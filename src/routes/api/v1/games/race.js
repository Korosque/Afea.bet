const express = require('express');
const { getDb } = require('../../../../db/connection');
const { withTransaction } = require('../../../../db/promises');
const { requireAuth } = require('../../../../middleware/auth');
const horsesRepository = require('../../../../dal/horsesRepository');
const usersRepository = require('../../../../dal/usersRepository');
const ledgerRepository = require('../../../../dal/ledgerRepository');
const {
    getBalanceCents,
    assertSufficientBalance,
    parseBetReais,
    buildBalancePayload,
    ensureBrokeRelief
} = require('../../../../services/balanceService');

const router = express.Router();

function horseWeight(horse) {
    return Math.max(1, 1 + horse.streak * 0.3);
}

function pickWinnerIndex(horses) {
    const weights = horses.map(horseWeight);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < weights.length; i++) {
        random -= weights[i];
        if (random <= 0) return i;
    }
    return 0;
}

router.get('/esportes/corrida-cavalos/cavalos', requireAuth, async (req, res) => {
    try {
        const horses = await horsesRepository.listWithStreaks(getDb());
        const weights = horses.map(horseWeight);
        const totalWeight = weights.reduce((a, b) => a + b, 0);

        res.json({
            horses: horses.map((h, index) => {
                const odds = Number((totalWeight / weights[index]).toFixed(2));
                const chance = Number((weights[index] / totalWeight).toFixed(3));
                return {
                    id: h.id,
                    index,
                    name: h.name,
                    streak: h.streak,
                    odds,
                    chance
                };
            })
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao listar cavalos.' });
    }
});

router.post('/esportes/corrida-cavalos/apostar', requireAuth, async (req, res) => {
    try {
        const betCents = parseBetReais(req.body.bet);
        const selectedHorse = Number.parseInt(req.body.selected_horse ?? req.body.selectedHorse, 10);
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

        const horses = await horsesRepository.listWithStreaks(db);
        if (!Number.isInteger(selectedHorse) || selectedHorse < 0 || selectedHorse >= horses.length) {
            return res.status(400).json({ error: 'Cavalo inválido.' });
        }

        const weights = horses.map(horseWeight);
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        const winner = pickWinnerIndex(horses);
        const winCents = winner === selectedHorse
            ? Math.max(0, Math.floor(betCents * totalWeight / weights[selectedHorse]))
            : 0;
        const delta = -betCents + winCents;

        const result = await withTransaction(db, async () => {
            let nextBalance = balance + delta;
            const relief = ensureBrokeRelief(nextBalance);
            nextBalance = relief.balanceCents;

            await usersRepository.updateBalance(db, userId, nextBalance);
            await ledgerRepository.recordEntry(db, {
                userId,
                gameType: 'corrida_cavalos',
                amountCents: delta,
                balanceAfterCents: nextBalance,
                metadata: { bet_cents: betCents, winner, selected_horse: selectedHorse, win_cents: winCents }
            });
            await horsesRepository.updateStreaksAfterRace(db, winner, horses);

            return { nextBalance, relief, winner, winCents };
        });

        res.json({
            winner: result.winner,
            winAmount: result.winCents / 100,
            ...buildBalancePayload(result.nextBalance, result.relief)
        });
    } catch (err) {
        if (err.message === 'INVALID_BET') {
            return res.status(400).json({ error: 'Aposta inválida.' });
        }
        console.error(err);
        res.status(500).json({ error: 'Erro ao processar corrida.' });
    }
});

module.exports = router;
