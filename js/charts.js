// Charts Manager - Sistema de Gráficos do Rio Park Vallet
class ChartManager {
    constructor() {
        // Verifica se Chart.js está carregado
        if (typeof Chart === 'undefined') {
            console.error('Chart.js não está carregado!');
            return;
        }
        
        this.occupationChart = null;
        this.revenueChart = null;
        this.revenuePeriod = '7d'; // Período padrão
        this.chartType = 'line'; // Tipo padrão para ocupação
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Botão para alternar visualização do gráfico de ocupação
        const toggleBtn = document.getElementById('toggle-occupation-view');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleOccupationChartType();
            });
        }

        // Seletor de período para faturamento
        const periodSelect = document.getElementById('revenue-period');
        if (periodSelect) {
            periodSelect.addEventListener('change', (e) => {
                this.revenuePeriod = e.target.value;
                this.updateRevenuePeriodText();
                if (window.parkingSystem) {
                    this.renderRevenueChart(window.parkingSystem.activities);
                }
            });
        }

        // Redimensionar gráficos quando a janela for redimensionada
        window.addEventListener('resize', this.debounce(() => {
            if (this.occupationChart) {
                this.occupationChart.resize();
            }
            if (this.revenueChart) {
                this.revenueChart.resize();
            }
        }, 250));
    }

    toggleOccupationChartType() {
        this.chartType = this.chartType === 'line' ? 'bar' : 'line';
        if (window.parkingSystem) {
            this.renderOccupationChart(window.parkingSystem.parkingSpots);
        }
        
        const toggleBtn = document.getElementById('toggle-occupation-view');
        if (toggleBtn) {
            toggleBtn.innerHTML = this.chartType === 'line' 
                ? '<i class="fas fa-chart-bar"></i>' 
                : '<i class="fas fa-chart-line"></i>';
            toggleBtn.title = this.chartType === 'line' 
                ? 'Mudar para gráfico de barras' 
                : 'Mudar para gráfico de linhas';
        }
    }

    updateRevenuePeriodText() {
        const periodText = document.getElementById('revenue-period-text');
        if (periodText) {
            const texts = {
                '7d': 'Últimos 7 dias',
                '15d': 'Últimos 15 dias',
                '30d': 'Últimos 30 dias'
            };
            periodText.textContent = texts[this.revenuePeriod] || 'Período selecionado';
        }
    }

    initCharts(parkingSpots, activities) {
        // Verifica se Chart.js está disponível
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js não está disponível. Gráficos não serão renderizados.');
            this.showChartFallback();
            return;
        }
        
        this.renderOccupationChart(parkingSpots);
        this.renderRevenueChart(activities);
        this.updateRevenuePeriodText();
    }

    renderOccupationChart(parkingSpots) {
        const ctx = document.getElementById('occupation-chart');
        if (!ctx) return;
        
        // Destroi gráfico anterior se existir
        if (this.occupationChart) {
            this.occupationChart.destroy();
        }
        
        // Calcula dados para as últimas 24 horas
        const now = new Date();
        const hours = [];
        const occupationData = [];
        
        // Limitar a 12 pontos para gráfico mais limpo
        for (let i = 11; i >= 0; i--) {
            const hour = new Date(now.getTime() - i * 2 * 60 * 60 * 1000); // A cada 2 horas
            hours.push(hour.getHours().toString().padStart(2, '0') + ':00');
            
            // Simulação de dados
            const baseOccupation = parkingSpots.filter(spot => spot.status === 'occupied').length;
            const totalSpots = parkingSpots.length;
            const percentage = (baseOccupation / totalSpots) * 100;
            const variation = Math.sin(i * 0.5) * 15; // Variação reduzida
            occupationData.push(Math.max(0, Math.min(percentage + variation, 100)));
        }
        
        const chartType = this.chartType || 'line';
        
        try {
            this.occupationChart = new Chart(ctx, {
                type: chartType,
                data: {
                    labels: hours,
                    datasets: [{
                        label: 'Taxa de Ocupação (%)',
                        data: occupationData,
                        borderColor: '#667eea',
                        backgroundColor: chartType === 'bar' 
                            ? 'rgba(102, 126, 234, 0.7)' 
                            : 'rgba(102, 126, 234, 0.1)',
                        borderWidth: chartType === 'line' ? 2 : 1,
                        fill: chartType === 'line',
                        tension: chartType === 'line' ? 0.4 : 0
                    }]
                },
                options: this.getChartOptions('Taxa de Ocupação (%)', 'Horário', '%', chartType)
            });
        } catch (error) {
            console.error('Erro ao criar gráfico de ocupação:', error);
            this.showChartError(ctx, 'Erro ao carregar gráfico de ocupação');
        }
    }

    renderRevenueChart(activities) {
        const ctx = document.getElementById('revenue-chart');
        if (!ctx) return;
        
        // Destroi gráfico anterior se existir
        if (this.revenueChart) {
            this.revenueChart.destroy();
        }
        
        // Determina número de dias baseado no período selecionado
        let days = 7;
        switch(this.revenuePeriod) {
            case '15d': days = 15; break;
            case '30d': days = 30; break;
        }
        
        // Calcula faturamento dos últimos N dias
        const daysData = [];
        const revenueData = [];
        const today = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
            
            // Formatação diferente baseada no número de dias
            let dayStr;
            if (days <= 7) {
                dayStr = date.toLocaleDateString('pt-BR', { weekday: 'short' });
            } else if (days <= 15) {
                dayStr = date.getDate().toString().padStart(2, '0') + '/' + 
                        (date.getMonth() + 1).toString().padStart(2, '0');
            } else {
                dayStr = date.getDate().toString().padStart(2, '0');
            }
            
            daysData.push(dayStr);
            
            // Calcula faturamento para o dia
            let dailyRevenue = 0;
            
            // Filtra atividades de pagamento deste dia
            const dayActivities = activities.filter(activity => {
                if (activity.type !== 'payment') return false;
                const activityDate = new Date(activity.time);
                return activityDate.toDateString() === date.toDateString();
            });
            
            // Soma valores das atividades
            dayActivities.forEach(activity => {
                const match = activity.description.match(/R\$ ([\d,]+)/);
                if (match) {
                    const value = parseFloat(match[1].replace(',', '.'));
                    dailyRevenue += value;
                }
            });
            
            // Se não houver atividades, gera dados simulados
            if (dailyRevenue === 0) {
                // Gera valores mais realistas baseados no dia da semana
                const dayOfWeek = date.getDay();
                const baseValue = dayOfWeek >= 5 ? 1200 : 800; // Finais de semana têm mais movimento
                dailyRevenue = Math.floor(baseValue + (Math.random() * 400) - 200);
            }
            
            revenueData.push(dailyRevenue);
        }
        
        try {
            this.revenueChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: daysData,
                    datasets: [{
                        label: 'Faturamento (R$)',
                        data: revenueData,
                        backgroundColor: 'rgba(102, 126, 234, 0.7)',
                        borderColor: 'rgba(102, 126, 234, 1)',
                        borderWidth: 1
                    }]
                },
                options: this.getChartOptions('Faturamento (R$)', 'Dias', 'R$', 'bar')
            });
        } catch (error) {
            console.error('Erro ao criar gráfico de faturamento:', error);
            this.showChartError(ctx, 'Erro ao carregar gráfico de faturamento');
        }
    }

    getChartOptions(yLabel, xLabel, unit, type) {
        const isBarChart = type === 'bar';
        
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { size: 12 },
                    bodyFont: { size: 12 },
                    padding: 10,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (unit === 'R$') {
                                label += 'R$ ' + context.parsed.y.toFixed(2);
                            } else if (unit === '%') {
                                label += context.parsed.y.toFixed(1) + '%';
                            } else {
                                label += context.parsed.y;
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: unit === '%' ? 100 : undefined,
                    title: {
                        display: true,
                        text: yLabel,
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            if (unit === 'R$') {
                                // Formata valores grandes
                                if (value >= 1000) {
                                    return 'R$ ' + (value/1000).toFixed(1) + 'k';
                                }
                                return 'R$ ' + value;
                            } else if (unit === '%') {
                                return value + '%';
                            }
                            return value;
                        },
                        maxTicksLimit: 6
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: xLabel,
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: {
                            size: 11
                        },
                        maxRotation: 45,
                        minRotation: 0
                    }
                }
            },
            elements: {
                line: {
                    tension: 0.4
                },
                point: {
                    radius: isBarChart ? 0 : 3,
                    hoverRadius: 5
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            animation: {
                duration: 750
            }
        };
    }

    showChartFallback() {
        // Mostra mensagem alternativa quando Chart.js não está disponível
        const chartContainers = document.querySelectorAll('.chart-wrapper');
        chartContainers.forEach(container => {
            container.innerHTML = `
                <div class="chart-fallback">
                    <i class="fas fa-chart-line"></i>
                    <p>Gráficos temporariamente indisponíveis</p>
                    <small>Recarregue a página ou verifique sua conexão</small>
                </div>
            `;
        });
    }

    showChartError(element, message) {
        // Mostra mensagem de erro no elemento do gráfico
        element.parentElement.innerHTML = `
            <div class="chart-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
                <button class="btn-secondary retry-chart">Tentar novamente</button>
            </div>
        `;
        
        // Adiciona evento ao botão de tentar novamente
        const retryBtn = element.parentElement.querySelector('.retry-chart');
        if (retryBtn && window.parkingSystem) {
            retryBtn.addEventListener('click', () => {
                this.initCharts(window.parkingSystem.parkingSpots, window.parkingSystem.activities);
            });
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Método para limpar gráficos (útil ao mudar de página)
    destroyCharts() {
        if (this.occupationChart) {
            this.occupationChart.destroy();
            this.occupationChart = null;
        }
        if (this.revenueChart) {
            this.revenueChart.destroy();
            this.revenueChart = null;
        }
    }
}

// Função global para inicialização
function initCharts(parkingSpots, activities) {
    if (!window.chartManager) {
        window.chartManager = new ChartManager();
    }
    window.chartManager.initCharts(parkingSpots, activities);
}

// Atualiza gráficos quando a janela é redimensionada (com debounce)
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (window.chartManager && window.chartManager.occupationChart) {
            window.chartManager.occupationChart.resize();
        }
        if (window.chartManager && window.chartManager.revenueChart) {
            window.chartManager.revenueChart.resize();
        }
    }, 250);
});

// Verifica se Chart.js está carregado antes de inicializar
document.addEventListener('DOMContentLoaded', () => {
    // Adiciona CSS para fallback
    const style = document.createElement('style');
    style.textContent = `
        .chart-fallback, .chart-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            text-align: center;
            color: #666;
        }
        
        .chart-fallback i, .chart-error i {
            font-size: 3rem;
            margin-bottom: 15px;
            color: #ccc;
        }
        
        .chart-error i {
            color: #e74c3c;
        }
        
        .chart-fallback p, .chart-error p {
            margin: 10px 0;
            font-size: 1rem;
        }
        
        .chart-fallback small, .chart-error small {
            font-size: 0.85rem;
            color: #999;
        }
        
        .chart-error button {
            margin-top: 15px;
        }
    `;
    document.head.appendChild(style);
});
