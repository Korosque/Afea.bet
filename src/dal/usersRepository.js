const bcrypt = require('bcryptjs');
const { get, run } = require('../db/promises');
const { initialBalanceCents } = require('../config');

const PUBLIC_FIELDS = 'id, username, balance_cents, created_at, updated_at';

async function findByUsername(db, username) {
    return get(
        db,
        `SELECT ${PUBLIC_FIELDS}, password_hash
         FROM users
         WHERE username = ? AND deleted_at IS NULL`,
        [username.trim()]
    );
}

async function findById(db, userId) {
    return get(
        db,
        `SELECT ${PUBLIC_FIELDS}
         FROM users
         WHERE id = ? AND deleted_at IS NULL`,
        [userId]
    );
}

async function createUser(db, username, plainPassword) {
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    const result = await run(
        db,
        `INSERT INTO users (username, password_hash, balance_cents)
         VALUES (?, ?, ?)`,
        [username.trim(), passwordHash, initialBalanceCents]
    );
    return findById(db, result.lastID);
}

async function verifyPassword(plainPassword, passwordHash) {
    return bcrypt.compare(plainPassword, passwordHash);
}

async function updateBalance(db, userId, balanceCents) {
    await run(
        db,
        'UPDATE users SET balance_cents = ?, updated_at = datetime(\'now\') WHERE id = ? AND deleted_at IS NULL',
        [balanceCents, userId]
    );
}

module.exports = {
    findByUsername,
    findById,
    createUser,
    verifyPassword,
    updateBalance
};
