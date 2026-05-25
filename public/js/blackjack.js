let bjState = null;

if (!requireAuthPage()) {
    // redirect
} else {
    initLayout();
}

function renderBJ() {
    if (!bjState) return;
    document.getElementById('p-score').innerText = bjState.player_score;
    document.getElementById('p-cards').innerText = 'Cards: ' + bjState.player_hand.join(', ');
    document.getElementById('d-score').innerText = bjState.dealer_score;
    document.getElementById('d-cards').innerText = 'Cards: ' + bjState.dealer_hand.join(', ');
    document.querySelectorAll('.bj-box').forEach((box) => {
        box.classList.add('active-turn');
        setTimeout(() => box.classList.remove('active-turn'), 220);
    });
}

async function startBJ() {
    const bet = parseFloat(document.getElementById('bet-bj').value);
    if (bet <= 0) return alert('Aposta inválida!');

    const { response, data } = await apiFetch('/api/v1/jogos/mesa/blackjack/rodadas', {
        method: 'POST',
        body: JSON.stringify({ bet })
    });

    if (!response.ok) {
        applyBalanceFromResponse(data);
        const showedRelief = handleReliefResponse(data);
        if (!showedRelief) alert(data?.error || 'Erro ao iniciar.');
        return;
    }

    applyBalanceFromResponse(data);
    bjState = data;
    renderBJ();
    document.getElementById('bj-bet-ui').classList.add('hidden');
    document.getElementById('bj-game-ui').classList.remove('hidden');
}

async function hitBJ() {
    const { response, data } = await apiFetch('/api/v1/jogos/mesa/blackjack/rodadas/comprar', {
        method: 'POST',
        body: JSON.stringify({})
    });

    if (!response.ok) {
        alert(data?.error || 'Erro.');
        return;
    }

    bjState = data;
    renderBJ();
    if (data.status === 'bust') {
        await finishBJ('ESTOUROU!', 'loss');
    }
}

async function standBJ() {
    const { response, data } = await apiFetch('/api/v1/jogos/mesa/blackjack/rodadas/parar', {
        method: 'POST',
        body: JSON.stringify({})
    });

    if (!response.ok) {
        alert(data?.error || 'Erro.');
        return;
    }

    bjState = data;
    renderBJ();

    let msg;
    let status;
    if (data.status === 'win') {
        msg = 'VENCEU!';
        status = 'win';
    } else if (data.status === 'draw') {
        msg = 'EMPATE!';
        status = 'draw';
    } else {
        msg = 'PERDEU.';
        status = 'loss';
    }
    await finishBJ(msg, status);
}

async function finishBJ(message, status) {
    const { response, data } = await apiFetch('/api/v1/jogos/mesa/blackjack/rodadas/encerrar', {
        method: 'POST',
        body: JSON.stringify({})
    });

    if (!response.ok) {
        alert(data?.error || 'Erro ao encerrar.');
        return;
    }

    applyBalanceFromResponse(data);
    const msgType = status === 'win' ? 'win' : status === 'draw' ? 'info' : 'loss';
    setMessage(message, msgType);
    handleReliefResponse(data);
    document.getElementById('bj-bet-ui').classList.remove('hidden');
    document.getElementById('bj-game-ui').classList.add('hidden');
    bjState = null;
}

document.getElementById('btn-bj-start').addEventListener('click', startBJ);
document.getElementById('btn-bj-hit').addEventListener('click', hitBJ);
document.getElementById('btn-bj-stand').addEventListener('click', standBJ);
