const {Telegraf} = require('telegraf')
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require('fs');
const winston = require('winston');


// replace the value below with the Telegram token you receive from @BotFather
const token = '';

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
    fs.readFileSync('./offers.txt', 'utf-8')
        .split('\n')
        .filter(Boolean)
        .map(function (val) {
            return +val;
        }).forEach(function (val) {
        oldOffers.add(val);
    });
    users.add(333396389);
    users.add(280668356);
    users.add(691885568);
    usedCookie = fs.readFileSync('./cookie.txt', 'utf-8');
}

loadInitData();

tBot.start((ctx) => {
    const chatId = ctx.message.chat.id;

    if (ctx.message.from.username !== adminUserName) {
        if (!users.has(chatId)) {
            users.add(chatId);
            logger.log('info', 'New user: ' + ctx.message.chat.id + ' ' + ctx.message.from.first_name + ' ' + ctx.message.from.last_name);
            ctx.telegram.sendMessage(chatId, 'Я буду слать тебе новые сообщения.');
        }
    }
    tBot.telegram.sendMessage(chatId, 'Я живой.');
});

tBot.on('text', (ctx) => {
    const chatId = ctx.message.chat.id;

    if (ctx.message.from.username === adminUserName && ctx.message.text && ctx.message.text > 100) {
        updateCookie(ctx.message.text);
    }
    tBot.telegram.sendMessage(chatId, 'Я живой.');
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
}, 1000 * 60);

function notifyUsers(offer) {
    for (let chat of users) {
        logger.log('info', "Notify user " + chat);
        tBot.telegram.sendMessage(chat, offer.link);
    }
}

function loadData(cookie) {
    const configPrivate = getConfigPrivate(cookie);

    sendRequest(configPrivate);

    const configBuss = getConfigBusiness(cookie);

    sendRequest(configBuss);
}

function sendRequest(config) {
    axios(config)
        .then((response) => {
            const body = response.data;
            var $ = cheerio.load(body);
            if ($('.offer-wrapper').length > 0) {
                logger.log('debug', "checking");
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
                logger.log('debug', "done");
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
            'cookie': 'newrelic_cdn_name=CF; PHPSESSID=7u3o46j8227bq4cj1vph7hvm65; mobile_default=desktop; last_locations=132-0-0-%D0%98%D0%B2%D0%B0%D0%BD%D0%BE-%D0%A4%D1%80%D0%B0%D0%BD%D0%BA%D0%BE%D0%B2%D1%81%D0%BA-%D0%98%D0%B2%D0%B0%D0%BD%D0%BE-%D0%A4%D1%80%D0%B0%D0%BD%D0%BA%D0%BE%D0%B2%D1%81%D0%BA%D0%B0%D1%8F+%D0%BE%D0%B1%D0%BB%D0%B0%D1%81%D1%82%D1%8C-ivano%3Afrankovsk; my_city_2=132_0_0_%D0%98%D0%B2%D0%B0%D0%BD%D0%BE-%D0%A4%D1%80%D0%B0%D0%BD%D0%BA%D0%BE%D0%B2%D1%81%D0%BA_0_%D0%98%D0%B2%D0%B0%D0%BD%D0%BE-%D0%A4%D1%80%D0%B0%D0%BD%D0%BA%D0%BE%D0%B2%D1%81%D0%BA%D0%B0%D1%8F+%D0%BE%D0%B1%D0%BB%D0%B0%D1%81%D1%82%D1%8C_ivano%3Afrankovsk; observed_aui=68db7bbbf22d4aba88df0712af25e0d8; user_adblock_status=false; ldTd=true; lqstatus=1647796707||||; laquesis=jobs-2491@a#jobs-3312@a#oesx-1292@a#olxeu-37785@a#srt-1549@b; laquesisff=euonb-114#euonb-48#kuna-307#oesx-1437#oesx-645#oesx-867#olxeu-29763#srt-1289#srt-1346#srt-1593#srt-477#srt-479#srt-682; laquesissu=; fingerprint=MTI1NzY4MzI5MTsxNjswOzA7MDsxOzA7MDswOzA7MDsxOzE7MTsxOzE7MTsxOzE7MTsxOzE7MTsxOzE7MDsxOzE7MTsxOzA7MDswOzA7MDswOzE7MTsxOzE7MTswOzE7MDswOzE7MTsxOzA7MDswOzA7MDswOzA7MDsxOzA7MDswOzA7MTsxOzA7MTsxOzA7MTsxOzE7MTswOzE7MDsxNDIzNTg4Mzg3OzI7MjsyOzI7MjsyOzU7Mjg0ODAwNjQxODsxMzU3MDQxNzM4OzE7MTsxOzE7MTsxOzE7MTsxOzE7MTsxOzE7MTsxOzE7MTswOzA7MDs0MTAwMjE5OTszNDY5MzA2NTUxOzMyNjY0MDc4NDA7MzMwODM4ODQxOzM5NTU0NDg2OTM7MTc5MjsxMTIwOzMwOzMwOzE4MDsxMjA7MTgwOzEyMDsxODA7MTIwOzE4MDsxMjA7MTgwOzEyMDsxODA7MTIwOzE4MDsxMjA7MTgwOzEyMDsxODA7MTIwOzE4MDsxMjA7MDswOzA=; dfp_user_id=fc6e6cd7-ddd5-487a-94fc-b70831f810af-ver2; from_detail=0; __gads=ID=1c83838b070eb435:T=1647795509:S=ALNI_Ma7zR-bQrXungjBOyrtSMJX8IOvcg; __utma=250720985.1615420089.1647795510.1647795510.1647795510.1; __utmc=250720985; __utmz=250720985.1647795510.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none); _hjFirstSeen=1; _hjIncludedInSessionSample=0; _hjSession_2218922=eyJpZCI6IjJhZDQzMjZkLWMzZTgtNGM0OC1iNTAxLTc3YThlNWVhMzU0MSIsImNyZWF0ZWQiOjE2NDc3OTU1MDk4OTUsImluU2FtcGxlIjpmYWxzZX0=; _hjAbsoluteSessionInProgress=0; _gid=GA1.2.873039356.1647795510; dfp_segment=%5B%5D; lister_lifecycle=1647795519; _hjSessionUser_2218922=eyJpZCI6Ijk5OGEwNzAwLTczZGUtNTlkZS04YTViLTc0NjAzNjUwN2VlZSIsImNyZWF0ZWQiOjE2NDc3OTU1MDY1MjgsImV4aXN0aW5nIjp0cnVlfQ==; searchFavTooltip=1; _ga=GA1.1.1099172220.1647795509; cto_bundle=zkruzF8zV3Y4aTZYbjM2Wm81SHBUWGJOejRHQVhmNjZiVnVYSDRwZTViMzZOMFZsTjRtJTJCTHFPUm93ZUFJQndyZDJBalMlMkJISHB4OG93VFd2Ujc5bmpaSGIxSE1mSFJMeHUyd2I2bEpRS2FPaER3WVRHY0xaZlRTZlFNdWoxbVppUEJXVXFrYkMzZkhMRnU5ZkglMkZ0b25CNkhGdzVSUFNlTGs3d0Fva3FRd1FVZ0NWalZyZHBuVHUxTTRweHM2NGV6ZmJmYUI; search_id_md5=4324739dd5612e37685d78c57c649552; onap=17fa8440e33x3641b2b4-1-17fa8440e33x3641b2b4-79-1647797793; __utmb=250720985.27.9.1647795992289; _ga_QFCVKCHXET=GS1.1.1647795509.1.1.1647795993.38; last_locations=132-0-0-%D0%98%D0%B2%D0%B0%D0%BD%D0%BE-%D0%A4%D1%80%D0%B0%D0%BD%D0%BA%D0%BE%D0%B2%D1%81%D0%BA-%D0%98%D0%B2%D0%B0%D0%BD%D0%BE-%D0%A4%D1%80%D0%B0%D0%BD%D0%BA%D0%BE%D0%B2%D1%81%D0%BA%D0%B0%D1%8F+%D0%BE%D0%B1%D0%BB%D0%B0%D1%81%D1%82%D1%8C-ivano%3Afrankovsk; lister_lifecycle=1641153890; mobile_default=desktop; my_city_2=132_0_0_%D0%98%D0%B2%D0%B0%D0%BD%D0%BE-%D0%A4%D1%80%D0%B0%D0%BD%D0%BA%D0%BE%D0%B2%D1%81%D0%BA_0_%D0%98%D0%B2%D0%B0%D0%BD%D0%BE-%D0%A4%D1%80%D0%B0%D0%BD%D0%BA%D0%BE%D0%B2%D1%81%D0%BA%D0%B0%D1%8F+%D0%BE%D0%B1%D0%BB%D0%B0%D1%81%D1%82%D1%8C_ivano%3Afrankovsk; observed_aui=84cd8712c6ff46ce8885ddc919433ede'
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
            'cookie': 'newrelic_cdn_name=CF; PHPSESSID=7u3o46j8227bq4cj1vph7hvm65; mobile_default=desktop; last_locations=132-0-0-%D0%98%D0%B2%D0%B0%D0%BD%D0%BE-%D0%A4%D1%80%D0%B0%D0%BD%D0%BA%D0%BE%D0%B2%D1%81%D0%BA-%D0%98%D0%B2%D0%B0%D0%BD%D0%BE-%D0%A4%D1%80%D0%B0%D0%BD%D0%BA%D0%BE%D0%B2%D1%81%D0%BA%D0%B0%D1%8F+%D0%BE%D0%B1%D0%BB%D0%B0%D1%81%D1%82%D1%8C-ivano%3Afrankovsk; my_city_2=132_0_0_%D0%98%D0%B2%D0%B0%D0%BD%D0%BE-%D0%A4%D1%80%D0%B0%D0%BD%D0%BA%D0%BE%D0%B2%D1%81%D0%BA_0_%D0%98%D0%B2%D0%B0%D0%BD%D0%BE-%D0%A4%D1%80%D0%B0%D0%BD%D0%BA%D0%BE%D0%B2%D1%81%D0%BA%D0%B0%D1%8F+%D0%BE%D0%B1%D0%BB%D0%B0%D1%81%D1%82%D1%8C_ivano%3Afrankovsk; observed_aui=68db7bbbf22d4aba88df0712af25e0d8; user_adblock_status=false; ldTd=true; lqstatus=1647796707||||; laquesis=jobs-2491@a#jobs-3312@a#oesx-1292@a#olxeu-37785@a#srt-1549@b; laquesisff=euonb-114#euonb-48#kuna-307#oesx-1437#oesx-645#oesx-867#olxeu-29763#srt-1289#srt-1346#srt-1593#srt-477#srt-479#srt-682; laquesissu=; fingerprint=MTI1NzY4MzI5MTsxNjswOzA7MDsxOzA7MDswOzA7MDsxOzE7MTsxOzE7MTsxOzE7MTsxOzE7MTsxOzE7MDsxOzE7MTsxOzA7MDswOzA7MDswOzE7MTsxOzE7MTswOzE7MDswOzE7MTsxOzA7MDswOzA7MDswOzA7MDsxOzA7MDswOzA7MTsxOzA7MTsxOzA7MTsxOzE7MTswOzE7MDsxNDIzNTg4Mzg3OzI7MjsyOzI7MjsyOzU7Mjg0ODAwNjQxODsxMzU3MDQxNzM4OzE7MTsxOzE7MTsxOzE7MTsxOzE7MTsxOzE7MTsxOzE7MTswOzA7MDs0MTAwMjE5OTszNDY5MzA2NTUxOzMyNjY0MDc4NDA7MzMwODM4ODQxOzM5NTU0NDg2OTM7MTc5MjsxMTIwOzMwOzMwOzE4MDsxMjA7MTgwOzEyMDsxODA7MTIwOzE4MDsxMjA7MTgwOzEyMDsxODA7MTIwOzE4MDsxMjA7MTgwOzEyMDsxODA7MTIwOzE4MDsxMjA7MDswOzA=; dfp_user_id=fc6e6cd7-ddd5-487a-94fc-b70831f810af-ver2; from_detail=0; __gads=ID=1c83838b070eb435:T=1647795509:S=ALNI_Ma7zR-bQrXungjBOyrtSMJX8IOvcg; __utma=250720985.1615420089.1647795510.1647795510.1647795510.1; __utmc=250720985; __utmz=250720985.1647795510.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none); _hjFirstSeen=1; _hjIncludedInSessionSample=0; _hjSession_2218922=eyJpZCI6IjJhZDQzMjZkLWMzZTgtNGM0OC1iNTAxLTc3YThlNWVhMzU0MSIsImNyZWF0ZWQiOjE2NDc3OTU1MDk4OTUsImluU2FtcGxlIjpmYWxzZX0=; _hjAbsoluteSessionInProgress=0; _gid=GA1.2.873039356.1647795510; dfp_segment=%5B%5D; lister_lifecycle=1647795519; _hjSessionUser_2218922=eyJpZCI6Ijk5OGEwNzAwLTczZGUtNTlkZS04YTViLTc0NjAzNjUwN2VlZSIsImNyZWF0ZWQiOjE2NDc3OTU1MDY1MjgsImV4aXN0aW5nIjp0cnVlfQ==; searchFavTooltip=1; _ga=GA1.1.1099172220.1647795509; cto_bundle=zkruzF8zV3Y4aTZYbjM2Wm81SHBUWGJOejRHQVhmNjZiVnVYSDRwZTViMzZOMFZsTjRtJTJCTHFPUm93ZUFJQndyZDJBalMlMkJISHB4OG93VFd2Ujc5bmpaSGIxSE1mSFJMeHUyd2I2bEpRS2FPaER3WVRHY0xaZlRTZlFNdWoxbVppUEJXVXFrYkMzZkhMRnU5ZkglMkZ0b25CNkhGdzVSUFNlTGs3d0Fva3FRd1FVZ0NWalZyZHBuVHUxTTRweHM2NGV6ZmJmYUI; search_id_md5=4324739dd5612e37685d78c57c649552; onap=17fa8440e33x3641b2b4-1-17fa8440e33x3641b2b4-79-1647797793; __utmb=250720985.27.9.1647795992289; _ga_QFCVKCHXET=GS1.1.1647795509.1.1.1647795993.38; last_locations=132-0-0-%D0%98%D0%B2%D0%B0%D0%BD%D0%BE-%D0%A4%D1%80%D0%B0%D0%BD%D0%BA%D0%BE%D0%B2%D1%81%D0%BA-%D0%98%D0%B2%D0%B0%D0%BD%D0%BE-%D0%A4%D1%80%D0%B0%D0%BD%D0%BA%D0%BE%D0%B2%D1%81%D0%BA%D0%B0%D1%8F+%D0%BE%D0%B1%D0%BB%D0%B0%D1%81%D1%82%D1%8C-ivano%3Afrankovsk; lister_lifecycle=1641153890; mobile_default=desktop; my_city_2=132_0_0_%D0%98%D0%B2%D0%B0%D0%BD%D0%BE-%D0%A4%D1%80%D0%B0%D0%BD%D0%BA%D0%BE%D0%B2%D1%81%D0%BA_0_%D0%98%D0%B2%D0%B0%D0%BD%D0%BE-%D0%A4%D1%80%D0%B0%D0%BD%D0%BA%D0%BE%D0%B2%D1%81%D0%BA%D0%B0%D1%8F+%D0%BE%D0%B1%D0%BB%D0%B0%D1%81%D1%82%D1%8C_ivano%3Afrankovsk; observed_aui=84cd8712c6ff46ce8885ddc919433ede'
        }
    };

}

tBot.launch();
