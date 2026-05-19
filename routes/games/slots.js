const express = require('express');
const router = express.Router();
const db = require('../../database');
const { ensureBrokeRelief, handleInsufficientBalance } = require('./shared');

router.post('/slots', (req, res) => {
    const { username, bet } = req.body;
    db.get("SELECT balance FROM users WHERE username = ?", [username], (err, user) => {
        if (handleInsufficientBalance(user, username, bet, res)) return;

        const win = Math.random() < 0.20 ? bet * 3 : 0; // 20% chance
        let newBalance = user.balance - bet + win;
        const relief = ensureBrokeRelief(newBalance);
        newBalance = relief.balance;

        db.run("UPDATE users SET balance = ? WHERE username = ?", [newBalance, username], () => {
            res.json({ balance: newBalance, win, reliefBonus: relief.bonus, reliefMessage: relief.message });
        });
    });
});

module.exports = router;
