const {Telegraf} = require('telegraf')
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require('fs');
const winston = require('winston');


// replace the value below with the Telegram token you receive from @BotFather
const token = (() => {
    let _token = fs.readFileSync('./token.txt', 'utf-8');
    if (_token) {
        return _token.trim();
    } else {
        return '';
    }
})();

let usedCookie = '';
const adminUserName = 'aretiznyk';
const adminChatId = 333396389;
const users = new Set();
const oldOffers = new Set();

const tBot = new Telegraf(token);

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.simple()
    ),
    transports: [
        new winston.transports.File({filename: 'debug.log', level: 'debug'}),
        new winston.transports.File({filename: 'error.log', level: 'error'}),
        new winston.transports.File({filename: 'combined.log'}),
    ],
});

function loadInitData() {
    readNumberData('./offers.txt').forEach(function (val) {
        oldOffers.add(val);
    });

    readNumberData('./users.txt').forEach((val) => {
        users.add(val);
    });

    usedCookie = fs.readFileSync('./cookie.txt', 'utf-8').trim();
}

function readNumberData(file) {
    return fs.readFileSync(file, 'utf-8')
        .split('\n')
        .filter(Boolean)
        .map(function (val) {
            return +val;
        });
}

loadInitData();

tBot.start((ctx) => {
    const chatId = ctx.message.chat.id;

    if (ctx.message.from.username !== adminUserName) {
        if (!users.has(chatId)) {
            users.add(chatId);
            logger.log('info', 'New user: ' + ctx.message.chat.id + ' ' + ctx.message.from.first_name + ' ' + ctx.message.from.last_name);
            ctx.telegram.sendMessage(chatId, 'Я буду надсилати тобі нові оголошення. Слава Україні🇺🇦🇺🇦🇺🇦');
        }
    }
    tBot.telegram.sendMessage(chatId, 'Слава Україні🇺🇦🇺🇦🇺🇦');
});

tBot.on('text', (ctx) => {
    const chatId = ctx.message.chat.id;

    if (ctx.message.from.username === adminUserName && ctx.message.text && ctx.message.text.length > 100) {
        updateCookie(ctx.message.text);
    }
    tBot.telegram.sendMessage(chatId, 'Слава Україні🇺🇦🇺🇦🇺🇦');
});

tBot.command('quit', (ctx) => {
    // Explicit usage
    ctx.telegram.leaveChat(ctx.message.chat.id);

    users.delete(ctx.message.chat.id);

    // Using context shortcut
    ctx.leaveChat();
})


function updateCookie(newCookie) {
    usedCookie = newCookie;
    tBot.telegram.sendMessage(adminChatId, 'Cookies are updated');
}

setInterval(() => {
    if (usedCookie.length) {
        loadData(usedCookie);
    } else {
        logger.log('error', 'Cookie is empty');
    }
}, 1000 * 30);

function notifyUsers(offer) {
    for (let chat of users) {
        logger.log('info', "Notify user " + chat);
        tBot.telegram.sendMessage(chat, offer.link);
    }
}

function loadData(cookie) {
    const configPrivate = getConfigPrivate(cookie);

    sendRequest(configPrivate)
        .then(function() {
            logger.log('debug', "Private success check");
        });

    const configBuss = getConfigBusiness(cookie);

    sendRequest(configBuss)
        .then(function() {
            logger.log('debug', "Business success check");
        });
}

function sendRequest(config) {
    return axios(config)
        .then((response) => {
            const body = response.data;
            var $ = cheerio.load(body);
            if ($('.offer-wrapper').length > 0) {
                const result = [];
                $(".offer-wrapper").each(function (i, elem) {
                    let $element = $(elem);
                    let id = $element.find('.breakword').data('id');
                    let link = $element.find('.detailsLink').attr('href');
                    result.push({id, link});
                });

                if (result.length === 0) {
                    tBot.telegram.sendMessage(adminChatId, 'Please update cookie');
                    usedCookie = '';
                    logger.log('error', 'Please update cookie');
                } else {
                    result.forEach((value) => {
                        if (!oldOffers.has(value.id)) {
                            oldOffers.add(value.id);
                            logger.log('info', value.id);
                            notifyUsers(value);
                            fs.appendFile('./offers.txt', value.id + '\n', function (err) {
                                if (err) {
                                    logger.log('error', err);
                                } else {
                                    logger.log('info', 'Saved!');
                                }
                            });
                        }
                    });
                }
            } else {
                logger.log('error', 'Response is empty');
            }
        })
        .catch(function (error) {
            logger.log('error', error);
        });
}

function getConfigPrivate(cookie) {
    return {
        method: 'get',
        url: 'https://www.olx.ua/nedvizhimost/kvartiry/dolgosrochnaya-arenda-kvartir/ivano-frankovsk/?search%5Bprivate_business%5D=private',
        headers: {
            'authority': 'www.olx.ua',
            'pragma': 'no-cache',
            'cache-control': 'no-cache',
            'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="99", "Google Chrome";v="99"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'upgrade-insecure-requests': '1',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.74 Safari/537.36',
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            'sec-fetch-site': 'same-origin',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-user': '?1',
            'sec-fetch-dest': 'document',
            'referer': 'https://www.olx.ua/',
            'accept-language': 'en-US,en;q=0.9',
            'cookie': cookie
        }
    };
}

function getConfigBusiness(cookie) {
    return {
        method: 'get',
        url: 'https://www.olx.ua/nedvizhimost/kvartiry/dolgosrochnaya-arenda-kvartir/ivano-frankovsk/?search%5Bprivate_business%5D=business',
        headers: {
            'authority': 'www.olx.ua',
            'pragma': 'no-cache',
            'cache-control': 'no-cache',
            'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="99", "Google Chrome";v="99"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'upgrade-insecure-requests': '1',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.74 Safari/537.36',
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            'sec-fetch-site': 'same-origin',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-user': '?1',
            'sec-fetch-dest': 'document',
            'referer': 'https://www.olx.ua/',
            'accept-language': 'en-US,en;q=0.9',
            'cookie': cookie
        }
    };

}

tBot.launch();
