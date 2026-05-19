const express = require('express');
const { getDb } = require('../../../db/connection');
const usersRepository = require('../../../dal/usersRepository');
const { signToken } = require('../../../middleware/auth');
const { buildBalancePayload } = require('../../../services/balanceService');
const { ensureBrokeRelief } = require('../../../services/relief');

const router = express.Router();

function userResponse(user, token = null) {
    const payload = {
        username: user.username,
        ...buildBalancePayload(user.balance_cents, ensureBrokeRelief(user.balance_cents))
    };
    if (token) payload.token = token;
    return payload;
}

router.post('/sessao', async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
        return res.status(400).json({ error: 'Informe usuário e senha.' });
    }
    if (String(username).length > 40 || String(password).length > 128) {
        return res.status(400).json({ error: 'Credenciais inválidas.' });
    }

    try {
        const db = getDb();
        let user = await usersRepository.findByUsername(db, username);

        if (!user) {
            user = await usersRepository.createUser(db, username, password);
            const token = signToken(user);
            return res.status(201).json(userResponse(user, token));
        }

        const valid = await usersRepository.verifyPassword(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Senha incorreta.' });
        }

        const token = signToken(user);
        return res.json(userResponse(user, token));
    } catch (err) {
        if (err && err.message && err.message.includes('UNIQUE')) {
            return res.status(409).json({ error: 'Usuário já existe.' });
        }
        console.error(err);
        return res.status(500).json({ error: 'Erro no servidor.' });
    }
});

module.exports = router;
