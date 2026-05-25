const express = require('express');
const { getDb } = require('../../../../db/connection');
const { requireAuth } = require('../../../../middleware/auth');
const blackjackRepository = require('../../../../dal/blackjackRepository');
const {
    getBalanceCents,
    applyBalanceChange,
    assertSufficientBalance,
    parseBetReais,
    buildBalancePayload,
    ensureBrokeRelief
} = require('../../../../services/balanceService');
const usersRepository = require('../../../../dal/usersRepository');

const router = express.Router();

const getCard = () => Math.floor(Math.random() * 10) + 2;
const sumHand = (hand) => hand.reduce((a, b) => a + b, 0);

function sessionPayload(state, hideDealer = true) {
    return {
        player_hand: state.playerHand,
        dealer_hand: hideDealer ? [state.dealerHand[0]] : state.dealerHand,
        player_score: sumHand(state.playerHand),
        dealer_score: hideDealer ? state.dealerHand[0] : sumHand(state.dealerHand)
    };
}

router.post('/mesa/blackjack/rodadas', requireAuth, async (req, res) => {
    try {
        const betCents = parseBetReais(req.body.bet);
        const db = getDb();
        const userId = req.user.id;
        const existing = await blackjackRepository.findActiveByUserId(db, userId);
        if (existing && existing.status === 'playing') {
            const balance = await getBalanceCents(db, userId);
            return res.json({
                ...buildBalancePayload(balance, { balanceCents: balance, bonusCents: 0, message: null }),
                ...sessionPayload(existing, true),
                resumed: true
            });
        }

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

        const session = {
            betCents,
            playerHand: [getCard(), getCard()],
            dealerHand: [getCard()],
            status: 'playing',
            result: null
        };
        await blackjackRepository.upsertSession(db, userId, session);

        res.json({
            ...buildBalancePayload(balance, { balanceCents: balance, bonusCents: 0, message: null }),
            ...sessionPayload(session, true)
        });
    } catch (err) {
        if (err.message === 'INVALID_BET') {
            return res.status(400).json({ error: 'Aposta inválida.' });
        }
        console.error(err);
        res.status(500).json({ error: 'Erro ao iniciar rodada.' });
    }
});

router.post('/mesa/blackjack/rodadas/comprar', requireAuth, async (req, res) => {
    const db = getDb();
    const userId = req.user.id;
    const state = await blackjackRepository.findActiveByUserId(db, userId);

    if (!state || state.status !== 'playing') {
        return res.status(400).json({ error: 'Rodada não iniciada.' });
    }

    state.playerHand.push(getCard());
    const playerScore = sumHand(state.playerHand);

    if (playerScore > 21) {
        state.status = 'finished';
        state.result = 'loss';
        await blackjackRepository.upsertSession(db, userId, state);
        return res.json({
            status: 'bust',
            ...sessionPayload(state, false)
        });
    }

    await blackjackRepository.upsertSession(db, userId, state);
    res.json(sessionPayload(state, true));
});

router.post('/mesa/blackjack/rodadas/parar', requireAuth, async (req, res) => {
    const db = getDb();
    const userId = req.user.id;
    const state = await blackjackRepository.findActiveByUserId(db, userId);

    if (!state || state.status !== 'playing') {
        return res.status(400).json({ error: 'Rodada não iniciada.' });
    }

    let dealerScore = sumHand(state.dealerHand);
    while (dealerScore < 17) {
        state.dealerHand.push(getCard());
        dealerScore = sumHand(state.dealerHand);
    }

    const playerScore = sumHand(state.playerHand);
    if (dealerScore > 21 || playerScore > dealerScore) state.result = 'win';
    else if (playerScore === dealerScore) state.result = 'draw';
    else state.result = 'loss';

    state.status = 'finished';
    await blackjackRepository.upsertSession(db, userId, state);

    res.json({
        status: state.result,
        ...sessionPayload(state, false)
    });
});

router.post('/mesa/blackjack/rodadas/encerrar', requireAuth, async (req, res) => {
    try {
        const db = getDb();
        const userId = req.user.id;
        const state = await blackjackRepository.findActiveByUserId(db, userId);

        if (!state || state.status !== 'finished') {
            return res.status(400).json({ error: 'Rodada não finalizada.' });
        }

        const delta = state.result === 'win'
            ? state.betCents
            : state.result === 'draw'
                ? 0
                : -state.betCents;
        const { balanceCents, relief } = await applyBalanceChange(db, userId, delta, 'blackjack_finish', {
            result: state.result,
            bet_cents: state.betCents,
            payout_cents: delta
        });

        await blackjackRepository.deleteByUserId(db, userId);

        res.json(buildBalancePayload(balanceCents, relief));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao encerrar rodada.' });
    }
});

module.exports = router;
