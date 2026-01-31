class ParkingSystem {
    constructor() {
        this.parkingSpots = [];
        this.clients = [];
        this.activities = [];
        this.settings = this.loadSettings();
        this.currentPage = 'dashboard';
        this.currentUser = this.loadCurrentUser();
        this.searchTimeout = null;
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateDateTime();
        this.renderDashboard();
        this.setupSearchFunctionality();
        setInterval(() => this.updateDateTime(), 1000);
        this.updateUserPermissions();
        this.applyMenuWhiteColor();
    }

    applyMenuWhiteColor() {
        // Força o menu a ficar branco
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.style.color = 'white';
            item.style.textDecoration = 'none';
        });
        
        // Aplica cor branca aos ícones do menu
        const menuIcons = document.querySelectorAll('.menu-item i');
        menuIcons.forEach(icon => {
            icon.style.color = 'white';
        });
        
        // Aplica cor branca aos textos do menu
        const menuTexts = document.querySelectorAll('.menu-text');
        menuTexts.forEach(text => {
            text.style.color = 'white';
        });
    }

    setupSearchFunctionality() {
        const searchInput = document.getElementById('search-vehicle');
        const searchBtn = document.getElementById('search-btn');
        const clearSearchBtn = document.getElementById('clear-search');
        
        if (searchInput) {
            // Buscar ao digitar
            searchInput.addEventListener('input', (e) => {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.performSearch(e.target.value);
                }, 300);
            });
            
            // Buscar ao clicar no botão
            if (searchBtn) {
                searchBtn.addEventListener('click', () => {
                    this.performSearch(searchInput.value);
                });
            }
            
            // Buscar ao pressionar Enter
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(searchInput.value);
                }
            });
        }
        
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                this.clearSearch();
            });
        }
    }

    performSearch(searchTerm) {
        const searchTermLower = searchTerm.trim().toLowerCase();
        
        if (searchTermLower.length < 2) {
            this.clearSearch();
            return;
        }
        
        const searchResults = document.getElementById('search-results');
        const parkingGrid = document.getElementById('parking-grid');
        const resultsGrid = document.getElementById('search-results-grid');
        const resultsCount = document.getElementById('results-count');
        
        // Encontrar vagas que correspondem à pesquisa
        const filteredSpots = this.parkingSpots.filter(spot => {
            if (!spot.vehicle) return false;
            
            const searchText = `
                ${spot.number}
                ${spot.sector}
                ${spot.vehicle.plate || ''}
                ${spot.vehicle.model || ''}
                ${spot.vehicle.color || ''}
                ${spot.client?.name || ''}
            `.toLowerCase();
            
            return searchText.includes(searchTermLower);
        });
        
        // Exibir resultados
        this.displaySearchResults(filteredSpots);
        
        // Atualizar contador
        if (resultsCount) {
            resultsCount.textContent = filteredSpots.length;
        }
        
        // Mostrar resultados e ocultar grid normal
        if (searchResults) searchResults.classList.remove('hidden');
        if (parkingGrid) parkingGrid.classList.add('hidden');
    }

    displaySearchResults(spots) {
        const resultsGrid = document.getElementById('search-results-grid');
        if (!resultsGrid) return;
        
        resultsGrid.innerHTML = '';
        
        if (spots.length === 0) {
            resultsGrid.innerHTML = `
                <div class="search-empty-state">
                    <i class="fas fa-search"></i>
                    <h4>Nenhum veículo encontrado</h4>
                    <p>Tente pesquisar por número da vaga, placa ou modelo do veículo</p>
                </div>
            `;
            return;
        }
        
        spots.forEach(spot => {
            const resultCard = document.createElement('div');
            resultCard.className = 'search-result-card';
            resultCard.innerHTML = `
                <div class="result-icon">
                    <i class="fas fa-car"></i>
                </div>
                <div class="result-info">
                    <h5>Vaga ${spot.number}</h5>
                    <p><strong>Setor:</strong> ${spot.sector}</p>
                    <p><strong>Placa:</strong> ${spot.vehicle?.plate || 'N/A'}</p>
                    <p><strong>Modelo:</strong> ${spot.vehicle?.model || 'N/A'}</p>
                    <p><strong>Cor:</strong> ${spot.vehicle?.color || 'N/A'}</p>
                    ${spot.client ? `<p><strong>Cliente:</strong> ${spot.client.name}</p>` : ''}
                    ${spot.entryTime ? `<p><strong>Entrada:</strong> ${new Date(spot.entryTime).toLocaleTimeString()}</p>` : ''}
                </div>
                <div class="result-actions">
                    <button class="btn-secondary" onclick="parkingSystem.highlightSpot(${spot.number})">
                        <i class="fas fa-map-marker-alt"></i> Localizar
                    </button>
                </div>
            `;
            resultsGrid.appendChild(resultCard);
        });
    }

    highlightSpot(spotNumber) {
        // Limpar pesquisa
        this.clearSearch();
        
        // Encontrar a vaga no DOM
        const allSpots = document.querySelectorAll('.parking-spot');
        let targetSpot = null;
        
        allSpots.forEach(spot => {
            const spotNumElement = spot.querySelector('.spot-number');
            if (spotNumElement && spotNumElement.textContent.includes(spotNumber.toString())) {
                targetSpot = spot;
            }
        });
        
        if (targetSpot) {
            // Rolar até a vaga
            targetSpot.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            // Destacar temporariamente
            targetSpot.classList.add('highlight');
            setTimeout(() => {
                targetSpot.classList.remove('highlight');
            }, 2000);
        } else {
            console.log('Vaga não encontrada:', spotNumber);
        }
    }

    clearSearch() {
        const searchInput = document.getElementById('search-vehicle');
        const searchResults = document.getElementById('search-results');
        const parkingGrid = document.getElementById('parking-grid');
        
        if (searchInput) searchInput.value = '';
        if (searchResults) searchResults.classList.add('hidden');
        if (parkingGrid) parkingGrid.classList.remove('hidden');
    }

    loadCurrentUser() {
        return JSON.parse(localStorage.getItem('currentUser')) || {
            id: 1,
            username: 'admin',
            name: 'Administrador',
            role: 'admin'
        };
    }

    loadSettings() {
        const defaultSettings = {
            totalSpots: 200,
            pcdSpots: 16,
            sectorDistribution: {
                A: 30,
                B: 30,
                C: 70,
                D: 70
            },
            prices: {
                firstHour: 15.00,
                additionalHour: 10.00,
                daily: 80.00
            }
        };
        
        const savedSettings = localStorage.getItem('parkingSettings');
        return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
    }

    saveSettings() {
        localStorage.setItem('parkingSettings', JSON.stringify(this.settings));
    }

    loadData() {
        const savedSpots = localStorage.getItem('parkingSpots');
        const savedClients = localStorage.getItem('parkingClients');
        const savedActivities = localStorage.getItem('parkingActivities');

        this.parkingSpots = savedSpots ? JSON.parse(savedSpots) : this.generateParkingSpots();
        this.clients = savedClients ? JSON.parse(savedClients) : [];
        this.activities = savedActivities ? JSON.parse(savedActivities) : this.generateSampleActivities();
    }

    saveData() {
        localStorage.setItem('parkingSpots', JSON.stringify(this.parkingSpots));
        localStorage.setItem('parkingClients', JSON.stringify(this.clients));
        localStorage.setItem('parkingActivities', JSON.stringify(this.activities));
    }

    generateParkingSpots() {
        const spots = [];
        const sectorDistribution = {
            'A': { start: 1, end: 30, pcd: 3 },
            'B': { start: 31, end: 60, pcd: 3 },
            'C': { start: 61, end: 130, pcd: 5 },
            'D': { start: 131, end: 200, pcd: 5 }
        };
        
        let spotNumber = 1;
        
        for (const [sector, config] of Object.entries(sectorDistribution)) {
            const sectorSpots = config.end - config.start + 1;
            
            for (let i = 1; i <= sectorSpots; i++) {
                const isPcd = i <= config.pcd;
                
                spots.push({
                    id: spotNumber,
                    number: spotNumber,
                    sector: sector,
                    status: 'available',
                    type: isPcd ? 'pcd' : 'regular',
                    vehicle: null,
                    entryTime: null,
                    client: null
                });
                
                spotNumber++;
            }
        }
        
        return spots;
    }

    generateSampleActivities() {
        const now = new Date();
        return [
            {
                id: 1,
                type: 'entry',
                title: 'Veículo entrou',
                description: 'Honda Civic - ABC-1234',
                time: new Date(now.getTime() - 300000),
                spot: 12
            },
            {
                id: 2,
                type: 'payment',
                title: 'Pagamento realizado',
                description: 'Vaga 8 - R$ 25,00',
                time: new Date(now.getTime() - 600000),
                spot: 8
            },
            {
                id: 3,
                type: 'exit',
                title: 'Veículo saiu',
                description: 'Toyota Corolla - XYZ-5678',
                time: new Date(now.getTime() - 900000),
                spot: 5
            }
        ];
    }

    setupEventListeners() {
        // Navegação do menu
        document.getElementById('dashboard-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchPage('dashboard');
        });

        document.getElementById('estacionamento-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchPage('estacionamento');
        });

        document.getElementById('clientes-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchPage('clientes');
        });

        document.getElementById('relatorios-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchPage('relatorios');
        });

        document.getElementById('configuracoes-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchPage('configuracoes');
        });

        // Logout
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            if (confirm('Deseja realmente sair do sistema?')) {
                localStorage.removeItem('isLoggedIn');
                window.location.href = 'login.html';
            }
        });

        // Botão de trocar usuário
        const switchUserBtn = document.querySelector('.switch-user-btn');
        if (switchUserBtn) {
            switchUserBtn.addEventListener('click', () => {
                this.showSwitchUserModal();
            });
        }

        // Botões principais
        document.getElementById('add-vehicle-btn')?.addEventListener('click', () => {
            this.showVehicleModal();
        });

        document.getElementById('add-client-btn')?.addEventListener('click', () => {
            this.showClientModal();
        });

        // Modal de veículo
        document.getElementById('close-vehicle-modal')?.addEventListener('click', () => {
            this.hideVehicleModal();
        });

        document.getElementById('cancel-vehicle-btn')?.addEventListener('click', () => {
            this.hideVehicleModal();
        });

        document.getElementById('vehicle-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.registerVehicle();
        });

        // Modal de troca de usuário
        document.getElementById('close-switch-modal')?.addEventListener('click', () => {
            this.hideSwitchUserModal();
        });

        document.getElementById('cancel-switch-btn')?.addEventListener('click', () => {
            this.hideSwitchUserModal();
        });

        // Login rápido
        document.getElementById('quick-login-btn')?.addEventListener('click', () => {
            this.handleQuickLogin();
        });

        // Enter no formulário rápido
        document.getElementById('quick-password')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleQuickLogin();
            }
        });

        // Configurações
        document.getElementById('save-prices-btn')?.addEventListener('click', () => {
            this.savePriceSettings();
        });

        document.getElementById('save-spots-btn')?.addEventListener('click', () => {
            this.saveSpotSettings();
        });

        document.getElementById('backup-btn')?.addEventListener('click', () => {
            this.createBackup();
        });

        document.getElementById('clear-data-btn')?.addEventListener('click', () => {
            this.clearData();
        });

        document.getElementById('add-user-btn')?.addEventListener('click', () => {
            this.addNewUser();
        });

        // Filtro de setor
        this.setupSectorFilter();
        
        // Event listeners para botões das vagas (delegar para container pai)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.release-btn')) {
                const spotId = parseInt(e.target.closest('.release-btn').dataset.spot);
                this.releaseSpot(spotId);
            }
            
            if (e.target.closest('.occupy-btn')) {
                const spotId = parseInt(e.target.closest('.occupy-btn').dataset.spot);
                this.occupySpot(spotId);
            }
        });
    }

    setupSectorFilter() {
        const filterContainer = document.getElementById('sector-filter');
        if (!filterContainer) {
            // Cria o filtro se não existir
            const parkingContent = document.getElementById('estacionamento-content');
            if (parkingContent) {
                const filterHtml = `
                    <div class="sector-filter" id="sector-filter">
                        <button class="sector-filter-btn active" data-sector="all">Todas</button>
                        <button class="sector-filter-btn" data-sector="A">Setor A</button>
                        <button class="sector-filter-btn" data-sector="B">Setor B</button>
                        <button class="sector-filter-btn" data-sector="C">Setor C</button>
                        <button class="sector-filter-btn" data-sector="D">Setor D</button>
                    </div>
                `;
                parkingContent.insertAdjacentHTML('afterbegin', filterHtml);
                
                // Reatacha o evento
                document.getElementById('sector-filter').addEventListener('click', (e) => {
                    if (e.target.classList.contains('sector-filter-btn')) {
                        document.querySelectorAll('.sector-filter-btn').forEach(btn => {
                            btn.classList.remove('active');
                        });
                        e.target.classList.add('active');
                        
                        const sector = e.target.dataset.sector;
                        this.filterParkingBySector(sector);
                    }
                });
            }
        }
    }

    switchPage(page) {
        console.log('Trocando para página:', page);
        
        // Atualiza menu ativo
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });

        const pageMap = {
            'dashboard': 'dashboard-link',
            'estacionamento': 'estacionamento-link',
            'clientes': 'clientes-link',
            'relatorios': 'relatorios-link',
            'configuracoes': 'configuracoes-link'
        };

        if (pageMap[page]) {
            const pageLink = document.getElementById(pageMap[page]);
            if (pageLink) {
                pageLink.classList.add('active');
            }
        }

        // Oculta todas as páginas e mostra a atual
        document.querySelectorAll('.page-content').forEach(content => {
            content.classList.add('hidden');
        });

        const pageContent = document.getElementById(`${page}-content`);
        if (pageContent) {
            pageContent.classList.remove('hidden');
        }

        // Atualiza título da página
        const titles = {
            'dashboard': { title: 'Dashboard', subtitle: 'Visão geral do sistema' },
            'estacionamento': { title: 'Estacionamento', subtitle: 'Gerenciamento de vagas' },
            'clientes': { title: 'Clientes', subtitle: 'Cadastro e histórico' },
            'relatorios': { title: 'Relatórios', subtitle: 'Análise de dados' },
            'configuracoes': { title: 'Configurações', subtitle: 'Configurações do sistema' }
        };

        if (titles[page]) {
            const pageTitle = document.getElementById('page-title');
            const pageSubtitle = document.getElementById('page-subtitle');
            
            if (pageTitle) pageTitle.textContent = titles[page].title;
            if (pageSubtitle) pageSubtitle.textContent = titles[page].subtitle;
        }

        this.currentPage = page;

        // Renderiza conteúdo específico da página
        switch(page) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'estacionamento':
                this.renderParking();
                // Reaplica cor branca no menu quando muda de página
                setTimeout(() => this.applyMenuWhiteColor(), 100);
                break;
            case 'clientes':
                this.renderClients();
                break;
            case 'configuracoes':
                this.renderSettings();
                break;
        }
        
        // Limpa pesquisa se estiver em estacionamento
        if (page !== 'estacionamento') {
            this.clearSearch();
        }
    }

    updateDateTime() {
        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const timeStr = now.toLocaleTimeString('pt-B