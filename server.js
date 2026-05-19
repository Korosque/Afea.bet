const express = require('express');
const path = require('path');
const app = express();

const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/games');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Usa as rotas modularizadas
app.use('/api', authRoutes);
app.use('/api/play', gameRoutes);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
    console.log(`🗄️  Banco de Dados SQLite (afeabet.db) pronto.`);
});