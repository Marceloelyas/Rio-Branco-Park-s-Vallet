/**
 * RIO BRANCO PARK'S VALET
 * Sistema Completo de Gerenciamento de Estacionamento
 * Versão 2.0 - App.js Completo COM SETORES RENOMEADOS
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
        this.SYSTEM_NAME = "RIO BRANCO PARK'S VALET";
        this.VERSION = "2.0.0";
        this.COMPANY = "RIO BRANCO ESTACIONAMENTOS LTDA";
        this.CNPJ = "12.345.678/0001-99";
        
        // Inicialização
        this.initSystem();
    }

    /**
     * INICIALIZAÇÃO DO SISTEMA
     */
    initSystem() {
        console.log(`=== ${this.SYSTEM_NAME} V${this.VERSION} ===`);
        console.log(`=== ${this.COMPANY} - CNPJ: ${this.CNPJ} ===`);
        console.log('=== SETORES CONFIGURADOS: FRENTE, EDU, BAIXO, AUTO ===');
        
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
        setInterval(() => this.autoSave(), 30000);
        
        // Registra atividade de inicialização
        this.logActivity('SYSTEM', 'SISTEMA INICIADO', 'SISTEMA INICIALIZADO COM SUCESSO');
        
        // Mostra mensagem de boas-vindas
        this.showNotification('SUCCESS', `BEM-VINDO AO ${this.SYSTEM_NAME}`);
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
            
            // SETORES RENOMEADOS - TUDO EM MAIÚSCULO
            sectors: {
                'FRENTE': { name: 'SETOR FRENTE - ENTRADA PRINCIPAL', total: 30, pcd: 3, vip: 2 },
                'EDU': { name: 'SETOR EDU - LESTE', total: 30, pcd: 3, vip: 2 },
                'BAIXO': { name: 'SETOR BAIXO - CENTRO', total: 70, pcd: 5, vip: 8 },
                'AUTO': { name: 'SETOR AUTO - OESTE', total: 70, pcd: 5, vip: 8 }
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
                console.log('CONFIGURAÇÕES CARREGADAS DO LOCALSTORAGE');
            } else {
                this.settings = defaultSettings;
                this.saveSettings();
                console.log('CONFIGURAÇÕES PADRÃO CARREGADAS');
            }
        } catch (error) {
            console.error('ERRO AO CARREGAR CONFIGURAÇÕES:', error);
            this.settings = defaultSettings;
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('rb_valet_settings', JSON.stringify(this.settings));
            console.log('CONFIGURAÇÕES SALVAS');
        } catch (error) {
            console.error('ERRO AO SALVAR CONFIGURAÇÕES:', error);
            this.showNotification('ERROR', 'ERRO AO SALVAR CONFIGURAÇÕES');
        }
    }

    /**
     * GERENCIAMENTO DE USUÁRIOS
     */
    loadUsers() {
        const defaultUsers = [
            {
                id: 1,
                name: "ADMINISTRADOR MASTER",
                username: "admin",
                password: this.hashPassword("rbpark@2024"),
                email: "admin@riobrancopark.com.br",
                role: "ADMIN",
                department: "ADMINISTRAÇÃO",
                permissions: ["ALL"],
                avatar: "👨‍💼",
                phone: "(11) 99999-9999",
                active: true,
                lastLogin: null,
                createdAt: new Date()
            },
            {
                id: 2,
                name: "JOÃO SILVA - GERENTE",
                username: "gerente",
                password: this.hashPassword("gerente123"),
                email: "gerencia@riobrancopark.com.br",
                role: "GERENTE",
                department: "GERÊNCIA",
                permissions: ["MANAGE_SPOTS", "MANAGE_CLIENTS", "VIEW_REPORTS", "MANAGE_USERS"],
                avatar: "👔",
                phone: "(11) 98888-8888",
                active: true,
                lastLogin: null,
                createdAt: new Date()
            },
            {
                id: 3,
                name: "MARIA SANTOS - OPERADORA",
                username: "operadora",
                password: this.hashPassword("operadora123"),
                email: "operacao@riobrancopark.com.br",
                role: "OPERADOR",
                department: "OPERAÇÃO",
                permissions: ["REGISTER_ENTRIES", "REGISTER_EXITS", "VIEW_SPOTS", "PROCESS_PAYMENTS"],
                avatar: "👩‍💼",
                phone: "(11) 97777-7777",
                active: true,
                lastLogin: null,
                createdAt: new Date()
            },
            {
                id: 4,
                name: "CARLOS OLIVEIRA - VALET",
                username: "valet",
                password: this.hashPassword("valet123"),
                email: "valet@riobrancopark.com.br",
                role: "VALET",
                department: "VALET",
                permissions: ["REGISTER_ENTRIES", "PARK_VEHICLE", "RETRIEVE_VEHICLE"],
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
                    this.logActivity('LOGIN', 'SESSÃO RESTAURADA', `USUÁRIO ${this.currentUser.name} RECONECTADO`);
                }
            }
        } catch (error) {
            console.error('ERRO AO CARREGAR USUÁRIOS:', error);
            this.users = defaultUsers;
        }
    }

    saveUsers() {
        try {
            localStorage.setItem('rb_valet_users', JSON.stringify(this.users));
        } catch (error) {
            console.error('ERRO AO SALVAR USUÁRIOS:', error);
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
        console.log('CARREGANDO DADOS DO SISTEMA...');
        
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
        
        // CONVERTE DADOS EXISTENTES SE NECESSÁRIO
        this.convertExistingData();
        
        console.log('DADOS CARREGADOS COM SUCESSO!');
    }

    loadOrGenerateSpots() {
        try {
            const savedSpots = localStorage.getItem('rb_valet_spots');
            if (savedSpots) {
                this.parkingSpots = JSON.parse(savedSpots);
                console.log(`VAGAS CARREGADAS: ${this.parkingSpots.length}`);
            } else {
                this.generateParkingSpots();
                this.saveSpots();
                console.log('VAGAS GERADAS AUTOMATICAMENTE');
            }
        } catch (error) {
            console.error('ERRO AO CARREGAR VAGAS:', error);
            this.generateParkingSpots();
        }
    }

    generateParkingSpots() {
        console.log('GERANDO VAGAS DO ESTACIONAMENTO...');
        this.parkingSpots = [];
        
        // CONFIGURAÇÃO DOS SETORES RENOMEADOS - TUDO EM MAIÚSCULO
        const sectorConfig = {
            'FRENTE': { start: 1, end: 30, pcd: 3, vip: 2 },
            'EDU': { start: 31, end: 60, pcd: 3, vip: 2 },
            'BAIXO': { start: 61, end: 130, pcd: 5, vip: 8 },
            'AUTO': { start: 131, end: 200, pcd: 5, vip: 8 }
        };
        
        let spotNumber = 1;
        
        for (const [sector, config] of Object.entries(sectorConfig)) {
            for (let i = config.start; i <= config.end; i++) {
                // Determina tipo da vaga - TUDO EM MAIÚSCULO
                let type = 'REGULAR';
                let special = null;
                
                if (spotNumber <= config.pcd) {
                    type = 'PCD';
                    special = 'PCD';
                } else if (spotNumber <= config.pcd + config.vip) {
                    type = 'VIP';
                    special = 'VIP';
                }
                
                // Determina localização - TUDO EM MAIÚSCULO
                let location = 'TERREO';
                if (sector === 'BAIXO' && spotNumber > 100) location = 'COBERTO';
                if (sector === 'AUTO') location = 'EXTERNO';
                
                this.parkingSpots.push({
                    id: spotNumber,
                    number: spotNumber,
                    sector: sector, // SETOR EM MAIÚSCULO
                    type: type, // TIPO EM MAIÚSCULO
                    special: special, // ESPECIAL EM MAIÚSCULO
                    location: location, // LOCALIZAÇÃO EM MAIÚSCULO
                    status: 'DISPONIVEL', // STATUS EM MAIÚSCULO
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
        
        console.log(`TOTAL DE VAGAS GERADAS: ${this.parkingSpots.length}`);
    }

    // CONVERTE DADOS EXISTENTES PARA NOVOS NOMES
    convertExistingData() {
        console.log('VERIFICANDO CONVERSÃO DE DADOS EXISTENTES...');
        
        // Mapa de conversão dos setores
        const sectorMap = {
            'A': 'FRENTE',
            'B': 'EDU',
            'C': 'BAIXO',
            'D': 'AUTO',
            'a': 'FRENTE',
            'b': 'EDU',
            'c': 'BAIXO',
            'd': 'AUTO'
        };
        
        let converted = false;
        
        // Converte vagas existentes
        this.parkingSpots.forEach(spot => {
            // Converte setor
            if (sectorMap[spot.sector]) {
                spot.sector = sectorMap[spot.sector];
                converted = true;
            }
            
            // Converte status para maiúsculo
            if (spot.status) {
                spot.status = spot.status.toUpperCase();
            }
            
            // Converte tipo para maiúsculo
            if (spot.type) {
                spot.type = spot.type.toUpperCase();
            }
            
            // Converte localização para maiúsculo
            if (spot.location) {
                spot.location = spot.location.toUpperCase();
            }
            
            // Converte características para maiúsculo
            if (spot.features && Array.isArray(spot.features)) {
                spot.features = spot.features.map(f => f.toUpperCase());
            }
        });
        
        // Converte atividades existentes
        this.activities.forEach(activity => {
            if (activity.description) {
                // Converte referências aos setores antigos
                activity.description = activity.description
                    .replace(/Setor A/gi, 'SETOR FRENTE')
                    .replace(/Setor B/gi, 'SETOR EDU')
                    .replace(/Setor C/gi, 'SETOR BAIXO')
                    .replace(/Setor D/gi, 'SETOR AUTO')
                    .replace(/Sector A/gi, 'SETOR FRENTE')
                    .replace(/Sector B/gi, 'SETOR EDU')
                    .replace(/Sector C/gi, 'SETOR BAIXO')
                    .replace(/Sector D/gi, 'SETOR AUTO');
                
                // Converte títulos para maiúsculo
                if (activity.title) {
                    activity.title = activity.title.toUpperCase();
                }
                
                converted = true;
            }
        });
        
        if (converted) {
            console.log('DADOS CONVERTIDOS PARA NOVOS NOMES DE SETORES');
            this.saveSpots();
            this.saveActivities();
        }
    }

    getSpotFeatures(type, location) {
        const features = [];
        
        if (type === 'PCD') features.push('AMPLIADA', 'SINALIZAÇÃO', 'RAMPA');
        if (type === 'VIP') features.push('COBERTA', 'MONITORADA', 'PRÓXIMA À ENTRADA');
        if (location === 'COBERTO') features.push('COBERTA');
        if (location === 'TERREO') features.push('TÉRREO');
        
        return features;
    }

    getSpotSize(type) {
        const sizes = {
            'PCD': { width: 3.5, length: 5.5 },
            'VIP': { width: 3.0, length: 5.0 },
            'REGULAR': { width: 2.5, length: 5.0 }
        };
        const upperType = type.toUpperCase();
        return sizes[upperType] || sizes.REGULAR;
    }

    getHourlyRate(type) {
        const base = this.settings.prices.firstHour;
        const upperType = type.toUpperCase();
        switch(upperType) {
            case 'PCD': return base * (1 - this.settings.prices.pcdDiscount);
            case 'VIP': return base * (1 - this.settings.prices.vipDiscount);
            default: return base;
        }
    }

    getDailyRate(type) {
        const base = this.settings.prices.daily;
        const upperType = type.toUpperCase();
        switch(upperType) {
            case 'PCD': return base * (1 - this.settings.prices.pcdDiscount);
            case 'VIP': return base * (1 - this.settings.prices.vipDiscount);
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
            console.error('ERRO AO CARREGAR CLIENTES:', error);
            this.clients = [];
        }
    }

    generateSampleClients() {
        this.clients = [
            {
                id: 1,
                type: 'REGULAR',
                name: 'JOÃO CARLOS MENDES',
                document: '123.456.789-00',
                email: 'joao@email.com',
                phone: '(11) 99999-9999',
                address: 'RUA DAS FLORES, 123 - CENTRO, SÃO PAULO/SP',
                category: 'GOLD',
                registrationDate: new Date('2023-01-15'),
                totalSpent: 2450.50,
                visits: 42,
                averageTime: 3.5,
                favoriteSpots: [15, 32, 78],
                notes: 'CLIENTE PREFERENCIAL - TRATAR COM CORTESIA',
                active: true
            },
            {
                id: 2,
                type: 'PCD',
                name: 'MARIA DA SILVA',
                document: '987.654.321-00',
                email: 'maria@email.com',
                phone: '(11) 98888-8888',
                address: 'AV. PAULISTA, 1000 - BELA VISTA, SÃO PAULO/SP',
                category: 'PCD',
                registrationDate: new Date('2023-03-20'),
                totalSpent: 1200.00,
                visits: 25,
                averageTime: 4.2,
                favoriteSpots: [5, 6, 7],
                pcdDocument: '123456789',
                notes: 'NECESSITA VAGA AMPLIADA',
                active: true
            },
            {
                id: 3,
                type: 'CORPORATE',
                name: 'EMPRESA XYZ LTDA',
                document: '12.345.678/0001-99',
                email: 'contato@xyz.com.br',
                phone: '(11) 3777-7777',
                address: 'AV. BRIGADEIRO FARIA LIMA, 1500 - ITAIM BIBI, SÃO PAULO/SP',
                category: 'CORPORATE',
                registrationDate: new Date('2023-02-10'),
                totalSpent: 8900.75,
                visits: 156,
                averageTime: 8.5,
                contactPerson: 'CARLOS ANDRADE',
                corporatePlan: 'PREMIUM',
                monthlyLimit: 5000.00,
                notes: 'CONTRATO CORPORATIVO - FATURA MENSAL',
                active: true
            },
            {
                id: 4,
                type: 'MONTHLY',
                name: 'ROBERTO ALMEIDA',
                document: '111.222.333-44',
                email: 'roberto@email.com',
                phone: '(11) 97777-7777',
                address: 'RUA AUGUSTA, 500 - CONSOLAÇÃO, SÃO PAULO/SP',
                category: 'MONTHLY',
                registrationDate: new Date('2023-04-05'),
                totalSpent: 1600.00,
                visits: 89,
                averageTime: 10.2,
                monthlyPlan: 'VIP',
                planStart: new Date('2023-11-01'),
                planEnd: new Date('2024-10-31'),
                paymentDay: 10,
                notes: 'PLANO MENSAL VIP - VAGA COBERTA',
                active: true
            }
        ];
    }

    loadVehicles() {
        try {
            const savedVehicles = localStorage.getItem('rb_valet_vehicles');
            if (savedVehicles) {
           