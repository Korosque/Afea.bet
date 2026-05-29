/**
 * DevTools - Painel de desenvolvimento flutuante
 * Monitora: Requisições HTTP, Cookies, Storage, Console
 */

const DEVTOOLS_ENABLED = true;
const DEVTOOLS_STORAGE_KEY = 'devtools_enabled';
const MAX_LOGS = 100;

class DevTools {
    constructor() {
        this.enabled = localStorage.getItem(DEVTOOLS_STORAGE_KEY) !== 'false';
        this.requests = [];
        this.logs = [];
        this.errors = [];
        this.init();
    }

    init() {
        if (!DEVTOOLS_ENABLED) return;
        this.createPanel();
        this.interceptFetch();
        this.interceptConsole();
        this.interceptErrors();
    }

    createPanel() {
        const panel = document.createElement('div');
        panel.id = 'devtools-panel';
        panel.className = `devtools-panel ${this.enabled ? 'devtools-visible' : ''}`;
        panel.innerHTML = `
            <div class="devtools-header">
                <div class="devtools-title">🛠️ DevTools</div>
                <button class="devtools-btn-minimize" title="Minimizar">−</button>
                <button class="devtools-btn-close" title="Fechar">×</button>
            </div>
            <div class="devtools-tabs">
                <button class="devtools-tab-btn active" data-tab="network">Network</button>
                <button class="devtools-tab-btn" data-tab="storage">Storage</button>
                <button class="devtools-tab-btn" data-tab="console">Console</button>
                <button class="devtools-tab-btn" data-tab="info">Info</button>
            </div>
            <div class="devtools-content">
                <div class="devtools-tab-content active" id="tab-network">
                    <div class="devtools-log-list" id="network-log"></div>
                </div>
                <div class="devtools-tab-content" id="tab-storage">
                    <div class="devtools-section">
                        <h4>🍪 Cookies</h4>
                        <div class="devtools-storage-list" id="cookies-list"></div>
                    </div>
                    <div class="devtools-section">
                        <h4>💾 SessionStorage</h4>
                        <div class="devtools-storage-list" id="session-list"></div>
                    </div>
                    <div class="devtools-section">
                        <h4>💾 LocalStorage</h4>
                        <div class="devtools-storage-list" id="local-list"></div>
                    </div>
                </div>
                <div class="devtools-tab-content" id="tab-console">
                    <div class="devtools-log-list" id="console-log"></div>
                </div>
                <div class="devtools-tab-content" id="tab-info">
                    <div class="devtools-info-box">
                        <p><strong>URL:</strong> <code>${window.location.href}</code></p>
                        <p><strong>User Agent:</strong> <code>${navigator.userAgent}</code></p>
                        <p><strong>Sessão:</strong> <span id="info-session">-</span></p>
                        <p><strong>Token:</strong> <span id="info-token">-</span></p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(panel);

        // Adicionar CSS
        this.addStyles();

        // Adicionar ícone flutuante
        this.createFloatingIcon();

        // Event listeners
        panel.querySelector('.devtools-btn-minimize').addEventListener('click', () => this.minimize());
        panel.querySelector('.devtools-btn-close').addEventListener('click', () => this.close());

        document.querySelectorAll('.devtools-tab-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        this.updateStorage();
    }

    createFloatingIcon() {
        const icon = document.createElement('button');
        icon.id = 'devtools-icon';
        icon.className = 'devtools-icon';
        icon.title = 'DevTools';
        icon.textContent = '🛠️';
        icon.addEventListener('click', () => this.toggle());
        document.body.appendChild(icon);
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .devtools-icon {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: 2px solid #fff;
                color: white;
                font-size: 24px;
                cursor: pointer;
                z-index: 9998;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                transition: all 0.3s ease;
            }

            .devtools-icon:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 16px rgba(0,0,0,0.4);
            }

            .devtools-panel {
                position: fixed;
                bottom: 80px;
                right: 20px;
                width: 500px;
                max-height: 500px;
                background: #1e1e1e;
                border: 1px solid #333;
                border-radius: 8px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                font-family: 'Monaco', 'Courier New', monospace;
                font-size: 12px;
                z-index: 9999;
                display: none;
                flex-direction: column;
                color: #d4d4d4;
            }

            .devtools-panel.devtools-visible {
                display: flex;
            }

            .devtools-header {
                background: #252526;
                border-bottom: 1px solid #333;
                padding: 10px 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .devtools-title {
                font-weight: bold;
                color: #ce9178;
            }

            .devtools-btn-minimize,
            .devtools-btn-close {
                background: none;
                border: none;
                color: #888;
                cursor: pointer;
                font-size: 18px;
                padding: 0 5px;
                transition: color 0.2s;
            }

            .devtools-btn-minimize:hover,
            .devtools-btn-close:hover {
                color: #fff;
            }

            .devtools-tabs {
                background: #252526;
                border-bottom: 1px solid #333;
                display: flex;
                gap: 5px;
                padding: 0 8px;
                overflow-x: auto;
            }

            .devtools-tab-btn {
                background: none;
                border: none;
                color: #888;
                cursor: pointer;
                padding: 8px 12px;
                font-size: 12px;
                white-space: nowrap;
                border-bottom: 2px solid transparent;
                transition: all 0.2s;
            }

            .devtools-tab-btn:hover {
                color: #d4d4d4;
            }

            .devtools-tab-btn.active {
                color: #4ec9b0;
                border-bottom-color: #4ec9b0;
            }

            .devtools-content {
                flex: 1;
                overflow-y: auto;
                padding: 8px;
            }

            .devtools-tab-content {
                display: none;
            }

            .devtools-tab-content.active {
                display: block;
            }

            .devtools-log-list {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .devtools-log-item {
                background: #252526;
                border-left: 3px solid #666;
                padding: 6px 8px;
                border-radius: 2px;
                word-break: break-word;
                max-height: 60px;
                overflow-y: auto;
            }

            .devtools-log-item.log-GET { border-left-color: #4ec9b0; }
            .devtools-log-item.log-POST { border-left-color: #ce9178; }
            .devtools-log-item.log-PUT { border-left-color: #dcdcaa; }
            .devtools-log-item.log-DELETE { border-left-color: #f48771; }
            .devtools-log-item.log-ERROR { border-left-color: #f48771; }
            .devtools-log-item.log-WARN { border-left-color: #dcdcaa; }
            .devtools-log-item.log-LOG { border-left-color: #9cdcfe; }

            .devtools-log-status {
                display: inline-block;
                margin-right: 8px;
                font-weight: bold;
                padding: 2px 6px;
                border-radius: 3px;
                background: #333;
            }

            .devtools-log-status.status-200 { color: #4ec9b0; }
            .devtools-log-status.status-201 { color: #4ec9b0; }
            .devtools-log-status.status-400 { color: #ce9178; }
            .devtools-log-status.status-401 { color: #f48771; }
            .devtools-log-status.status-500 { color: #f48771; }

            .devtools-section {
                margin-bottom: 12px;
            }

            .devtools-section h4 {
                color: #4ec9b0;
                margin: 0 0 8px 0;
                font-size: 12px;
            }

            .devtools-storage-list {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .devtools-storage-item {
                background: #252526;
                padding: 6px 8px;
                border-radius: 2px;
                word-break: break-all;
                font-size: 11px;
            }

            .devtools-storage-key {
                color: #9cdcfe;
            }

            .devtools-storage-value {
                color: #ce9178;
            }

            .devtools-info-box {
                padding: 8px;
                background: #252526;
                border-radius: 2px;
            }

            .devtools-info-box p {
                margin: 6px 0;
                word-break: break-all;
            }

            .devtools-info-box code {
                background: #1e1e1e;
                padding: 2px 4px;
                border-radius: 2px;
                color: #ce9178;
            }

            @media (max-width: 800px) {
                .devtools-panel {
                    width: 100vw;
                    height: 50vh;
                    bottom: 0;
                    right: 0;
                    border-radius: 0;
                    max-height: none;
                }
            }
        `;
        document.head.appendChild(style);
    }

    interceptFetch() {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const [resource, config] = args;
            const startTime = performance.now();

            const request = {
                method: config?.method || 'GET',
                url: resource,
                timestamp: new Date().toLocaleTimeString(),
                startTime
            };

            try {
                const response = await originalFetch(...args);
                const endTime = performance.now();
                request.status = response.status;
                request.duration = (endTime - startTime).toFixed(0);
                request.type = 'success';
                this.addRequest(request);
                return response;
            } catch (error) {
                request.type = 'error';
                request.error = error.message;
                request.duration = (performance.now() - startTime).toFixed(0);
                this.addRequest(request);
                throw error;
            }
        };
    }

    interceptConsole() {
        const methods = ['log', 'warn', 'error', 'info', 'debug'];
        methods.forEach((method) => {
            const original = console[method];
            console[method] = (...args) => {
                original(...args);
                const type = method.toUpperCase();
                const message = args.map((arg) =>
                    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                ).join(' ');
                this.addLog(message, type);
            };
        });
    }

    interceptErrors() {
        window.addEventListener('error', (event) => {
            const message = `${event.filename}:${event.lineno}:${event.colno} - ${event.message}`;
            this.addLog(message, 'ERROR');
        });
    }

    addRequest(request) {
        this.requests.unshift(request);
        if (this.requests.length > MAX_LOGS) this.requests.pop();
        this.updateNetworkLog();
    }

    addLog(message, type = 'LOG') {
        this.logs.unshift({ message, type, timestamp: new Date().toLocaleTimeString() });
        if (this.logs.length > MAX_LOGS) this.logs.pop();
        this.updateConsoleLog();
    }

    updateNetworkLog() {
        const container = document.getElementById('network-log');
        if (!container) return;

        container.innerHTML = this.requests.map((req) => {
            const statusClass = req.status ? `status-${req.status}` : '';
            const status = req.status ? `<span class="devtools-log-status ${statusClass}">${req.status}</span>` : '<span class="devtools-log-status">ERROR</span>';
            return `
                <div class="devtools-log-item log-${req.method}">
                    ${status}
                    <strong>${req.method}</strong> ${req.url} <span style="color:#888;">${req.duration}ms</span>
                </div>
            `;
        }).join('');
    }

    updateConsoleLog() {
        const container = document.getElementById('console-log');
        if (!container) return;

        container.innerHTML = this.logs.map((log) => {
            return `
                <div class="devtools-log-item log-${log.type}">
                    <span style="color:#888;">[${log.timestamp}]</span>
                    <strong>${log.type}:</strong> ${log.message}
                </div>
            `;
        }).join('');
    }

    updateStorage() {
        // Cookies
        const cookiesContainer = document.getElementById('cookies-list');
        if (cookiesContainer) {
            const cookies = document.cookie.split(';').map(c => c.trim()).filter(Boolean);
            cookiesContainer.innerHTML = cookies.length ? cookies.map((cookie) => {
                const [key, value] = cookie.split('=');
                return `
                    <div class="devtools-storage-item">
                        <span class="devtools-storage-key">${decodeURIComponent(key)}</span>:
                        <span class="devtools-storage-value">${decodeURIComponent(value || '')}</span>
                    </div>
                `;
            }).join('') : '<div style="color:#888;">Sem cookies</div>';
        }

        // SessionStorage
        const sessionContainer = document.getElementById('session-list');
        if (sessionContainer) {
            const items = Object.entries(sessionStorage).map(([key, value]) => `
                <div class="devtools-storage-item">
                    <span class="devtools-storage-key">${key}</span>:
                    <span class="devtools-storage-value">${value}</span>
                </div>
            `).join('');
            sessionContainer.innerHTML = items || '<div style="color:#888;">Vazio</div>';
        }

        // LocalStorage
        const localContainer = document.getElementById('local-list');
        if (localContainer) {
            const items = Object.entries(localStorage).map(([key, value]) => `
                <div class="devtools-storage-item">
                    <span class="devtools-storage-key">${key}</span>:
                    <span class="devtools-storage-value">${value}</span>
                </div>
            `).join('');
            localContainer.innerHTML = items || '<div style="color:#888;">Vazio</div>';
        }

        // Info
        const infoSession = document.getElementById('info-session');
        const infoToken = document.getElementById('info-token');
        if (infoSession && typeof getSession === 'function') {
            const session = getSession();
            infoSession.textContent = session ? '✅ Ativo' : '❌ Inativo';
            infoToken.textContent = session?.token ? `${session.token.substring(0, 20)}...` : 'Sem token';
        }
    }

    switchTab(tabName) {
        document.querySelectorAll('.devtools-tab-content').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.devtools-tab-btn').forEach(el => el.classList.remove('active'));

        const tabContent = document.getElementById(`tab-${tabName}`);
        const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);

        if (tabContent) tabContent.classList.add('active');
        if (tabBtn) tabBtn.classList.add('active');

        if (tabName === 'storage') {
            this.updateStorage();
        }
    }

    toggle() {
        const panel = document.getElementById('devtools-panel');
        if (panel) {
            panel.classList.toggle('devtools-visible');
            this.enabled = panel.classList.contains('devtools-visible');
            localStorage.setItem(DEVTOOLS_STORAGE_KEY, this.enabled);
        }
    }

    minimize() {
        const panel = document.getElementById('devtools-panel');
        if (panel) panel.classList.remove('devtools-visible');
    }

    close() {
        const panel = document.getElementById('devtools-panel');
        const icon = document.getElementById('devtools-icon');
        if (panel) panel.remove();
        if (icon) icon.remove();
        localStorage.setItem(DEVTOOLS_STORAGE_KEY, 'false');
    }
}

// Inicializar DevTools quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.devtools = new DevTools();
    });
} else {
    window.devtools = new DevTools();
}
