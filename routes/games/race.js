const express = require('express');
const router = express.Router();
const db = require('../../database');
const { HORSE_NAMES, ensureBrokeRelief, handleInsufficientBalance } = require('./shared');

router.post('/race', (req, res) => {
    const { username, bet, selectedHorse } = req.body;
    db.get("SELECT balance FROM users WHERE username = ?", [username], (err, user) => {
        if (handleInsufficientBalance(user, username, bet, res)) return;

        db.all("SELECT horse_name, streak FROM horse_streaks", [], (err, rows) => {
            const streaks = {};
            rows.forEach((row) => { streaks[row.horse_name] = row.streak; });

            // Mais tempo sem ganhar = maior chance.
            const weights = HORSE_NAMES.map((name) => Math.max(1, 1 + (streaks[name] || 0) * 0.3));
            const totalWeight = weights.reduce((a, b) => a + b, 0);
            let random = Math.random() * totalWeight;
            let winner = 0;

            for (let i = 0; i < weights.length; i++) {
                random -= weights[i];
                if (random <= 0) {
                    winner = i;
                    break;
                }
            }

            const winAmount = (winner === parseInt(selectedHorse, 10)) ? bet * 5 : 0;
            let newBalance = user.balance - bet + winAmount;
            const relief = ensureBrokeRelief(newBalance);
            newBalance = relief.balance;

            db.run("UPDATE users SET balance = ? WHERE username = ?", [newBalance, username], () => {
                const updates = HORSE_NAMES.map((name, i) => {
                    const newStreak = (i === winner) ? 0 : (streaks[name] || 0) + 1;
                    return new Promise((resolve) => {
                        db.run("UPDATE horse_streaks SET streak = ? WHERE horse_name = ?", [newStreak, name], resolve);
                    });
                });

                Promise.all(updates).then(() => {
                    res.json({ balance: newBalance, winner, winAmount, reliefBonus: relief.bonus, reliefMessage: relief.message });
                });
            });
        });
    });
});

module.exports = router;
