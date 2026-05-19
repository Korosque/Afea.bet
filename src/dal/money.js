function centsToReais(cents) {
    return Number(cents) / 100;
}

function reaisToCents(value) {
    return Math.round(Number(value) * 100);
}

function formatBalanceResponse(balanceCents) {
    return {
        balance: centsToReais(balanceCents),
        balance_cents: balanceCents
    };
}

module.exports = { centsToReais, reaisToCents, formatBalanceResponse };
