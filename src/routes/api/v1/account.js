const express = require('express');
const { requireAuth } = require('../../../middleware/auth');
const { buildBalancePayload } = require('../../../services/balanceService');
const { ensureBrokeRelief } = require('../../../services/relief');

const router = express.Router();

router.get('/conta', requireAuth, (req, res) => {
    const user = req.user;
    res.json({
        username: user.username,
        member_since: user.created_at,
        ...buildBalancePayload(user.balance_cents, ensureBrokeRelief(user.balance_cents))
    });
});

module.exports = router;
