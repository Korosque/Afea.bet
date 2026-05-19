const express = require('express');
const router = express.Router();

const slotsRoutes = require('./games/slots');
const raceRoutes = require('./games/race');
const blackjackRoutes = require('./games/blackjack');

router.use(slotsRoutes);
router.use(raceRoutes);
router.use(blackjackRoutes);

module.exports = router;