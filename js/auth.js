// ==============================================
// SISTEMA DE AUTENTICAÇÃO - Rio Branco Vallet
// ==============================================
class AuthSystem {
    constructor() {
        this.users = this.loadUsers();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkLoginStatus();
    }

    loadUsers() {
        const defaultUsers = [
            {
                id: 1,
                username: 'admin',
                password: 'admin123',
                name: 'Administrador',
                role: 'admin',
                email: 'admin@rioparkvallet.com'
            },
            {
                id: 2,
                username: 'operador',
                password: 'operador123',
                name: 'Operador',
                role: 'operator',
                email: 'operador@rioparkvallet.com'
            }
        ];
        
        const savedUsers = localStorage.getItem('parkingUsers');
        return savedUsers ? JSON.parse(savedUsers) : defaultUsers;
    }

    saveUsers() {
        localStorage.setItem('parkingUsers', JSON.stringify(this.users));
    }

    setupEventListeners() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        const togglePassword = document.getElementById('toggle-password');
        if (togglePassword) {
            togglePassword.addEventListener('click', () => {
                this.togglePasswordVisibility();
            });
        }

        const forgotPassword = document.getElementById('forgot-password');
        if (forgotPassword) {
            forgotPassword.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRecoveryModal();
            });
        }

        const closeRecoveryModal = document.getElementById('close-recovery-modal');
        if (closeRecoveryModal) {
            closeRecoveryModal.addEventListener('click', () => {
                this.hideRecoveryModal();
            });
        }

        const cancelRecoveryBtn = document.getElementById('cancel-recovery-btn');
        if (cancelRecoveryBtn) {
            cancelRecoveryBtn.addEventListener('click', () => {
                this.hideRecoveryModal();
            });
        }

        const sendRecoveryBtn = document.getElementById('send-recovery-btn');
        if (sendRecoveryBtn) {
            sendRecoveryBtn.addEventListener('click', () => {
                this.handlePasswordRecovery();
            });
        }
    }

    checkLoginStatus() {
        // Se estiver na página de login e já estiver logado, redireciona
        if (window.location.pathname.includes('login.html')) {
            const isLoggedIn = localStorage.getItem('isLoggedIn');
            const currentUser = localStorage.getItem('currentUser');
            
            if (isLoggedIn && currentUser) {
                window.location.href = 'index.html';
            }
        }
    }

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const toggleIcon = document.querySelector('#toggle-password i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.className = 'fas fa-eye-slash';
        } else {
            passwordInput.type = 'password';
            toggleIcon.className = 'fas fa-eye';
        }
    }

    showRecoveryModal() {
        document.getElementById('recovery-modal').classList.remove('hidden');
    }

    hideRecoveryModal() {
        document.getElementById('recovery-modal').classList.add('hidden');
        document.getElementById('recovery-email').value = '';
    }

    handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('remember-me').checked;

        // Validação básica
        if (!username || !password) {
            alert('Por favor, preencha todos os campos.');
            return;
        }

        // Simula um pequeno atraso para parecer real
        const loginBtn = document.getElementById('login-btn');
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
        loginBtn.disabled = true;

        setTimeout(() => {
            // Verifica credenciais
            const user = this.users.find(u => 
                u.username === username && u.password === password
            );

            if (user) {
                // Login bem-sucedido
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('currentUser', JSON.stringify({
                    id: user.id,
                    username: user.username,
                    name: user.name,
                    role: user.role,
                    email: user.email
                }));

                if (rememberMe) {
                    localStorage.setItem('rememberedUser', username);
                } else {
                    localStorage.removeItem('rememberedUser');
                }

                // Redireciona para o dashboard
                window.location.href = 'index.html';
            } else {
                // Login falhou
                alert('Usuário ou senha incorretos. Por favor, tente novamente.');
                loginBtn.innerHTML = originalText;
                loginBtn.disabled = false;
            }
        }, 1000);
    }

    handlePasswordRecovery() {
        const email = document.getElementById('recovery-email').value.trim();
        
        if (!email) {
            alert('Por favor, digite seu e-mail.');
            return;
        }
        
        // Verifica se o e-mail existe
        const user = this.users.find(u => u.email === email);
        
        if (user) {
            // Simula envio de e-mail
            const recoveryBtn = document.getElementById('send-recovery-btn');
            const originalText = recoveryBtn.innerHTML;
            recoveryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            recoveryBtn.disabled = true;
            
            setTimeout(() => {
                this.hideRecoveryModal();
                recoveryBtn.innerHTML = originalText;
                recoveryBtn.disabled = false;
                
                alert(`Instruções de recuperação de senha foram enviadas para ${email}.\n\nSua senha atual é: ${user.password}\n\nRecomendamos que você altere sua senha após o login.`);
            }, 1500);
        } else {
            alert('E-mail não encontrado em nosso sistema.');
        }
    }
}

// Inicializa o sistema de autenticação
document.addEventListener('DOMContentLoaded', () => {
    window.authSystem = new AuthSystem();
    
    // Preenche usuário lembrado, se existir
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser && document.getElementById('username')) {
        document.getElementById('username').value = rememberedUser;
        document.getElementById('remember-me').checked = true;
    }
});
