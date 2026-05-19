const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../config');
const { getDb } = require('../db/connection');
const usersRepository = require('../dal/usersRepository');

function signToken(user) {
    return jwt.sign(
        { sub: user.id, username: user.username },
        jwtSecret,
        { expiresIn: jwtExpiresIn }
    );
}

async function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ error: 'Sessão não autenticada.' });
    }

    try {
        const payload = jwt.verify(token, jwtSecret);
        const db = getDb();
        const user = await usersRepository.findById(db, payload.sub);
        if (!user) {
            return res.status(401).json({ error: 'Usuário inválido ou removido.' });
        }
        req.user = user;
        next();
    } catch {
        return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
}

module.exports = { requireAuth, signToken };
