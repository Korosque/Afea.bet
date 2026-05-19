const { get, withTransaction } = require('../db/promises');
const usersRepository = require('../dal/usersRepository');
const ledgerRepository = require('../dal/ledgerRepository');
const { ensureBrokeRelief, reliefToResponse } = require('./relief');
const { reaisToCents } = require('../dal/money');

async function getBalanceCents(db, userId) {
    const row = await get(
        db,
        'SELECT balance_cents FROM users WHERE id = ? AND deleted_at IS NULL',
        [userId]
    );
    return row ? row.balance_cents : null;
}

async function applyBalanceChange(db, userId, deltaCents, gameType, metadata = null) {
    return withTransaction(db, async () => {
        const current = await getBalanceCents(db, userId);
        if (current === null) {
            throw new Error('USER_NOT_FOUND');
        }

        let nextBalance = current + deltaCents;
        const relief = ensureBrokeRelief(nextBalance);
        nextBalance = relief.balanceCents;

        await usersRepository.updateBalance(db, userId, nextBalance);
        await ledgerRepository.recordEntry(db, {
            userId,
            gameType,
            amountCents: deltaCents,
            balanceAfterCents: nextBalance,
            metadata: { ...metadata, relief: relief.message }
        });

        return {
            balanceCents: nextBalance,
            relief
        };
    });
}

function assertSufficientBalance(balanceCents, betCents) {
    return balanceCents >= betCents;
}

function parseBetReais(bet) {
    const betCents = reaisToCents(bet);
    if (!Number.isFinite(betCents) || betCents <= 0) {
        throw new Error('INVALID_BET');
    }
    return betCents;
}

function buildBalancePayload(balanceCents, relief) {
    return {
        balance: balanceCents / 100,
        balance_cents: balanceCents,
        ...reliefToResponse(relief)
    };
}

module.exports = {
    getBalanceCents,
    applyBalanceChange,
    assertSufficientBalance,
    parseBetReais,
    buildBalancePayload,
    ensureBrokeRelief,
    reliefToResponse
};
