if (!requireAuthPage()) {
    // redirect
} else {
    initLayout();
}

async function playSlots() {
    const bet = parseFloat(document.getElementById('bet-slots').value);
    if (bet <= 0) return alert('Aposta inválida!');

    const btn = document.getElementById('btn-spin');
    btn.disabled = true;

    const { response, data } = await apiFetch('/api/v1/jogos/cassino/fortune-tiger/apostar', {
        method: 'POST',
        body: JSON.stringify({ bet })
    });

    if (!response.ok) {
        applyBalanceFromResponse(data);
        const showedRelief = handleReliefResponse(data);
        if (!showedRelief) alert(data?.error || 'Erro ao jogar.');
        btn.disabled = false;
        return;
    }

    const icons = ['🐯', '💰', '💎', '🍒', '🍀'];
    const reels = document.querySelectorAll('.reel');
    reels.forEach((x) => x.classList.add('spinning'));

    let c = 0;
    const timer = setInterval(() => {
        document.getElementById('r1').innerText = icons[Math.floor(Math.random() * 5)];
        document.getElementById('r2').innerText = icons[Math.floor(Math.random() * 5)];
        document.getElementById('r3').innerText = icons[Math.floor(Math.random() * 5)];

        if (c++ > 15) {
            clearInterval(timer);
            reels.forEach((x) => x.classList.remove('spinning'));
            applyBalanceFromResponse(data);

            if (data.win > 0) {
                document.querySelectorAll('.reel').forEach((x) => { x.innerText = '🐯'; });
                reels.forEach((x) => x.classList.add('win'));
                setMessage(`🐯 PAGOU R$ ${data.win.toFixed(2)}`, 'win');
                setTimeout(() => reels.forEach((x) => x.classList.remove('win')), 1500);
            } else {
                setMessage('PERDEU!', 'loss');
            }

            handleReliefResponse(data);
            btn.disabled = false;
        }
    }, 80);
}

document.getElementById('btn-spin').addEventListener('click', playSlots);
