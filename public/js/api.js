const SESSION_KEY = 'afeabet_session';

function getSession() {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function saveSession(data) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
}

function updateSessionBalance(balance) {
    const session = getSession();
    if (!session) return;
    session.balance = balance;
    saveSession(session);
}

async function apiFetch(path, options = {}) {
    const session = getSession();
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };
    if (session?.token) {
        headers.Authorization = `Bearer ${session.token}`;
    }

    const response = await fetch(path, { ...options, headers });
    let data = null;
    try {
        data = await response.json();
    } catch {
        data = null;
    }
    return { response, data };
}

function requireAuthPage() {
    if (!getSession()?.token) {
        window.location.replace('/entrar');
        return false;
    }
    return true;
}
