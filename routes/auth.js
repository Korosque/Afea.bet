const express = require('express');
const router = express.Router();
const db = require('../database');

router.post('/auth', (req, res) => {
    const { username, password } = req.body;

    db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
        if (err) return res.status(500).json({ error: "Erro no banco" });

        if (!user) {
            // Cadastro automático
            db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, password], function(err) {
                if (err) return res.status(500).json({ error: "Erro ao criar conta" });
                res.json({ username, balance: 2000 });
            });
        } else {
            // Login
            if (user.password !== password) return res.status(401).json({ error: "Senha incorreta" });
            res.json({ username: user.username, balance: user.balance });
        }
    });
});

module.exports = router;