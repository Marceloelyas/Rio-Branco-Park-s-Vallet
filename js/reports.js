class ReportGenerator {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const generateBtn = document.getElementById('generate-report-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                this.generateReport();
            });
        }

        const reportType = document.getElementById('report-type');
        if (reportType) {
            reportType.addEventListener('change', (e) => {
                this.updateDateInput(e.target.value);
            });
        }

        // Inicializa input de data
        this.updateDateInput('daily');
    }

    updateDateInput(reportType) {
        const dateInput = document.getElementById('report-date');
        const today = new Date().toISOString().split('T')[0];
        
        switch(reportType) {
            case 'daily':
                dateInput.type = 'date';
                dateInput.value = today;
                break;
            case 'weekly':
                dateInput.type = 'week';
                dateInput.value = this.getCurrentWeek();
                break;
            case 'monthly':
                dateInput.type = 'month';
                dateInput.value = today.substr(0, 7);
                break;
        }
    }

    getCurrentWeek() {
        const now = new Date();
        const oneJan = new Date(now.getFullYear(), 0, 1);
        const numberOfDays = Math.floor((now - oneJan) / (24 * 60 * 60 * 1000));
        const weekNumber = Math.ceil((now.getDay() + 1 + numberOfDays) / 7);
        
        return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
    }

    generateReport() {
        const reportType = document.getElementById('report-type').value;
        const dateValue = document.getElementById('report-date').value;
        
        let reportData;
        
        switch(reportType) {
            case 'daily':
                reportData = this.generateDailyReport(dateValue);
                break;
            case 'weekly':
                reportData = this.generateWeeklyReport(dateValue);
                break;
            case 'monthly':
                reportData = this.generateMonthlyReport(dateValue);
                break;
            default:
                reportData = this.generateDailyReport(new Date().toISOString().split('T')[0]);
        }
        
        this.renderReport(reportData, reportType, dateValue);
    }

    generateDailyReport(date) {
        // Carrega dados do localStorage
        const activities = JSON.parse(localStorage.getItem('parkingActivities') || '[]');
        const parkingSpots = JSON.parse(localStorage.getItem('parkingSpots') || '[]');
        
        const reportDate = new Date(date);
        const dayStart = new Date(reportDate.setHours(0, 0, 0, 0));
        const dayEnd = new Date(reportDate.setHours(23, 59, 59, 999));
        
        // Filtra atividades do dia
        const dayActivities = activities.filter(activity => {
            const activityDate = new Date(activity.time);
            return activityDate >= dayStart && activityDate <= dayEnd;
        });
        
        // Calcula estatísticas
        const entries = dayActivities.filter(a => a.type === 'entry').length;
        const exits = dayActivities.filter(a => a.type === 'exit').length;
        const payments = dayActivities.filter(a => a.type === 'payment').length;
        
        // Calcula faturamento
        let revenue = 0;
        dayActivities.forEach(activity => {
            if (activity.type === 'payment') {
                const match = activity.description.match(/R\$ ([\d,]+)/);
                if (match) {
                    revenue += parseFloat(match[1].replace(',', '.'));
                }
            }
        });
        
        // Encontra hora de pico
        const hourCounts = {};
        dayActivities.forEach(activity => {
            if (activity.type === 'entry') {
                const hour = new Date(activity.time).getHours();
                hourCounts[hour] = (hourCounts[hour] || 0) + 1;
            }
        });
        
        let peakHour = 'N/A';
        let peakCount = 0;
        Object.entries(hourCounts).forEach(([hour, count]) => {
            if (count > peakCount) {
                peakCount = count;
                peakHour = `${hour}:00`;
            }
        });
        
        // Vagas ocupadas no final do dia
        const occupiedSpots = parkingSpots.filter(spot => spot.status === 'occupied').length;
        
        return {
            type: 'daily',
            date: date,
            entries: entries,
            exits: exits,
            payments: payments,
            revenue: revenue,
            peakHour: peakHour,
            occupiedSpots: occupiedSpots,
            activities: dayActivities
        };
    }

    generateWeeklyReport(weekValue) {
        // Lógica similar para relatório semanal
        const [year, week] = weekValue.split('-W');
        const activities = JSON.parse(localStorage.getItem('parkingActivities') || '[]');
        
        // Calcula datas da semana
        const weekStart = this.getDateOfISOWeek(week, year);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        // Filtra atividades da semana
        const weekActivities = activities.filter(activity => {
            const activityDate = new Date(activity.time);
            return activityDate >= weekStart && activityDate <= weekEnd;
        });
        
        // Agrupa por dia
        const dailyStats = {};
        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart);
            day.setDate(day.getDate() + i);
            const dayKey = day.toISOString().split('T')[0];
            
            dailyStats[dayKey] = {
                date: dayKey,
                entries: 0,
                exits: 0,
                revenue: 0,
                dayName: day.toLocaleDateString('pt-BR', { weekday: 'short' })
            };
        }
        
        // Processa atividades
        weekActivities.forEach(activity => {
            const activityDate = new Date(activity.time).toISOString().split('T')[0];
            if (dailyStats[activityDate]) {
                if (activity.type === 'entry') dailyStats[activityDate].entries++;
                if (activity.type === 'exit') dailyStats[activityDate].exits++;
                if (activity.type === 'payment') {
                    const match = activity.description.match(/R\$ ([\d,]+)/);
                    if (match) {
                        dailyStats[activityDate].revenue += parseFloat(match[1].replace(',', '.'));
                    }
                }
            }
        });
        
        // Calcula totais
        const totals = Object.values(dailyStats).reduce((acc, day) => {
            acc.entries += day.entries;
            acc.exits += day.exits;
            acc.revenue += day.revenue;
            return acc;
        }, { entries: 0, exits: 0, revenue: 0 });
        
        return {
            type: 'weekly',
            week: weekValue,
            startDate: weekStart.toISOString().split('T')[0],
            endDate: weekEnd.toISOString().split('T')[0],
            dailyStats: Object.values(dailyStats),
            totals: totals,
            activities: weekActivities
        };
    }

    generateMonthlyReport(monthValue) {
        // Lógica similar para relatório mensal
        const [year, month] = monthValue.split('-');
        const activities = JSON.parse(localStorage.getItem('parkingActivities') || '[]');
        
        // Calcula datas do mês
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 0);
        
        // Filtra atividades do mês
        const monthActivities = activities.filter(activity => {
            const activityDate = new Date(activity.time);
            return activityDate >= monthStart && activityDate <= monthEnd;
        });
        
        // Agrupa por semana
        const weeklyStats = {};
        let currentWeek = 1;
        
        for (let day = new Date(monthStart); day <= monthEnd; day.setDate(day.getDate() + 1)) {
            const weekNumber = this.getWeekNumber(day);
            const weekKey = `${year}-W${weekNumber.toString().padStart(2, '0')}`;
            
            if (!weeklyStats[weekKey]) {
                weeklyStats[weekKey] = {
                    week: weekKey,
                    entries: 0,
                    exits: 0,
                    revenue: 0
                };
            }
        }
        
        // Processa atividades
        monthActivities.forEach(activity => {
            const activityDate = new Date(activity.time);
            const weekNumber = this.getWeekNumber(activityDate);
            const weekKey = `${year}-W${weekNumber.toString().padStart(2, '0')}`;
            
            if (weeklyStats[weekKey]) {
                if (activity.type === 'entry') weeklyStats[weekKey].entries++;
                if (activity.type === 'exit') weeklyStats[weekKey].exits++;
                if (activity.type === 'payment') {
                    const match = activity.description.match(/R\$ ([\d,]+)/);
                    if (match) {
                        weeklyStats[weekKey].revenue += parseFloat(match[1].replace(',', '.'));
                    }
                }
            }
        });
        
        // Calcula totais
        const totals = Object.values(weeklyStats).reduce((acc, week) => {
            acc.entries += week.entries;
            acc.exits += week.exits;
            acc.revenue += week.revenue;
            return acc;
        }, { entries: 0, exits: 0, revenue: 0 });
        
        return {
            type: 'monthly',
            month: monthValue,
            startDate: monthStart.toISOString().split('T')[0],
            endDate: monthEnd.toISOString().split('T')[0],
            weeklyStats: Object.values(weeklyStats),
            totals: totals,
            activities: monthActivities
        };
    }

    getDateOfISOWeek(week, year) {
        const simple = new Date(year, 0, 1 + (week - 1) * 7);
        const dow = simple.getDay();
        const ISOweekStart = simple;
        if (dow <= 4) {
            ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
        } else {
            ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
        }
        return ISOweekStart;
    }

    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    renderReport(reportData, reportType, dateValue) {
        const reportContent = document.getElementById('report-content');
        
        let html = `
            <div class="report-header">
                <h3>Relatório ${this.getReportTypeName(reportType)}</h3>
                <p>Período: ${this.formatDateRange(reportData, reportType)}</p>
                <div class="report-actions">
                    <button class="btn-secondary" onclick="reportGenerator.printReport()">
                        <i class="fas fa-print"></i> Imprimir
                    </button>
                    <button class="btn-primary" onclick="reportGenerator.downloadReport()">
                        <i class="fas fa-download"></i> Download
                    </button>
                </div>
            </div>
        `;
        
        if (reportType === 'daily') {
            html += this.renderDailyReport(reportData);
        } else if (reportType === 'weekly') {
            html += this.renderWeeklyReport(reportData);
        } else if (reportType === 'monthly') {
            html += this.renderMonthlyReport(reportData);
        }
        
        reportContent.innerHTML = html;
        
        // Adiciona gráficos
        setTimeout(() => {
            this.renderReportCharts(reportData, reportType);
        }, 100);
    }

    renderDailyReport(data) {
        return `
            <div class="report-stats">
                <div class="stat-grid">
                    <div class="stat-item">
                        <h4>Entradas</h4>
                        <p class="stat-value">${data.entries}</p>
                    </div>
                    <div class="stat-item">
                        <h4>Saídas</h4>
                        <p class="stat-value">${data.exits}</p>
                    </div>
                    <div class="stat-item">
                        <h4>Pagamentos</h4>
                        <p class="stat-value">${data.payments}</p>
                    </div>
                    <div class="stat-item">
                        <h4>Faturamento</h4>
                        <p class="stat-value">R$ ${data.revenue.toFixed(2)}</p>
                    </div>
                    <div class="stat-item">
                        <h4>Hora de Pico</h4>
                        <p class="stat-value">${data.peakHour}</p>
                    </div>
                    <div class="stat-item">
                        <h4>Vagas Ocupadas</h4>
                        <p class="stat-value">${data.occupiedSpots}</p>
                    </div>
                </div>
                
                <div class="charts-container">
                    <div class="chart-wrapper">
                        <h4>Atividades por Hora</h4>
                        <canvas id="daily-hourly-chart" height="200"></canvas>
                    </div>
                </div>
                
                <div class="activities-list">
                    <h4>Atividades Detalhadas</h4>
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Horário</th>
                                <th>Tipo</th>
                                <th>Descrição</th>
                                <th>Vaga</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.activities.map(activity => `
                                <tr>
                                    <td>${new Date(activity.time).toLocaleTimeString('pt-BR')}</td>
                                    <td><span class="badge badge-${activity.type}">${this.getActivityTypeName(activity.type)}</span></td>
                                    <td>${activity.description}</td>
                                    <td>${activity.spot || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    renderWeeklyReport(data) {
        return `
            <div class="report-stats">
                <div class="summary-card">
                    <h4>Resumo Semanal</h4>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <span>Total de Entradas:</span>
                            <strong>${data.totals.entries}</strong>
                        </div>
                        <div class="summary-item">
                            <span>Total de Saídas:</span>
                            <strong>${data.totals.exits}</strong>
                        </div>
                        <div class="summary-item">
                            <span>Faturamento Total:</span>
                            <strong>R$ ${data.totals.revenue.toFixed(2)}</strong>
                        </div>
                        <div class="summary-item">
                            <span>Média Diária:</span>
                            <strong>R$ ${(data.totals.revenue / 7).toFixed(2)}</strong>
                        </div>
                    </div>
                </div>
                
                <div class="charts-container">
                    <div class="chart-wrapper">
                        <h4>Faturamento por Dia</h4>
                        <canvas id="weekly-revenue-chart" height="200"></canvas>
                    </div>
                    <div class="chart-wrapper">
                        <h4>Movimentação por Dia</h4>
                        <canvas id="weekly-movement-chart" height="200"></canvas>
                    </div>
                </div>
                
                <div class="daily-breakdown">
                    <h4>Detalhamento por Dia</h4>
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Dia</th>
                                <th>Entradas</th>
                                <th>Saídas</th>
                                <th>Faturamento</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.dailyStats.map(day => `
                                <tr>
                                    <td>${day.dayName}</td>
                                    <td>${day.entries}</td>
                                    <td>${day.exits}</td>
                                    <td>R$ ${day.revenue.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    renderMonthlyReport(data) {
        return `
            <div class="report-stats">
                <div class="summary-card">
                    <h4>Resumo Mensal</h4>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <span>Total de Entradas:</span>
                            <strong>${data.totals.entries}</strong>
                        </div>
                        <div class="summary-item">
                            <span>Total de Saídas:</span>
                            <strong>${data.totals.exits}</strong>
                        </div>
                        <div class="summary-item">
                            <span>Faturamento Total:</span>
                            <strong>R$ ${data.totals.revenue.toFixed(2)}</strong>
                        </div>
                        <div class="summary-item">
                            <span>Média Semanal:</span>
                            <strong>R$ ${(data.totals.revenue / 4).toFixed(2)}</strong>
                        </div>
                    </div>
                </div>
                
                <div class="charts-container">
                    <div class="chart-wrapper">
                        <h4>Faturamento por Semana</h4>
                        <canvas id="monthly-revenue-chart" height="200"></canvas>
                    </div>
                    <div class="chart-wrapper">
                        <h4>Movimentação por Semana</h4>
                        <canvas id="monthly-movement-chart" height="200"></canvas>
                    </div>
                </div>
                
                <div class="weekly-breakdown">
                    <h4>Detalhamento por Semana</h4>
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Semana</th>
                                <th>Entradas</th>
                                <th>Saídas</th>
                                <th>Faturamento</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.weeklyStats.map(week => `
                                <tr>
                                    <td>${week.week}</td>
                                    <td>${week.entries}</td>
                                    <td>${week.exits}</td>
                                    <td>R$ ${week.revenue.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    renderReportCharts(data, reportType) {
        if (reportType === 'daily') {
            this.renderDailyCharts(data);
        } else if (reportType === 'weekly') {
            this.renderWeeklyCharts(data);
        } else if (reportType === 'monthly') {
            this.renderMonthlyCharts(data);
        }
    }

    renderDailyCharts(data) {
        // Agrupa atividades por hora
        const hourlyData = {};
        for (let i = 0; i < 24; i++) {
            hourlyData[i] = { entries: 0, exits: 0, payments: 0 };
        }
        
        data.activities.forEach(activity => {
            const hour = new Date(activity.time).getHours();
            if (hourlyData[hour]) {
                hourlyData[hour][activity.type + 's']++;
            }
        });
        
        // Cria gráfico
        const ctx = document.getElementById('daily-hourly-chart');
        if (!ctx) return;
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: Object.keys(hourlyData).map(h => `${h}h`),
                datasets: [
                    {
                        label: 'Entradas',
                        data: Object.values(hourlyData).map(d => d.entries),
                        borderColor: '#2ecc71',
                        backgroundColor: 'rgba(46, 204, 113, 0.1)',
                        borderWidth: 2,
                        tension: 0.4
                    },
                    {
                        label: 'Saídas',
                        data: Object.values(hourlyData).map(d => d.exits),
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        borderWidth: 2,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    }

    getReportTypeName(type) {
        const names = {
            'daily': 'Diário',
            'weekly': 'Semanal',
            'monthly': 'Mensal'
        };
        return names[type] || type;
    }

    getActivityTypeName(type) {
        const names = {
            'entry': 'Entrada',
            'exit': 'Saída',
            'payment': 'Pagamento'
        };
        return names[type] || type;
    }

    formatDateRange(data, type) {
        switch(type) {
            case 'daily':
                return new Date(data.date).toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            case 'weekly':
                return `${new Date(data.startDate).toLocaleDateString('pt-BR')} a ${new Date(data.endDate).toLocaleDateString('pt-BR')}`;
            case 'monthly':
                return new Date(data.startDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            default:
                return data.date;
        }
    }

    printReport() {
        window.print();
    }

    downloadReport() {
        const reportContent = document.getElementById('report-content');
        const reportType = document.getElementById('report-type').value;
        const dateValue = document.getElementById('report-date').value;
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Relatório Rio Park Vallet - ${this.getReportTypeName(reportType)}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #1a1a2e; }
                    .report-header { border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-bottom: 20px; }
                    .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
                    .stat-item { background: #f8f9fa; padding: 15px; border-radius: 5px; }
                    .stat-value { font-size: 24px; font-weight: bold; color: #667eea; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background: #667eea; color: white; }
                    .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="report-header">
                    <h1>Rio Park Vallet - Relatório ${this.getReportTypeName(reportType)}</h1>
                    <p>Período: ${this.formatDateRange(
                        this.generateReportData(reportType, dateValue),
                        reportType
                    )}</p>
                    <p>Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</p>
                </div>
                ${reportContent.innerHTML}
                <div class="footer">
                    <p>Sistema Rio Park Vallet - Todos os direitos reservados</p>
                    <p>www.rioparkvallet.com.br</p>
                </div>
            </body>
            </html>
        `;
        
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-${reportType}-${dateValue}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    generateReportData(reportType, dateValue) {
        // Método auxiliar para gerar dados do relatório
        switch(reportType) {
            case 'daily':
                return this.generateDailyReport(dateValue);
            case 'weekly':
                return this.generateWeeklyReport(dateValue);
            case 'monthly':
                return this.generateMonthlyReport(dateValue);
            default:
                return {};
        }
    }
}

// Inicializa o gerador de relatórios
document.addEventListener('DOMContentLoaded', () => {
    window.reportGenerator = new ReportGenerator();
});
