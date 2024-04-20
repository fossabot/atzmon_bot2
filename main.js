const qrcode = require('qrcode-terminal');
const fs = require('fs');
const utils = require('./utils');
const OpenAI = require('openai');
const handlerShoppingList = require('./handlerShoppingList');
const handlerReadingList = require('./handlerReadingList');
var mysql = require('mysql2');
const wwebVersion = '2.2407.3';


var ALLOWED_LIST = [];
var config = {};

// read config file
try {
    console.log('Starting Up');
    config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
    if (config == undefined) throw new Error('Config object is missing');
    ALLOWED_LIST = config.allowed;
} catch (e) { console.error(e); }

const { Client, LocalAuth } = require('whatsapp-web.js');
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox'],
    },
    webVersionCache: {
        type: 'remote',
        remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${wwebVersion}.html`,
    },
});

// set database connection
var connection = null;
if (config.db == undefined) {
    connection = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE
    })
} else {
    connection = mysql.createConnection({
        host: config.db.host,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database
    });
}
if (connection == undefined) throw new Error('Database configuration is missing');
connection.connect();
console.log('Database connected');

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('auth_failure', (message) => {
    console.log('Authentication failure: ' + message);
});

client.on('disconnected', (reason) => {
    console.log('Disconnected: ' + reason);
});

client.on('authenticated', () => {
    console.log('Authenticated');
});

client.initialize();

client.on('message', async (msg) => {
    if (isSenderAuthorized(msg)) {
        var router = null;
        // actions loop here - for now it will be plainly simple
        if (msg.hasMedia && (msg.type === 'ptt' || msg.type === 'audio')) {
            transcribeMessage(msg);
        } else {
            router = await getRouterName(msg);
            switch (router) {
                case "shopping_list":
                    handlerShoppingList(connection, msg, 'message');
                    break;
                case "reading_list":
                    handlerReadingList(connection, msg, 'message');
                    break;
            }
        }
    }
});

client.on('message_revoke_everyone', async (msg, revoked_msg) => {
    if (isSenderAuthorized(revoked_msg)) {
        router = await getRouterName(revoked_msg);
        switch (router) {
            case "shopping_list":
                handlerShoppingList(connection, revoked_msg, 'message_revoke_everyone');
                break;
        }
    }
});

client.on('message_reaction', async (reaction) => {
    client.getChatById(reaction.msgId.remote).then(chat => {
        chat.fetchMessages({ limit: 500 }).then(async messages => {
            for (msg of messages) {
                if (msg.id.id == reaction.msgId.id) {
                    router = await getRouterName(msg);
                    switch (router) {
                        case "shopping_list":
                            handlerShoppingList(connection, msg, 'reaction', reaction.reaction, reaction.senderId);
                            break;
                    }
                }
            }
        });

    })
});

async function transcribeMessage(msg) {
    var apiKey = config.openaiToken;
    if (apiKey == undefined) apiKey = process.env.OPENAI_API_KEY;
    const audio = await msg.downloadMedia();
    const filePath = "./voc" + utils.randomIntFromInterval(100, 1000) + ".ogg";
    fs.writeFileSync(filePath, audio.data, "base64");
    const openai = new OpenAI({ apiKey: apiKey });

    const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: "whisper-1",
        response_format: "text",
    });
    fs.unlinkSync(filePath);
    msg.reply(transcription)
}

async function isSenderAuthorized(msg) {
    return ALLOWED_LIST.includes(await msg.getContact().number);
}

async function getRouterName(msg) {
    if (config.router == undefined) throw new Error('Router configuration is missing');

    var chat = await msg.getChat();
    if (chat.isGroup) {
        const groupId = chat.id._serialized.substring(chat.id._serialized.indexOf('-') + 1);
        // console.log(groupId);
        const foundRouter = config.router.find(obj => obj.id === groupId);
        if (foundRouter) {
            return foundRouter.route;
        }

    }
    return null;
}