# Afea.bet

Aplicação web de apostas (Node.js + Express + SQLite) com páginas separadas por jogo e API REST versionada.

## Estrutura do projeto

```
├── server.js          # Entrada da aplicação
├── src/               # Backend (API, banco, regras de jogo)
│   ├── config.js
│   ├── db/
│   ├── dal/
│   ├── middleware/
│   ├── routes/
│   └── services/
├── public/            # CSS, JS e assets estáticos
├── views/             # Páginas HTML
├── migrations/        # Schema SQL versionado
└── data/              # Banco SQLite (gerado em runtime)
```

## Como rodar

```bash
npm install
npm start
```

Acesse [http://localhost:3000/entrar](http://localhost:3000/entrar).

## Variáveis de ambiente (opcional)

Copie `.env.example` para `.env` e ajuste:

- `PORT` — porta do servidor (padrão: 3000)
- `JWT_SECRET` — chave para tokens de sessão
- `DB_PATH` — caminho do arquivo SQLite

## Rotas principais

| Página | URL |
|--------|-----|
| Login | `/entrar` |
| Conta | `/conta` |
| Fortune Tiger | `/jogos/cassino/fortune-tiger` |
| Corrida | `/jogos/esportes/corrida-cavalos` |
| Blackjack | `/jogos/mesa/blackjack` |

API: prefixo `/api/v1` (ex.: `POST /api/v1/sessao`).

## Licença

ISC
# Afea-Bet
