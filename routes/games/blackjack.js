const express = require('express');
const router = express.Router();
const db = require('../../database');
const { ensureBrokeRelief, handleInsufficientBalance } = require('./shared');

const getCard = () => Math.floor(Math.random() * 10) + 2;
const sumHand = (hand) => hand.reduce((a, b) => a + b, 0);

// Estado em memória para partidas de Blackjack.
const gameStates = {}; // { username: { pHand: [], dHand: [], bet: number, status: 'playing'|'finished', result?: 'win'|'draw'|'loss' } }

router.post('/bj-start', (req, res) => {
    const { username, bet } = req.body;
    db.get("SELECT balance FROM users WHERE username = ?", [username], (err, user) => {
        if (handleInsufficientBalance(user, username, bet, res)) return;

        let newBalance = user.balance - bet;
        const relief = ensureBrokeRelief(newBalance);
        newBalance = relief.balance;

        db.run("UPDATE users SET balance = ? WHERE username = ?", [newBalance, username], () => {
            const pHand = [getCard(), getCard()];
            const dHand = [getCard()];
            gameStates[username] = { pHand, dHand, bet, status: 'playing' };
            res.json({
                balance: newBalance,
                pHand,
                dHand: [dHand[0]],
                pScore: sumHand(pHand),
                dScore: dHand[0],
                reliefBonus: relief.bonus,
                reliefMessage: relief.message
            });
        });
    });
});

router.post('/bj-hit', (req, res) => {
    const { username } = req.body;
    const state = gameStates[username];
    if (!state || state.status !== 'playing') return res.status(400).json({ error: "Jogo não iniciado" });

    state.pHand.push(getCard());
    const pScore = sumHand(state.pHand);

    if (pScore > 21) {
        state.status = 'finished';
        state.result = 'loss';
        return res.json({ pHand: state.pHand, dHand: state.dHand, pScore, dScore: sumHand(state.dHand), status: 'bust' });
    }

    res.json({ pHand: state.pHand, dHand: [state.dHand[0]], pScore, dScore: state.dHand[0] });
});

router.post('/bj-stand', (req, res) => {
    const { username } = req.body;
    const state = gameStates[username];
    if (!state || state.status !== 'playing') return res.status(400).json({ error: "Jogo não iniciado" });

    let dScore = sumHand(state.dHand);
    while (dScore < 17) {
        state.dHand.push(getCard());
        dScore = sumHand(state.dHand);
    }

    const pScore = sumHand(state.pHand);
    let result;
    if (dScore > 21 || pScore > dScore) result = 'win';
    else if (pScore === dScore) result = 'draw';
    else result = 'loss';

    state.status = 'finished';
    state.result = result;
    res.json({ pHand: state.pHand, dHand: state.dHand, pScore, dScore, status: result });
});

router.post('/bj-finish', (req, res) => {
    const { username } = req.body;
    const state = gameStates[username];
    if (!state || state.status !== 'finished') return res.status(400).json({ error: "Jogo não finalizado" });

    db.get("SELECT balance FROM users WHERE username = ?", [username], (err, user) => {
        const result = state.result || 'loss';
        const mult = result === 'win' ? 2 : (result === 'draw' ? 1 : 0);
        let newBalance = user.balance + (state.bet * mult);
        const relief = ensureBrokeRelief(newBalance);
        newBalance = relief.balance;

        db.run("UPDATE users SET balance = ? WHERE username = ?", [newBalance, username], () => {
            delete gameStates[username];
            res.json({ balance: newBalance, reliefBonus: relief.bonus, reliefMessage: relief.message });
        });
    });
});

module.exports = router;
