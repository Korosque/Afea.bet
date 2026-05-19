const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const ROOT_DIR = path.join(__dirname, '..');
const INITIAL_BALANCE_CENTS = 200000;

module.exports = {
    rootDir: ROOT_DIR,
    port: Number(process.env.PORT) || 3000,
    jwtSecret: process.env.JWT_SECRET || 'afeabet-dev-secret-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    initialBalanceCents: INITIAL_BALANCE_CENTS,
    dbPath: process.env.DB_PATH || path.join(ROOT_DIR, 'data', 'afeabet.db')
};
