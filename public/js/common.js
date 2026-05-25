function setMessage(text, type = 'info') {
    const msgEl = document.getElementById('msg');
    if (!msgEl) return;
    msgEl.classList.remove('message-pop', 'message-win', 'message-loss', 'message-info', 'message-show');
    const cleanText = (text || '').trim();
    msgEl.innerText = cleanText;
    if (!cleanText) return;
    msgEl.classList.add('message-pop', 'message-show', `message-${type}`);
    window.alert(cleanText);
}

function pulseBalance() {
    const balanceEl = document.querySelector('.balance-box');
    if (!balanceEl) return;
    balanceEl.classList.remove('balance-pulse');
    void balanceEl.offsetWidth;
    balanceEl.classList.add('balance-pulse');
}

function formatBalance(value) {
    return Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function renderBalance(balance) {
    const el = document.getElementById('val-balance');
    if (el) el.innerText = formatBalance(balance);
    pulseBalance();
}

function handleReliefResponse(data) {
    if (!data) return false;

    const bonus = Number(data.reliefBonus);
    const hasBonus = Number.isFinite(bonus) && bonus > 0;
    const hasMessage = typeof data.reliefMessage === 'string' && data.reliefMessage.trim().length > 0;

    if (!hasBonus && !hasMessage) return false;

    const msg = hasMessage ? data.reliefMessage.trim() : 'Ajuda recebida';
    const suffix = hasBonus ? ` (+R$ ${bonus.toFixed(2)})` : '';
    const fullMessage = msg + suffix;
    setMessage(fullMessage, 'info');
    return true;
}

function applyBalanceFromResponse(data) {
    if (data && typeof data.balance === 'number') {
        updateSessionBalance(data.balance);
        renderBalance(data.balance);
        return true;
    }
    return false;
}

function markActiveNav() {
    const current = window.location.pathname;
    document.querySelectorAll('.site-nav a').forEach((link) => {
        const path = new URL(link.href, window.location.origin).pathname;
        link.classList.toggle('active', path === current);
    });
}

function initLayout() {
    const session = getSession();
    if (session) renderBalance(session.balance);
    markActiveNav();
}
