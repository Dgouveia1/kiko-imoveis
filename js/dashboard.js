// js/dashboard.js

const Dashboard = {
    async init() {
        const container = document.getElementById('app');
        container.innerHTML = '<div class="flex h-full items-center justify-center"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div></div>';
        
        const metrics = await Data.getDashboardMetrics();
        this.render(metrics);
    },

    render(metrics) {
        if (!metrics) return;
        const container = document.getElementById('app');
        const { kpis, pipelines } = metrics;

        // Renderiza os cards de pipeline
        const pipelineCards = pipelines.map(p => `
            <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-slate-100 rounded-lg text-slate-600">
                            <i data-lucide="activity" class="w-6 h-6"></i> 
                        </div>
                        <div>
                            <h3 class="font-bold text-slate-800 text-lg">${p.name}</h3>
                            <p class="text-xs text-slate-500">Pipeline Ativo</p>
                        </div>
                    </div>
                    ${p.waiting_response > 0 ? `
                        <span class="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                            ${p.waiting_response} aguardando
                        </span>
                    ` : '<span class="text-green-500 text-xs"><i data-lucide="check"></i> Em dia</span>'}
                </div>

                <div class="grid grid-cols-2 gap-4 mt-6">
                    <div class="p-3 bg-slate-50 rounded-lg">
                        <p class="text-xs text-slate-500 uppercase font-bold">Leads Totais</p>
                        <p class="text-xl font-bold text-slate-800">${p.total_leads}</p>
                    </div>
                    <div class="p-3 bg-slate-50 rounded-lg">
                        <p class="text-xs text-slate-500 uppercase font-bold">Volume (R$)</p>
                        <p class="text-xl font-bold text-gold-dark">${Utils.formatCurrency(p.total_value)}</p>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="p-8 h-full overflow-y-auto bg-slate-50">
                <header class="mb-8">
                    <h1 class="text-2xl font-bold text-slate-900">Dashboard Geral</h1>
                    <p class="text-slate-500">Visão consolidada da imobiliária</p>
                </header>

                <!-- KPIs Macro -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div class="bg-slate-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                        <div class="relative z-10">
                            <p class="text-slate-400 text-xs uppercase font-bold mb-1">Total Clientes</p>
                            <h2 class="text-4xl font-bold">${kpis.total_clients}</h2>
                        </div>
                        <i data-lucide="users" class="absolute right-4 bottom-4 w-16 h-16 text-white opacity-10"></i>
                    </div>

                    <div class="bg-red-600 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                        <div class="relative z-10">
                            <p class="text-red-100 text-xs uppercase font-bold mb-1">Fila de Espera</p>
                            <h2 class="text-4xl font-bold">${kpis.waiting_response}</h2>
                            <p class="text-xs mt-2 text-red-100">Clientes aguardando resposta</p>
                        </div>
                        <i data-lucide="message-square" class="absolute right-4 bottom-4 w-16 h-16 text-white opacity-20"></i>
                    </div>

                    <div class="bg-gold text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                         <div class="relative z-10">
                            <p class="text-yellow-100 text-xs uppercase font-bold mb-1">VGV Total (Estimado)</p>
                            <h2 class="text-3xl font-bold">${Utils.formatCurrency(kpis.total_value)}</h2>
                        </div>
                        <i data-lucide="dollar-sign" class="absolute right-4 bottom-4 w-16 h-16 text-white opacity-20"></i>
                    </div>
                </div>

                <h2 class="text-lg font-bold text-slate-800 mb-4">Performance por Setor</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    ${pipelineCards}
                </div>
            </div>
        `;
        
        lucide.createIcons();
    }
};