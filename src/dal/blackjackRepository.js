const { get, run } = require('../db/promises');

function parseHand(raw) {
    return JSON.parse(raw);
}

function serializeHand(hand) {
    return JSON.stringify(hand);
}

async function findActiveByUserId(db, userId) {
    const row = await get(
        db,
        `SELECT id, user_id, bet_cents, player_hand, dealer_hand, status, result
         FROM blackjack_sessions
         WHERE user_id = ?
           AND status = 'playing'`,
        [userId]
    );
    if (!row) return null;
    return {
        id: row.id,
        userId: row.user_id,
        betCents: row.bet_cents,
        playerHand: parseHand(row.player_hand),
        dealerHand: parseHand(row.dealer_hand),
        status: row.status,
        result: row.result
    };
}

async function upsertSession(db, userId, session) {
    await run(
        db,
        `INSERT INTO blackjack_sessions (user_id, bet_cents, player_hand, dealer_hand, status, result)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
            bet_cents = excluded.bet_cents,
            player_hand = excluded.player_hand,
            dealer_hand = excluded.dealer_hand,
            status = excluded.status,
            result = excluded.result,
            updated_at = datetime('now')`,
        [
            userId,
            session.betCents,
            serializeHand(session.playerHand),
            serializeHand(session.dealerHand),
            session.status,
            session.result || null
        ]
    );
}

async function deleteByUserId(db, userId) {
    await run(db, 'DELETE FROM blackjack_sessions WHERE user_id = ?', [userId]);
}

module.exports = {
    findActiveByUserId,
    upsertSession,
    deleteByUserId
};
