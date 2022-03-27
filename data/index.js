import { JSONFile, Low } from "lowdb";

const adapter = new JSONFile('./db.json');
const db = new Low(adapter);

export async function loadData() {
    await db.read();
    db.data = db.data || { users: [], offers: [] };
}

export function hasUser(chatId) {
    return db.data.users.indexOf(chatId) !== -1;
}

export async function addUser(chatId) {
    db.data.users.push(chatId);
    await db.write();
}

export function getUsers() {
    return [].concat(db.data.users);
}

export async function removeUser(chatId) {
    let index = db.users.indexOf(chatId);
    if (index !== -1) {
        db.users.splice(index, 1);
        await db.write();
    }
}

export function hasOffer(offerId) {
    return db.data.offers.indexOf(offerId) !== -1;
}

export async function addOffer(offerId) {
    db.data.offers.push(offerId);
    await db.write();
}

export async function removeOffer(offerId) {
    let index = db.offers.indexOf(offerId);
    if (index !== -1) {
        db.offers.splice(index, 1);
        await db.write();
    }
}
