const db = require('../../database');

const HORSE_NAMES = ["Maezio", "Jorge", "Hugo", "Vinicius", "Rômulo", "Darlan"];
const RELIEF_MESSAGES = [
    "Vendeu os móveis ganhou 2000",
    "Vendeu o PS5",
    "Vendeu um rim",
    "Pegou empréstimo no Nubank",
    "Trabalhou um extra e recebeu 2000"
];

const ensureBrokeRelief = (balance) => {
    if (balance > 0) return { balance, bonus: 0, message: null };
    const message = RELIEF_MESSAGES[Math.floor(Math.random() * RELIEF_MESSAGES.length)];
    return { balance: 2000, bonus: 2000, message };
};

const handleInsufficientBalance = (user, username, bet, res) => {
    if (!user) {
        res.status(400).json({ error: "Usuário não encontrado" });
        return true;
    }

    if (user.balance >= bet) return false;

    // Se já estiver quebrado, aplica socorro na hora.
    if (user.balance <= 0) {
        const relief = ensureBrokeRelief(user.balance);
        db.run("UPDATE users SET balance = ? WHERE username = ?", [relief.balance, username], () => {
            res.status(400).json({
                error: "Sem saldo",
                balance: relief.balance,
                reliefBonus: relief.bonus,
                reliefMessage: relief.message
            });
        });
        return true;
    }

    res.status(400).json({ error: "Sem saldo" });
    return true;
};

module.exports = {
    HORSE_NAMES,
    ensureBrokeRelief,
    handleInsufficientBalance
};
