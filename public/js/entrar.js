async function submitLogin(event) {
    event.preventDefault();
    const username = document.getElementById('user-in').value.trim();
    const password = document.getElementById('pass-in').value;
    const errEl = document.getElementById('auth-err');
    errEl.innerText = '';

    if (!username || !password) {
        errEl.innerText = 'Preencha usuário e senha.';
        return;
    }

    try {
        const { response, data } = await apiFetch('/api/v1/sessao', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        if (response.ok && data?.token) {
            saveSession({
                token: data.token,
                username: data.username,
                balance: data.balance
            });
            window.location.href = '/conta';
            return;
        }

        errEl.innerText = data?.error || 'Não foi possível entrar.';
    } catch {
        errEl.innerText = 'Servidor indisponível. Execute npm start.';
    }
}

document.getElementById('login-form').addEventListener('submit', submitLogin);
