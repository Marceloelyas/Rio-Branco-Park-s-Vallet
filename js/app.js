class ParkingSystem {
    constructor() {
        this.parkingSpots = [];
        this.clients = [];
        this.activities = [];
        this.settings = this.loadSettings();
        this.currentPage = 'dashboard';
        this.currentUser = this.loadCurrentUser();
        this.searchResults = [];
        this.currentSearch = '';
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateDateTime();
        this.renderDashboard();
        setInterval(() => this.updateDateTime(), 1000);
        this.updateUserPermissions();
        this.addGlobalStyles();
        this.createOccupiedSpotsModal();
    }

    // ============================================
    // CONFIGURAÇÃO E CARREGAMENTO
    // ============================================

    loadCurrentUser() {
        return JSON.parse(localStorage.getItem('currentUser')) || {
            id: 1,
            username: 'ADMIN',
            name: 'ADMINISTRADOR',
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

    // ============================================
    // GERAÇÃO DE DADOS
    // ============================================

    generateParkingSpots() {
        const spots = [];
        const sectorDistribution = {
            'A': { start: 1, end: 30, pcd: 3, name: 'FRENTE' },
            'B': { start: 31, end: 60, pcd: 3, name: 'EDU' },
            'C': { start: 61, end: 130, pcd: 5, name: 'BAIXO' },
            'D': { start: 131, end: 200, pcd: 5, name: 'ALTO' }
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
                    sectorName: config.name,
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
                title: 'VEÍCULO ENTROU',
                description: 'HONDA CIVIC - ABC-1234',
                time: new Date(now.getTime() - 300000),
                spot: 12
            },
            {
                id: 2,
                type: 'payment',
                title: 'PAGAMENTO REALIZADO',
                description: 'VAGA 8 - R$ 25,00',
                time: new Date(now.getTime() - 600000),
                spot: 8
            },
            {
                id: 3,
                type: 'exit',
                title: 'VEÍCULO SAIU',
                description: 'TOYOTA COROLLA - XYZ-5678',
                time: new Date(now.getTime() - 900000),
                spot: 5
            }
        ];
    }

    // ============================================
    // CONFIGURAÇÃO DE EVENTOS
    // ============================================

    setupEventListeners() {
        this.setupNavigationListeners();
        this.setupActionListeners();
        this.setupVehicleModalListeners();
        this.setupSwitchUserModalListeners();
        this.setupSettingsListeners();
        this.setupSectorFilter();
        this.setupSearchField();
        this.setupDashboardStatsClick();
    }

    setupNavigationListeners() {
        const pages = ['dashboard', 'estacionamento', 'clientes', 'relatorios', 'configuracoes'];
        pages.forEach(page => {
            const element = document.getElementById(`${page}-link`);
            if (element) {
                element.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.switchPage(page);
                });
            }
        });

        document.getElementById('logout-btn')?.addEventListener('click', () => {
            if (confirm('DESEJA REALMENTE SAIR DO SISTEMA?')) {
                localStorage.removeItem('isLoggedIn');
                window.location.href = 'login.html';
            }
        });
    }

    setupActionListeners() {
        document.querySelector('.switch-user-btn')?.addEventListener('click', () => {
            this.showSwitchUserModal();
        });

        document.getElementById('add-vehicle-btn')?.addEventListener('click', () => {
            this.showVehicleModal();
        });

        document.getElementById('add-client-btn')?.addEventListener('click', () => {
            this.showClientModal();
        });
    }

    setupVehicleModalListeners() {
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
    }

    setupSwitchUserModalListeners() {
        document.getElementById('close-switch-modal')?.addEventListener('click', () => {
            this.hideSwitchUserModal();
        });

        document.getElementById('cancel-switch-btn')?.addEventListener('click', () => {
            this.hideSwitchUserModal();
        });

        document.getElementById('quick-login-btn')?.addEventListener('click', () => {
            this.handleQuickLogin();
        });

        document.getElementById('quick-password')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleQuickLogin();
            }
        });
    }

    setupSettingsListeners() {
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
    }

    setupSectorFilter() {
        const filterContainer = document.getElementById('sector-filter');
        if (!filterContainer) {
            const parkingContent = document.getElementById('estacionamento-content');
            if (parkingContent) {
                const filterHtml = `
                    <div class="sector-filter" id="sector-filter">
                        <button class="sector-filter-btn active" data-sector="all">TODAS</button>
                        <button class="sector-filter-btn" data-sector="A">FRENTE</button>
                        <button class="sector-filter-btn" data-sector="B">EDU</button>
                        <button class="sector-filter-btn" data-sector="C">BAIXO</button>
                        <button class="sector-filter-btn" data-sector="D">ALTO</button>
                    </div>
                `;
                parkingContent.insertAdjacentHTML('afterbegin', filterHtml);
                
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

    setupSearchField() {
        let searchContainer = document.getElementById('vehicle-search-container');
        
        if (!searchContainer) {
            const headerActions = document.querySelector('.header-actions');
            if (headerActions) {
                const searchHtml = `
                    <div class="search-container" id="vehicle-search-container">
                        <div class="search-input-group">
                            <i class="fas fa-search search-icon"></i>
                            <input type="text" 
                                   id="vehicle-search" 
                                   class="search-input" 
                                   placeholder="BUSCAR VEÍCULO (PLACA OU MODELO)..."
                                   title="Digite placa, modelo ou nome do cliente"
                                   value="${this.currentSearch || ''}">
                            <button id="clear-search" class="clear-search-btn" 
                                    style="${this.currentSearch ? '' : 'display: none;'}">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <button id="search-btn" class="btn-search">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                `;
                headerActions.insertAdjacentHTML('afterbegin', searchHtml);
                this.setupSearchEvents();
            }
        }
    }

    setupSearchEvents() {
        const searchInput = document.getElementById('vehicle-search');
        const clearBtn = document.getElementById('clear-search');
        const searchBtn = document.getElementById('search-btn');
        
        if (!searchInput) return;
        
        let searchTimeout;
        const handleSearchInput = (e) => {
            clearTimeout(searchTimeout);
            const searchTerm = e.target.value.trim().toUpperCase();
            
            if (clearBtn) {
                clearBtn.style.display = searchTerm ? 'flex' : 'none';
            }
            
            searchTimeout = setTimeout(() => {
                if (searchTerm.length >= 1) {
                    this.searchVehicle(searchTerm);
                } else {
                    this.clearSearch();
                }
            }, 300);
        };
        
        searchInput.addEventListener('input', handleSearchInput);
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const searchTerm = searchInput.value.trim().toUpperCase();
                if (searchTerm) {
                    this.searchVehicle(searchTerm);
                }
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                searchInput.focus();
                searchInput.select();
            }
        });
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                searchInput.value = '';
                clearBtn.style.display = 'none';
                this.clearSearch();
                searchInput.focus();
            });
        }
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                const searchTerm = searchInput.value.trim().toUpperCase();
                if (searchTerm) {
                    this.searchVehicle(searchTerm);
                }
            });
        }
    }

    setupDashboardStatsClick() {
        const occupiedSpotsElement = document.getElementById('occupied-spots');
        if (occupiedSpotsElement) {
            occupiedSpotsElement.style.cursor = 'pointer';
            occupiedSpotsElement.title = 'CLIQUE PARA VER DETALHES DOS VEÍCULOS ESTACIONADOS';
            occupiedSpotsElement.addEventListener('click', () => {
                this.showOccupiedSpotsModal();
            });
        }

        const availableSpotsElement = document.getElementById('available-spots');
        if (availableSpotsElement) {
            availableSpotsElement.style.cursor = 'pointer';
            availableSpotsElement.title = 'CLIQUE PARA VER VAGAS DISPONÍVEIS';
            availableSpotsElement.addEventListener('click', () => {
                this.switchPage('estacionamento');
                this.showNotification('VAGAS DISPONÍVEIS VISUALIZADAS NA PÁGINA DE ESTACIONAMENTO', 'info');
            });
        }

        const dailyRevenueElement = document.getElementById('daily-revenue');
        if (dailyRevenueElement) {
            dailyRevenueElement.style.cursor = 'pointer';
            dailyRevenueElement.title = 'CLIQUE PARA VER RELATÓRIO DE FATURAMENTO';
            dailyRevenueElement.addEventListener('click', () => {
                this.showRevenueReport();
            });
        }
    }

    // ============================================
    // SISTEMA DE PESQUISA
    // ============================================

    searchVehicle(searchTerm) {
        if (!searchTerm || searchTerm.length < 1) {
            this.clearSearch();
            return;
        }
        
        this.currentSearch = searchTerm;
        const results = this.performSearch(searchTerm);
        this.searchResults = results;
        
        if (results.length > 0) {
            this.showSearchResults(results, searchTerm);
        } else {
            this.showNoResults(searchTerm);
        }
        
        if (this.currentPage === 'estacionamento') {
            this.highlightParkingSpots(results);
        } else if (results.length > 0) {
            this.showSearchModal(results, searchTerm);
        }
    }

    performSearch(searchTerm) {
        return this.parkingSpots.filter(spot => {
            if (spot.status !== 'occupied') return false;
            
            if (spot.vehicle?.plate?.toUpperCase().includes(searchTerm)) return true;
            if (spot.vehicle?.model?.toUpperCase().includes(searchTerm)) return true;
            if (spot.client?.name?.toUpperCase().includes(searchTerm)) return true;
            if (!isNaN(searchTerm) && spot.number.toString().includes(searchTerm)) return true;
            
            return false;
        });
    }

    showSearchResults(results, searchTerm) {
        this.removeExistingElement('.search-notification');
        
        const notification = document.createElement('div');
        notification.className = 'search-notification';
        
        if (results.length === 1) {
            const spot = results[0];
            notification.innerHTML = `
                <i class="fas fa-car"></i>
                <span>
                    <strong>${searchTerm}</strong> ENCONTRADO NA 
                    <strong>VAGA ${spot.number}</strong> (${spot.sectorName}) 
                    - ${spot.vehicle.plate} - ${spot.vehicle.model}
                </span>
                <button class="btn-go-to-spot" data-spot="${spot.id}">
                    <i class="fas fa-map-marker-alt"></i> IR PARA VAGA
                </button>
            `;
        } else {
            notification.innerHTML = `
                <i class="fas fa-car"></i>
                <span>
                    <strong>${results.length} RESULTADOS</strong> PARA 
                    <strong>"${searchTerm}"</strong>
                </span>
                <button class="btn-view-all-results">
                    <i class="fas fa-list"></i> VER TODOS
                </button>
            `;
        }
        
        this.applyElementStyles(notification, {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            top: '80px'
        });
        
        document.body.appendChild(notification);
        
        const goToSpotBtn = notification.querySelector('.btn-go-to-spot');
        if (goToSpotBtn) {
            this.applyButtonStyle(goToSpotBtn);
            goToSpotBtn.addEventListener('click', (e) => {
                const spotId = parseInt(e.currentTarget.dataset.spot);
                this.goToParkingSpot(spotId);
                notification.remove();
            });
        }
        
        const viewAllBtn = notification.querySelector('.btn-view-all-results');
        if (viewAllBtn) {
            this.applyButtonStyle(viewAllBtn);
            viewAllBtn.addEventListener('click', () => {
                this.showSearchModal(results, searchTerm);
                notification.remove();
            });
        }
        
        this.autoCloseElement(notification, 8000);
    }

    showNoResults(searchTerm) {
        this.removeExistingElement('.search-notification');
        
        const notification = document.createElement('div');
        notification.className = 'search-notification';
        notification.innerHTML = `
            <i class="fas fa-search"></i>
            <span>NENHUM VEÍCULO ENCONTRADO PARA <strong>"${searchTerm}"</strong></span>
        `;
        
        this.applyElementStyles(notification, {
            background: '#e74c3c',
            color: 'white',
            top: '80px'
        });
        
        document.body.appendChild(notification);
        this.autoCloseElement(notification, 5000);
    }

    showSearchModal(results, searchTerm) {
        this.removeExistingElement('#search-results-modal');
        
        const modal = document.createElement('div');
        modal.id = 'search-results-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = this.getSearchModalHTML(results, searchTerm);
        
        document.body.appendChild(modal);
        this.setupSearchModalEvents(modal, results);
    }

    getSearchModalHTML(results, searchTerm) {
        return `
            <div class="modal-content search-modal">
                <div class="modal-header">
                    <h3>
                        <i class="fas fa-search"></i>
                        RESULTADOS DA BUSCA: "${searchTerm}"
                    </h3>
                    <button class="close-modal" id="close-search-modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="search-summary">
                        <i class="fas fa-car"></i>
                        <span>${results.length} VEÍCULO(S) ENCONTRADO(S)</span>
                    </div>
                    <div class="search-results-list" id="search-results-list">
                        ${results.map(spot => this.getSearchResultItemHTML(spot)).join('')}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" id="close-search-modal-btn">
                        FECHAR
                    </button>
                </div>
            </div>
        `;
    }

    getSearchResultItemHTML(spot) {
        return `
            <div class="search-result-item" data-spot="${spot.id}">
                <div class="result-header">
                    <div class="result-spot-info">
                        <span class="spot-badge">VAGA ${spot.number}</span>
                        <span class="sector-badge">${spot.sectorName}</span>
                        ${spot.type === 'pcd' ? '<span class="pcd-badge">PCD</span>' : ''}
                    </div>
                    <button class="btn-go-to-spot-small" data-spot="${spot.id}">
                        <i class="fas fa-map-marker-alt"></i> IR PARA VAGA
                    </button>
                </div>
                <div class="result-vehicle-info">
                    <div class="vehicle-detail">
                        <i class="fas fa-car"></i>
                        <strong>${spot.vehicle.plate}</strong>
                    </div>
                    <div class="vehicle-detail">
                        <i class="fas fa-tag"></i>
                        ${spot.vehicle.model} ${spot.vehicle.color ? `- ${spot.vehicle.color}` : ''}
                    </div>
                    ${spot.client ? `
                        <div class="vehicle-detail">
                            <i class="fas fa-user"></i>
                            ${spot.client.name}
                        </div>
                    ` : ''}
                    <div class="vehicle-detail">
                        <i class="fas fa-clock"></i>
                        ESTACIONADO HÁ: ${this.getElapsedTime(spot.entryTime)}
                    </div>
                </div>
                <div class="result-actions">
                    <button class="btn-secondary btn-release-search" data-spot="${spot.id}">
                        <i class="fas fa-sign-out-alt"></i> LIBERAR VAGA
                    </button>
                </div>
            </div>
        `;
    }

    setupSearchModalEvents(modal, results) {
        const closeModal = () => {
            modal.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        };
        
        document.getElementById('close-search-modal')?.addEventListener('click', closeModal);
        document.getElementById('close-search-modal-btn')?.addEventListener('click', closeModal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        modal.querySelectorAll('.btn-go-to-spot-small').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const spotId = parseInt(e.currentTarget.dataset.spot);
                closeModal();
                this.goToParkingSpot(spotId);
            });
        });
        
        modal.querySelectorAll('.btn-release-search').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const spotId = parseInt(e.currentTarget.dataset.spot);
                const vehiclePlate = results.find(r => r.id === spotId)?.vehicle?.plate;
                if (confirm(`LIBERAR VAGA DO VEÍCULO ${vehiclePlate}?`)) {
                    this.releaseSpot(spotId);
                    closeModal();
                }
            });
        });
    }

    highlightParkingSpots(results) {
        document.querySelectorAll('.parking-spot').forEach(spot => {
            spot.classList.remove('highlighted', 'search-match');
            spot.style.animation = '';
        });
        
        results.forEach(spot => {
            const spotElement = document.querySelector(`[data-spot-id="${spot.id}"]`);
            if (spotElement) {
                spotElement.classList.add('highlighted', 'search-match');
                spotElement.style.animation = 'pulse 2s infinite';
                
                setTimeout(() => {
                    spotElement.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                }, 500);
            } else {
                document.querySelectorAll('.parking-spot').forEach(element => {
                    const spotNumber = element.querySelector('.spot-number');
                    if (spotNumber && parseInt(spotNumber.textContent) === spot.number) {
                        element.classList.add('highlighted', 'search-match');
                        element.style.animation = 'pulse 2s infinite';
                        
                        setTimeout(() => {
                            element.scrollIntoView({ 
                                behavior: 'smooth', 
                                block: 'center' 
                            });
                        }, 500);
                    }
                });
            }
        });
    }

    goToParkingSpot(spotId) {
        this.switchPage('estacionamento');
        
        setTimeout(() => {
            const spot = this.parkingSpots.find(s => s.id === spotId);
            if (spot) {
                const spotElements = document.querySelectorAll('.parking-spot');
                spotElements.forEach(element => {
                    const spotNumber = element.querySelector('.spot-number');
                    if (spotNumber && parseInt(spotNumber.textContent) === spot.number) {
                        element.classList.add('highlighted');
                        element.style.animation = 'pulse 2s infinite';
                        
                        element.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'center' 
                        });
                        
                        const searchInput = document.getElementById('vehicle-search');
                        if (searchInput) {
                            searchInput.value = spot.vehicle?.plate || '';
                            searchInput.focus();
                        }
                    }
                });
            }
        }, 300);
    }

    clearSearch() {
        this.searchResults = [];
        this.currentSearch = '';
        
        document.querySelectorAll('.parking-spot').forEach(spot => {
            spot.classList.remove('highlighted', 'search-match');
            spot.style.animation = '';
        });
        
        this.removeExistingElement('#search-counter');
        this.removeExistingElement('.search-notification');
        this.removeExistingElement('#search-results-modal');
        
        const searchInput = document.getElementById('vehicle-search');
        if (searchInput) {
            searchInput.value = '';
        }
        
        const clearBtn = document.getElementById('clear-search');
        if (clearBtn) {
            clearBtn.style.display = 'none';
        }
    }

    // ============================================
    // MODAL DE VEÍCULOS ESTACIONADOS
    // ============================================

    createOccupiedSpotsModal() {
        this.removeExistingElement('#occupied-spots-modal');
        
        const modal = document.createElement('div');
        modal.id = 'occupied-spots-modal';
        modal.className = 'modal-overlay hidden';
        modal.innerHTML = `
            <div class="modal-content occupied-modal">
                <div class="modal-header">
                    <h3>
                        <i class="fas fa-car"></i>
                        VEÍCULOS ESTACIONADOS
                    </h3>
                    <button class="close-modal" id="close-occupied-modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="occupied-summary">
                        <div class="summary-item">
                            <i class="fas fa-parking"></i>
                            <span>VAGAS OCUPADAS: <strong id="occupied-count">0</strong></span>
                        </div>
                        <div class="summary-item">
                            <i class="fas fa-clock"></i>
                            <span>TEMPO MÉDIO: <strong id="average-time-display">0h 0m</strong></span>
                        </div>
                        <div class="summary-item">
                            <i class="fas fa-money-bill-wave"></i>
                            <span>FATURAMENTO ESTIMADO: <strong id="estimated-revenue">R$ 0,00</strong></span>
                        </div>
                    </div>
                    
                    <div class="search-controls">
                        <div class="search-input-group">
                            <i class="fas fa-search search-icon"></i>
                            <input type="text" 
                                   id="occupied-search" 
                                   class="search-input" 
                                   placeholder="FILTRAR VEÍCULOS...">
                            <button id="clear-occupied-search" class="clear-search-btn" style="display: none;">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="filter-controls">
                            <select id="sector-filter-occupied" class="filter-select">
                                <option value="all">TODOS OS SETORES</option>
                                <option value="A">FRENTE</option>
                                <option value="B">EDU</option>
                                <option value="C">BAIXO</option>
                                <option value="D">ALTO</option>
                            </select>
                            <select id="time-filter-occupied" class="filter-select">
                                <option value="all">QUALQUER TEMPO</option>
                                <option value="1">ATÉ 1 HORA</option>
                                <option value="3">ATÉ 3 HORAS</option>
                                <option value="6">ATÉ 6 HORAS</option>
                                <option value="12">ATÉ 12 HORAS</option>
                                <option value="24">MAIS DE 12 HORAS</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="vehicles-list-container">
                        <div class="vehicles-list-header">
                            <div class="header-cell">VAGA</div>
                            <div class="header-cell">SETOR</div>
                            <div class="header-cell">PLACA</div>
                            <div class="header-cell">VEÍCULO</div>
                            <div class="header-cell">CLIENTE</div>
                            <div class="header-cell">TEMPO</div>
                            <div class="header-cell">VALOR ESTIMADO</div>
                            <div class="header-cell">AÇÕES</div>
                        </div>
                        <div class="vehicles-list-body" id="occupied-vehicles-list">
                            <!-- Lista será carregada aqui -->
                        </div>
                    </div>
                    
                    <div class="export-section">
                        <button class="btn-secondary" id="print-occupied-list">
                            <i class="fas fa-print"></i> IMPRIMIR LISTA
                        </button>
                        <button class="btn-secondary" id="export-occupied-list">
                            <i class="fas fa-file-export"></i> EXPORTAR CSV
                        </button>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-primary" id="close-occupied-modal-btn">
                        FECHAR
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.setupOccupiedSpotsModalEvents();
    }

    setupOccupiedSpotsModalEvents() {
        const modal = document.getElementById('occupied-spots-modal');
        
        const closeModal = () => {
            modal.classList.add('hidden');
        };
        
        document.getElementById('close-occupied-modal')?.addEventListener('click', closeModal);
        document.getElementById('close-occupied-modal-btn')?.addEventListener('click', closeModal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Busca
        const searchInput = document.getElementById('occupied-search');
        const clearSearchBtn = document.getElementById('clear-occupied-search');
        
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                const searchTerm = e.target.value.trim().toUpperCase();
                
                if (clearSearchBtn) {
                    clearSearchBtn.style.display = searchTerm ? 'flex' : 'none';
                }
                
                searchTimeout = setTimeout(() => {
                    this.filterOccupiedVehicles();
                }, 300);
            });
        }
        
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                searchInput.value = '';
                clearSearchBtn.style.display = 'none';
                this.filterOccupiedVehicles();
            });
        }
        
        // Filtros
        document.getElementById('sector-filter-occupied')?.addEventListener('change', () => {
            this.filterOccupiedVehicles();
        });
        
        document.getElementById('time-filter-occupied')?.addEventListener('change', () => {
            this.filterOccupiedVehicles();
        });
        
        // Exportar
        document.getElementById('print-occupied-list')?.addEventListener('click', () => {
            this.printOccupiedList();
        });
        
        document.getElementById('export-occupied-list')?.addEventListener('click', () => {
            this.exportOccupiedListToCSV();
        });
    }

    showOccupiedSpotsModal() {
        const modal = document.getElementById('occupied-spots-modal');
        if (!modal) return;
        
        this.updateOccupiedSpotsModal();
        modal.classList.remove('hidden');
        
        setTimeout(() => {
            document.getElementById('occupied-search')?.focus();
        }, 100);
    }

    updateOccupiedSpotsModal() {
        const occupiedSpots = this.parkingSpots.filter(spot => spot.status === 'occupied');
        const occupiedCount = occupiedSpots.length;
        
        document.getElementById('occupied-count').textContent = occupiedCount;
        
        let totalTime = 0;
        let estimatedRevenue = 0;
        
        occupiedSpots.forEach(spot => {
            const entryTime = new Date(spot.entryTime);
            const hours = (new Date() - entryTime) / (1000 * 60 * 60);
            totalTime += hours;
            
            let price = 0;
            if (hours <= 1) {
                price = this.settings.prices.firstHour;
            } else if (hours > 24) {
                price = this.settings.prices.daily;
            } else {
                price = this.settings.prices.firstHour + (Math.ceil(hours) - 1) * this.settings.prices.additionalHour;
                price = Math.min(price, this.settings.prices.daily);
            }
            estimatedRevenue += price;
        });
        
        const avgHours = occupiedCount > 0 ? totalTime / occupiedCount : 0;
        const hours = Math.floor(avgHours);
        const minutes = Math.floor((avgHours - hours) * 60);
        
        document.getElementById('average-time-display').textContent = `${hours}h ${minutes}m`;
        document.getElementById('estimated-revenue').textContent = `R$ ${estimatedRevenue.toFixed(2).replace('.', ',')}`;
        
        this.renderOccupiedVehiclesList(occupiedSpots);
    }

    renderOccupiedVehiclesList(spots) {
        const listBody = document.getElementById('occupied-vehicles-list');
        if (!listBody) return;
        
        listBody.innerHTML = '';
        
        if (spots.length === 0) {
            const emptyRow = document.createElement('div');
            emptyRow.className = 'vehicle-row';
            emptyRow.innerHTML = `
                <div class="vehicle-cell" style="grid-column: 1 / -1; text-align: center; padding: 30px; color: #6c757d;">
                    <i class="fas fa-parking" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    <p>NENHUM VEÍCULO ESTACIONADO NO MOMENTO</p>
                </div>
            `;
            listBody.appendChild(emptyRow);
            return;
        }
        
        spots.forEach(spot => {
            const entryTime = new Date(spot.entryTime);
            const hours = (new Date() - entryTime) / (1000 * 60 * 60);
            
            let estimatedPrice = 0;
            if (hours <= 1) {
                estimatedPrice = this.settings.prices.firstHour;
            } else if (hours > 24) {
                estimatedPrice = this.settings.prices.daily;
            } else {
                estimatedPrice = this.settings.prices.firstHour + (Math.ceil(hours) - 1) * this.settings.prices.additionalHour;
                estimatedPrice = Math.min(estimatedPrice, this.settings.prices.daily);
            }
            
            const vehicleRow = document.createElement('div');
            vehicleRow.className = 'vehicle-row';
            vehicleRow.setAttribute('data-spot-id', spot.id);
            vehicleRow.setAttribute('data-sector', spot.sector);
            vehicleRow.setAttribute('data-hours', hours.toFixed(1));
            
            vehicleRow.innerHTML = `
                <div class="vehicle-cell spot-number-cell">
                    ${spot.number}
                    ${spot.type === 'pcd' ? '<span class="pcd-badge-small">PCD</span>' : ''}
                </div>
                <div class="vehicle-cell sector-cell sector-${spot.sector.toLowerCase()}">
                    ${spot.sectorName}
                </div>
                <div class="vehicle-cell plate-cell">
                    ${spot.vehicle?.plate || 'N/A'}
                </div>
                <div class="vehicle-cell">
                    ${spot.vehicle?.model || 'N/A'} ${spot.vehicle?.color ? `(${spot.vehicle.color})` : ''}
                </div>
                <div class="vehicle-cell">
                    ${spot.client?.name || 'NÃO CADASTRADO'}
                </div>
                <div class="vehicle-cell ${hours > 12 ? 'time-warning' : ''}">
                    ${this.getElapsedTime(spot.entryTime)}
                </div>
                <div class="vehicle-cell">
                    R$ ${estimatedPrice.toFixed(2).replace('.', ',')}
                </div>
                <div class="vehicle-cell">
                    <button class="btn-icon-small btn-go-to-spot" data-spot="${spot.id}" title="Ir para vaga">
                        <i class="fas fa-map-marker-alt"></i>
                    </button>
                    <button class="btn-icon-small btn-release-from-list" data-spot="${spot.id}" title="Liberar vaga">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            `;
            
            listBody.appendChild(vehicleRow);
        });
        
        this.setupOccupiedListEvents();
    }

    setupOccupiedListEvents() {
        const listBody = document.getElementById('occupied-vehicles-list');
        if (!listBody) return;
        
        listBody.addEventListener('click', (e) => {
            if (e.target.closest('.btn-go-to-spot')) {
                const spotId = parseInt(e.target.closest('.btn-go-to-spot').dataset.spot);
                this.goToParkingSpotFromList(spotId);
            } else if (e.target.closest('.btn-release-from-list')) {
                const spotId = parseInt(e.target.closest('.btn-release-from-list').dataset.spot);
                this.releaseSpotFromList(spotId);
            }
        });
    }

    goToParkingSpotFromList(spotId) {
        const modal = document.getElementById('occupied-spots-modal');
        modal.classList.add('hidden');
        
        this.switchPage('estacionamento');
        
        setTimeout(() => {
            const spot = this.parkingSpots.find(s => s.id === spotId);
            if (spot) {
                const spotElements = document.querySelectorAll('.parking-spot');
                spotElements.forEach(element => {
                    const spotNumber = element.querySelector('.spot-number');
                    if (spotNumber && parseInt(spotNumber.textContent) === spot.number) {
                        element.classList.add('highlighted');
                        element.style.animation = 'pulse 2s infinite';
                        
                        element.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'center' 
                        });
                    }
                });
            }
        }, 300);
    }

    releaseSpotFromList(spotId) {
        const spot = this.parkingSpots.find(s => s.id === spotId);
        if (!spot) return;
        
        const entryTime = new Date(spot.entryTime);
        const hours = (new Date() - entryTime) / (1000 * 60 * 60);
        let price = 0;
        
        if (hours <= 1) {
            price = this.settings.prices.firstHour;
        } else if (hours > 24) {
            price = this.settings.prices.daily;
        } else {
            price = this.settings.prices.firstHour + (Math.ceil(hours) - 1) * this.settings.prices.additionalHour;
            price = Math.min(price, this.settings.prices.daily);
        }
        
        if (confirm(`LIBERAR VAGA ${spot.number} - ${spot.vehicle?.plate || 'N/A'}?\nTEMPO: ${this.getElapsedTime(spot.entryTime)}\nVALOR: R$ ${price.toFixed(2)}`)) {
            this.releaseSpot(spotId);
            
            setTimeout(() => {
                this.updateOccupiedSpotsModal();
            }, 500);
        }
    }

    filterOccupiedVehicles() {
        const searchTerm = document.getElementById('occupied-search')?.value.trim().toUpperCase() || '';
        const sectorFilter = document.getElementById('sector-filter-occupied')?.value || 'all';
        const timeFilter = document.getElementById('time-filter-occupied')?.value || 'all';
        
        const occupiedSpots = this.parkingSpots.filter(spot => spot.status === 'occupied');
        
        const filteredSpots = occupiedSpots.filter(spot => {
            if (sectorFilter !== 'all' && spot.sector !== sectorFilter) {
                return false;
            }
            
            const entryTime = new Date(spot.entryTime);
            const hours = (new Date() - entryTime) / (1000 * 60 * 60);
            
            if (timeFilter !== 'all') {
                if (timeFilter === '1' && hours > 1) return false;
                if (timeFilter === '3' && hours > 3) return false;
                if (timeFilter === '6' && hours > 6) return false;
                if (timeFilter === '12' && hours > 12) return false;
                if (timeFilter === '24' && hours <= 12) return false;
            }
            
            if (searchTerm) {
                const matchesPlate = spot.vehicle?.plate?.toUpperCase().includes(searchTerm);
                const matchesModel = spot.vehicle?.model?.toUpperCase().includes(searchTerm);
                const matchesClient = spot.client?.name?.toUpperCase().includes(searchTerm);
                const matchesSpot = spot.number.toString().includes(searchTerm);
                
                if (!matchesPlate && !matchesModel && !matchesClient && !matchesSpot) {
                    return false;
                }
            }
            
            return true;
        });
        
        this.renderOccupiedVehiclesList(filteredSpots);
        
        const resultCount = document.querySelector('.occupied-summary .summary-item:first-child strong');
        if (resultCount && filteredSpots.length !== occupiedSpots.length) {
            resultCount.textContent = `${filteredSpots.length} de ${occupiedSpots.length}`;
        }
    }

    printOccupiedList() {
        const printWindow = window.open('', '_blank');
        const occupiedSpots = this.parkingSpots.filter(spot => spot.status === 'occupied');
        
        let totalRevenue = 0;
        const rows = occupiedSpots.map(spot => {
            const entryTime = new Date(spot.entryTime);
            const hours = (new Date() - entryTime) / (1000 * 60 * 60);
            
            let price = 0;
            if (hours <= 1) {
                price = this.settings.prices.firstHour;
            } else if (hours > 24) {
                price = this.settings.prices.daily;
            } else {
                price = this.settings.prices.firstHour + (Math.ceil(hours) - 1) * this.settings.prices.additionalHour;
                price = Math.min(price, this.settings.prices.daily);
            }
            totalRevenue += price;
            
            return `
                <tr>
                    <td>${spot.number}</td>
                    <td>${spot.sectorName}</td>
                    <td>${spot.vehicle?.plate || 'N/A'}</td>
                    <td>${spot.vehicle?.model || 'N/A'}</td>
                    <td>${spot.client?.name || 'NÃO CADASTRADO'}</td>
                    <td>${this.getElapsedTime(spot.entryTime)}</td>
                    <td>R$ ${price.toFixed(2).replace('.', ',')}</td>
                </tr>
            `;
        }).join('');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>RELATÓRIO DE VEÍCULOS ESTACIONADOS</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #2c3e50; text-align: center; }
                    h2 { color: #34495e; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th { background: #2c3e50; color: white; padding: 10px; text-align: left; }
                    td { padding: 8px; border: 1px solid #ddd; }
                    tr:nth-child(even) { background: #f8f9fa; }
                    .summary { background: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    .summary-item { margin: 5px 0; }
                    .timestamp { text-align: right; color: #7f8c8d; font-size: 0.9em; }
                </style>
            </head>
            <body>
                <h1>RELATÓRIO DE VEÍCULOS ESTACIONADOS</h1>
                <div class="timestamp">
                    EMITIDO EM: ${new Date().toLocaleString('pt-BR')}
                </div>
                
                <div class="summary">
                    <h2>RESUMO</h2>
                    <div class="summary-item">TOTAL DE VEÍCULOS: ${occupiedSpots.length}</div>
                    <div class="summary-item">FATURAMENTO ESTIMADO: R$ ${totalRevenue.toFixed(2).replace('.', ',')}</div>
                    <div class="summary-item">TEMPO MÉDIO: ${this.getAverageParkingTime()}</div>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>VAGA</th>
                            <th>SETOR</th>
                            <th>PLACA</th>
                            <th>VEÍCULO</th>
                            <th>CLIENTE</th>
                            <th>TEMPO</th>
                            <th>VALOR ESTIMADO</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
    }

    exportOccupiedListToCSV() {
        const occupiedSpots = this.parkingSpots.filter(spot => spot.status === 'occupied');
        
        let csvContent = "Vaga;Setor;Placa;Veículo;Cor;Cliente;Telefone;Entrada;Tempo;Valor Estimado\n";
        
        occupiedSpots.forEach(spot => {
            const entryTime = new Date(spot.entryTime);
            const hours = (new Date() - entryTime) / (1000 * 60 * 60);
            
            let price = 0;
            if (hours <= 1) {
                price = this.settings.prices.firstHour;
            } else if (hours > 24) {
                price = this.settings.prices.daily;
            } else {
                price = this.settings.prices.firstHour + (Math.ceil(hours) - 1) * this.settings.prices.additionalHour;
                price = Math.min(price, this.settings.prices.daily);
            }
            
            const row = [
                spot.number,
                spot.sectorName,
                spot.vehicle?.plate || '',
                spot.vehicle?.model || '',
                spot.vehicle?.color || '',
                spot.client?.name || 'NÃO CADASTRADO',
                this.clients.find(c => c.id === spot.client?.id)?.phone || '',
                new Date(spot.entryTime).toLocaleString('pt-BR'),
                this.getElapsedTime(spot.entryTime),
                `R$ ${price.toFixed(2)}`
            ].map(field => `"${field}"`).join(';');
            
            csvContent += row + "\n";
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `veiculos_estacionados_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('LISTA EXPORTADA COM SUCESSO!', 'success');
    }

    getAverageParkingTime() {
        const occupied = this.parkingSpots.filter(spot => spot.status === 'occupied' && spot.entryTime);
        
        if (occupied.length === 0) return '0h 0m';
        
        const avgHours = occupied.reduce((sum, spot) => {
            const entryTime = new Date(spot.entryTime);
            return sum + (new Date() - entryTime) / (1000 * 60 * 60);
        }, 0) / occupied.length;
        
        const hours = Math.floor(avgHours);
        const minutes = Math.floor((avgHours - hours) * 60);
        
        return `${hours}h ${minutes}m`;
    }

    // ============================================
    // NAVEGAÇÃO E RENDERIZAÇÃO
    // ============================================

    switchPage(page) {
        this.updateActiveMenu(page);
        this.showPageContent(page);
        this.updatePageTitle(page);
        this.currentPage = page;
        this.renderPageContent(page);
    }

    updateActiveMenu(page) {
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
    }

    showPageContent(page) {
        document.querySelectorAll('.page-content').forEach(content => {
            content.classList.add('hidden');
        });

        const pageContent = document.getElementById(`${page}-content`);
        if (pageContent) {
            pageContent.classList.remove('hidden');
        }
    }

    updatePageTitle(page) {
        const titles = {
            'dashboard': { title: 'DASHBOARD', subtitle: 'VISÃO GERAL DO SISTEMA' },
            'estacionamento': { title: 'ESTACIONAMENTO', subtitle: 'GERENCIAMENTO DE VAGAS' },
            'clientes': { title: 'CLIENTES', subtitle: 'CADASTRO E HISTÓRICO' },
            'relatorios': { title: 'RELATÓRIOS', subtitle: 'ANÁLISE DE DADOS' },
            'configuracoes': { title: 'CONFIGURAÇÕES', subtitle: 'CONFIGURAÇÕES DO SISTEMA' }
        };

        if (titles[page]) {
            const pageTitle = document.getElementById('page-title');
            const pageSubtitle = document.getElementById('page-subtitle');
            
            if (pageTitle) pageTitle.textContent = titles[page].title;
            if (pageSubtitle) pageSubtitle.textContent = titles[page].subtitle;
        }
    }

    renderPageContent(page) {
        switch(page) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'estacionamento':
                this.renderParking();
                break;
            case 'clientes':
                this.renderClients();
                break;
            case 'configuracoes':
                this.renderSettings();
                break;
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
        
        const timeStr = now.toLocaleTimeString('pt-BR');
        
        const currentDate = document.getElementById('current-date');
        const currentTime = document.getElementById('current-time');
        
        if (currentDate) currentDate.textContent = dateStr;
        if (currentTime) currentTime.textContent = timeStr;
    }

    renderDashboard() {
        const occupiedSpots = this.parkingSpots.filter(spot => spot.status === 'occupied').length;
        const availableSpots = this.parkingSpots.filter(spot => spot.status === 'available').length;
        
        const occupiedSpotsElement = document.getElementById('occupied-spots');
        const availableSpotsElement = document.getElementById('available-spots');
        
        if (occupiedSpotsElement) {
            occupiedSpotsElement.textContent = occupiedSpots;
            occupiedSpotsElement.style.cursor = 'pointer';
            occupiedSpotsElement.title = 'CLIQUE PARA VER DETALHES DOS VEÍCULOS ESTACIONADOS';
        }
        
        if (availableSpotsElement) {
            availableSpotsElement.textContent = availableSpots;
            availableSpotsElement.style.cursor = 'pointer';
            availableSpotsElement.title = 'CLIQUE PARA VER VAGAS DISPONÍVEIS';
        }
        
        let dailyRevenue = 0;
        this.parkingSpots.forEach(spot => {
            if (spot.status === 'occupied' && spot.entryTime) {
                const entryTime = new Date(spot.entryTime);
                const hours = (new Date() - entryTime) / (1000 * 60 * 60);
                const price = hours <= 1 ? this.settings.prices.firstHour : 
                            this.settings.prices.firstHour + (Math.ceil(hours) - 1) * this.settings.prices.additionalHour;
                dailyRevenue += Math.min(price, this.settings.prices.daily);
            }
        });
        
        const dailyRevenueElement = document.getElementById('daily-revenue');
        if (dailyRevenueElement) {
            dailyRevenueElement.textContent = `R$ ${dailyRevenue.toFixed(2).replace('.', ',')}`;
            dailyRevenueElement.style.cursor = 'pointer';
            dailyRevenueElement.title = 'CLIQUE PARA VER RELATÓRIO DE FATURAMENTO';
        }
        
        const occupied = this.parkingSpots.filter(spot => spot.status === 'occupied' && spot.entryTime);
        const averageTimeElement = document.getElementById('average-time');
        
        if (occupied.length > 0 && averageTimeElement) {
            const avgHours = occupied.reduce((sum, spot) => {
                const entryTime = new Date(spot.entryTime);
                return sum + (new Date() - entryTime) / (1000 * 60 * 60);
            }, 0) / occupied.length;
            
            const hours = Math.floor(avgHours);
            const minutes = Math.floor((avgHours - hours) * 60);
            averageTimeElement.textContent = `${hours}h ${minutes}m`;
        }
        
        this.renderActivities();
        
        if (typeof window.initCharts === 'function') {
            window.initCharts(this.parkingSpots, this.activities);
        }
    }

    showRevenueReport() {
        const occupiedSpots = this.parkingSpots.filter(spot => spot.status === 'occupied');
        let totalRevenue = 0;
        
        const revenueBySector = {
            'A': 0,
            'B': 0,
            'C': 0,
            'D': 0
        };
        
        occupiedSpots.forEach(spot => {
            const entryTime = new Date(spot.entryTime);
            const hours = (new Date() - entryTime) / (1000 * 60 * 60);
            
            let price = 0;
            if (hours <= 1) {
                price = this.settings.prices.firstHour;
            } else if (hours > 24) {
                price = this.settings.prices.daily;
            } else {
                price = this.settings.prices.firstHour + (Math.ceil(hours) - 1) * this.settings.prices.additionalHour;
                price = Math.min(price, this.settings.prices.daily);
            }
            
            totalRevenue += price;
            revenueBySector[spot.sector] += price;
        });
        
        const reportHtml = `
            <div class="revenue-report">
                <h3><i class="fas fa-money-bill-wave"></i> RELATÓRIO DE FATURAMENTO</h3>
                <div class="revenue-total">
                    <span>TOTAL ESTIMADO:</span>
                    <strong>R$ ${totalRevenue.toFixed(2).replace('.', ',')}</strong>
                </div>
                <div class="revenue-by-sector">
                    <h4>POR SETOR:</h4>
                    <div class="sector-revenue">
                        <span>FRENTE:</span>
                        <strong>R$ ${revenueBySector['A'].toFixed(2).replace('.', ',')}</strong>
                    </div>
                    <div class="sector-revenue">
                        <span>EDU:</span>
                        <strong>R$ ${revenueBySector['B'].toFixed(2).replace('.', ',')}</strong>
                    </div>
                    <div class="sector-revenue">
                        <span>BAIXO:</span>
                        <strong>R$ ${revenueBySector['C'].toFixed(2).replace('.', ',')}</strong>
                    </div>
                    <div class="sector-revenue">
                        <span>ALTO:</span>
                        <strong>R$ ${revenueBySector['D'].toFixed(2).replace('.', ',')}</strong>
                    </div>
                </div>
                <div class="revenue-details">
                    <p><i class="fas fa-info-circle"></i> Baseado no tempo atual de permanência</p>
                    <p><i class="fas fa-clock"></i> Atualizado em: ${new Date().toLocaleTimeString('pt-BR')}</p>
                </div>
            </div>
        `;
        
        this.showNotification(reportHtml, 'info', 10000);
    }

    renderActivities() {
        const activitiesList = document.getElementById('activities-list');
        if (!activitiesList) return;
        
        activitiesList.innerHTML = '';
        
        const sortedActivities = [...this.activities].sort((a, b) => 
            new Date(b.time) - new Date(a.time)
        ).slice(0, 10);
        
        sortedActivities.forEach(activity => {
            const activityDate = new Date(activity.time);
            const timeStr = activityDate.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const iconClass = {
                'entry': 'fas fa-sign-in-alt entry',
                'exit': 'fas fa-sign-out-alt exit',
                'payment': 'fas fa-money-bill-wave payment',
                'system': 'fas fa-cog system'
            }[activity.type] || 'fas fa-info-circle';
            
            const activityElement = document.createElement('div');
            activityElement.className = 'activity-item';
            activityElement.innerHTML = `
                <div class="activity-icon ${activity.type}">
                    <i class="${iconClass}"></i>
                </div>
                <div class="activity-details">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-description">${activity.description}</div>
                    <div class="activity-time">${timeStr}</div>
                </div>
            `;
            
            activitiesList.appendChild(activityElement);
        });
    }

    renderParking() {
        const parkingGrid = document.getElementById('parking-grid');
        if (!parkingGrid) return;
        
        parkingGrid.innerHTML = '';
        
        if (this.currentSearch && this.searchResults.length > 0) {
            const searchInfoHtml = `
                <div class="search-active-info">
                    <i class="fas fa-search"></i>
                    <span>BUSCA ATIVA: "${this.currentSearch}" - ${this.searchResults.length} RESULTADO(S)</span>
                    <button class="btn-clear-search" onclick="window.parkingSystem.clearSearch()">
                        <i class="fas fa-times"></i> LIMPAR BUSCA
                    </button>
                </div>
            `;
            parkingGrid.insertAdjacentHTML('afterbegin', searchInfoHtml);
        }
        
        const sectors = ['A', 'B', 'C', 'D'];
        sectors.forEach(sector => {
            this.renderParkingSector(parkingGrid, sector);
        });
        
        parkingGrid.addEventListener('click', (e) => {
            this.handleParkingSpotClick(e);
        });
    }

    renderParkingSector(container, sector) {
        const sectorTitles = {
            'A': 'FRENTE (VAGAS 1-30)',
            'B': 'EDU (VAGAS 31-60)',
            'C': 'BAIXO (VAGAS 61-130)',
            'D': 'ALTO (VAGAS 131-200)'
        };
        
        const sectorHeader = document.createElement('div');
        sectorHeader.className = 'sector-header';
        sectorHeader.innerHTML = `
            <h3>${sectorTitles[sector]}</h3>
            <div class="sector-stats">
                <span class="sector-stat">TOTAL: ${sector === 'A' || sector === 'B' ? 30 : 70}</span>
                <span class="sector-stat">PCD: ${sector === 'A' || sector === 'B' ? 3 : 5}</span>
            </div>
        `;
        container.appendChild(sectorHeader);
        
        const sectorSpots = this.parkingSpots.filter(spot => spot.sector === sector);
        const sectorContainer = document.createElement('div');
        sectorContainer.className = 'sector-container';
        sectorContainer.setAttribute('data-sector', sector);
        
        sectorSpots.forEach(spot => {
            sectorContainer.appendChild(this.createParkingSpotElement(spot, sector));
        });
        
        container.appendChild(sectorContainer);
    }

    createParkingSpotElement(spot, sector) {
        const isHighlighted = this.searchResults.some(r => r.id === spot.id);
    
    const spotElement = document.createElement('div');
    spotElement.className = `parking-spot ${spot.status} ${spot.type} sector-${sector.toLowerCase()} ${isHighlighted ? 'highlighted search-match' : ''}`;
    spotElement.setAttribute('data-spot-id', spot.id);
    
    // Criar conteúdo HTML mais organizado
    let vehicleInfoHTML = '';
    if (spot.vehicle) {
        vehicleInfoHTML = `
            <div class="vehicle-info">
                <p class="vehicle-plate"><strong>${spot.vehicle.plate}</strong></p>
                <p class="vehicle-model">${spot.vehicle.model}</p>
                ${spot.vehicle.color ? `<p class="vehicle-color">${spot.vehicle.color}</p>` : ''}
                ${spot.client ? `<p class="client-name"><i class="fas fa-user"></i> ${spot.client.name}</p>` : ''}
                ${spot.entryTime ? `<p class="parking-time"><i class="fas fa-clock"></i> ${this.getElapsedTime(spot.entryTime)}</p>` : ''}
            </div>
        `;
    } else {
        vehicleInfoHTML = `
            <div class="vehicle-info empty">
                <p><i class="fas fa-parking"></i> VAGA DISPONÍVEL</p>
                <p class="empty-message">Clique em OCUPAR para estacionar</p>
            </div>
        `;
    }
    
    spotElement.innerHTML = `
        <div class="spot-header">
            <div class="spot-number">${spot.number}</div>
            <div class="spot-sector">${spot.sectorName}</div>
        </div>
        <div class="spot-status">${this.getStatusText(spot.status)}</div>
        ${spot.type === 'pcd' ? '<div class="spot-pcd">VAGA PCD</div>' : ''}
        ${vehicleInfoHTML}
        ${spot.status === 'occupied' ? `
            <button class="btn-secondary release-btn" data-spot="${spot.id}">
                <i class="fas fa-sign-out-alt"></i> LIBERAR
            </button>
        ` : `
            <button class="btn-primary occupy-btn" data-spot="${spot.id}">
                <i class="fas fa-car"></i> OCUPAR
            </button>
        `}
    `;
    
    if (isHighlighted) {
        spotElement.style.animation = 'highlightPulse 2s infinite';
    }
    
    return spotElement;
}

    handleParkingSpotClick(e) {
        if (e.target.closest('.release-btn')) {
            const spotId = parseInt(e.target.closest('.release-btn').dataset.spot);
            this.releaseSpot(spotId);
        } else if (e.target.closest('.occupy-btn')) {
            const spotId = parseInt(e.target.closest('.occupy-btn').dataset.spot);
            this.showVehicleModal(spotId);
        }
    }

    filterParkingBySector(sector) {
        const allSpots = document.querySelectorAll('.parking-spot');
        allSpots.forEach(spot => {
            if (sector === 'all' || spot.classList.contains(`sector-${sector.toLowerCase()}`)) {
                spot.style.display = 'block';
            } else {
                spot.style.display = 'none';
            }
        });
    }

    renderClients() {
        const tableBody = document.getElementById('clients-table-body');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        this.clients.forEach(client => {
            const clientRow = document.createElement('tr');
            clientRow.innerHTML = `
                <td>${client.name}</td>
                <td>${client.phone}</td>
                <td>${client.vehicle?.plate || '-'}</td>
                <td>${client.vehicle?.model || '-'}</td>
                <td><span class="badge badge-success">ATIVO</span></td>
                <td>
                    <button class="btn-icon edit-client" data-id="${client.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete-client" data-id="${client.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tableBody.appendChild(clientRow);
        });
        
        tableBody.addEventListener('click', (e) => {
            if (e.target.closest('.edit-client')) {
                const clientId = e.target.closest('.edit-client').dataset.id;
                this.editClient(clientId);
            } else if (e.target.closest('.delete-client')) {
                const clientId = e.target.closest('.delete-client').dataset.id;
                this.deleteClient(clientId);
            }
        });
    }

    renderSettings() {
        document.getElementById('first-hour-price').value = this.settings.prices.firstHour;
        document.getElementById('additional-hour-price').value = this.settings.prices.additionalHour;
        document.getElementById('daily-price').value = this.settings.prices.daily;
        
        document.getElementById('total-spots').value = this.settings.totalSpots;
        document.getElementById('pcd-spots').value = this.settings.pcdSpots;
        
        this.renderUsersList();
    }

    renderUsersList() {
        const usersList = document.getElementById('users-list');
        if (!usersList) return;
        
        const users = JSON.parse(localStorage.getItem('parkingUsers')) || [
            {
                id: 1,
                username: 'ADMIN',
                password: 'admin123',
                name: 'ADMINISTRADOR',
                role: 'admin',
                email: 'admin@rioparkvallet.com'
            },
            {
                id: 2,
                username: 'OPERADOR',
                password: 'operador123',
                name: 'OPERADOR',
                role: 'operator',
                email: 'operador@rioparkvallet.com'
            }
        ];
        
        usersList.innerHTML = '';
        
        users.forEach(user => {
            const userItem = document.createElement('div');
            userItem.className = 'user-item';
            userItem.innerHTML = `
                <div class="user-avatar-small">
                    <i class="fas fa-user"></i>
                </div>
                <div class="user-details-small">
                    <span class="user-name-small">${user.name}</span>
                    <span class="user-role-small">${user.role === 'admin' ? 'ADMINISTRADOR' : 'OPERADOR'}</span>
                </div>
                <div class="user-actions-small">
                    <button class="btn-icon-small edit-user" data-id="${user.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            `;
            
            usersList.appendChild(userItem);
        });
    }

    // ============================================
    // OPERAÇÕES COM VEÍCULOS
    // ============================================

    showVehicleModal(spotId = null) {
        const modal = document.getElementById('vehicle-modal');
        const form = document.getElementById('vehicle-form');
        
        if (!modal || !form) return;
        
        form.reset();
        modal.classList.remove('hidden');
        this.updateSpotSelect('all');
        
        if (spotId) {
            const spot = this.parkingSpots.find(s => s.id === spotId);
            if (spot && spot.status === 'available') {
                document.getElementById('spot-number').value = spotId;
            }
        }
    }

    hideVehicleModal() {
        document.getElementById('vehicle-modal')?.classList.add('hidden');
    }

    updateSpotSelect(sector = 'all') {
        const spotSelect = document.getElementById('spot-number');
        if (!spotSelect) return;
        
        spotSelect.innerHTML = '';
        
        const availableSpots = this.parkingSpots.filter(spot => 
            spot.status === 'available' && 
            (sector === 'all' || spot.sector === sector)
        );
        
        if (availableSpots.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = sector === 'all' ? 'NENHUMA VAGA DISPONÍVEL' : `NENHUMA VAGA DISPONÍVEL NO SETOR ${sector}`;
            option.disabled = true;
            option.selected = true;
            spotSelect.appendChild(option);
            return;
        }
        
        const spotsBySector = {};
        availableSpots.forEach(spot => {
            if (!spotsBySector[spot.sector]) {
                spotsBySector[spot.sector] = [];
            }
            spotsBySector[spot.sector].push(spot);
        });
        
        Object.keys(spotsBySector).sort().forEach(sectorKey => {
            const group = document.createElement('optgroup');
            group.label = `SETOR ${sectorKey} (${spotsBySector[sectorKey].length} VAGAS)`;
            
            spotsBySector[sectorKey].forEach(spot => {
                const option = document.createElement('option');
                option.value = spot.id;
                option.textContent = `VAGA ${spot.number} ${spot.type === 'pcd' ? '(PCD)' : ''}`;
                group.appendChild(option);
            });
            
            spotSelect.appendChild(group);
        });
    }

    registerVehicle() {
        const plate = document.getElementById('vehicle-plate')?.value.trim().toUpperCase();
        const model = document.getElementById('vehicle-model')?.value.trim().toUpperCase();
        const color = document.getElementById('vehicle-color')?.value.trim().toUpperCase();
        const clientName = document.getElementById('client-name')?.value.trim().toUpperCase();
        const clientPhone = document.getElementById('client-phone')?.value.trim();
        const spotSelect = document.getElementById('spot-number');
        const spotId = spotSelect ? parseInt(spotSelect.value) : null;
        
        if (!plate || !model || !clientName || !clientPhone || !spotId) {
            alert('POR FAVOR, PREENCHA TODOS OS CAMPOS OBRIGATÓRIOS.');
            return;
        }
        
        const spot = this.parkingSpots.find(s => s.id === spotId);
        if (!spot || spot.status !== 'available') {
            alert('ESTA VAGA NÃO ESTÁ DISPONÍVEL.');
            return;
        }
        
        const newClient = {
            id: Date.now(),
            name: clientName,
            phone: clientPhone,
            vehicle: {
                plate: plate,
                model: model,
                color: color
            },
            createdAt: new Date().toISOString()
        };
        
        spot.status = 'occupied';
        spot.vehicle = {
            plate: plate,
            model: model,
            color: color
        };
        spot.client = {
            id: newClient.id,
            name: clientName
        };
        spot.entryTime = new Date().toISOString();
        
        this.clients.push(newClient);
        
        this.activities.push({
            id: Date.now(),
            type: 'entry',
            title: 'VEÍCULO ENTROU',
            description: `${model} - ${plate}`,
            time: new Date().toISOString(),
            spot: spot.number
        });
        
        this.saveData();
        this.hideVehicleModal();
        
        if (this.currentPage === 'estacionamento') {
            this.renderParking();
        }
        
        this.renderDashboard();
        this.showNotification('VEÍCULO REGISTRADO COM SUCESSO!', 'success');
    }

    releaseSpot(spotId) {
        const spot = this.parkingSpots.find(s => s.id === spotId);
        if (!spot || spot.status !== 'occupied') return;
        
        const entryTime = new Date(spot.entryTime);
        const hours = (new Date() - entryTime) / (1000 * 60 * 60);
        let price = 0;
        
        if (hours <= 1) {
            price = this.settings.prices.firstHour;
        } else if (hours > 24) {
            price = this.settings.prices.daily;
        } else {
            price = this.settings.prices.firstHour + (Math.ceil(hours) - 1) * this.settings.prices.additionalHour;
            price = Math.min(price, this.settings.prices.daily);
        }
        
        if (confirm(`LIBERAR VAGA ${spot.number}?\nTEMPO: ${this.getElapsedTime(spot.entryTime)}\nVALOR: R$ ${price.toFixed(2)}`)) {
            this.activities.push({
                id: Date.now(),
                type: 'exit',
                title: 'VEÍCULO SAIU',
                description: `${spot.vehicle.model} - ${spot.vehicle.plate}`,
                time: new Date().toISOString(),
                spot: spot.number
            });
            
            this.activities.push({
                id: Date.now() + 1,
                type: 'payment',
                title: 'PAGAMENTO REALIZADO',
                description: `VAGA ${spot.number} - R$ ${price.toFixed(2)}`,
                time: new Date().toISOString(),
                spot: spot.number
            });
            
            spot.status = 'available';
            spot.vehicle = null;
            spot.client = null;
            spot.entryTime = null;
            
            this.saveData();
            
            if (this.currentPage === 'estacionamento') {
                this.renderParking();
            }
            
            this.renderDashboard();
            this.showNotification(`VAGA ${spot.number} LIBERADA COM SUCESSO!\nVALOR COBRADO: R$ ${price.toFixed(2)}`, 'success');
            
            // Atualiza modal de veículos ocupados se estiver aberto
            if (!document.getElementById('occupied-spots-modal')?.classList.contains('hidden')) {
                this.updateOccupiedSpotsModal();
            }
        }
    }

    // ============================================
    // CONFIGURAÇÕES
    // ============================================

    savePriceSettings() {
        const firstHourPrice = document.getElementById('first-hour-price');
        const additionalHourPrice = document.getElementById('additional-hour-price');
        const dailyPrice = document.getElementById('daily-price');
        
        if (firstHourPrice && additionalHourPrice && dailyPrice) {
            this.settings.prices.firstHour = parseFloat(firstHourPrice.value);
            this.settings.prices.additionalHour = parseFloat(additionalHourPrice.value);
            this.settings.prices.daily = parseFloat(dailyPrice.value);
            
            this.saveSettings();
            this.showNotification('PREÇOS ATUALIZADOS COM SUCESSO!', 'success');
        }
    }

    saveSpotSettings() {
        const totalSpots = document.getElementById('total-spots');
        const pcdSpots = document.getElementById('pcd-spots');
        
        if (!totalSpots || !pcdSpots) return;
        
        const total = parseInt(totalSpots.value);
        const pcd = parseInt(pcdSpots.value);
        
        if (total !== 200) {
            this.showNotification('O SISTEMA DEVE TER EXATAMENTE 200 VAGAS.', 'error');
            totalSpots.value = 200;
            return;
        }
        
        if (pcd > 20) {
            this.showNotification('O NÚMERO DE VAGAS PCD NÃO PODE SER MAIOR QUE 20 (10% DO TOTAL).', 'error');
            pcdSpots.value = 16;
            return;
        }
        
        this.settings.totalSpots = total;
        this.settings.pcdSpots = pcd;
        this.parkingSpots = this.generateParkingSpots();
        
        this.saveSettings();
        this.saveData();
        
        if (this.currentPage === 'estacionamento') {
            this.renderParking();
        }
        
        this.showNotification('CONFIGURAÇÕES DE VAGAS ATUALIZADAS COM SUCESSO!', 'success');
    }

    createBackup() {
        const backup = {
            spots: this.parkingSpots,
            clients: this.clients,
            activities: this.activities,
            settings: this.settings,
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-rio-park-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('BACKUP CRIADO COM SUCESSO!', 'success');
    }

    clearData() {
        if (confirm('ATENÇÃO: ESTA AÇÃO IRÁ APAGAR TODOS OS DADOS DO SISTEMA. TEM CERTEZA?')) {
            localStorage.clear();
            this.showNotification('TODOS OS DADOS FORAM APAGADOS. A PÁGINA SERÁ RECARREGADA.', 'warning');
            setTimeout(() => {
                location.reload();
            }, 2000);
        }
    }

    // ============================================
    // GERENCIAMENTO DE USUÁRIOS
    // ============================================

    showSwitchUserModal() {
        const modal = document.getElementById('switch-user-modal');
        const userList = document.getElementById('user-list');
        
        if (!modal || !userList) return;
        
        this.loadUserList(userList);
        modal.classList.remove('hidden');
        
        setTimeout(() => {
            document.getElementById('quick-username')?.focus();
        }, 100);
    }

    hideSwitchUserModal() {
        document.getElementById('switch-user-modal')?.classList.add('hidden');
        
        document.getElementById('quick-username').value = '';
        document.getElementById('quick-password').value = '';
    }

    loadUserList(userListElement) {
        if (!userListElement) return;
        
        const users = JSON.parse(localStorage.getItem('parkingUsers')) || [
            {
                id: 1,
                username: 'ADMIN',
                password: 'admin123',
                name: 'ADMINISTRADOR',
                role: 'admin',
                email: 'admin@rioparkvallet.com'
            },
            {
                id: 2,
                username: 'OPERADOR',
                password: 'operador123',
                name: 'OPERADOR',
                role: 'operator',
                email: 'operador@rioparkvallet.com'
            }
        ];
        
        const currentUser = this.currentUser;
        userListElement.innerHTML = '';
        
        users.forEach(user => {
            const isCurrent = user.username === currentUser.username;
            
            const userItem = document.createElement('div');
            userItem.className = `user-item ${isCurrent ? 'active' : ''}`;
            userItem.dataset.username = user.username;
            userItem.innerHTML = `
                <div class="user-item-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="user-item-info">
                    <span class="user-item-name">${user.name}</span>
                    <span class="user-item-role">${user.role === 'admin' ? 'ADMINISTRADOR' : 'OPERADOR'}</span>
                </div>
                <div class="user-item-status ${isCurrent ? 'current' : 'available'}">
                    ${isCurrent ? 'ATUAL' : 'DISPONÍVEL'}
                </div>
            `;
            
            if (!isCurrent) {
                userItem.style.cursor = 'pointer';
                userItem.addEventListener('click', () => {
                    this.quickLoginWithUser(user.username, user.password);
                });
                
                userItem.setAttribute('title', `TROCAR PARA ${user.name}`);
            }
            
            userListElement.appendChild(userItem);
        });
    }

    handleQuickLogin() {
        const usernameInput = document.getElementById('quick-username');
        const passwordInput = document.getElementById('quick-password');
        
        if (!usernameInput || !passwordInput) return;
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        if (!username || !password) {
            this.showNotification('POR FAVOR, PREENCHA USUÁRIO E SENHA.', 'warning');
            return;
        }
        
        const users = JSON.parse(localStorage.getItem('parkingUsers')) || [];
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            this.switchToUser(user);
        } else {
            this.showNotification('USUÁRIO OU SENHA INCORRETOS.', 'error');
        }
    }

    quickLoginWithUser(username, password) {
        const users = JSON.parse(localStorage.getItem('parkingUsers')) || [];
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            this.switchToUser(user);
        } else {
            this.showNotification('ERRO AO TROCAR DE USUÁRIO.', 'error');
        }
    }

    switchToUser(newUser) {
        if (!newUser) return;
        
        if (!confirm(`DESEJA TROCAR PARA O USUÁRIO ${newUser.name} (${newUser.role === 'admin' ? 'ADMINISTRADOR' : 'OPERADOR'})?`)) {
            return;
        }
        
        const previousUser = this.currentUser;
        
        this.currentUser = {
            id: newUser.id,
            username: newUser.username,
            name: newUser.name,
            role: newUser.role,
            email: newUser.email
        };
        
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        
        document.getElementById('user-name').textContent = newUser.name;
        document.querySelector('.user-role').textContent = newUser.role === 'admin' ? 'ADMINISTRADOR' : 'OPERADOR';
        
        this.hideSwitchUserModal();
        this.showNotification(`USUÁRIO ALTERADO PARA: ${newUser.name}`, 'success');
        
        this.activities.push({
            id: Date.now(),
            type: 'system',
            title: 'TROCA DE USUÁRIO',
            description: `DE ${previousUser.name || 'N/A'} PARA ${newUser.name}`,
            time: new Date().toISOString(),
            user: newUser.username
        });
        
        this.saveData();
        this.updateUserPermissions();
    }

    updateUserPermissions() {
        const isAdmin = this.currentUser.role === 'admin';
        
        document.querySelectorAll('.admin-only').forEach(element => {
            element.style.display = isAdmin ? '' : 'none';
        });
        
        document.querySelectorAll('.admin-only-input').forEach(input => {
            input.disabled = !isAdmin;
            input.title = !isAdmin ? 'APENAS ADMINISTRADORES PODEM MODIFICAR' : '';
        });
    }

    addNewUser() {
        const name = prompt('NOME DO NOVO USUÁRIO:');
        if (!name) return;
        
        const username = prompt('NOME DE USUÁRIO:');
        if (!username) return;
        
        const password = prompt('SENHA:');
        if (!password) return;
        
        const role = prompt('TIPO (ADMIN/OPERADOR):', 'OPERADOR').toLowerCase();
        if (!['admin', 'operador'].includes(role)) {
            alert('TIPO INVÁLIDO. USE "ADMIN" OU "OPERADOR".');
            return;
        }
        
        const users = JSON.parse(localStorage.getItem('parkingUsers')) || [];
        
        if (users.some(u => u.username === username)) {
            alert('NOME DE USUÁRIO JÁ EXISTE!');
            return;
        }
        
        const newUser = {
            id: Date.now(),
            username: username.toUpperCase(),
            password: password,
            name: name.toUpperCase(),
            role: role,
            email: `${username.toUpperCase()}@RIOPARKVALLET.COM`
        };
        
        users.push(newUser);
        localStorage.setItem('parkingUsers', JSON.stringify(users));
        
        this.showNotification(`USUÁRIO ${name.toUpperCase()} ADICIONADO COM SUCESSO!`, 'success');
        this.renderUsersList();
    }

    // ============================================
    // GERENCIAMENTO DE CLIENTES
    // ============================================

    editClient(clientId) {
        const client = this.clients.find(c => c.id == clientId);
        if (!client) return;
        
        const newName = prompt('NOVO NOME:', client.name);
        if (!newName) return;
        
        const newPhone = prompt('NOVO TELEFONE:', client.phone);
        if (!newPhone) return;
        
        client.name = newName.toUpperCase();
        client.phone = newPhone;
        
        this.saveData();
        this.renderClients();
        this.showNotification('CLIENTE ATUALIZADO COM SUCESSO!', 'success');
    }

    deleteClient(clientId) {
        if (!confirm('TEM CERTEZA QUE DESEJA EXCLUIR ESTE CLIENTE?')) {
            return;
        }
        
        this.clients = this.clients.filter(c => c.id != clientId);
        this.saveData();
        this.renderClients();
        this.showNotification('CLIENTE EXCLUÍDO COM SUCESSO!', 'success');
    }

    showClientModal() {
        const name = prompt('NOME DO CLIENTE:');
        if (!name) return;
        
        const phone = prompt('TELEFONE:');
        if (!phone) return;
        
        const newClient = {
            id: Date.now(),
            name: name.toUpperCase(),
            phone: phone,
            createdAt: new Date().toISOString()
        };
        
        this.clients.push(newClient);
        this.saveData();
        this.renderClients();
        this.showNotification('CLIENTE ADICIONADO COM SUCESSO!', 'success');
    }

    // ============================================
    // MÉTODOS AUXILIARES
    // ============================================

    getStatusText(status) {
        const statusMap = {
            'available': 'DISPONÍVEL',
            'occupied': 'OCUPADA',
            'reserved': 'RESERVADA'
        };
        return statusMap[status] || status.toUpperCase();
    }

    getElapsedTime(entryTime) {
        if (!entryTime) return '0h 0m';
        
        const entry = new Date(entryTime);
        const now = new Date();
        const diffMs = now - entry;
        
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
    }

    showNotification(message, type = 'info', timeout = 3000) {
        this.removeExistingElement('.user-switch-notification');
        
        const notification = document.createElement('div');
        notification.className = `user-switch-notification notification-${type}`;
        
        if (typeof message === 'string') {
            notification.innerHTML = `
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            `;
        } else {
            notification.innerHTML = message;
        }
        
        this.applyElementStyles(notification, {
            background: this.getNotificationColor(type),
            color: 'white',
            top: '20px'
        });
        
        document.body.appendChild(notification);
        this.autoCloseElement(notification, timeout);
    }

    getNotificationIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    getNotificationColor(type) {
        const colors = {
            'success': '#2ecc71',
            'error': '#e74c3c',
            'warning': '#f39c12',
            'info': '#3498db'
        };
        return colors[type] || '#3498db';
    }

    applyElementStyles(element, styles) {
        element.style.cssText = `
            position: fixed;
            top: ${styles.top || '20px'};
            right: 20px;
            background: ${styles.background || '#3498db'};
            color: ${styles.color || 'white'};
            padding: ${styles.padding || '12px 20px'};
            border-radius: ${styles.borderRadius || '8px'};
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            font-family: 'Poppins', sans-serif;
            font-size: 0.9rem;
            max-width: ${styles.maxWidth || '500px'};
        `;
    }

    applyButtonStyle(button) {
        button.style.cssText = `
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 5px 10px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.8rem;
            transition: all 0.3s;
        `;
        
        button.onmouseover = () => {
            button.style.background = 'rgba(255,255,255,0.3)';
        };
        
        button.onmouseout = () => {
            button.style.background = 'rgba(255,255,255,0.2)';
        };
    }

    removeExistingElement(selector) {
        const element = document.querySelector(selector);
        if (element) element.remove();
    }

    autoCloseElement(element, timeout = 3000) {
        setTimeout(() => {
            if (element.parentNode) {
                element.style.animation = 'slideOutRight 0.3s ease forwards';
                setTimeout(() => {
                    if (element.parentNode) {
                        element.parentNode.removeChild(element);
                    }
                }, 300);
            }
        }, timeout);
    }

    addGlobalStyles() {
        if (!document.getElementById('parking-system-styles')) {
            const style = document.createElement('style');
            style.id = 'parking-system-styles';
            style.textContent = `
                /* Animações */
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
                
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
                
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(52, 152, 219, 0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(52, 152, 219, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(52, 152, 219, 0); }
                }
                
                /* Estilos de busca */
                .search-container {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-right: 20px;
                }
                
                .search-input-group {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                
                .search-icon {
                    position: absolute;
                    left: 12px;
                    color: #6c757d;
                }
                
                .search-input {
                    padding: 10px 40px 10px 40px;
                    border: 2px solid #dee2e6;
                    border-radius: 25px;
                    width: 300px;
                    font-family: 'Poppins', sans-serif;
                    font-size: 0.9rem;
                    transition: all 0.3s;
                }
                
                .search-input:focus {
                    outline: none;
                    border-color: #667eea;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                    width: 350px;
                }
                
                .clear-search-btn {
                    position: absolute;
                    right: 10px;
                    background: none;
                    border: none;
                    color: #6c757d;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    transition: all 0.3s;
                }
                
                .clear-search-btn:hover {
                    background: #f8f9fa;
                    color: #495057;
                }
                
                .btn-search {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-family: 'Poppins', sans-serif;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.3s;
                }
                
                .btn-search:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
                }
                
                /* Vagas destacadas */
                .parking-spot.highlighted {
                    border: 3px solid #3498db;
                    box-shadow: 0 0 15px rgba(52, 152, 219, 0.5);
                }
                
                .search-active-info {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 12px;
                    margin-bottom: 25px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    font-size: 1.1rem;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }

                .search-active-info i {
                font-size: 1.3rem;
            }
                
                .btn-clear-search {
                    background: rgba(255,255,255,0.2);
                    border: 1px solid rgba(255,255,255,0.3);
                    color: white;
                    padding: 10px 20px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    font-weight: 500;
                    margin-left: auto;
                    transition: all 0.3s;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .btn-clear-search:hover {
                    background: rgba(255,255,255,0.3);
                    transform: translateY(-2px);
                }
                
                /* Cursor pointer para stats */
                .stat-number {
                    transition: all 0.3s;
                    cursor: pointer;
                }
                
                .stat-number:hover {
                    transform: scale(1.05);
                    color: #3498db;
                }
                
                /* Estilos para o modal de veículos ocupados */
                .occupied-modal {
                    max-width: 1200px;
                    max-height: 85vh;
                    width: 95%;
                }
                
                .occupied-summary {
                    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
                    color: white;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 15px;
                }
                
                .summary-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 0.95rem;
                }
                
                .summary-item i {
                    font-size: 1.2rem;
                    color: #3498db;
                }
                
                .filter-controls {
                    display: flex;
                    gap: 10px;
                    margin-top: 10px;
                    flex-wrap: wrap;
                }
                
                .filter-select {
                    padding: 8px 15px;
                    border: 2px solid #dee2e6;
                    border-radius: 5px;
                    font-family: 'Poppins', sans-serif;
                    font-size: 0.9rem;
                    background: white;
                    min-width: 200px;
                }
                
                .filter-select:focus {
                    outline: none;
                    border-color: #3498db;
                }
                
                .vehicles-list-container {
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    overflow: hidden;
                    margin-bottom: 20px;
                    max-height: 400px;
                    overflow-y: auto;
                }
                
                .vehicles-list-header {
                    display: grid;
                    grid-template-columns: 80px 100px 120px 200px 150px 100px 120px 100px;
                    background: #f8f9fa;
                    font-weight: 600;
                    color: #495057;
                    border-bottom: 2px solid #dee2e6;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }
                
                .header-cell {
                    padding: 12px 10px;
                    border-right: 1px solid #dee2e6;
                    font-size: 0.9rem;
                }
                
                .header-cell:last-child {
                    border-right: none;
                }
                
                .vehicle-row {
                    display: grid;
                    grid-template-columns: 80px 100px 120px 200px 150px 100px 120px 100px;
                    border-bottom: 1px solid #dee2e6;
                    transition: all 0.2s;
                }
                
                .vehicle-row:hover {
                    background: #f8f9fa;
                }
                
                .vehicle-cell {
                    padding: 10px;
                    border-right: 1px solid #dee2e6;
                    display: flex;
                    align-items: center;
                    font-size: 0.9rem;
                }
                
                .vehicle-cell:last-child {
                    border-right: none;
                }
                
                .spot-number-cell {
                    font-weight: 600;
                    color: #2c3e50;
                    justify-content: center;
                }
                
                .sector-cell {
                    font-weight: 600;
                }
                
                .sector-a { color: #e74c3c !important; }
                .sector-b { color: #3498db !important; }
                .sector-c { color: #2ecc71 !important; }
                .sector-d { color: #f39c12 !important; }
                
                .plate-cell {
                    font-weight: 600;
                    font-family: monospace;
                    font-size: 1.1rem;
                    color: #2c3e50;
                    justify-content: center;
                }
                
                .vehicle-cell .btn-icon-small {
                    padding: 5px 10px;
                    font-size: 0.8rem;
                }
                
                .export-section {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    margin-top: 20px;
                }
                
                .pcd-badge-small {
                    background: #e74c3c;
                    color: white;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 0.7rem;
                    margin-left: 5px;
                }
                
                .time-warning {
                    color: #e74c3c;
                    font-weight: 600;
                }
                
                /* Relatório de faturamento */
                .revenue-report {
                    background: white;
                    padding: 15px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    max-width: 400px;
                }
                
                .revenue-total {
                    font-size: 1.2rem;
                    font-weight: 600;
                    color: #2ecc71;
                    margin: 10px 0;
                    display: flex;
                    justify-content: space-between;
                }
                
                .revenue-by-sector {
                    margin: 15px 0;
                }
                
                .revenue-by-sector h4 {
                    color: #34495e;
                    margin-bottom: 10px;
                }
                
                .sector-revenue {
                    display: flex;
                    justify-content: space-between;
                    margin: 5px 0;
                    padding: 5px 0;
                    border-bottom: 1px solid #ecf0f1;
                }
                
                .revenue-details {
                    font-size: 0.8rem;
                    color: #7f8c8d;
                    margin-top: 10px;
                }

                /* ESTILOS MELHORADOS PARA VAGAS */
            .parking-spot {
                background: white;
                border: 2px solid #e9ecef;
                border-radius: 12px;
                padding: 15px;
                min-height: 180px;
                display: flex;
                flex-direction: column;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            
            .parking-spot:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                border-color: #3498db;
            }
            
            .spot-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 2px solid #f8f9fa;
            }
            
            .spot-number {
                font-size: 1.8rem;
                font-weight: 700;
                color: #2c3e50;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                min-width: 60px;
            }
            
            .spot-sector {
                font-size: 1rem;
                font-weight: 600;
                color: #495057;
                background: #f8f9fa;
                padding: 4px 12px;
                border-radius: 20px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .spot-status {
                font-size: 1.1rem;
                font-weight: 600;
                padding: 6px 12px;
                border-radius: 6px;
                margin-bottom: 12px;
                text-align: center;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .available .spot-status {
                background: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }
            
            .occupied .spot-status {
                background: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }
            
            .spot-pcd {
                background: #e74c3c;
                color: white;
                font-size: 0.8rem;
                font-weight: 600;
                padding: 3px 8px;
                border-radius: 4px;
                display: inline-block;
                margin: 0 auto 12px auto;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                max-width: fit-content;
            }
            
            .vehicle-info {
                background: #f8f9fa;
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 15px;
                flex-grow: 1;
                overflow: hidden;
            }
            
            .vehicle-info p {
                margin: 4px 0;
                font-size: 0.9rem;
                line-height: 1.4;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .vehicle-info p strong {
                color: #2c3e50;
                font-weight: 600;
            }
            
            .vehicle-info.empty {
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                text-align: center;
                min-height: 80px;
            }

            .vehicle-info.empty p {
                font-size: 1rem;
                color: #6c757d;
                margin: 5px 0;
            }

            .vehicle-info.empty .empty-message {
                font-size: 0.85rem;
                color: #adb5bd;
                font-style: italic;
            }

            .vehicle-info.empty i {
                font-size: 1.5rem;
                color: #3498db;
                margin-bottom: 8px;
            }

            .vehicle-plate {
                font-size: 1.1rem !important;
                font-weight: 700 !important;
                color: #2c3e50 !important;
                margin-bottom: 8px !important;
            }

            .vehicle-model {
                color: #495057 !important;
                font-weight: 500 !important;
            }

            .vehicle-color {
                color: #6c757d !important;
                font-size: 0.85rem !important;
            }

            .client-name {
                color: #e74c3c !important;
                font-weight: 500 !important;
                margin-top: 8px !important;
            }

            .client-name i {
                margin-right: 5px;
                font-size: 0.9rem;
            }

            .parking-time {
                color: #3498db !important;
                font-weight: 500 !important;
                margin-top: 5px !important;
            }

            .parking-time i {
                margin-right: 5px;
                font-size: 0.9rem;
            }
            .parking-spot button {
                padding: 10px 15px;
                font-size: 0.9rem;
                font-weight: 600;
                border-radius: 8px;
                border: none;
                cursor: pointer;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                width: 100%;
            }
            
            .parking-spot .btn-primary {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            
            .parking-spot .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
            }
            
            .parking-spot .btn-secondary {
                background: #6c757d;
                color: white;
            }
            
            .parking-spot .btn-secondary:hover {
                background: #5a6268;
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(108, 117, 125, 0.3);
            }
            
             /* GRID RESPONSIVO PARA VAGAS */
            .sector-container {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
                 
            /* VAGAS DESTACADAS NA BUSCA */
            .parking-spot.highlighted {
                border: 3px solid #3498db;
                box-shadow: 0 0 20px rgba(52, 152, 219, 0.3);
                animation: highlightPulse 2s infinite;
            }
            
            @keyframes highlightPulse {
                0% {
                    box-shadow: 0 0 0 0 rgba(52, 152, 219, 0.4);
                }
                70% {
                    box-shadow: 0 0 0 15px rgba(52, 152, 219, 0);
                }
                100% {
                    box-shadow: 0 0 0 0 rgba(52, 152, 219, 0);
                }
            }

            /* CABEÇALHO DOS SETORES */
            .sector-header {
                background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
                color: white;
                padding: 20px;
                border-radius: 12px;
                margin: 30px 0 20px 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            
            .sector-header h3 {
                font-size: 1.5rem;
                font-weight: 600;
                margin: 0;
                color: white;
            }
            
            .sector-stats {
                display: flex;
                gap: 20px;
            }
            
            .sector-stat {
                background: rgba(255,255,255,0.1);
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 0.9rem;
                font-weight: 500;
            }
            
            /* FILTRO DE SETOR */
            .sector-filter {
                display: flex;
                gap: 10px;
                margin-bottom: 25px;
                flex-wrap: wrap;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 10px;
            }
            
            .sector-filter-btn {
                padding: 10px 20px;
                border: 2px solid #dee2e6;
                background: white;
                border-radius: 25px;
                cursor: pointer;
                font-family: 'Poppins', sans-serif;
                font-weight: 500;
                transition: all 0.3s;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                min-width: 100px;
            }
            
            .sector-filter-btn:hover {
                border-color: #3498db;
                color: #3498db;
                transform: translateY(-2px);
            }
            
            .sector-filter-btn.active {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-color: transparent;
            }
            
             /* CORES DIFERENCIADAS POR SETOR NO SPOT-SECTOR */
            .sector-a .spot-sector { 
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
                color: white;
            }

            .sector-b .spot-sector { 
                background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
                color: white;
            }
            
            .sector-c .spot-sector { 
                background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
                color: white;
            }
            
            .sector-d .spot-sector { 
                background: linear-gradient(135deg, #f39c12 0%, #d35400 100%);
                color: white;
            }

             /* RESPONSIVIDADE */
            @media (max-width: 1200px) {
                .sector-container {
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 15px;
                }
                
                .parking-spot {
                    min-height: 170px;
                    padding: 12px;
                }
                
                .spot-number {
                    font-size: 1.6rem;
                }
                
                .spot-sector {
                    font-size: 0.9rem;
                    padding: 3px 10px;
                }
            }
            
            @media (max-width: 768px) {
                .sector-container {
                    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                    gap: 12px;
                }
                
                .sector-header {
                    flex-direction: column;
                    gap: 15px;
                    text-align: center;
                    padding: 15px;
                }
                
                .sector-stats {
                    width: 100%;
                    justify-content: center;
                }
                
                .search-active-info {
                    flex-direction: column;
                    text-align: center;
                    gap: 10px;
                }
                
                .btn-clear-search {
                    margin-left: 0;
                    width: 100%;
                    justify-content: center;
                }
                
                .parking-spot {
                    min-height: 160px;
                }
                
                .vehicle-info p {
                    font-size: 0.85rem;
                }
                
                .parking-spot button {
                    padding: 8px 12px;
                    font-size: 0.85rem;
                }
            }
            
            @media (max-width: 480px) {
                .sector-container {
                    grid-template-columns: 1fr;
                }
                
                .sector-filter {
                    justify-content: center;
                }
                
                .sector-filter-btn {
                    min-width: 80px;
                    padding: 8px 15px;
                    font-size: 0.85rem;
                }
                
                .spot-header {
                    flex-direction: column;
                    gap: 8px;
                    align-items: flex-start;
                }
                
                .spot-sector {
                    align-self: flex-start;
                }
            }

            /* ESTILO PARA VAGAS COM MUITO CONTEÚDO */
            .vehicle-info {
                max-height: 100px;
                overflow-y: auto;
                scrollbar-width: thin;
                scrollbar-color: #dee2e6 #f8f9fa;
            }
            
            .vehicle-info::-webkit-scrollbar {
                width: 4px;
            }
            
            .vehicle-info::-webkit-scrollbar-track {
                background: #f8f9fa;
                border-radius: 4px;
            }
            
            .vehicle-info::-webkit-scrollbar-thumb {
                background: #dee2e6;
                border-radius: 4px;
            }
            
            .vehicle-info::-webkit-scrollbar-thumb:hover {
                background: #adb5bd;
            }
            
            /* ANIMAÇÃO DE ENTRADA */
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .parking-spot {
                animation: fadeInUp 0.5s ease forwards;
                opacity: 0;
            }
            
            .parking-spot:nth-child(1) { animation-delay: 0.1s; }
            .parking-spot:nth-child(2) { animation-delay: 0.2s; }
            .parking-spot:nth-child(3) { animation-delay: 0.3s; }
            .parking-spot:nth-child(4) { animation-delay: 0.4s; }
            .parking-spot:nth-child(5) { animation-delay: 0.5s; }
            .parking-spot:nth-child(6) { animation-delay: 0.6s; }
            .parking-spot:nth-child(7) { animation-delay: 0.7s; }
            .parking-spot:nth-child(8) { animation-delay: 0.8s; }
            .parking-spot:nth-child(9) { animation-delay: 0.9s; }
            .parking-spot:nth-child(10) { animation-delay: 1.0s; }
            
            /* INDICADOR DE VAGA PCD */
            .parking-spot.pcd {
                border-left: 4px solid #e74c3c;
            }
            
            .parking-spot.pcd .spot-number {
                position: relative;
            }
            
            .parking-spot.pcd .spot-number::after {
                content: "♿";
                position: absolute;
                right: -25px;
                top: 50%;
                transform: translateY(-50%);
                font-size: 1.2rem;
                color: #e74c3c;
            }

            `;
            document.head.appendChild(style);
        }
    }
}

// Inicializa o sistema quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.parkingSystem = new ParkingSystem();
});
