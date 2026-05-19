const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { run, get, all } = require('./promises');
const { initialBalanceCents } = require('../config');

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

const CREATE_HORSE_STREAKS_SQL = `
CREATE TABLE IF NOT EXISTS horse_streaks (
    horse_id INTEGER PRIMARY KEY,
    streak INTEGER NOT NULL DEFAULT 0 CHECK (streak >= 0),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (horse_id) REFERENCES horses (id) ON DELETE CASCADE
);
`;

async function tableExists(db, name) {
    const row = await get(
        db,
        "SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = ?",
        [name]
    );
    return Boolean(row);
}

async function columnExists(db, table, column) {
    const cols = await all(db, `PRAGMA table_info(${table})`);
    return cols.some((c) => c.name === column);
}

function applySqlFile(db, filePath) {
    const sql = fs.readFileSync(filePath, 'utf8');
    return new Promise((resolve, reject) => {
        db.exec(sql, (err) => (err ? reject(err) : resolve()));
    });
}

async function recordMigration(db, version) {
    await run(db, 'INSERT OR IGNORE INTO schema_migrations (version) VALUES (?)', [version]);
}

function dedupeLegacyUsers(legacyUsers) {
    const byUsername = new Map();
    for (const user of legacyUsers) {
        const key = String(user.username || '').trim().toLowerCase();
        if (!key) continue;
        const current = byUsername.get(key);
        if (!current || Number(user.id) > Number(current.id)) {
            byUsername.set(key, user);
        }
    }
    return [...byUsername.values()];
}

async function importLegacyUsers(db, legacyUsers) {
    await run(db, 'DELETE FROM users');
    const uniqueUsers = dedupeLegacyUsers(legacyUsers);
    for (const user of uniqueUsers) {
        const balanceCents = Math.max(0, Math.round(Number(user.balance || 0) * 100));
        const passwordHash = await bcrypt.hash(String(user.password || ''), 10);
        await run(
            db,
            `INSERT INTO users (id, username, password_hash, balance_cents, created_at, updated_at)
             VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
            [user.id, user.username, passwordHash, balanceCents || initialBalanceCents]
        );
    }
}

async function finishLegacyUserMigration(db) {
    if (await tableExists(db, 'users_legacy')) {
        await run(db, 'DROP TABLE users_legacy');
    }
    await recordMigration(db, 1);
    await recordMigration(db, 2);
}

async function recoverInterruptedLegacyMigration(db) {
    if (!(await tableExists(db, 'users_legacy'))) return false;

    const legacyUsers = await all(
        db,
        'SELECT id, username, password, balance FROM users_legacy'
    );

    if (await tableExists(db, 'users')) {
        await run(db, 'DROP TABLE users');
    }

    await applySqlFile(db, path.join(MIGRATIONS_DIR, '001_schema.sql'));
    await importLegacyUsers(db, legacyUsers);
    await finishLegacyUserMigration(db);
    await migrateLegacyHorseStreaks(db);
    return true;
}

async function migrateLegacyUsers(db) {
    if (!(await tableExists(db, 'users'))) return;
    if (await columnExists(db, 'users', 'password_hash')) return;
    if (!(await columnExists(db, 'users', 'password'))) return;

    const legacyUsers = await all(db, 'SELECT id, username, password, balance FROM users');
    await run(db, 'ALTER TABLE users RENAME TO users_legacy');
    await applySqlFile(db, path.join(MIGRATIONS_DIR, '001_schema.sql'));
    await importLegacyUsers(db, legacyUsers);
    await finishLegacyUserMigration(db);
}

async function ensureHorsesSeeded(db) {
    const row = await get(db, 'SELECT COUNT(*) AS total FROM horses');
    if (Number(row.total) > 0) return;

    await applySqlFile(db, path.join(MIGRATIONS_DIR, '002_seed_horses.sql'));
}

async function migrateLegacyHorseStreaks(db) {
    let savedStreaks = [];

    if (await tableExists(db, 'horse_streaks')) {
        if (await columnExists(db, 'horse_streaks', 'horse_id')) {
            return;
        }
        if (await columnExists(db, 'horse_streaks', 'horse_name')) {
            savedStreaks = await all(db, 'SELECT horse_name, streak FROM horse_streaks');
        }
        await run(db, 'DROP TABLE horse_streaks');
    }

    await run(db, CREATE_HORSE_STREAKS_SQL);
    await ensureHorsesSeeded(db);

    const existingStreaks = await all(db, 'SELECT horse_id FROM horse_streaks');
    if (existingStreaks.length === 0) {
        await run(
            db,
            `INSERT OR IGNORE INTO horse_streaks (horse_id, streak)
             SELECT id, 0 FROM horses`
        );
    }

    for (const row of savedStreaks) {
        const horse = await get(db, 'SELECT id FROM horses WHERE name = ?', [row.horse_name]);
        if (!horse) continue;
        await run(db, 'UPDATE horse_streaks SET streak = ? WHERE horse_id = ?', [
            Math.max(0, Number(row.streak) || 0),
            horse.id
        ]);
    }
}

async function runMigrations(db) {
    await run(db, 'PRAGMA foreign_keys = ON');
    await run(db, 'PRAGMA journal_mode = WAL');

    if (await recoverInterruptedLegacyMigration(db)) {
        return;
    }

    const legacyPasswordUsers =
        (await tableExists(db, 'users')) && (await columnExists(db, 'users', 'password'));

    if (legacyPasswordUsers) {
        await migrateLegacyUsers(db);
        await migrateLegacyHorseStreaks(db);
        return;
    }

    const v1 = await get(db, 'SELECT version FROM schema_migrations WHERE version = 1');
    if (!v1) {
        await applySqlFile(db, path.join(MIGRATIONS_DIR, '001_schema.sql'));
        await recordMigration(db, 1);
    }

    const v2 = await get(db, 'SELECT version FROM schema_migrations WHERE version = 2');
    if (!v2) {
        await applySqlFile(db, path.join(MIGRATIONS_DIR, '002_seed_horses.sql'));
        await recordMigration(db, 2);
    }

    await migrateLegacyHorseStreaks(db);
}

module.exports = { runMigrations };
