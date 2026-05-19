const { run } = require('../db/promises');

async function recordEntry(db, { userId, gameType, amountCents, balanceAfterCents, metadata = null }) {
    const metadataJson = metadata ? JSON.stringify(metadata) : null;
    await run(
        db,
        `INSERT INTO ledger_entries (user_id, game_type, amount_cents, balance_after_cents, metadata)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, gameType, amountCents, balanceAfterCents, metadataJson]
    );
}

module.exports = { recordEntry };
