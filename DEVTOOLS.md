# DevTools - Guia de Uso

## 🛠️ O que é?

DevTools é um painel de desenvolvimento integrado ao projeto que permite monitorar em tempo real:
- **Requisições HTTP** - Todas as chamadas fetch com método, URL, status e duração
- **Cookies** - Visualizar cookies HTTP atuais
- **Storage** - SessionStorage e LocalStorage
- **Console** - Logs, warnings e erros em tempo real
- **Info** - Informações da sessão e token

## 🚀 Como Usar?

### Abrir o DevTools
1. Procure pelo ícone **🛠️** no canto inferior direito da página
2. Clique para abrir o painel
3. Clique novamente para minimizar

### Abas Disponíveis

#### 📡 Network
Mostra todas as requisições HTTP feitas pela página:
- **Método**: GET, POST, PUT, DELETE
- **URL**: Endpoint chamado
- **Status**: Código HTTP (200, 201, 400, 401, 500, etc)
- **Duração**: Tempo em ms

Cores indicam o método:
- 🟢 GET - Verde
- 🟠 POST - Laranja
- 🟡 PUT - Amarelo
- 🔴 DELETE - Vermelho

#### 💾 Storage
Visualiza dados armazenados no navegador:
- **Cookies**: HTTP cookies (inclui token JWT)
- **SessionStorage**: Dados da aba atual
- **LocalStorage**: Dados persistentes

#### 📝 Console
Monitora saídas do console:
- `console.log()` - Logs informativos
- `console.warn()` - Avisos
- `console.error()` - Erros
- Erros não capturados

#### ℹ️ Info
Informações úteis:
- URL atual
- User Agent
- Status da sessão
- Token JWT (primeiros 20 caracteres)

## 🎯 Casos de Uso Comuns

### Debugar Problema de Login
1. Abra DevTools
2. Vá para a aba **Storage**
3. Verifique se o token está em **SessionStorage**
4. Verifique o valor do cookie `afeabet_session`

### Monitorar Requisições de Jogo
1. Abra DevTools
2. Fique na aba **Network**
3. Execute uma ação no jogo (aposte no cavalo, gire o slot, etc)
4. Veja a requisição POST com status 200 ou 201
5. Clique para ver resposta (abra console do navegador)

### Verificar Erros
1. Abra DevTools
2. Vá para a aba **Console**
3. Procure por itens com fundo vermelho (ERROR)
4. Veja a mensagem de erro

## 💡 Dicas

- **Limite de 100 registros**: Por performance, DevTools mantém apenas os 100 últimos eventos
- **Persiste estado**: Se você minimizar e reabrir, o painel reabre no estado anterior
- **Sem impacto de performance**: O interceptor é leve e usa `WeakMap` internamente

## 🔧 Desabilitar/Habilitar

Para desabilitar completamente o DevTools no frontend:
- Edite `/public/js/devtools.js`
- Mude `const DEVTOOLS_ENABLED = true;` para `false`

Ou feche clicando no botão **×** - aparecerá um ícone para reabrir

## 📌 Informações Técnicas

- **Arquivo**: `/public/js/devtools.js`
- **Importado em**: Todos os arquivos HTML
- **Requer**: Nenhuma dependência adicional
- **Tamanho**: ~12KB (minificado ~4KB)
