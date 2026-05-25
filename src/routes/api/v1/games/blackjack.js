const express = require('express');
const router = express.Router();
const { getDb } = require('../../../../db/connection');
const { requireAuth } = require('../../../../middleware/auth');
const blackjackRepository = require('../../../../dal/blackjackRepository');
const usersRepository = require('../../../../dal/usersRepository');
const {
    getBalanceCents,
    applyBalanceChange,
    assertSufficientBalance,
    parseBetReais,
    buildBalancePayload,
    ensureBrokeRelief
} = require('../../../../services/balanceService');

const DECK = [
    { rank: 'A', value: 11 }, { rank: '2', value: 2 }, { rank: '3', value: 3 },
    { rank: '4', value: 4 }, { rank: '5', value: 5 }, { rank: '6', value: 6 },
    { rank: '7', value: 7 }, { rank: '8', value: 8 }, { rank: '9', value: 9 },
    { rank: '10', value: 10 }, { rank: 'J', value: 10 }, { rank: 'Q', value: 10 },
    { rank: 'K', value: 10 }
];

function getRandomCard() {
    return DECK[Math.floor(Math.random() * DECK.length)];
}

// Utilitário para calcular o valor da mão (Lógica do Ás)
function calculateHandValue(hand) {
    let value = 0;
    let aces = 0;
    hand.forEach(card => {
        value += card.value;
        if (card.rank === 'A') aces++;
    });
    while (value > 21 && aces > 0) {
        value -= 10;
        aces--;
    }
    return value;
}

router.post('/mesa/blackjack/rodadas', requireAuth, async (req, res) => {
    try {
        const betCents = parseBetReais(req.body.bet);
        const db = getDb();
        const userId = req.user.id;
        const balance = await getBalanceCents(db, userId);

        if (!assertSufficientBalance(balance, betCents)) {
            if (balance <= 0) {
                const relief = ensureBrokeRelief(balance);
                await usersRepository.updateBalance(db, userId, relief.balanceCents);
                return res.status(400).json({ error: 'Sem saldo', ...buildBalancePayload(relief.balanceCents, relief) });
            }
            return res.status(400).json({ error: 'Sem saldo' });
        }

        await usersRepository.updateBalance(db, userId, balance - betCents);

        const playerHand = [getRandomCard(), getRandomCard()];
        const dealerHand = [getRandomCard()];
        const session = {
            betCents,
            playerHand,
            dealerHand,
            status: 'playing',
            result: null
        };

        await blackjackRepository.upsertSession(db, userId, session);

        res.json({
            player_hand: playerHand.map(c => c.rank),
            dealer_hand: dealerHand.map(c => c.rank),
            player_score: calculateHandValue(playerHand),
            dealer_score: calculateHandValue(dealerHand),
            status: 'playing',
            balance: (balance - betCents) / 100
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao iniciar Blackjack' });
    }
});

router.post('/mesa/blackjack/rodadas/comprar', requireAuth, async (req, res) => {
    const db = getDb();
    const session = await blackjackRepository.findByUserId(db, req.user.id);
    if (!session) return res.status(400).json({ error: 'Nenhuma partida ativa.' });

    session.playerHand.push(getRandomCard());
    const score = calculateHandValue(session.playerHand);
    if (score > 21) {
        session.status = 'finished';
        session.result = 'loss';
    }

    await blackjackRepository.upsertSession(db, req.user.id, session);
    res.json({
        player_hand: session.playerHand.map(c => c.rank),
        dealer_hand: session.dealerHand.map(c => c.rank),
        player_score: score,
        dealer_score: calculateHandValue(session.dealerHand),
        status: score > 21 ? 'bust' : session.status
    });
});

router.post('/mesa/blackjack/rodadas/parar', requireAuth, async (req, res) => {
    const db = getDb();
    const session = await blackjackRepository.findByUserId(db, req.user.id);
    if (!session) return res.status(400).json({ error: 'Nenhuma partida ativa.' });

    while (calculateHandValue(session.dealerHand) < 17) {
        session.dealerHand.push(getRandomCard());
    }

    const pScore = calculateHandValue(session.playerHand);
    const dScore = calculateHandValue(session.dealerHand);

    session.status = 'finished';
    if (dScore > 21 || pScore > dScore) session.result = 'win';
    else if (pScore === dScore) session.result = 'draw';
    else session.result = 'loss';

    await blackjackRepository.upsertSession(db, req.user.id, session);
    res.json({
        player_hand: session.playerHand.map(c => c.rank),
        dealer_hand: session.dealerHand.map(c => c.rank),
        player_score: pScore,
        dealer_score: dScore,
        status: session.result
    });
});

router.post('/mesa/blackjack/rodadas/encerrar', requireAuth, async (req, res) => {
    const db = getDb();
    const userId = req.user.id;
    const session = await blackjackRepository.findByUserId(db, userId);
    if (!session) return res.status(400).json({ error: 'Sessão não encontrada.' });

    let multiplier = 0;
    if (session.result === 'win') multiplier = 2;
    else if (session.result === 'draw') multiplier = 1;

    const winCents = Math.floor(session.betCents * multiplier);
    const { balanceCents, relief } = await applyBalanceChange(db, userId, winCents, 'blackjack', {
        bet_cents: session.betCents,
        win_cents: winCents,
        result: session.result
    });

    await blackjackRepository.deleteByUserId(db, userId);
    res.json({ ...buildBalancePayload(balanceCents, relief) });
});

module.exports = router;