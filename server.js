const express = require('express');
const path = require('path');
const { port, dbPath, rootDir } = require('./src/config');
const { initDatabase } = require('./src/db/connection');
const pageRoutes = require('./src/routes/pages');
const apiV1Routes = require('./src/routes/api/v1');

const app = express();

app.use(express.json());
app.use(express.static(path.join(rootDir, 'public')));

app.use(pageRoutes);
app.use('/api/v1', apiV1Routes);

app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Rota de API não encontrada.' });
    }
    res.status(404).sendFile(path.join(rootDir, 'views', '404.html'));
});

initDatabase()
    .then(() => {
        app.listen(port, () => {
            console.log(`Servidor: http://localhost:${port}`);
            console.log(`Banco SQLite: ${path.resolve(dbPath)}`);
        });
    })
    .catch((err) => {
        console.error('Falha ao iniciar banco de dados:', err);
        process.exit(1);
    });
