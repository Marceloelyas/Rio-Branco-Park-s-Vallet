/**
 * RIO BRANCO PARK'S VALET
 * Sistema Completo de Gerenciamento de Estacionamento
 * Versão 2.0 - App.js Completo
 */

class RioBrancoValetSystem {
    constructor() {
        // Dados principais do sistema
        this.parkingSpots = [];
        this.clients = [];
        this.vehicles = [];
        this.transactions = [];
        this.activities = [];
        this.users = [];
        this.settings = {};
        this.currentUser = null;
        this.currentPage = 'dashboard';
        this.selectedSpot = null;
        
        // Constantes do sistema
        this.SYSTEM_NAME = "Rio Branco Park's Valet";
        this.VERSION = "2.0.0";
        this.COMPANY = "Rio Branco Estacionamentos LTDA";
        this.CNPJ = "12.345.678/0001-99";
        
        // Inicialização
        this.initSystem();
    }

    /**
     * INICIALIZAÇÃO DO SISTEMA
     */
    initSystem() {
        console.log(`=== ${this.SYSTEM_NAME} v${this.VERSION} ===`);
        console.log(`=== ${this.COMPANY} - CNPJ: ${this.CNPJ} ===`);
        
        // Carrega todas as configurações e dados
        this.loadSettings();
        this.loadUsers();
        this.loadData();
        
        // Configura interface
        this.setupEventListeners();
        this.updateDateTime();
        this.updateUserDisplay();
        this.renderDashboard();
        
        // Inicia atualizações automáticas
        setInterval(() => this.updateDateTime(), 1000);
        setInterval(() => this.autoSave(), 30000); // Auto-save a cada 30 segundos
        
        // Registra atividade de inicialização
        this.logActivity('system', 'Sistema iniciado', 'Sistema inicializado com sucesso');
        
        // Mostra mensagem de boas-vindas
        this.showNotification('success', `Bem-vindo ao ${this.SYSTEM_NAME}`);
    }

    /**
     * CONFIGURAÇÕES DO SISTEMA
     */
    loadSettings() {
        const defaultSettings = {
            // Vagas
            totalSpots: 200,
            pcdSpots: 16,
            vipSpots: 20,
            reservedSpots: 10,
            
            // Setores
            sectors: {
                'A': { name: 'Setor A - Entrada Principal', total: 30, pcd: 3, vip: 2 },
                'B': { name: 'Setor B - Leste', total: 30, pcd: 3, vip: 2 },
                'C': { name: 'Setor C - Centro', total: 70, pcd: 5, vip: 8 },
                'D': { name: 'Setor D - Oeste', total: 70, pcd: 5, vip: 8 }
            },
            
            // Tarifas (em R$)
            prices: {
                firstHour: 15.00,
                additionalHour: 10.00,
                daily: 80.00,
                nightly: 50.00,
                monthly: 400.00,
                pcdDiscount: 0.5, // 50% de desconto para PCD
                vipDiscount: 0.2,  // 20% de desconto para VIP
                
                // Taxas adicionais
                valetService: 25.00,
                carWash: 45.00,
                detailing: 120.00
            },
            
            // Horários de funcionamento
            businessHours: {
                weekdays: { open: '06:00', close: '23:00' },
                saturday: { open: '07:00', close: '22:00' },
                sunday: { open: '08:00', close: '20:00' },
                holidays: { open: '09:00', close: '18:00' }
            },
            
            // Configurações do sistema
            autoBackup: true,
            backupInterval: 3600000, // 1 hora
            printReceipts: true,
            soundNotifications: true,
            language: 'pt-BR',
            currency: 'BRL',
            
            // Configurações de segurança
            sessionTimeout: 1800, // 30 minutos
            maxLoginAttempts: 3,
            passwordExpiry: 90, // dias
            requireTwoFactor: false
        };
        
        // Tenta carregar configurações salvas
        try {
            const savedSettings = localStorage.getItem('rb_valet_settings');
            if (savedSettings) {
                this.settings = { ...defaultSettings, ...JSON.parse(savedSettings) };
                console.log('Configurações carregadas do localStorage');
            } else {
                this.settings = defaultSettings;
                this.saveSettings();
                console.log('Configurações padrão carregadas');
            }
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
            this.settings = defaultSettings;
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('rb_valet_settings', JSON.stringify(this.settings));
            console.log('Configurações salvas');
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            this.showNotification('error', 'Erro ao salvar configurações');
        }
    }

    /**
     * GERENCIAMENTO DE USUÁRIOS
     */
    loadUsers() {
        const defaultUsers = [
            {
                id: 1,
                name: "Administrador Master",
                username: "admin",
                password: this.hashPassword("rbpark@2024"),
                email: "admin@riobrancopark.com.br",
                role: "admin",
                department: "Administração",
                permissions: ["all"],
                avatar: "👨‍💼",
                phone: "(11) 99999-9999",
                active: true,
                lastLogin: null,
                createdAt: new Date()
            },
            {
                id: 2,
                name: "João Silva - Gerente",
                username: "gerente",
                password: this.hashPassword("gerente123"),
                email: "gerencia@riobrancopark.com.br",
                role: "manager",
                department: "Gerência",
                permissions: ["manage_spots", "manage_clients", "view_reports", "manage_users"],
                avatar: "👔",
                phone: "(11) 98888-8888",
                active: true,
                lastLogin: null,
                createdAt: new Date()
            },
            {
                id: 3,
                name: "Maria Santos - Operadora",
                username: "operadora",
                password: this.hashPassword("operadora123"),
                email: "operacao@riobrancopark.com.br",
                role: "operator",
                department: "Operação",
                permissions: ["register_entries", "register_exits", "view_spots", "process_payments"],
                avatar: "👩‍💼",
                phone: "(11) 97777-7777",
                active: true,
                lastLogin: null,
                createdAt: new Date()
            },
            {
                id: 4,
                name: "Carlos Oliveira - Valet",
                username: "valet",
                password: this.hashPassword("valet123"),
                email: "valet@riobrancopark.com.br",
                role: "valet",
                department: "Valet",
                permissions: ["register_entries", "park_vehicle", "retrieve_vehicle"],
                avatar: "🚗",
                phone: "(11) 96666-6666",
                active: true,
                lastLogin: null,
                createdAt: new Date()
            }
        ];
        
        try {
            const savedUsers = localStorage.getItem('rb_valet_users');
            if (savedUsers) {
                this.users = JSON.parse(savedUsers);
            } else {
                this.users = defaultUsers;
                this.saveUsers();
            }
            
            // Tenta restaurar sessão
            const session = localStorage.getItem('rb_valet_session');
            if (session) {
                const sessionData = JSON.parse(session);
                if (sessionData.expires > Date.now()) {
                    this.currentUser = this.users.find(u => u.id === sessionData.userId);
                    this.logActivity('login', 'Sessão restaurada', `Usuário ${this.currentUser.name} reconectado`);
                }
            }
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            this.users = defaultUsers;
        }
    }

    saveUsers() {
        try {
            localStorage.setItem('rb_valet_users', JSON.stringify(this.users));
        } catch (error) {
            console.error('Erro ao salvar usuários:', error);
        }
    }

    hashPassword(password) {
        // Simulação de hash (em produção usar bcrypt ou similar)
        return btoa(password + 'rb_valet_salt');
    }

    /**
     * CARREGAMENTO DE DADOS
     */
    loadData() {
        console.log('Carregando dados do sistema...');
        
        // Carrega ou gera vagas
        this.loadOrGenerateSpots();
        
        // Carrega clientes
        this.loadClients();
        
        // Carrega veículos
        this.loadVehicles();
        
        // Carrega transações
        this.loadTransactions();
        
        // Carrega atividades
        this.loadActivities();
        
        console.log('Dados carregados com sucesso!');
    }

    loadOrGenerateSpots() {
        try {
            const savedSpots = localStorage.getItem('rb_valet_spots');
            if (savedSpots) {
                this.parkingSpots = JSON.parse(savedSpots);
                console.log(`Vagas carregadas: ${this.parkingSpots.length}`);
            } else {
                this.generateParkingSpots();
                this.saveSpots();
                console.log('Vagas geradas automaticamente');
            }
        } catch (error) {
            console.error('Erro ao carregar vagas:', error);
            this.generateParkingSpots();
        }
    }

    generateParkingSpots() {
        console.log('Gerando vagas do estacionamento...');
        this.parkingSpots = [];
        
        const sectorConfig = {
            'A': { start: 1, end: 30, pcd: 3, vip: 2 },
            'B': { start: 31, end: 60, pcd: 3, vip: 2 },
            'C': { start: 61, end: 130, pcd: 5, vip: 8 },
            'D': { start: 131, end: 200, pcd: 5, vip: 8 }
        };
        
        let spotNumber = 1;
        
        for (const [sector, config] of Object.entries(sectorConfig)) {
            for (let i = config.start; i <= config.end; i++) {
                // Determina tipo da vaga
                let type = 'regular';
                let special = null;
                
                if (spotNumber <= config.pcd) {
                    type = 'pcd';
                    special = 'PCD';
                } else if (spotNumber <= config.pcd + config.vip) {
                    type = 'vip';
                    special = 'VIP';
                }
                
                // Determina localização
                let location = 'ground';
                if (sector === 'C' && spotNumber > 100) location = 'covered';
                if (sector === 'D') location = 'outdoor';
                
                this.parkingSpots.push({
                    id: spotNumber,
                    number: spotNumber,
                    sector: sector,
                    type: type,
                    special: special,
                    location: location,
                    status: 'available',
                    features: this.getSpotFeatures(type, location),
                    size: this.getSpotSize(type),
                    vehicle: null,
                    client: null,
                    entryTime: null,
                    notes: '',
                    lastMaintenance: null,
                    nextMaintenance: this.addDays(new Date(), 30),
                    hourlyRate: this.getHourlyRate(type),
                    dailyRate: this.getDailyRate(type)
                });
                
                spotNumber++;
            }
        }
        
        console.log(`Total de vagas geradas: ${this.parkingSpots.length}`);
    }

    getSpotFeatures(type, location) {
        const features = [];
        
        if (type === 'pcd') features.push('Ampliada', 'Sinalização', 'Rampa');
        if (type === 'vip') features.push('Coberta', 'Monitorada', 'Próxima à entrada');
        if (location === 'covered') features.push('Coberta');
        if (location === 'ground') features.push('Térreo');
        
        return features;
    }

    getSpotSize(type) {
        const sizes = {
            'pcd': { width: 3.5, length: 5.5 },
            'vip': { width: 3.0, length: 5.0 },
            'regular': { width: 2.5, length: 5.0 }
        };
        return sizes[type] || sizes.regular;
    }

    getHourlyRate(type) {
        const base = this.settings.prices.firstHour;
        switch(type) {
            case 'pcd': return base * (1 - this.settings.prices.pcdDiscount);
            case 'vip': return base * (1 - this.settings.prices.vipDiscount);
            default: return base;
        }
    }

    getDailyRate(type) {
        const base = this.settings.prices.daily;
        switch(type) {
            case 'pcd': return base * (1 - this.settings.prices.pcdDiscount);
            case 'vip': return base * (1 - this.settings.prices.vipDiscount);
            default: return base;
        }
    }

    loadClients() {
        try {
            const savedClients = localStorage.getItem('rb_valet_clients');
            if (savedClients) {
                this.clients = JSON.parse(savedClients);
            } else {
                this.generateSampleClients();
                this.saveClients();
            }
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
            this.clients = [];
        }
    }

    generateSampleClients() {
        this.clients = [
            {
                id: 1,
                type: 'regular',
                name: 'João Carlos Mendes',
                document: '123.456.789-00',
                email: 'joao@email.com',
                phone: '(11) 99999-9999',
                address: 'Rua das Flores, 123 - Centro, São Paulo/SP',
                category: 'gold',
                registrationDate: new Date('2023-01-15'),
                totalSpent: 2450.50,
                visits: 42,
                averageTime: 3.5,
                favoriteSpots: [15, 32, 78],
                notes: 'Cliente preferencial - Tratar com cortesia',
                active: true
            },
            {
                id: 2,
                type: 'pcd',
                name: 'Maria da Silva',
                document: '987.654.321-00',
                email: 'maria@email.com',
                phone: '(11) 98888-8888',
                address: 'Av. Paulista, 1000 - Bela Vista, São Paulo/SP',
                category: 'pcd',
                registrationDate: new Date('2023-03-20'),
                totalSpent: 1200.00,
                visits: 25,
                averageTime: 4.2,
                favoriteSpots: [5, 6, 7],
                pcdDocument: '123456789',
                notes: 'Necessita vaga ampliada',
                active: true
            },
            {
                id: 3,
                type: 'corporate',
                name: 'Empresa XYZ Ltda',
                document: '12.345.678/0001-99',
                email: 'contato@xyz.com.br',
                phone: '(11) 3777-7777',
                address: 'Av. Brigadeiro Faria Lima, 1500 - Itaim Bibi, São Paulo/SP',
                category: 'corporate',
                registrationDate: new Date('2023-02-10'),
                totalSpent: 8900.75,
                visits: 156,
                averageTime: 8.5,
                contactPerson: 'Carlos Andrade',
                corporatePlan: 'premium',
                monthlyLimit: 5000.00,
                notes: 'Contrato corporativo - Fatura mensal',
                active: true
            },
            {
                id: 4,
                type: 'monthly',
                name: 'Roberto Almeida',
                document: '111.222.333-44',
                email: 'roberto@email.com',
                phone: '(11) 97777-7777',
                address: 'Rua Augusta, 500 - Consolação, São Paulo/SP',
                category: 'monthly',
                registrationDate: new Date('2023-04-05'),
                totalSpent: 1600.00,
                visits: 89,
                averageTime: 10.2,
                monthlyPlan: 'vip',
                planStart: new Date('2023-11-01'),
                planEnd: new Date('2024-10-31'),
                paymentDay: 10,
                notes: 'Plano mensal VIP - Vaga coberta',
                active: true
            }
        ];
    }

    loadVehicles() {
        try {
            const savedVehicles = localStorage.getItem('rb_valet_vehicles');
            if (savedVehicles) {
                this.vehicles = JSON.parse(savedVehicles);
            } else {
                this.vehicles = [];
            }
        } catch (error) {
            console.error('Erro ao carregar veículos:', error);
            this.vehicles = [];
        }
    }

    loadTransactions() {
        try {
            const savedTransactions = localStorage.getItem('rb_valet_transactions');
            if (savedTransactions) {
                this.transactions = JSON.parse(savedTransactions);
            } else {
                this.transactions = [];
            }
        } catch (error) {
            console.error('Erro ao carregar transações:', error);
            this.transactions = [];
        }
    }

    loadActivities() {
        try {
            const savedActivities = localStorage.getItem('rb_valet_activities');
            if (savedActivities) {
                this.activities = JSON.parse(savedActivities);
            } else {
                this.activities = [];
            }
        } catch (error) {
            console.error('Erro ao carregar atividades:', error);
            this.activities = [];
        }
    }

    /**
     * SALVAMENTO DE DADOS
     */
    saveSpots() {
        try {
            localStorage.setItem('rb_valet_spots', JSON.stringify(this.parkingSpots));
        } catch (error) {
            console.error('Erro ao salvar vagas:', error);
        }
    }

    saveClients() {
        try {
            localStorage.setItem('rb_valet_clients', JSON.stringify(this.clients));
        } catch (error) {
            console.error('Erro ao salvar clientes:', error);
        }
    }

    saveVehicles() {
        try {
            localStorage.setItem('rb_valet_vehicles', JSON.stringify(this.vehicles));
        } catch (error) {
            console.error('Erro ao salvar veículos:', error);
        }
    }

    saveTransactions() {
        try {
            localStorage.setItem('rb_valet_transactions', JSON.stringify(this.transactions));
        } catch (error) {
            console.error('Erro ao salvar transações:', error);
        }
    }

    saveActivities() {
        try {
            localStorage.setItem('rb_valet_activities', JSON.stringify(this.activities));
        } catch (error) {
            console.error('Erro ao salvar atividades:', error);
        }
    }

    autoSave() {
        console.log('Auto-salvando dados...');
        this.saveSpots();
        this.saveClients();
        this.saveVehicles();
        this.saveTransactions();
        this.saveActivities();
        this.saveSettings();
        this.saveUsers();
        console.log('Dados auto-salvos com sucesso!');
    }

    createBackup() {
        const backup = {
            timestamp: new Date().toISOString(),
            system: this.SYSTEM_NAME,
            version: this.VERSION,
            data: {
                spots: this.parkingSpots,
                clients: this.clients,
                vehicles: this.vehicles,
                transactions: this.transactions,
                activities: this.activities,
                users: this.users,
                settings: this.settings
            }
        };
        
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }