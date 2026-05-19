let cur = null;
const horseNames = ["Maezio", "Jorge", "Hugo", "Vinicius", "Rômulo", "Darlan"];

function setMessage(text, type = 'info') {
    const msgEl = document.getElementById('msg');
    msgEl.classList.remove('message-pop', 'message-win', 'message-loss', 'message-info', 'message-show');
    const cleanText = (text || "").trim();
    msgEl.innerText = cleanText;
    if (!cleanText) return;
    msgEl.classList.add('message-pop', 'message-show', `message-${type}`);
}

function pulseBalance() {
    const balanceEl = document.querySelector('.balance-box');
    if (!balanceEl) return;
    balanceEl.classList.remove('balance-pulse');
    void balanceEl.offsetWidth;
    balanceEl.classList.add('balance-pulse');
}

async function auth() {
    const u = document.getElementById('user-in').value;
    const p = document.getElementById('pass-in').value;
    if(!u || !p) return alert("Preencha tudo!");
    
    try {
        const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: u, password: p })
        });
        if(res.ok) {
            cur = await res.json();
            document.getElementById('auth-screen').classList.add('hidden');
            document.getElementById('game-screen').classList.remove('hidden');
            updateUI();
        } else {
            const data = await res.json();
            document.getElementById('auth-err').innerText = data.error;
        }
    } catch (e) {
        alert("Erro: O servidor não está rodando!");
    }
}

function updateUI() {
    if(!cur) return;
    document.getElementById('val-balance').innerText = cur.balance.toLocaleString('pt-BR',{minimumFractionDigits:2});
    pulseBalance();
}

function tab(id, b) {
    document.querySelectorAll('.tab-content').forEach(x=>x.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(x=>x.classList.remove('active'));
    document.getElementById('tab-'+id).classList.remove('hidden');
    b.classList.add('active');
    setMessage("");
}

function handleReliefResponse(data) {
    if (!data) return false;

    const bonus = Number(data.reliefBonus);
    const hasBonus = Number.isFinite(bonus) && bonus > 0;
    const hasMessage = typeof data.reliefMessage === 'string' && data.reliefMessage.trim().length > 0;

    if (!hasBonus && !hasMessage) return false;

    const msg = hasMessage ? data.reliefMessage.trim() : "Ajuda recebida";
    const suffix = hasBonus ? " (+R$ " + bonus.toFixed(2) + ")" : "";
    const fullMessage = msg + suffix;
    setMessage(fullMessage, 'info');
    alert(fullMessage);
    return true;
}

function applyBalanceIfPresent(data) {
    if (data && typeof data.balance === 'number' && cur) {
        cur.balance = data.balance;
        updateUI();
    }
}

async function playSlots() {
    const bet = parseFloat(document.getElementById('bet-slots').value);
    if(bet <= 0) return alert("Aposta inválida!");
    const btn = document.getElementById('btn-spin');
    btn.disabled = true;

    const res = await fetch('/api/play/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cur.username, bet: bet })
    });
    const data = await res.json();
    if (!res.ok) {
        applyBalanceIfPresent(data);
        const showedRelief = handleReliefResponse(data);
        if (!showedRelief) alert(data.error || "Erro ao jogar.");
        btn.disabled = false;
        return;
    }

    const icons = ["🐯","💰","💎","🍒","🍀"];
    const reels = document.querySelectorAll('.reel');
    reels.forEach((x) => x.classList.add('spinning'));
    let c = 0;
    const t = setInterval(() => {
        document.getElementById('r1').innerText = icons[Math.floor(Math.random()*5)];
        document.getElementById('r2').innerText = icons[Math.floor(Math.random()*5)];
        document.getElementById('r3').innerText = icons[Math.floor(Math.random()*5)];
        if(c++ > 15) {
            clearInterval(t);
            reels.forEach((x) => x.classList.remove('spinning'));
            cur.balance = data.balance;
            if(data.win > 0) {
                document.querySelectorAll('.reel').forEach(x=>x.innerText="🐯");
                reels.forEach((x) => x.classList.add('win'));
                setMessage("🐯 PAGOU R$ " + data.win.toFixed(2), 'win');
                setTimeout(() => reels.forEach((x) => x.classList.remove('win')), 1500);
            } else {
                setMessage("PERDEU!", 'loss');
            }
            handleReliefResponse(data);
            btn.disabled = false;
            updateUI();
        }
    }, 80);
}

async function startRace() {
    const bet = parseFloat(document.getElementById('bet-race').value);
    const selectedHorse = document.getElementById('horse-bet').value;
    if(bet <= 0) return alert("Aposta inválida!");
    const btn = document.getElementById('btn-race');
    btn.disabled = true;

    const res = await fetch('/api/play/race', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cur.username, bet, selectedHorse })
    });
    const data = await res.json();
    if (!res.ok) {
        applyBalanceIfPresent(data);
        const showedRelief = handleReliefResponse(data);
        if (!showedRelief) alert(data.error || "Erro ao jogar.");
        btn.disabled = false;
        return;
    }

    cur.balance = data.balance;
    updateUI();

    let positions = [0, 0, 0, 0, 0, 0];
    const horsesElements = [0,1,2,3,4,5].map(i => document.getElementById('h'+i));
    horsesElements.forEach((h) => {
        h.style.left = "0%";
        h.classList.remove('winner');
    });

    const raceInterval = setInterval(() => {
        let finished = false;
        for (let i = 0; i < 6; i++) {
            let speed = Math.random() * 3;
            if (i === data.winner && positions[i] > 60) speed += 1;
            positions[i] += speed;
            horsesElements[i].style.left = positions[i] + "%";
            if (positions[i] >= 85) { finished = true; break; }
        }
        if (finished) {
            clearInterval(raceInterval);
            horsesElements[data.winner].style.left = "86%";
            horsesElements[data.winner].classList.add('winner');
            setMessage("Vencedor: " + horseNames[data.winner] + (data.winAmount > 0 ? " - VOCÊ GANHOU!" : " - PERDEU."), data.winAmount > 0 ? 'win' : 'loss');
            handleReliefResponse(data);
            btn.disabled = false;
            updateUI();
        }
    }, 50);
}

let bjBet = 0, bjState = null;

async function startBJ() {
    bjBet = parseFloat(document.getElementById('bet-bj').value);
    if(bjBet <= 0) return alert("Aposta inválida!");
    const res = await fetch('/api/play/bj-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cur.username, bet: bjBet })
    });
    const data = await res.json();
    if (res.ok) {
        cur.balance = data.balance;
        bjState = { pHand: data.pHand, dHand: data.dHand, pScore: data.pScore, dScore: data.dScore };
        renderBJ();
        document.getElementById('bj-bet-ui').classList.add('hidden');
        document.getElementById('bj-game-ui').classList.remove('hidden');
        updateUI();
    } else {
        applyBalanceIfPresent(data);
        const showedRelief = handleReliefResponse(data);
        if (!showedRelief) alert(data.error);
    }
}

function renderBJ() {
    if (!bjState) return;
    document.getElementById('p-score').innerText = bjState.pScore;
    document.getElementById('p-cards').innerText = "Cards: " + bjState.pHand.join(", ");
    document.getElementById('d-score').innerText = bjState.dScore;
    document.getElementById('d-cards').innerText = "Cards: " + bjState.dHand.join(", ");
    const boxes = document.querySelectorAll('.bj-box');
    boxes.forEach((box) => box.classList.add('active-turn'));
    setTimeout(() => boxes.forEach((box) => box.classList.remove('active-turn')), 220);
}

async function hitBJ() {
    const res = await fetch('/api/play/bj-hit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cur.username })
    });
    const data = await res.json();
    if (res.ok) {
        bjState = { pHand: data.pHand, dHand: data.dHand, pScore: data.pScore, dScore: data.dScore };
        renderBJ();
        if (data.status === 'bust') {
            await finishBJ("ESTOUROU!", "loss");
        }
    } else {
        alert(data.error);
    }
}

async function standBJ() {
    const res = await fetch('/api/play/bj-stand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cur.username })
    });
    const data = await res.json();
    if (res.ok) {
        bjState = { pHand: data.pHand, dHand: data.dHand, pScore: data.pScore, dScore: data.dScore };
        renderBJ();
        let msg, status;
        if (data.status === 'win') { msg = "VENCEU!"; status = "win"; }
        else if (data.status === 'draw') { msg = "EMPATE!"; status = "draw"; }
        else { msg = "PERDEU."; status = "loss"; }
        await finishBJ(msg, status);
    } else {
        alert(data.error);
    }
}

async function finishBJ(m, status) {
    const res = await fetch('/api/play/bj-finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cur.username })
    });
    const data = await res.json();
    if (res.ok) {
        cur.balance = data.balance;
        const msgType = status === 'win' ? 'win' : (status === 'draw' ? 'info' : 'loss');
        setMessage(m, msgType);
        handleReliefResponse(data);
        document.getElementById('bj-bet-ui').classList.remove('hidden');
        document.getElementById('bj-game-ui').classList.add('hidden');
        bjState = null;
        updateUI();
    } else {
        alert(data.error);
    }
}