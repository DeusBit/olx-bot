import {Telegraf} from "telegraf";
import * as fs from "fs";
import logger from "./logger/index.js";
import dataLoader from "./dataLoader/index.js";
import * as db from './data/index.js';

const loader = dataLoader();

db.loadData().then(() => {
    // replace the value below with the Telegram token you receive from @BotFather
    const token = (() => {
        let _token = fs.readFileSync('./data/token.txt', 'utf-8');
        if (_token) {
            return _token.trim();
        } else {
            return '';
        }
    })();

    let usedCookie = '';
    const adminUserName = 'aretiznyk';
    const adminChatId = 333396389;

    const tBot = new Telegraf(token);

    (function loadInitData() {
        usedCookie = fs.readFileSync('./data/cookie.txt', 'utf-8').trim();
    })();

    tBot.start((ctx) => {
        const chatId = ctx.message.chat.id;

        if (!db.hasUser(chatId)) {
            db.addUser(chatId);
            logger.log('info', 'New user: ' + ctx.message.chat.id + ' ' + ctx.message.from.first_name + ' ' + ctx.message.from.last_name);
            ctx.telegram.sendMessage(chatId, 'Я буду надсилати тобі нові оголошення. Слава Україні🇺🇦🇺🇦🇺🇦');
        } else {
            ctx.reply('Слава Україні🇺🇦🇺🇦🇺🇦');
        }
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
        ctx.telegram.leaveChat(ctx.message.chat.id).then(() => {
            db.removeUser(ctx.message.chat.id).then(r => logger.log('debug', `User ${ctx.message.chat.id} left bot`));
            ctx.leaveChat();
        });
    });


    function updateCookie(newCookie) {
        usedCookie = newCookie;
        tBot.telegram.sendMessage(adminChatId, 'Cookies are updated');
    }

    setInterval(async () => {
        if (usedCookie.length) {
            await loadData(usedCookie);
        } else {
            logger.log('error', 'Cookie is empty');
        }
    }, 1000 * 30);


    async function loadData(cookie) {
        let result = await loader.sendRequest(cookie);

        if (result.length !== 0) {
            result.forEach((val) => {
                if (!db.hasOffer(val.id)) {
                    db.addOffer(val.id);
                    notifyUsers(val);
                }
            })
        } else {
            tBot.telegram.sendMessage(adminChatId, "Please update cookie");
        }
    }

    function notifyUsers(val) {
        db.getUsers().forEach((userId) => {
            tBot.telegram.sendMessage(userId, val.link);
        });
    }

    tBot.launch();
//stop
});
