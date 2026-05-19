const express = require('express');
const authRoutes = require('./auth');
const accountRoutes = require('./account');
const slotsRoutes = require('./games/slots');
const raceRoutes = require('./games/race');
const blackjackRoutes = require('./games/blackjack');

const router = express.Router();

router.use(authRoutes);
router.use(accountRoutes);

const gamesRouter = express.Router();
gamesRouter.use(slotsRoutes);
gamesRouter.use(raceRoutes);
gamesRouter.use(blackjackRoutes);
router.use('/jogos', gamesRouter);

module.exports = router;
