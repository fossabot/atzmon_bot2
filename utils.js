const moment = require('moment-timezone');

exports.getWordleGuesses = function (message) {
    // Define the regular expression pattern to match the Wordle message format
    const pattern = /^[\s\S]*Wordle \d+ (X|\d+)\/6(\*?)([\s\S]*)/;

    // Use the pattern to test if the message matches the expected format
    const match = message.match(pattern);

    // If there is a match, return an object with guesses count (Y), hard mode indicator, and result pattern
    // Otherwise, return null to indicate that the input format is not valid
    if (match) {
        const guesses = match[1] === 'X' ? -1 : parseInt(match[1], 10);
        const isHardMode = match[2] === '*';
        const resultPattern = match[3];
        return { guesses, isHardMode, resultPattern };
    } else {
        return null;
    }
}

exports.getDataFromPfpUrl = async function (url, options) {
    const reqOptions = Object.assign({ headers: { accept: 'image/* video/* text/* audio/*' } }, options);
    const response = await fetch(url, reqOptions);
    const mime = response.headers.get('Content-Type');
    const size = response.headers.get('Content-Length');

    const contentDisposition = response.headers.get('Content-Disposition');
    const name = contentDisposition ? contentDisposition.match(/((?<=filename=")(.*)(?="))/) : null;

    let data = '';
    if (response.buffer) {
        data = (await response.buffer()).toString('base64');
    } else {
        const bArray = new Uint8Array(await response.arrayBuffer());
        bArray.forEach((b) => {
            data += String.fromCharCode(b);
        });
        data = btoa(data);
    }

    return { data, mime, name, size };
}

exports.stringToContact = function (str) {
    if (str.includes('@')) {
        return {
            server: '@' + str.split('@')[1],
            user: str.split('@')[0],
            _serialized: str
        };
    }

    return {
        server: '@c.us',
        user: str,
        _serialized: str + '@c.us'
    };
}

exports.getWordleDay = function (date) {
    const firstWordleDate = moment.tz('2021-06-20T00:00:00Z', 'Israel');
    const dateIsrael = moment.tz(date, 'Israel');
    const daysDifference = dateIsrael.diff(firstWordleDate, 'days') + 1;

    return daysDifference;
}

exports.randomIntFromInterval = function (min, max) { // min and max included 
    const n = Math.floor(Math.random() * (max - min + 1) + min)
    return n.toString()
}

exports.getTimeToPublishWinners = function (time) {
    var currentdate = new Date();
    var datetime = currentdate.getFullYear() + "-" + currentdate.getMonth() + 1 + "-" + currentdate.getDate() + "T" + time + ":00.000";
    var date = new Date(datetime)
    var total = date - currentdate;
    if (total < 0) total += 24 * 60 * 1000 * 60;
    return total;
}

exports.randomRange = function (start, end) {
    if (start > end) return exports.randomRange(end, start);

    return start + Math.random() * (end - start);
}