const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const oldDbPath = './afyabet.db';
const newDbPath = './afeabet.db';

if (fs.existsSync(oldDbPath) && !fs.existsSync(newDbPath)) {
    fs.copyFileSync(oldDbPath, newDbPath);
}

const db = new sqlite3.Database(newDbPath);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        balance REAL DEFAULT 2000.0
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS horse_streaks (
        horse_name TEXT PRIMARY KEY,
        streak INTEGER DEFAULT 0
    )`);
    // Inicializar streaks se não existirem
    const horses = ["Maezio", "Jorge", "Hugo", "Vinicius", "Rômulo", "Darlan"];
    horses.forEach(horse => {
        db.run(`INSERT OR IGNORE INTO horse_streaks (horse_name, streak) VALUES (?, 0)`, [horse]);
    });
});

module.exports = db;