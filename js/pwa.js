class PWAInstaller {
    constructor() {
        this.deferredPrompt = null;
        this.init();
    }

    init() {
        this.registerServiceWorker();
        this.setupInstallPrompt();
        this.setupOfflineDetection();
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(registration => {
                        console.log('ServiceWorker registrado com sucesso:', registration.scope);
                        
                        // Verifica se há atualizações
                        registration.addEventListener('updatefound', () => {
                            const newWorker = registration.installing;
                            console.log('Nova versão do ServiceWorker encontrada:', newWorker);
                            
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    this.showUpdateNotification();
                                }
                            });
                        });
                    })
                    .catch(error => {
                        console.log('Falha ao registrar ServiceWorker:', error);
                    });
            });
        }
    }

    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            // Previne que o navegador mostre o prompt automaticamente
            e.preventDefault();
            this.deferredPrompt = e;
            
            // Mostra botão de instalação
            this.showInstallButton();
        });

        window.addEventListener('appinstalled', () => {
            console.log('Aplicativo instalado com sucesso');
            this.deferredPrompt = null;
            this.hideInstallButton();
            
            // Envia evento para analytics
            this.sendAnalyticsEvent('app_installed');
        });
    }

    setupOfflineDetection() {
        window.addEventListener('online', () => {
            this.updateOnlineStatus(true);
        });

        window.addEventListener('offline', () => {
            this.updateOnlineStatus(false);
        });

        // Verifica status inicial
        this.updateOnlineStatus(navigator.onLine);
    }

    updateOnlineStatus(isOnline) {
        const statusElement = document.getElementById('online-status');
        if (!statusElement) {
            // Cria elemento de status se não existir
            const statusDiv = document.createElement('div');
            statusDiv.id = 'online-status';
            statusDiv.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                z-index: 10000;
                transition: all 0.3s ease;
            `;
            document.body.appendChild(statusDiv);
        }
        
        const element = document.getElementById('online-status');
        if (isOnline) {
            element.textContent = '● Online';
            element.style.backgroundColor = '#2ecc71';
            element.style.color = 'white';
            element.style.opacity = '0.9';
            
            // Esconde após 3 segundos
            setTimeout(() => {
                element.style.opacity = '0';
            }, 3000);
        } else {
            element.textContent = '● Offline';
            element.style.backgroundColor = '#e74c3c';
            element.style.color = 'white';
            element.style.opacity = '1';
        }
    }

    showInstallButton() {
        // Remove botão existente
        const existingBtn = document.getElementById('install-pwa-btn');
        if (existingBtn) existingBtn.remove();
        
        // Cria botão de instalação
        const installBtn = document.createElement('button');
        installBtn.id = 'install-pwa-btn';
        installBtn.innerHTML = `
            <i class="fas fa-download"></i>
            <span>Instalar App</span>
        `;
        installBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 50px;
            padding: 12px 24px;
            font-family: 'Poppins', sans-serif;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
            z-index: 10000;
            transition: all 0.3s ease;
        `;
        
        installBtn.addEventListener('mouseenter', () => {
            installBtn.style.transform = 'translateY(-2px)';
            installBtn.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
        });
        
        installBtn.addEventListener('mouseleave', () => {
            installBtn.style.transform = 'translateY(0)';
            installBtn.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
        });
        
        installBtn.addEventListener('click', () => {
            this.installApp();
        });
        
        document.body.appendChild(installBtn);
    }

    hideInstallButton() {
        const installBtn = document.getElementById('install-pwa-btn');
        if (installBtn) {
            installBtn.style.opacity = '0';
            installBtn.style.transform = 'translateY(20px)';
            setTimeout(() => {
                if (installBtn.parentNode) {
                    installBtn.parentNode.removeChild(installBtn);
                }
            }, 300);
        }
    }

    installApp() {
        if (!this.deferredPrompt) return;
        
        this.deferredPrompt.prompt();
        
        this.deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('Usuário aceitou a instalação');
            } else {
                console.log('Usuário recusou a instalação');
            }
            this.deferredPrompt = null;
            this.hideInstallButton();
        });
    }

    showUpdateNotification() {
        if (!('Notification' in window)) return;
        
        if (Notification.permission === 'granted') {
            this.createUpdateNotification();
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.createUpdateNotification();
                }
            });
        }
    }

    createUpdateNotification() {
        const notification = new Notification('Rio Park Vallet - Atualização Disponível', {
            body: 'Uma nova versão do aplicativo está disponível. Recarregue a página para atualizar.',
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png'
        });
        
        notification.onclick = () => {
            window.focus();
            location.reload();
        };
        
        setTimeout(() => notification.close(), 5000);
    }

    sendAnalyticsEvent(eventName) {
        // Implementação básica de analytics
        const analyticsData = {
            event: eventName,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            platform: navigator.platform
        };
        
        // Salva no localStorage para envio posterior se offline
        let analyticsQueue = JSON.parse(localStorage.getItem('analyticsQueue') || '[]');
        analyticsQueue.push(analyticsData);
        localStorage.setItem('analyticsQueue', JSON.stringify(analyticsQueue));
        
        // Tenta enviar eventos pendentes
        this.sendQueuedAnalytics();
    }

    sendQueuedAnalytics() {
        if (!navigator.onLine) return;
        
        const analyticsQueue = JSON.parse(localStorage.getItem('analyticsQueue') || '[]');
        if (analyticsQueue.length === 0) return;
        
        // Simulação de envio para analytics
        console.log('Enviando eventos de analytics:', analyticsQueue);
        
        // Limpa fila após envio (em produção, você verificaria se o envio foi bem-sucedido)
        localStorage.removeItem('analyticsQueue');
    }
}

// Inicializa PWA quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    // Verifica se estamos em um contexto de PWA
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        window.pwaInstaller = new PWAInstaller();
    }
    
    // Adiciona classe para diferenciar PWA instalado
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
        document.documentElement.classList.add('pwa-installed');
    }
});

// Atualiza Service Worker quando a página ganha foco
window.addEventListener('focus', () => {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'UPDATE_CHECK'
        });
    }
});

// Força atualização do Service Worker
function updateServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            registration.update();
        });
    }
}

// Recarrega a página quando um novo Service Worker está esperando
let refreshing = false;
navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
        refreshing = true;
        window.location.reload();
    }
});
