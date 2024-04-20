const { URL } = require('url');
const { CheerioWebBaseLoader } = require("langchain/document_loaders/web/cheerio");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { ChatOpenAI } = require("@langchain/openai");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { loadSummarizationChain } = require("langchain/chains");
const { encode } = require('gpt-3-encoder');

/**
 * Handles the reading list based on the given type.
 * 
 * @param {Connection} connection - The connection object.
 * @param {string} msg - The message.
 * @param {string} type - The type of operation.
 * @param {...any} params - Additional parameters.
 */


async function handlerReadingList(connection, msg, type, ...params) {
    var url = null;
    switch (type) {
        case 'message':
            if (msg.body.toLowerCase() === "summarize" && msg.hasQuotedMsg) {
                quotedMsg = await msg.getQuotedMessage();
                url = quotedMsg.body;
                if (isValidUrl(url)) {
                    summarizeUrl(url, msg);
                }

                if (quotedMsg != undefined && quotedMsg.links.length > 0) {
                    console.log(quotedMsg.links[0].link);
                }
                break;
            }
    }
}

const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch (error) {
        return false;
    }
};

const summarizeUrl = async (url, msg) => {
    var model_name = "gpt-3.5-turbo"
    var maxToken = 16384;

    const loader = new CheerioWebBaseLoader(
        url
        , { timeout: 150000 }
    );
    const docs = await loader.load();
    const splitter = new RecursiveCharacterTextSplitter();
    var splitDocs = await splitter.splitDocuments(docs);
    var numOfTokens = 0;
    var finalIdx = 0;
    for (idx in splitDocs) {
        const encoded = encode(splitDocs[idx].pageContent)
        numOfTokens += encoded.length;
        if (numOfTokens > maxToken) {
            finalIdx = idx - 1;
            break;
        }
    }
    splitDocs = splitDocs.slice(0, finalIdx);

    var llm = new ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        temperature: 0,
        modelName: model_name
    });

    const prompt_template = `Summarize the following text in 6-8 bullet points:

     {text}

    SUMMARY IN ENGLISH:`;

    var prompt = ChatPromptTemplate.fromTemplate(prompt_template, input_variables = ["text"]);

    const chain = loadSummarizationChain(llm, { type: "stuff", prompt: prompt });
    const res = await chain.invoke({
        input_documents: splitDocs,
    });
    msg.reply(res.text);
};


module.exports = handlerReadingList;
