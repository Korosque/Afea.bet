# Patch Notes - Afea.bet

## Versão Atual: 1.2.1

### Novidades desta versão
- **Modularização das rotas de jogos**: o arquivo `routes/games.js` virou agregador e cada jogo foi separado em módulos:
  - `routes/games/slots.js`
  - `routes/games/race.js`
  - `routes/games/blackjack.js`
  - `routes/games/shared.js` (utilitários compartilhados)
- **Organização de código**: redução de duplicação e responsabilidades melhor divididas para facilitar manutenção.

### Correções importantes
- **Socorro ao usuário falido**:
  - Quando o usuário está com saldo `0` (ou menor) e tenta jogar, o backend agora aplica socorro automático de `+2000`.
  - O saldo é atualizado no banco imediatamente e retornado na resposta.
- **Mensagem de socorro no FrontEnd**:
  - O front não bloqueia mais a tentativa de aposta só porque `bet > balance` (quando a ideia é justamente disparar o socorro).
  - A resposta de erro da API passou a ser tratada corretamente para atualizar saldo e exibir a mensagem da ajuda.
  - A mensagem de ajuda agora aparece também em popup (`alert`), igual ao comportamento de mensagens de erro.
- **Blackjack - cálculo de pagamento**:
  - Corrigido bug no `/bj-finish` para usar o resultado real da partida (`win`, `draw`, `loss`) no multiplicador de pagamento.

### Validação
- Testes de sintaxe realizados com `node --check` nos arquivos alterados.
- Smoke test de API executado com sucesso:
  - autenticação;
  - rotas de jogos (`slots`, `race`, `bj-start`, `bj-stand`, `bj-finish`);
  - cenário de usuário falido com socorro automático.

### Notas técnicas
- **Stack**: Node.js + Express + SQLite.
- **Porta padrão**: `3000`.
- **Banco**: `afeabet.db` com tabelas `users` e `horse_streaks`.