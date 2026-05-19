const express = require('express');
const path = require('path');

const router = express.Router();
const viewsDir = path.join(__dirname, '..', '..', 'views');

function sendView(res, relativePath) {
    res.sendFile(path.join(viewsDir, relativePath));
}

router.get('/', (req, res) => res.redirect(302, '/entrar'));

router.get('/entrar', (req, res) => sendView(res, 'entrar.html'));
router.get('/conta', (req, res) => sendView(res, 'conta.html'));
router.get('/ajuda', (req, res) => sendView(res, 'ajuda.html'));

router.get('/jogos/cassino/fortune-tiger', (req, res) => sendView(res, 'jogos/cassino/fortune-tiger.html'));
router.get('/jogos/esportes/corrida-cavalos', (req, res) => sendView(res, 'jogos/esportes/corrida-cavalos.html'));
router.get('/jogos/mesa/blackjack', (req, res) => sendView(res, 'jogos/mesa/blackjack.html'));

module.exports = router;
