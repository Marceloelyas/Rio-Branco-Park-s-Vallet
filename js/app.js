class ParkingSystem {
    constructor() {
        this.parkingSpots = [];
        this.clients = [];
        this.activities = [];
        this.settings = this.loadSettings();
        this.currentPage = 'dashboard';
        this.currentUser = this.loadCurrentUser();
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateDateTime();
        this.renderDashboard();
        setInterval(() => this.updateDateTime(), 1000);
        this.updateUserPermissions();
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
        // Atualiza estatísticas
        const occupiedSpots = this.parkingSpots.filter(spot => spot.status === 'occupied').length;
        const availableSpots = this.parkingSpots.filter(spot => spot.status === 'available').length;
        
        const occupiedSpotsElement = document.getElementById('occupied-spots');
        const availableSpotsElement = document.getElementById('available-spots');
        
        if (occupiedSpotsElement) occupiedSpotsElement.textContent = occupiedSpots;
        if (availableSpotsElement) availableSpotsElement.textContent = availableSpots;
        
        // Calcula faturamento estimado
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
        }
        
        // Calcula tempo médio
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
        
        // Renderiza atividades
        this.renderActivities();
        
        // Inicializa gráficos se a função existir
        if (typeof window.initCharts === 'function') {
            window.initCharts(this.parkingSpots, this.activities);
        }
    }

    renderActivities() {
        const activitiesList = document.getElementById('activities-list');
        if (!activitiesList) return;
        
        activitiesList.innerHTML = '';
        
        // Ordena atividades por data (mais recentes primeiro)
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
        
        // Cabeçalhos dos setores
        const sectors = ['FRENTE', 'EDU', 'BAIXO', 'AUTO'];
        const sectorTitles = {
            'FRENTE': 'Setor FRENTE (Vagas 1-30)',
            'EDU': 'Setor EDU (Vagas 31-60)',
            'BAIXO': 'Setor BAIXO (Vagas 61-130)',
            'AUTO': 'Setor AUTO (Vagas 131-200)'
        };
        
        // Renderiza cada setor separadamente
        sectors.forEach(sector => {
            // Cabeçalho do setor
            const sectorHeader = document.createElement('div');
            sectorHeader.className = 'sector-header';
            sectorHeader.innerHTML = `
                <h3>${sectorTitles[sector]}</h3>
                <div class="sector-stats">
                    <span class="sector-stat">Total: ${sector === 'A' || sector === 'B' ? 30 : 70}</span>
                    <span class="sector-stat">PCD: ${sector === 'A' || sector === 'B' ? 3 : 5}</span>
                </div>
            `;
            parkingGrid.appendChild(sectorHeader);
            
            // Vagas do setor
            const sectorSpots = this.parkingSpots.filter(spot => spot.sector === sector);
            
            // Container para as vagas do setor
            const sectorContainer = document.createElement('div');
            sectorContainer.className = 'sector-container';
            sectorContainer.setAttribute('data-sector', sector);
            
            sectorSpots.forEach(spot => {
                const spotElement = document.createElement('div');
                spotElement.className = `parking-spot ${spot.status} ${spot.type} sector-${sector.toLowerCase()}`;
                spotElement.innerHTML = `
                    <div class="spot-header">
                        <div class="spot-number">${spot.number}</div>
                        <div class="spot-sector">${spot.sector}</div>
                    </div>
                    <div class="spot-status">${this.getStatusText(spot.status)}</div>
                    ${spot.type === 'pcd' ? '<div class="spot-pcd">PCD</div>' : ''}
                    ${spot.vehicle ? `
                        <div class="vehicle-info">
                            <p><strong>${spot.vehicle.plate}</strong></p>
                            <p>${spot.vehicle.model}</p>
                            ${spot.client ? `<p>${spot.client.name}</p>` : ''}
                            ${spot.entryTime ? `<p>${this.getElapsedTime(spot.entryTime)}</p>` : ''}
                        </div>
                    ` : ''}
                    ${spot.status === 'occupied' ? `
                        <button class="btn-secondary release-btn" data-spot="${spot.id}">
                            <i class="fas fa-sign-out-alt"></i> Liberar
                        </button>
                    ` : `
                        <button class="btn-primary occupy-btn" data-spot="${spot.id}">
                            <i class="fas fa-car"></i> Ocupar
                        </button>
                    `}
                `;
                
                sectorContainer.appendChild(spotElement);
            });
            
            parkingGrid.appendChild(sectorContainer);
        });
    
        // Adiciona eventos aos botões (usando event delegation)
        parkingGrid.addEventListener('click', (e) => {
            if (e.target.closest('.release-btn')) {
                const spotId = parseInt(e.target.closest('.release-btn').dataset.spot);
                this.releaseSpot(spotId);
            } else if (e.target.closest('.occupy-btn')) {
                const spotId = parseInt(e.target.closest('.occupy-btn').dataset.spot);
                this.showVehicleModal(spotId);
            }
        });
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
                <td><span class="badge badge-success">Ativo</span></td>
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
        
        // Adiciona eventos aos botões usando event delegation
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
        // Preenche formulário de preços
        const firstHourPrice = document.getElementById('first-hour-price');
        const additionalHourPrice = document.getElementById('additional-hour-price');
        const dailyPrice = document.getElementById('daily-price');
        
        if (firstHourPrice) firstHourPrice.value = this.settings.prices.firstHour;
        if (additionalHourPrice) additionalHourPrice.value = this.settings.prices.additionalHour;
        if (dailyPrice) dailyPrice.value = this.settings.prices.daily;
        
        // Preenche formulário de vagas
        const totalSpots = document.getElementById('total-spots');
        const pcdSpots = document.getElementById('pcd-spots');
        
        if (totalSpots) totalSpots.value = this.settings.totalSpots;
        if (pcdSpots) pcdSpots.value = this.settings.pcdSpots;
        
        // Renderiza lista de usuários
        this.renderUsersList();
    }

    renderUsersList() {
        const usersList = document.getElementById('users-list');
        if (!usersList) return;
        
        const users = JSON.parse(localStorage.getItem('parkingUsers')) || [
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
                    <span class="user-role-small">${user.role === 'admin' ? 'Administrador' : 'Operador'}</span>
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

    getStatusText(status) {
        const statusMap = {
            'available': 'Disponível',
            'occupied': 'Ocupada',
            'reserved': 'Reservada'
        };
        return statusMap[status] || status;
    }

    getElapsedTime(entryTime) {
        const entry = new Date(entryTime);
        const now = new Date();
        const diffMs = now - entry;
        
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
    }

    showVehicleModal(spotId = null) {
        const modal = document.getElementById('vehicle-modal');
        const form = document.getElementById('vehicle-form');
        
        if (!modal || !form) {
            console.error('Modal ou formulário não encontrado');
            return;
        }
        
        // Limpa formulário
        form.reset();
        
        modal.classList.remove('hidden');
        
        // Atualiza filtro de setor
        this.updateSpotSelect('all');
        
        // Seleciona vaga específica se fornecida
        if (spotId) {
            const spot = this.parkingSpots.find(s => s.id === spotId);
            if (spot && spot.status === 'available') {
                const spotSelect = document.getElementById('spot-number');
                if (spotSelect) {
                    spotSelect.value = spotId;
                }
            }
        }
    }

    hideVehicleModal() {
        const modal = document.getElementById('vehicle-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    updateSpotSelect(sector = 'all') {
        const spotSelect = document.getElementById('spot-number');
        if (!spotSelect) return;
        
        spotSelect.innerHTML = '';
        
        // Filtra vagas disponíveis
        const availableSpots = this.parkingSpots.filter(spot => 
            spot.status === 'available' && 
            (sector === 'all' || spot.sector === sector)
        );
        
        if (availableSpots.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = sector === 'all' ? 'Nenhuma vaga disponível' : `Nenhuma vaga disponível no setor ${sector}`;
            option.disabled = true;
            option.selected = true;
            spotSelect.appendChild(option);
            return;
        }
        
        // Agrupa por setor
        const spotsBySector = {};
        availableSpots.forEach(spot => {
            if (!spotsBySector[spot.sector]) {
                spotsBySector[spot.sector] = [];
            }
            spotsBySector[spot.sector].push(spot);
        });
        
        // Adiciona opções agrupadas
        Object.keys(spotsBySector).sort().forEach(sectorKey => {
            // Cabeçalho do setor
            const group = document.createElement('optgroup');
            group.label = `Setor ${sectorKey} (${spotsBySector[sectorKey].length} vagas)`;
            
            spotsBySector[sectorKey].forEach(spot => {
                const option = document.createElement('option');
                option.value = spot.id;
                option.textContent = `Vaga ${spot.number} ${spot.type === 'pcd' ? '(PCD)' : ''}`;
                group.appendChild(option);
            });
            
            spotSelect.appendChild(group);
        });
    }

    registerVehicle() {
        const plate = document.getElementById('vehicle-plate')?.value.trim().toUpperCase();
        const model = document.getElementById('vehicle-model')?.value.trim();
        const color = document.getElementById('vehicle-color')?.value.trim();
        const clientName = document.getElementById('client-name')?.value.trim();
        const clientPhone = document.getElementById('client-phone')?.value.trim();
        const spotSelect = document.getElementById('spot-number');
        const spotId = spotSelect ? parseInt(spotSelect.value) : null;
        
        // Validações básicas
        if (!plate || !model || !clientName || !clientPhone || !spotId) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
        
        // Encontra a vaga
        const spot = this.parkingSpots.find(s => s.id === spotId);
        if (!spot || spot.status !== 'available') {
            alert('Esta vaga não está disponível.');
            return;
        }
        
        // Cria cliente
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
        
        // Atualiza vaga
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
        
        // Adiciona cliente à lista
        this.clients.push(newClient);
        
        // Registra atividade
        this.activities.push({
            id: Date.now(),
            type: 'entry',
            title: 'Veículo entrou',
            description: `${model} - ${plate}`,
            time: new Date().toISOString(),
            spot: spot.number
        });
        
        // Salva dados
        this.saveData();
        
        // Atualiza interface
        this.hideVehicleModal();
        
        if (this.currentPage === 'estacionamento') {
            this.renderParking();
        }
        
        this.renderDashboard();
        
        this.showNotification('Veículo registrado com sucesso!', 'success');
    }

    releaseSpot(spotId) {
        const spot = this.parkingSpots.find(s => s.id === spotId);
        if (!spot || spot.status !== 'occupied') return;
        
        // Calcula valor
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
        
        if (confirm(`Liberar vaga ${spot.number}?\nTempo: ${this.getElapsedTime(spot.entryTime)}\nValor: R$ ${price.toFixed(2)}`)) {
            // Registra atividade
            this.activities.push({
                id: Date.now(),
                type: 'exit',
                title: 'Veículo saiu',
                description: `${spot.vehicle.model} - ${spot.vehicle.plate}`,
                time: new Date().toISOString(),
                spot: spot.number
            });
            
            // Registra pagamento
            this.activities.push({
                id: Date.now() + 1,
                type: 'payment',
                title: 'Pagamento realizado',
                description: `Vaga ${spot.number} - R$ ${price.toFixed(2)}`,
                time: new Date().toISOString(),
                spot: spot.number
            });
            
            // Libera vaga
            spot.status = 'available';
            spot.vehicle = null;
            spot.client = null;
            spot.entryTime = null;
            
            // Salva dados
            this.saveData();
            
            // Atualiza interface
            if (this.currentPage === 'estacionamento') {
                this.renderParking();
            }
            
            this.renderDashboard();
            
            this.showNotification(`Vaga ${spot.number} liberada com sucesso!\nValor cobrado: R$ ${price.toFixed(2)}`, 'success');
        }
    }

    savePriceSettings() {
        const firstHourPrice = document.getElementById('first-hour-price');
        const additionalHourPrice = document.getElementById('additional-hour-price');
        const dailyPrice = document.getElementById('daily-price');
        
        if (firstHourPrice && additionalHourPrice && dailyPrice) {
            this.settings.prices.firstHour = parseFloat(firstHourPrice.value);
            this.settings.prices.additionalHour = parseFloat(additionalHourPrice.value);
            this.settings.prices.daily = parseFloat(dailyPrice.value);
            
            this.saveSettings();
            this.showNotification('Preços atualizados com sucesso!', 'success');
        }
    }

    saveSpotSettings() {
        const totalSpots = document.getElementById('total-spots');
        const pcdSpots = document.getElementById('pcd-spots');
        
        if (!totalSpots || !pcdSpots) return;
        
        const total = parseInt(totalSpots.value);
        const pcd = parseInt(pcdSpots.value);
        
        // Validações para 200 vagas
        if (total !== 200) {
            this.showNotification('O sistema deve ter exatamente 200 vagas.', 'error');
            totalSpots.value = 200;
            return;
        }
        
        if (pcd > 20) { // 10% do total
            this.showNotification('O número de vagas PCD não pode ser maior que 20 (10% do total).', 'error');
            pcdSpots.value = 16;
            return;
        }
        
        this.settings.totalSpots = total;
        this.settings.pcdSpots = pcd;
        
        // Regenera vagas
        this.parkingSpots = this.generateParkingSpots();
        
        this.saveSettings();
        this.saveData();
        
        if (this.currentPage === 'estacionamento') {
            this.renderParking();
        }
        
        this.showNotification('Configurações de vagas atualizadas com sucesso!', 'success');
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
        
        this.showNotification('Backup criado com sucesso!', 'success');
    }

    clearData() {
        if (confirm('ATENÇÃO: Esta ação irá apagar todos os dados do sistema. Tem certeza?')) {
            localStorage.clear();
            this.showNotification('Todos os dados foram apagados. A página será recarregada.', 'warning');
            setTimeout(() => {
                location.reload();
            }, 2000);
        }
    }
// Função para buscar veículos
function searchVehicles(searchTerm) {
    const searchTermLower = searchTerm.toLowerCase().trim();
    const parkingSpots = document.querySelectorAll('.parking-spot');
    const resultsContainer = document.getElementById('search-results-grid');
    const resultsCount = document.getElementById('results-count');
    const searchResults = document.getElementById('search-results');
    const parkingGrid = document.getElementById('parking-grid');
    
    let foundResults = [];
    
    // Limpar resultados anteriores
    resultsContainer.innerHTML = '';
    
    if (!searchTerm) {
        searchResults.classList.add('hidden');
        parkingGrid.classList.remove('hidden');
        return;
    }
    
    // Procurar em cada vaga
    parkingSpots.forEach(spot => {
        const spotNumber = spot.querySelector('.spot-number')?.textContent || '';
        const spotSector = spot.querySelector('.spot-sector')?.textContent || '';
        const vehicleInfo = spot.querySelector('.vehicle-info')?.textContent || '';
        
        const searchableText = `${spotNumber} ${spotSector} ${vehicleInfo}`.toLowerCase();
        
        if (searchableText.includes(searchTermLower)) {
            foundResults.push({
                element: spot,
                number: spotNumber,
                sector: spotSector,
                info: vehicleInfo
            });
        }
    });
    
    // Exibir resultados
    if (foundResults.length > 0) {
        resultsCount.textContent = foundResults.length;
        
        foundResults.forEach(result => {
            const resultCard = document.createElement('div');
            resultCard.className = 'search-result-card';
            
            resultCard.innerHTML = `
                <div class="result-icon">
                    <i class="fas fa-car"></i>
                </div>
                <div class="result-info">
                    <h5>Vaga ${result.number}</h5>
                    <p><strong>Setor:</strong> ${result.sector}</p>
                    <p>${result.info}</p>
                </div>
                <div class="result-actions">
                    <button class="btn-secondary" onclick="highlightSpot('${result.number}')">
                        <i class="fas fa-map-marker-alt"></i> Localizar
                    </button>
                </div>
            `;
            
            resultsContainer.appendChild(resultCard);
        });
        
        searchResults.classList.remove('hidden');
        parkingGrid.classList.add('hidden');
    } else {
        // Nenhum resultado encontrado
        resultsContainer.innerHTML = `
            <div class="search-empty-state">
                <i class="fas fa-search"></i>
                <h4>Nenhum veículo encontrado</h4>
                <p>Não encontramos veículos com o termo "${searchTerm}"</p>
                <button class="btn-secondary" id="show-all-spots">
                    <i class="fas fa-eye"></i> Ver todas as vagas
                </button>
            </div>
        `;
        
        document.getElementById('show-all-spots')?.addEventListener('click', () => {
            document.getElementById('search-vehicle').value = '';
            searchResults.classList.add('hidden');
            parkingGrid.classList.remove('hidden');
        });
        
        resultsCount.textContent = '0';
        searchResults.classList.remove('hidden');
        parkingGrid.classList.add('hidden');
    }
}

// Função para destacar uma vaga específica
function highlightSpot(spotNumber) {
    // Voltar para a visualização normal
    document.getElementById('search-results').classList.add('hidden');
    document.getElementById('parking-grid').classList.remove('hidden');
    
    // Limpar pesquisa
    document.getElementById('search-vehicle').value = '';
    
    // Encontrar e destacar a vaga
    const spotElement = document.querySelector(`.spot-number:contains("${spotNumber}")`)?.closest('.parking-spot');
    if (spotElement) {
        // Rolar até a vaga
        spotElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Adicionar classe de destaque
        spotElement.classList.add('highlight');
        
        // Remover destaque após 3 segundos
        setTimeout(() => {
            spotElement.classList.remove('highlight');
        }, 3000);
    }
}

// Adicione este evento no seu código de inicialização
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-vehicle');
    const searchBtn = document.getElementById('search-btn');
    const clearSearchBtn = document.getElementById('clear-search');
    
    // Buscar ao digitar (com debounce para performance)
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchVehicles(this.value);
        }, 300); // Aguarda 300ms após a última digitação
    });
    
    // Buscar ao clicar no botão
    searchBtn.addEventListener('click', function() {
        searchVehicles(searchInput.value);
    });
    
    // Buscar ao pressionar Enter
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchVehicles(this.value);
        }
    });
    
    // Limpar pesquisa
    clearSearchBtn?.addEventListener('click', function() {
        searchInput.value = '';
        searchVehicles('');
    });
});

// Adicione esta função de utilidade se não existir
if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || 
                                Element.prototype.webkitMatchesSelector;
}

// Polyfill para :contains (se necessário)
if (!document.querySelectorAll(':contains')) {
    // Adicionar suporte básico se necessário
}
    // ============================================
    // MÉTODOS PARA TROCA DE USUÁRIO
    // ============================================

    showSwitchUserModal() {
        const modal = document.getElementById('switch-user-modal');
        const userList = document.getElementById('user-list');
        
        if (!modal || !userList) return;
        
        // Carrega lista de usuários
        this.loadUserList(userList);
        
        modal.classList.remove('hidden');
        
        // Foco no primeiro campo
        setTimeout(() => {
            const quickUsername = document.getElementById('quick-username');
            if (quickUsername) {
                quickUsername.focus();
            }
        }, 100);
    }

    hideSwitchUserModal() {
        const modal = document.getElementById('switch-user-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        
        // Limpa formulário
        const quickUsername = document.getElementById('quick-username');
        const quickPassword = document.getElementById('quick-password');
        
        if (quickUsername) quickUsername.value = '';
        if (quickPassword) quickPassword.value = '';
    }

    loadUserList(userListElement) {
        if (!userListElement) return;
        
        const users = JSON.parse(localStorage.getItem('parkingUsers')) || [
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
                    <span class="user-item-role">${user.role === 'admin' ? 'Administrador' : 'Operador'}</span>
                </div>
                <div class="user-item-status ${isCurrent ? 'current' : 'available'}">
                    ${isCurrent ? 'Atual' : 'Disponível'}
                </div>
            `;
            
            // Clique para login rápido (apenas se não for o usuário atual)
            if (!isCurrent) {
                userItem.style.cursor = 'pointer';
                userItem.addEventListener('click', () => {
                    this.quickLoginWithUser(user.username, user.password);
                });
                
                userItem.setAttribute('title', `Trocar para ${user.name}`);
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
            this.showNotification('Por favor, preencha usuário e senha.', 'warning');
            return;
        }
        
        // Verifica credenciais
        const users = JSON.parse(localStorage.getItem('parkingUsers')) || [];
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            this.switchToUser(user);
        } else {
            this.showNotification('Usuário ou senha incorretos.', 'error');
        }
    }

    quickLoginWithUser(username, password) {
        const users = JSON.parse(localStorage.getItem('parkingUsers')) || [];
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            this.switchToUser(user);
        } else {
            this.showNotification('Erro ao trocar de usuário.', 'error');
        }
    }

    switchToUser(newUser) {
        if (!newUser) return;
        
        // Confirmação
        if (!confirm(`Deseja trocar para o usuário ${newUser.name} (${newUser.role === 'admin' ? 'Administrador' : 'Operador'})?`)) {
            return;
        }
        
        // Salva usuário anterior
        const previousUser = this.currentUser;
        
        // Atualiza usuário atual
        this.currentUser = {
            id: newUser.id,
            username: newUser.username,
            name: newUser.name,
            role: newUser.role,
            email: newUser.email
        };
        
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        
        // Atualiza interface
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = newUser.name;
        }
        
        const userRoleElement = document.querySelector('.user-role');
        if (userRoleElement) {
            userRoleElement.textContent = newUser.role === 'admin' ? 'Administrador' : 'Operador';
        }
        
        // Fecha modal
        this.hideSwitchUserModal();
        
        // Mostra notificação
        this.showNotification(`Usuário alterado para: ${newUser.name}`, 'success');
        
        // Registra atividade
        this.activities.push({
            id: Date.now(),
            type: 'system',
            title: 'Troca de usuário',
            description: `De ${previousUser.name || 'N/A'} para ${newUser.name}`,
            time: new Date().toISOString(),
            user: newUser.username
        });
        
        // Salva dados
        this.saveData();
        
        // Atualiza permissões
        this.updateUserPermissions();
    }

    updateUserPermissions() {
        const isAdmin = this.currentUser.role === 'admin';
        
        // Elementos visíveis apenas para admin
        const adminOnlyElements = document.querySelectorAll('.admin-only');
        adminOnlyElements.forEach(element => {
            if (isAdmin) {
                element.style.display = '';
            } else {
                element.style.display = 'none';
            }
        });
        
        // Inputs desabilitados para não-admin
        const adminOnlyInputs = document.querySelectorAll('.admin-only-input');
        adminOnlyInputs.forEach(input => {
            input.disabled = !isAdmin;
            if (!isAdmin) {
                input.title = 'Apenas administradores podem modificar';
            } else {
                input.title = '';
            }
        });
    }

    showNotification(message, type = 'info') {
        // Remove notificações anteriores
        const existing = document.querySelector('.user-switch-notification');
        if (existing) existing.remove();
        
        // Cria nova notificação
        const notification = document.createElement('div');
        notification.className = `user-switch-notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        // Estilos inline
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            font-family: 'Poppins', sans-serif;
            font-size: 0.9rem;
        `;
        
        document.body.appendChild(notification);
        
        // Remove após 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
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

    addNewUser() {
        const name = prompt('Nome do novo usuário:');
        if (!name) return;
        
        const username = prompt('Nome de usuário:');
        if (!username) return;
        
        const password = prompt('Senha:');
        if (!password) return;
        
        const role = prompt('Tipo (admin/operador):', 'operador');
        if (!['admin', 'operador'].includes(role)) {
            alert('Tipo inválido. Use "admin" ou "operador".');
            return;
        }
        
        // Carrega usuários existentes
        const users = JSON.parse(localStorage.getItem('parkingUsers')) || [];
        
        // Verifica se usuário já existe
        if (users.some(u => u.username === username)) {
            alert('Nome de usuário já existe!');
            return;
        }
        
        // Adiciona novo usuário
        const newUser = {
            id: Date.now(),
            username: username,
            password: password,
            name: name,
            role: role,
            email: `${username}@rioparkvallet.com`
        };
        
        users.push(newUser);
        localStorage.setItem('parkingUsers', JSON.stringify(users));
        
        this.showNotification(`Usuário ${name} adicionado com sucesso!`, 'success');
        
        // Atualiza lista de usuários
        this.renderUsersList();
    }

    editClient(clientId) {
        const client = this.clients.find(c => c.id == clientId);
        if (!client) return;
        
        const newName = prompt('Novo nome:', client.name);
        if (!newName) return;
        
        const newPhone = prompt('Novo telefone:', client.phone);
        if (!newPhone) return;
        
        client.name = newName;
        client.phone = newPhone;
        
        this.saveData();
        this.renderClients();
        
        this.showNotification('Cliente atualizado com sucesso!', 'success');
    }

    deleteClient(clientId) {
        if (!confirm('Tem certeza que deseja excluir este cliente?')) {
            return;
        }
        
        this.clients = this.clients.filter(c => c.id != clientId);
        this.saveData();
        this.renderClients();
        
        this.showNotification('Cliente excluído com sucesso!', 'success');
    }

    showClientModal() {
        const name = prompt('Nome do cliente:');
        if (!name) return;
        
        const phone = prompt('Telefone:');
        if (!phone) return;
        
        const newClient = {
            id: Date.now(),
            name: name,
            phone: phone,
            createdAt: new Date().toISOString()
        };
        
        this.clients.push(newClient);
        this.saveData();
        this.renderClients();
        
        this.showNotification('Cliente adicionado com sucesso!', 'success');
    }
}

// Inicializa o sistema quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.parkingSystem = new ParkingSystem();
});
