let horseNames = [];
let horseOdds = [];

if (!requireAuthPage()) {
    // redirect handled in requireAuthPage
} else {
    initLayout();
    loadHorses();
}

async function loadHorses() {
    const { response, data } = await apiFetch('/api/v1/jogos/esportes/corrida-cavalos/cavalos');
    if (!response.ok || !data?.horses?.length) {
        setMessage('Não foi possível carregar os cavalos. Tente recarregar a página.', 'loss');
        return;
    }

    horseNames = data.horses.map((h) => h.name);
    horseOdds = data.horses.map((h) => h.odds || 1);
    const track = document.getElementById('race-track');
    const select = document.getElementById('horse-bet');

    track.innerHTML = '';
    select.innerHTML = '';

    const finish = document.createElement('div');
    finish.className = 'finish-line';
    track.appendChild(finish);

    data.horses.forEach((horse) => {
        const lane = document.createElement('div');
        lane.className = 'lane';
        lane.innerHTML = `<span class="horse-name">${horse.name}</span><div id="h${horse.index}" class="horse">🐎</div>`;
        track.appendChild(lane);

        const option = document.createElement('option');
        option.value = String(horse.index);
        option.textContent = `${horse.name} (${horse.odds.toFixed(2)}x)`;
        select.appendChild(option);
    });
}

async function startRace() {
    const bet = parseFloat(document.getElementById('bet-race').value);
    const selectedHorse = document.getElementById('horse-bet').value;
    if (bet <= 0) return alert('Aposta inválida!');
    if (!horseNames.length) {
        await loadHorses();
        if (!horseNames.length) return alert('Aguarde os cavalos carregarem.');
    }

    const btn = document.getElementById('btn-race');
    btn.disabled = true;

    const { response, data } = await apiFetch('/api/v1/jogos/esportes/corrida-cavalos/apostar', {
        method: 'POST',
        body: JSON.stringify({ bet, selected_horse: selectedHorse })
    });

    if (!response.ok) {
        applyBalanceFromResponse(data);
        const showedRelief = handleReliefResponse(data);
        if (!showedRelief) alert(data?.error || 'Erro ao jogar.');
        btn.disabled = false;
        return;
    }

    applyBalanceFromResponse(data);
    setMessage('A corrida começou! Preparando o suspense...', 'info');

    const horsesElements = horseNames.map((_, i) => document.getElementById(`h${i}`)).filter(Boolean);
    if (!horsesElements.length) {
        alert('Pista não carregada. Aguarde ou recarregue a página.');
        btn.disabled = false;
        return;
    }

    const positions = Array(horsesElements.length).fill(0);

    horsesElements.forEach((h) => {
        h.style.left = '0%';
        h.classList.remove('winner');
    });

    const raceInterval = setInterval(() => {
        let finished = false;
        for (let i = 0; i < horsesElements.length; i++) {
            let speed = Math.random() * 3;
            if (i === data.winner && positions[i] > 60) speed += 1;
            positions[i] += speed;
            horsesElements[i].style.left = `${positions[i]}%`;
            if (positions[i] >= 85) {
                finished = true;
                break;
            }
        }
        if (finished) {
            clearInterval(raceInterval);
            if (horsesElements[data.winner]) {
                horsesElements[data.winner].style.left = '86%';
                horsesElements[data.winner].classList.add('winner');
            }
            const name = horseNames[data.winner] || `Cavalo ${data.winner}`;
            setMessage(`Vencedor: ${name}... calculando prêmio.`, 'info');

            setTimeout(() => {
                const finalText = data.winAmount > 0
                    ? `Vencedor: ${name} - VOCÊ GANHOU R$${data.winAmount.toFixed(2)}!`
                    : `Vencedor: ${name} - PERDEU.`;
                setMessage(finalText, data.winAmount > 0 ? 'win' : 'loss');
                handleReliefResponse(data);
                btn.disabled = false;
            }, 1400);
        }
    }, 50);
}

document.getElementById('btn-race').addEventListener('click', startRace);
