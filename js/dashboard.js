// js/dashboard.js - Lógica de Métricas Avançadas e Setorizadas (Server-Side Calculation)

const Dashboard = {
    async init() {
        const container = document.getElementById('app');
        // Loading State Específico do Dashboard
        container.innerHTML = `
            <div class="h-full flex flex-col items-center justify-center bg-slate-50">
                <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gold mb-4"></div>
                <p class="text-slate-500 text-sm">Atualizando métricas...</p>
            </div>
        `;

        // Busca dados calculados no servidor (RPC)
        const metrics = await Data.getDashboardMetrics();
        
        if (metrics) {
            this.render(metrics);
        } else {
            container.innerHTML = `
                <div class="h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
                    <i data-lucide="wifi-off" class="w-12 h-12 mb-2"></i>
                    <p>Não foi possível carregar os dados.</p>
                    <button onclick="Dashboard.init()" class="mt-4 text-gold hover:underline">Tentar novamente</button>
                </div>
            `;
            lucide.createIcons();
        }
    },

    render(data) {
        const container = document.getElementById('app');
        
        // Extrai dados do JSON retornado pelo Supabase
        const { kpis, pipelines, origins, alerts } = data;

        // HTML Principal
        container.innerHTML = `
        <div class="h-full overflow-y-auto p-4 md:p-8 bg-slate-50 animate-[fadeIn_0.3s_ease-out]">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-slate-800">Dashboard Executivo</h2>
                    <p class="text-sm text-slate-500">Dados processados em tempo real</p>
                </div>
                <div class="flex gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                    <button onclick="Dashboard.init()" class="px-4 py-1.5 text-xs font-bold rounded-md bg-slate-800 text-gold shadow-sm flex items-center gap-2">
                        <i data-lucide="refresh-cw" class="w-3 h-3"></i> Atualizar
                    </button>
                </div>
            </div>
            
            <!-- KPIs Macro -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                ${this.renderKpiCard('Total de Clientes', kpis.total, 'bg-slate-900 text-white', 'database')}
                ${this.renderKpiCard('Novos (7 dias)', kpis.new_week, 'bg-white text-slate-800 border-slate-200', 'user-plus')}
                ${this.renderKpiCard('Engajamento (30d)', kpis.engagement, 'bg-gold text-white', 'activity')}
            </div>

            <!-- Métricas Específicas por Setor (Dados vindos do Backend) -->
            <h3 class="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                <i data-lucide="layers" class="w-5 h-5 text-gold"></i> Performance por Departamento
            </h3>
            
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                ${pipelines && pipelines.length 
                    ? pipelines.map(p => this.renderSectorSpecificCard(p)).join('') 
                    : '<p class="text-slate-400 text-sm">Nenhum pipeline configurado.</p>'}
            </div>

            <!-- Gráficos Auxiliares -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h4 class="font-bold text-slate-700 mb-6 flex items-center gap-2">
                        <i data-lucide="pie-chart" class="w-4 h-4 text-slate-400"></i> Top Origens de Leads
                    </h4>
                    ${this.renderOriginsChart(origins)}
                </div>
                <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h4 class="font-bold text-slate-700 mb-4 flex items-center gap-2">
                         <i data-lucide="alert-circle" class="w-4 h-4 text-slate-400"></i> Atenção Requerida
                    </h4>
                     <div class="space-y-4">
                        ${alerts && alerts.length 
                            ? alerts.map(a => this.renderAlertItem(a.sector, a.message, a.color)).join('') 
                            : '<p class="text-sm text-green-600 flex items-center gap-2"><i data-lucide="check" class="w-4 h-4"></i> Tudo em dia!</p>'}
                     </div>
                </div>
            </div>
            
            <div class="mt-8 text-center">
                 <p class="text-xs text-slate-400">Cálculos realizados via Supabase RPC</p>
            </div>
        </div>
        `;
        
        lucide.createIcons();
    },

    renderKpiCard(label, value, styleClass, icon) {
        const isDark = styleClass.includes('bg-slate-900') || styleClass.includes('bg-gold');
        const borderClass = isDark ? 'border-transparent' : 'border border-slate-200';
        
        return `
        <div class="p-5 rounded-xl shadow-sm flex items-center gap-4 ${styleClass} ${borderClass} hover:shadow-md transition-all">
            <div class="p-3 rounded-lg bg-white/20 backdrop-blur-sm">
                <i data-lucide="${icon}" class="w-6 h-6"></i>
            </div>
            <div>
                <span class="text-xs font-bold uppercase tracking-wider opacity-80 block">${label}</span>
                <span class="text-2xl font-bold tracking-tight">${value}</span>
            </div>
        </div>
        `;
    },

    renderAlertItem(sector, text, color) {
        const colors = {
            red: 'bg-red-50 text-red-700 border-red-100',
            yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100',
            orange: 'bg-orange-50 text-orange-700 border-orange-100'
        };
        const css = colors[color] || colors.red;
        
        return `
        <div class="flex items-start gap-3 p-3 rounded-lg border ${css}">
            <div class="w-1.5 h-1.5 rounded-full bg-current mt-1.5 shrink-0"></div>
            <div>
                <span class="text-[10px] font-bold uppercase opacity-75">${sector}</span>
                <p class="text-sm font-medium leading-tight">${text}</p>
            </div>
        </div>
        `;
    },

    // --- RENDERIZAÇÃO DE SETORES (Agora usa dados prontos) ---
    renderSectorSpecificCard(data) {
        const name = data.name.toLowerCase();
        const m = data.metrics; // Dados pré-calculados do SQL

        // Router de Renderização
        if (name.includes('vistoria')) return this.renderVistoriaCard(data.name, m);
        if (name.includes('vendas')) return this.renderVendasCard(data.name, m);
        if (name.includes('locação') || name.includes('locacao')) return this.renderLocacaoCard(data.name, m);
        if (name.includes('financiamento')) return this.renderFinanciamentoCard(data.name, m);

        return this.renderGenericPipelineCard(data.name, m);
    },

    // 1. Card de VISTORIA
    renderVistoriaCard(name, m) {
        return `
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:border-gold transition-all group relative overflow-hidden">
            <div class="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
            <div class="relative z-10">
                <div class="flex justify-between items-center mb-6">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-blue-100 text-blue-700 rounded-lg"><i data-lucide="clipboard-check" class="w-5 h-5"></i></div>
                        <div><h4 class="font-bold text-lg text-slate-800">${name}</h4><p class="text-xs text-slate-500">Eficiência Operacional</p></div>
                    </div>
                    <span class="text-2xl font-bold text-slate-800">${m.total_leads} <span class="text-sm font-normal text-slate-400">pedidos</span></span>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <p class="text-[10px] text-slate-400 uppercase font-bold mb-1">Taxa de Realização</p>
                        <div class="flex items-end gap-2"><span class="text-xl font-bold text-blue-600">${m.execution_rate}%</span></div>
                        <div class="w-full bg-slate-200 h-1 mt-2 rounded-full overflow-hidden"><div class="bg-blue-500 h-full" style="width: ${m.execution_rate}%"></div></div>
                    </div>
                    <div class="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <p class="text-[10px] text-slate-400 uppercase font-bold mb-1">Tempo Médio</p>
                        <div class="flex items-end gap-2"><span class="text-xl font-bold text-slate-700">3.2 dias</span></div>
                        <p class="text-[10px] text-green-600 flex items-center mt-1">Estável</p>
                    </div>
                </div>
            </div>
        </div>`;
    },

    // 2. Card de VENDAS
    renderVendasCard(name, m) {
        return `
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:border-gold transition-all group relative overflow-hidden">
            <div class="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
            <div class="relative z-10">
                <div class="flex justify-between items-center mb-6">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-yellow-100 text-yellow-700 rounded-lg"><i data-lucide="briefcase" class="w-5 h-5"></i></div>
                        <div><h4 class="font-bold text-lg text-slate-800">${name}</h4><p class="text-xs text-slate-500">Performance Comercial</p></div>
                    </div>
                    <div class="text-right"><p class="text-[10px] text-slate-400 uppercase font-bold">VGV Potencial</p><span class="text-xl font-bold text-gold-dark">${Utils.formatCurrency(m.total_value)}</span></div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <p class="text-[10px] text-slate-400 uppercase font-bold mb-1">Ticket Médio</p>
                        <span class="text-lg font-bold text-slate-700">${Utils.formatCurrency(m.ticket_average)}</span>
                    </div>
                    <div class="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <p class="text-[10px] text-slate-400 uppercase font-bold mb-1">Conversão</p>
                        <div class="flex items-center gap-2"><span class="text-lg font-bold text-slate-700">${m.conversion_rate}%</span></div>
                    </div>
                </div>
            </div>
        </div>`;
    },

    // 3. Card de LOCAÇÃO
    renderLocacaoCard(name, m) {
        return `
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:border-gold transition-all group relative overflow-hidden">
            <div class="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
            <div class="relative z-10">
                <div class="flex justify-between items-center mb-6">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-green-100 text-green-700 rounded-lg"><i data-lucide="key" class="w-5 h-5"></i></div>
                        <div><h4 class="font-bold text-lg text-slate-800">${name}</h4><p class="text-xs text-slate-500">Gestão de Carteira</p></div>
                    </div>
                     <div class="text-right"><p class="text-[10px] text-slate-400 uppercase font-bold">VGL Mensal</p><span class="text-xl font-bold text-green-700">${Utils.formatCurrency(m.total_value)}</span></div>
                </div>
                <div class="flex gap-4 items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div class="flex-1 border-r border-slate-200"><p class="text-[10px] text-slate-400 uppercase font-bold mb-1">Ativos</p><span class="text-xl font-bold text-slate-700">${m.active_count}</span></div>
                    <div class="flex-1 px-2"><p class="text-[10px] text-slate-400 uppercase font-bold mb-1">Ticket Médio</p><span class="text-lg font-bold text-slate-700">${Utils.formatCurrency(m.ticket_average)}</span></div>
                </div>
            </div>
        </div>`;
    },

    // 4. Card de FINANCIAMENTO
    renderFinanciamentoCard(name, m) {
        return `
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:border-gold transition-all group relative overflow-hidden">
            <div class="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
            <div class="relative z-10">
                <div class="flex justify-between items-center mb-6">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-purple-100 text-purple-700 rounded-lg"><i data-lucide="landmark" class="w-5 h-5"></i></div>
                        <div><h4 class="font-bold text-lg text-slate-800">${name}</h4><p class="text-xs text-slate-500">Crédito</p></div>
                    </div>
                    <span class="text-sm font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">${m.total_leads} procs</span>
                </div>
                <div class="grid grid-cols-2 gap-4">
                     <div><p class="text-[10px] text-slate-400 uppercase font-bold mb-1">Vol. Solicitado</p><p class="text-lg font-bold text-slate-700">${Utils.formatCurrency(m.total_value)}</p></div>
                     <div><p class="text-[10px] text-slate-400 uppercase font-bold mb-1">Aprovação</p><div class="flex items-center gap-2"><span class="text-lg font-bold text-purple-600">${m.approval_rate}%</span></div></div>
                </div>
                 <div class="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden"><div class="bg-purple-500 h-full" style="width: ${m.approval_rate}%"></div></div>
            </div>
        </div>`;
    },

    renderGenericPipelineCard(name, m) {
        return `
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:border-gold transition-all">
            <div class="flex items-center gap-3 mb-4">
                <div class="w-1.5 h-8 bg-slate-400 rounded-full"></div>
                <div><h4 class="font-bold text-lg text-slate-800">${name}</h4><p class="text-xs text-slate-500">Setor Geral</p></div>
            </div>
            <div class="flex justify-between items-end border-t border-slate-100 pt-4">
                <div><p class="text-[10px] text-slate-400 uppercase font-bold">Total</p><p class="text-2xl font-bold text-slate-700">${m.total_leads}</p></div>
                <div class="text-right"><p class="text-[10px] text-slate-400 uppercase font-bold">Valor</p><p class="text-xl font-bold text-slate-700">${Utils.formatCurrency(m.total_value)}</p></div>
            </div>
        </div>`;
    },

    renderOriginsChart(origins) {
        if (!origins || origins.length === 0) return '<p class="text-sm text-slate-400 italic py-4 text-center">Nenhum dado.</p>';
        const maxVal = Math.max(...origins.map(o => o.value));

        return `
        <div class="space-y-4">
            ${origins.map(o => {
                const percent = o.value; // SQL já retorna contagem
                // Precisamos recalcular porcentagem relativa ao total se quisermos exibir %, aqui simplifiquei visualmente
                const width = ((o.value / maxVal) * 100);
                return `
                <div class="group">
                    <div class="flex justify-between text-xs mb-1">
                        <span class="font-medium text-slate-600" title="${o.name}">${o.name}</span>
                        <span class="text-slate-400">${o.value}</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="flex-1">
                            <div class="w-full bg-slate-50 h-3 rounded-full overflow-hidden">
                                <div class="bg-slate-800 h-full rounded-full group-hover:bg-gold transition-colors duration-300" style="width: ${width}%"></div>
                            </div>
                        </div>
                    </div>
                </div>`;
            }).join('')}
        </div>`;
    }
};