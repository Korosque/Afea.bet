if (!requireAuthPage()) {
    // redirect handled
} else {
    initLayout();
}

function logout() {
    clearSession();
    window.location.href = '/entrar';
}

document.getElementById('btn-logout')?.addEventListener('click', logout);
