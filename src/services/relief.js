const { initialBalanceCents } = require('../config');

const RELIEF_MESSAGES = [
    'Vendeu os móveis ganhou 2000',
    'Vendeu o PS5',
    'Vendeu um rim',
    'Pegou empréstimo no Nubank',
    'Trabalhou um extra e recebeu 2000'
];

function ensureBrokeRelief(balanceCents) {
    if (balanceCents > 0) {
        return { balanceCents, bonusCents: 0, message: null };
    }
    const message = RELIEF_MESSAGES[Math.floor(Math.random() * RELIEF_MESSAGES.length)];
    return {
        balanceCents: initialBalanceCents,
        bonusCents: initialBalanceCents,
        message
    };
}

function reliefToResponse(relief) {
    if (!relief.bonusCents) {
        return { reliefBonus: 0, reliefMessage: null };
    }
    return {
        reliefBonus: relief.bonusCents / 100,
        reliefMessage: relief.message
    };
}

module.exports = { ensureBrokeRelief, reliefToResponse, RELIEF_MESSAGES };
