const { all, run } = require('../db/promises');

async function listWithStreaks(db) {
    return all(
        db,
        `SELECT h.id, h.name, h.display_order, COALESCE(hs.streak, 0) AS streak
         FROM horses h
         LEFT JOIN horse_streaks hs ON hs.horse_id = h.id
         ORDER BY h.display_order ASC`
    );
}

async function updateStreaksAfterRace(db, winnerIndex, horses) {
    for (let i = 0; i < horses.length; i++) {
        const horse = horses[i];
        const newStreak = i === winnerIndex ? 0 : horse.streak + 1;
        await run(
            db,
            `UPDATE horse_streaks
             SET streak = ?, updated_at = datetime('now')
             WHERE horse_id = ?`,
            [newStreak, horse.id]
        );
    }
}

module.exports = { listWithStreaks, updateStreaksAfterRace };
