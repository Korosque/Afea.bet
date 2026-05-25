const { initialBalanceCents } = require('../config');

const RELIEF_MESSAGES = [
    'Vendeu droga',
    'Vendeu o filho',
    'Roubou a família',
    'Pegou empréstimo no Nubank e desinstalou o app depois',
    'Pegou emprestimo com agiota',
    'Recebeu do governo',
    'Roubou a prostituta',
    'Sonegou pensão alimentícia',
    'Vendeu a alma pro diabo'
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
