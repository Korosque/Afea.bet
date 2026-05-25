const SESSION_KEY = 'afeabet_session';
const COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function getCookie(name) {
    const cookieString = document.cookie || '';
    const cookies = cookieString.split(';').map((item) => item.trim());
    const matched = cookies.find((cookie) => cookie.startsWith(`${encodeURIComponent(name)}=`));
    if (!matched) return null;
    return decodeURIComponent(matched.split('=')[1] || '');
}

function setCookie(name, value, maxAge = COOKIE_MAX_AGE_SECONDS) {
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function deleteCookie(name) {
    document.cookie = `${encodeURIComponent(name)}=; path=/; max-age=0; SameSite=Lax`;
}

function getSession() {
    const rawCookie = getCookie(SESSION_KEY);
    if (rawCookie) {
        try {
            return JSON.parse(rawCookie);
        } catch {
            // ignore malformed cookie
        }
    }

    const rawSession = sessionStorage.getItem(SESSION_KEY);
    if (!rawSession) return null;
    try {
        return JSON.parse(rawSession);
    } catch {
        return null;
    }
}

function saveSession(data) {
    const raw = JSON.stringify(data);
    sessionStorage.setItem(SESSION_KEY, raw);
    setCookie(SESSION_KEY, raw);
}

function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    deleteCookie(SESSION_KEY);
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
