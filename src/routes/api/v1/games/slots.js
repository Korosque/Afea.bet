const express = require('express');
const { getDb } = require('../../../../db/connection');
const { requireAuth } = require('../../../../middleware/auth');
const {
    getBalanceCents,
    applyBalanceChange,
    assertSufficientBalance,
    parseBetReais,
    buildBalancePayload,
    ensureBrokeRelief,
    reliefToResponse
} = require('../../../../services/balanceService');
const usersRepository = require('../../../../dal/usersRepository');

const router = express.Router();

router.post('/cassino/fortune-tiger/apostar', requireAuth, async (req, res) => {
    try {
        const betCents = parseBetReais(req.body.bet);
        const db = getDb();
        const userId = req.user.id;
        const balance = await getBalanceCents(db, userId);

        if (!assertSufficientBalance(balance, betCents)) {
            if (balance <= 0) {
                const relief = ensureBrokeRelief(balance);
                await usersRepository.updateBalance(db, userId, relief.balanceCents);
                return res.status(400).json({
                    error: 'Sem saldo',
                    ...buildBalancePayload(relief.balanceCents, relief)
                });
            }
            return res.status(400).json({ error: 'Sem saldo' });
        }

        const winCents = Math.random() < 0.2 ? betCents * 3 : 0;
        const delta = -betCents + winCents;
        const { balanceCents, relief } = await applyBalanceChange(db, userId, delta, 'fortune_tiger', {
            bet_cents: betCents,
            win_cents: winCents
        });

        res.json({
            win: winCents / 100,
            ...buildBalancePayload(balanceCents, relief)
        });
    } catch (err) {
        if (err.message === 'INVALID_BET') {
            return res.status(400).json({ error: 'Aposta inválida.' });
        }
        console.error(err);
        res.status(500).json({ error: 'Erro ao processar aposta.' });
    }
});

module.exports = router;
