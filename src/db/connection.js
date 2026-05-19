const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { dbPath, rootDir } = require('../config');
const { runMigrations } = require('./migrate');

const LEGACY_PATHS = [
    path.join(rootDir, 'afeabet.db'),
    path.join(rootDir, 'afyabet.db')
];

function ensureDataDirectory() {
    const dir = path.dirname(path.resolve(dbPath));
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function copyLegacyDatabaseIfNeeded() {
    const target = path.resolve(dbPath);
    if (fs.existsSync(target)) return;

    for (const legacy of LEGACY_PATHS) {
        if (fs.existsSync(legacy)) {
            fs.copyFileSync(legacy, target);
            return;
        }
    }
}

let db;
let readyPromise;

function getDb() {
    if (!db) {
        throw new Error('Banco de dados ainda não foi inicializado.');
    }
    return db;
}

function initDatabase() {
    if (readyPromise) return readyPromise;

    readyPromise = new Promise((resolve, reject) => {
        ensureDataDirectory();
        copyLegacyDatabaseIfNeeded();

        db = new sqlite3.Database(path.resolve(dbPath), (err) => {
            if (err) return reject(err);

            runMigrations(db)
                .then(() => resolve(db))
                .catch(reject);
        });
    });

    return readyPromise;
}

function closeDatabase() {
    return new Promise((resolve, reject) => {
        if (!db) return resolve();
        db.close((err) => {
            if (err) return reject(err);
            db = null;
            readyPromise = null;
            resolve();
        });
    });
}

module.exports = {
    initDatabase,
    getDb,
    closeDatabase
};
