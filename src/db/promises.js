function run(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function onRun(err) {
            if (err) return reject(err);
            resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}

function get(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) return reject(err);
            resolve(row);
        });
    });
}

function all(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows || []);
        });
    });
}

async function withTransaction(db, fn) {
    await run(db, 'BEGIN IMMEDIATE');
    try {
        const result = await fn();
        await run(db, 'COMMIT');
        return result;
    } catch (err) {
        await run(db, 'ROLLBACK').catch(() => {});
        throw err;
    }
}

module.exports = { run, get, all, withTransaction };
