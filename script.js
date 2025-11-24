// script.js

// --- DADOS (MOCK DATA) ---
// ESTRUTURA ATUALIZADA: Vendas separado de Financiamento
const DEPARTMENTS = [
    { 
        id: 'locacao', 
        name: 'Locação', 
        stages: ['Contato Inicial', 'Visita Agendada', 'Proposta', 'Documentação', 'Contrato Assinado'] 
    },
    { 
        id: 'vendas', 
        name: 'Vendas', 
        stages: ['Triagem', 'Visita', 'Proposta', 'Negociação', 'Contrato Compra e Venda'] 
    },
    { 
        id: 'financiamento', 
        name: 'Financiamento', 
        stages: ['Coleta Documentos', 'Simulação', 'Análise de Crédito', 'Avaliação Engenharia', 'Emissão Contrato', 'Registro'] 
    },
    { 
        id: 'vistoria', 
        name: 'Vistoria', 
        stages: ['Solicitada', 'Agendada', 'Realizada', 'Em Análise', 'Concluída'] 
    }
];

// Estado Global da Aplicação
const STATE = {
    view: 'kanban',
    activeDeptId: 'vendas', // Começa na aba de Vendas para visualizar a mudança
    searchQuery: '',
    modalOpen: null,
    activeModalTab: 'chat',
    activeFilters: {
        tags: [],
        type: '',
        minValue: '',
        maxValue: ''
    },
    leads: [],
    notifications: []
};

// Inicialização
function init() {
    loadData();
    renderApp();
    setupEventListeners();
    startSimulation();
}

// Carregar dados do localStorage
function loadData() {
    const savedLeads = localStorage.getItem('kikobim_leads_v2'); // Mudei a chave para não conflitar com dados antigos
    const savedNotifications = localStorage.getItem('kikobim_notifications');
    
    if (savedLeads) {
        STATE.leads = JSON.parse(savedLeads);
    } else {
        // Dados padrão atualizados com a nova estrutura
        STATE.leads = [
            { 
                id: 'l1', 
                name: 'João Silva', 
                phone: '+55 11 99999-1111', 
                dept: 'locacao', 
                stage: 'Contato Inicial', 
                type: 'Inquilino', 
                unread: 2, 
                lastActive: '10 min', 
                lastMsg: 'Olá, vi o apto no centro.', 
                value: 2500, 
                tags: ['Urgente', 'Fiador'], 
                messages: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            { 
                id: 'l2', 
                name: 'Maria Souza', 
                phone: '+55 11 98888-2222', 
                dept: 'locacao', 
                stage: 'Visita Agendada', 
                type: 'Locador', 
                unread: 0, 
                lastActive: '2h', 
                lastMsg: 'Confirmado para terça às 14h.', 
                value: 4200, 
                tags: ['Exclusividade'], 
                messages: [],
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                updatedAt: new Date().toISOString()
            },
            // Lead de VENDAS (Comercial)
            { 
                id: 'l3', 
                name: 'Carlos Oliveira', 
                phone: '+55 11 97777-3333', 
                dept: 'vendas', 
                stage: 'Negociação', 
                type: 'Comprador', 
                unread: 1, 
                lastActive: '1d', 
                lastMsg: 'A proposta de 440 mil foi aceita?', 
                value: 450000, 
                tags: ['Investidor', 'À Vista'], 
                messages: [],
                createdAt: new Date(Date.now() - 172800000).toISOString(),
                updatedAt: new Date().toISOString()
            },
            // Lead de FINANCIAMENTO (Processo Bancário)
            { 
                id: 'l_fin1', 
                name: 'Fernanda Lima', 
                phone: '+55 11 91234-5678', 
                dept: 'financiamento', 
                stage: 'Análise de Crédito', 
                type: 'Comprador', 
                unread: 0, 
                lastActive: '3h', 
                lastMsg: 'Enviei os comprovantes de renda.', 
                value: 650000, 
                tags: ['MCMV', 'Primeiro Imóvel'], 
                messages: [],
                createdAt: new Date(Date.now() - 100000000).toISOString(),
                updatedAt: new Date().toISOString()
            },
            { 
                id: 'l_fin2', 
                name: 'Ricardo Santos', 
                phone: '+55 11 98765-4321', 
                dept: 'financiamento', 
                stage: 'Avaliação Engenharia', 
                type: 'Comprador', 
                unread: 3, 
                lastActive: '1h', 
                lastMsg: 'O engenheiro já foi ao imóvel?', 
                value: 890000, 
                tags: ['Bradesco'], 
                messages: [],
                createdAt: new Date(Date.now() - 200000000).toISOString(),
                updatedAt: new Date().toISOString()
            },
            { 
                id: 'l4', 
                name: 'Ana Pereira', 
                phone: '+55 11 96666-4444', 
                dept: 'vistoria', 
                stage: 'Agendada', 
                type: 'Inquilino', 
                unread: 0, 
                lastActive: '30 min', 
                lastMsg: 'A chave fica na portaria?', 
                value: 0, 
                tags: [], 
                messages: [],
                createdAt: new Date(Date.now() - 259200000).toISOString(),
                updatedAt: new Date().toISOString()
            },
            { 
                id: 'l5', 
                name: 'Roberto Costa', 
                phone: '+55 11 95555-5555', 
                dept: 'locacao', 
                stage: 'Documentação', 
                type: 'Inquilino', 
                unread: 5, 
                lastActive: '5 min', 
                lastMsg: 'Enviei o holerite.', 
                value: 1800, 
                tags: ['Seguro Fiança'], 
                messages: [],
                createdAt: new Date(Date.now() - 345600000).toISOString(),
                updatedAt: new Date().toISOString()
            },
        ];
        
        // Popula mensagens iniciais
        STATE.leads.forEach(l => {
            if(l.messages.length === 0) {
                l.messages = [
                    { id: 1, text: 'Olá, gostaria de saber mais.', sender: 'lead', time: '10:30' },
                    { id: 2, text: `Olá ${l.name}! Sou da KikoBim.`, sender: 'agent', time: '10:32' }
                ];
            }
        });
        
        saveData();
    }
    
    if (savedNotifications) {
        STATE.notifications = JSON.parse(savedNotifications);
    }
}

// Salvar dados no localStorage
function saveData() {
    localStorage.setItem('kikobim_leads_v2', JSON.stringify(STATE.leads));
    localStorage.setItem('kikobim_notifications', JSON.stringify(STATE.notifications));
}

// Helper para cores das tags
function getTagColorClasses(tag) {
    const colors = {
        'Urgente': 'bg-red-50 text-red-700 border-red-200',
        'Investidor': 'bg-slate-800 text-[#E6C35C] border-slate-700',
        'À Vista': 'bg-green-50 text-green-700 border-green-200',
        'Fiador': 'bg-blue-50 text-blue-700 border-blue-200',
        'Exclusividade': 'bg-[#F7F2D6] text-[#8F7320] border-[#EEDD9D]',
        'Seguro Fiança': 'bg-slate-100 text-slate-700 border-slate-200',
        'MCMV': 'bg-teal-50 text-teal-700 border-teal-200',
        'Bradesco': 'bg-red-50 text-red-800 border-red-200',
        'Itaú': 'bg-orange-50 text-orange-700 border-orange-200',
        'Caixa': 'bg-blue-50 text-blue-700 border-blue-200',
        'default': 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[tag] || colors['default'];
}

// --- FUNÇÕES DE RENDERIZAÇÃO PRINCIPAL ---
function renderApp() {
    const app = document.getElementById('app');
    
    // Header
    const headerHtml = `
        <header class="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-md z-20 h-18 shrink-0">
            <div class="flex items-center gap-4">
                <div class="relative group cursor-pointer">
                    <div class="flex items-baseline gap-1">
                        <i data-lucide="home" class="text-gold w-8 h-8 fill-current stroke-slate-900 stroke-2"></i>
                        <div class="flex flex-col">
                            <h1 class="font-serif font-bold text-2xl text-gold leading-none tracking-tight">
                                KB <span class="text-white font-sans font-light">KikoBim</span>
                            </h1>
                            <span class="text-[10px] text-gold-light opacity-80 uppercase tracking-[0.2em] font-medium ml-1">Imóveis</span>
                        </div>
                    </div>
                </div>
                <div class="h-8 w-[1px] bg-slate-700 hidden sm:block mx-2"></div>
                <div class="hidden sm:block">
                    <p class="text-xs text-slate-400 font-medium">
                        ${STATE.view === 'kanban' ? 'Gestão de Leads' : 'Dashboard Executivo'}
                    </p>
                </div>
            </div>

            ${STATE.view === 'kanban' ? `
            <div class="flex-1 max-w-md mx-6 relative group hidden md:block">
                <i data-lucide="search" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4"></i>
                <input 
                    type="text" 
                    id="search-input"
                    placeholder="Buscar lead..."
                    value="${STATE.searchQuery}"
                    class="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-full text-sm text-slate-200 placeholder-slate-500 focus:ring-2 ring-gold focus:bg-slate-800 focus:border-transparent transition-all shadow-inner outline-none"
                />
            </div>
            ` : '<div></div>'}

            <div class="flex items-center gap-4">
                <div class="flex items-center gap-3 cursor-pointer hover:bg-slate-800 p-1.5 rounded-full pr-3 transition-colors group">
                     <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-yellow-500 to-yellow-700 ring-2 ring-slate-700 shadow-md flex items-center justify-center text-slate-900 font-bold text-xs">JS</div>
                     <div class="hidden lg:block text-left">
                       <p class="text-xs font-bold text-slate-200 leading-none">João Silva</p>
                       <p class="text-[10px] text-slate-500 leading-none mt-1 text-gold">KikoBim Agent</p>
                     </div>
                </div>
            </div>
        </header>
    `;

    let contentHtml = STATE.view === 'kanban' ? renderKanban() : renderDashboard();

    const navHtml = `
        <nav class="bg-white border-t border-slate-200 px-2 pb-safe pt-2 flex justify-around items-center shrink-0 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] h-20 sm:h-auto">
            <div class="flex w-full max-w-lg justify-between items-center mx-auto">
                <button onclick="changeView('kanban')" class="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl group ${STATE.view === 'kanban' ? 'text-slate-900' : 'text-slate-400'}">
                    <div class="p-1.5 rounded-full mb-1 ${STATE.view === 'kanban' ? 'bg-gold-light text-gold-dark' : ''}">
                        <i data-lucide="layout" class="w-5 h-5"></i>
                    </div>
                    <span class="text-[10px] font-medium ${STATE.view === 'kanban' ? 'font-bold' : ''}">Pipeline</span>
                </button>

                <button onclick="changeView('dashboard')" class="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl group ${STATE.view === 'dashboard' ? 'text-slate-900' : 'text-slate-400'}">
                    <div class="p-1.5 rounded-full mb-1 ${STATE.view === 'dashboard' ? 'bg-gold-light text-gold-dark' : ''}">
                        <i data-lucide="bar-chart-2" class="w-5 h-5"></i>
                    </div>
                    <span class="text-[10px] font-medium ${STATE.view === 'dashboard' ? 'font-bold' : ''}">Métricas</span>
                </button>

                <div class="relative -top-6">
                     <button onclick="openAddLeadModal()" class="bg-gold text-white p-4 rounded-full shadow-lg hover-bg-gold transform hover:scale-105 transition-all ring-4 ring-slate-50 flex items-center justify-center">
                       <i data-lucide="plus" class="w-7 h-7"></i>
                     </button>
                </div>

                <button class="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl text-slate-400">
                    <div class="p-1.5 rounded-full mb-1"><i data-lucide="users" class="w-5 h-5"></i></div>
                    <span class="text-[10px] font-medium">Equipe</span>
                </button>

                <button onclick="toggleNotifications()" class="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl text-slate-400 relative">
                    <div class="p-1.5 rounded-full mb-1"><i data-lucide="bell" class="w-5 h-5"></i></div>
                    <span class="text-[10px] font-medium">Alertas</span>
                    ${STATE.notifications.filter(n => !n.read).length > 0 ? 
                        `<span class="absolute top-1 right-1/4 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">${STATE.notifications.filter(n => !n.read).length}</span>` : 
                        ''}
                </button>
            </div>
        </nav>
    `;

    app.innerHTML = headerHtml + `<div class="flex-1 overflow-hidden bg-slate-100 flex flex-col">${contentHtml}</div>` + navHtml;
    
    renderModal();
    renderAddLeadModal();
    lucide.createIcons();

    if (document.getElementById('search-input')) {
        document.getElementById('search-input').addEventListener('input', (e) => {
            STATE.searchQuery = e.target.value;
            renderApp();
            const input = document.getElementById('search-input');
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
        });
    }
}

// --- KANBAN BOARD ---
function renderKanban() {
    const activeDept = DEPARTMENTS.find(d => d.id === STATE.activeDeptId);
    const filteredLeads = filterLeads();
    const totalValue = filteredLeads.reduce((acc, curr) => acc + curr.value, 0);

    // Tabs - Mostra todos os departamentos incluindo o novo "Financiamento"
    const tabsHtml = DEPARTMENTS.map(d => `
        <button onclick="changeDept('${d.id}')" class="py-1.5 px-4 text-xs font-semibold rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${STATE.activeDeptId === d.id ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}">
            <span class="w-1.5 h-1.5 rounded-full ${STATE.activeDeptId === d.id ? 'bg-gold' : 'bg-slate-300'}"></span>
            ${d.name}
        </button>
    `).join('');

    // Filtros
    const filtersHtml = renderFilters();

    // Columns
    const columnsHtml = activeDept.stages.map(stage => {
        const stageLeads = filteredLeads.filter(l => l.stage === stage);
        
        const cardsHtml = stageLeads.map(lead => `
            <div 
                draggable="true" 
                ondragstart="dragStart(event, '${lead.id}')"
                onclick="openModal('${lead.id}')"
                class="bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-grab hover:shadow-md hover:border-gold-light transition-all group relative select-none"
            >
                <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200">
                            ${lead.name.substring(0, 2)}
                        </div>
                        <div>
                            <h4 class="font-bold text-sm text-slate-800 leading-tight">${lead.name}</h4>
                            <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">${lead.type}</span>
                        </div>
                    </div>
                    ${lead.unread > 0 ? `<span class="flex items-center justify-center min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold px-1 rounded-full animate-bounce shadow-sm">${lead.unread}</span>` : ''}
                </div>
                
                <div class="flex flex-wrap gap-1 mb-3">
                    ${lead.tags.map(tag => `<span class="text-[10px] px-2 py-0.5 rounded border ${getTagColorClasses(tag)} font-medium">${tag}</span>`).join('')}
                </div>
                
                <div class="bg-slate-50 p-2.5 rounded border border-slate-100 mb-3">
                    <p class="text-xs text-slate-500 line-clamp-2 italic">"${lead.lastMsg}"</p>
                </div>

                <div class="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-50">
                    <div class="flex items-center gap-1.5">
                        <i data-lucide="activity" class="w-3 h-3 ${lead.lastActive === 'Agora' ? 'text-green-500' : ''}"></i>
                        ${lead.lastActive}
                    </div>
                    <div class="flex items-center gap-1 text-slate-600 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                        <i data-lucide="message-square" class="w-3 h-3 text-green-500"></i>
                        WhatsApp
                    </div>
                </div>
                
                ${lead.value > 0 ? `
                    <div class="absolute -top-2 -right-2 bg-gold text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                        R$ ${lead.value.toLocaleString('pt-BR')}
                    </div>
                ` : ''}
            </div>
        `).join('');

        return `
            <div 
                class="flex-shrink-0 w-80 flex flex-col rounded-xl border-2 border-transparent bg-slate-100 drop-zone transition-colors"
                ondrop="drop(event, '${stage}')"
                ondragover="allowDrop(event)"
                ondragleave="leaveDrop(event)"
            >
                <div class="p-3 flex items-center justify-between sticky top-0 backdrop-blur-sm rounded-t-xl z-10 border-b border-slate-200/50">
                    <h3 class="font-bold text-xs text-slate-600 uppercase tracking-wider flex items-center gap-2">
                        ${stage}
                        <span class="bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm">${stageLeads.length}</span>
                    </h3>
                    <button class="text-slate-400 hover:text-gold hover:bg-white p-1 rounded transition-colors"><i data-lucide="plus" class="w-4 h-4"></i></button>
                </div>
                <div class="flex-1 overflow-y-auto p-2 space-y-3 custom-scrollbar">
                    ${cardsHtml}
                    ${stageLeads.length === 0 ? `
                        <div class="h-32 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 gap-2">
                           <div class="p-2 bg-slate-100 rounded-full"><i data-lucide="plus" class="w-4 h-4"></i></div>
                           <span class="text-xs font-medium">Vazio</span>
                         </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="bg-white border-b border-slate-200 px-6 py-2 flex items-center gap-4 shadow-sm z-10 shrink-0 overflow-x-auto no-scrollbar">
            <div class="flex items-center bg-slate-100 p-1 rounded-lg shrink-0">
                ${tabsHtml}
            </div>
            <div class="h-6 w-[1px] bg-slate-200 hidden sm:block"></div>
            <div class="flex items-center gap-6 hidden md:flex">
                <div>
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Leads Ativos</p>
                    <p class="text-sm font-bold text-slate-700">${filteredLeads.length} <span class="text-slate-400 font-normal">clientes</span></p>
                </div>
                <div>
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Potencial</p>
                    <p class="text-sm font-bold text-gold-dark">R$ ${totalValue.toLocaleString('pt-BR')}</p>
                </div>
            </div>
            <div class="ml-auto flex items-center gap-2">
                <button onclick="toggleFilters()" class="text-slate-500 hover:text-slate-700 flex items-center gap-1 text-sm">
                    <i data-lucide="filter" class="w-4 h-4"></i>
                    Filtros
                </button>
                <button onclick="exportLeads()" class="text-slate-500 hover:text-slate-700 flex items-center gap-1 text-sm">
                    <i data-lucide="download" class="w-4 h-4"></i>
                    Exportar
                </button>
            </div>
        </div>
        ${filtersHtml}
        <div class="flex-1 overflow-x-auto overflow-y-hidden p-6 bg-slate-50">
            <div class="flex gap-5 h-full min-w-max pb-2">
                ${columnsHtml}
            </div>
        </div>
    `;
}

// --- FILTROS ---
function renderFilters() {
    if (!STATE.showFilters) return '';
    
    const allTags = [...new Set(STATE.leads.flatMap(lead => lead.tags))];
    const allTypes = [...new Set(STATE.leads.map(lead => lead.type))];
    
    return `
        <div class="bg-white border-b border-slate-200 p-4 shadow-sm">
            <div class="flex flex-wrap gap-4 items-center">
                <div>
                    <label class="block text-xs text-slate-500 font-medium mb-1">Tags</label>
                    <div class="flex flex-wrap gap-2">
                        ${allTags.map(tag => `
                            <button 
                                onclick="toggleFilter('tags', '${tag}')" 
                                class="text-xs px-3 py-1 rounded-full border transition-all ${STATE.activeFilters.tags.includes(tag) ? 'filter-active' : 'bg-white border-slate-200 text-slate-600'}"
                            >
                                ${tag}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <div>
                    <label class="block text-xs text-slate-500 font-medium mb-1">Tipo</label>
                    <select onchange="setFilter('type', this.value)" class="text-xs border border-slate-200 rounded-lg px-3 py-1 outline-none focus:ring-1 focus:ring-gold">
                        <option value="">Todos</option>
                        ${allTypes.map(type => `
                            <option value="${type}" ${STATE.activeFilters.type === type ? 'selected' : ''}>${type}</option>
                        `).join('')}
                    </select>
                </div>
                
                <div>
                    <label class="block text-xs text-slate-500 font-medium mb-1">Valor Mín.</label>
                    <input 
                        type="number" 
                        value="${STATE.activeFilters.minValue}" 
                        onchange="setFilter('minValue', this.value)"
                        placeholder="R$ 0" 
                        class="text-xs w-24 border border-slate-200 rounded-lg px-3 py-1 outline-none focus:ring-1 focus:ring-gold"
                    >
                </div>
                
                <div>
                    <label class="block text-xs text-slate-500 font-medium mb-1">Valor Máx.</label>
                    <input 
                        type="number" 
                        value="${STATE.activeFilters.maxValue}" 
                        onchange="setFilter('maxValue', this.value)"
                        placeholder="R$ 999.999" 
                        class="text-xs w-24 border border-slate-200 rounded-lg px-3 py-1 outline-none focus:ring-1 focus:ring-gold"
                    >
                </div>
                
                <div class="ml-auto">
                    <button onclick="clearFilters()" class="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
                        <i data-lucide="x" class="w-3 h-3"></i>
                        Limpar Filtros
                    </button>
                </div>
            </div>
        </div>
    `;
}

function filterLeads() {
    let filtered = STATE.leads.filter(l => 
        l.dept === STATE.activeDeptId && 
        l.name.toLowerCase().includes(STATE.searchQuery.toLowerCase())
    );
    
    // Aplicar filtros
    if (STATE.activeFilters.tags.length > 0) {
        filtered = filtered.filter(lead => 
            STATE.activeFilters.tags.some(tag => lead.tags.includes(tag))
        );
    }
    
    if (STATE.activeFilters.type) {
        filtered = filtered.filter(lead => lead.type === STATE.activeFilters.type);
    }
    
    if (STATE.activeFilters.minValue) {
        filtered = filtered.filter(lead => lead.value >= parseInt(STATE.activeFilters.minValue));
    }
    
    if (STATE.activeFilters.maxValue) {
        filtered = filtered.filter(lead => lead.value <= parseInt(STATE.activeFilters.maxValue));
    }
    
    return filtered;
}

// --- DASHBOARD ---
function renderDashboard() {
    const totalLeads = STATE.leads.length;
    const activeLeads = STATE.leads.filter(l => l.unread > 0 || l.lastActive === 'Agora').length;
    const totalValue = STATE.leads.reduce((acc, curr) => acc + curr.value, 0);
    const conversionRate = calculateConversionRate();
    
    return `
        <div class="h-full overflow-y-auto p-8 bg-slate-50">
            <div class="flex justify-between items-center mb-8">
                <div><h2 class="text-xl font-bold text-slate-800">Visão Geral</h2><p class="text-sm text-slate-500">Performance KikoBim</p></div>
                <div class="flex bg-white p-1 rounded-lg shadow-sm border border-slate-200">
                   <button class="px-4 py-1.5 text-xs font-semibold rounded-md bg-slate-800 text-gold">Todos</button>
                   <button class="px-4 py-1.5 text-xs font-semibold rounded-md text-slate-500 hover:bg-slate-50">Locação</button>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                ${renderKPICard('VGV Total', `R$ ${(totalValue/1000).toFixed(1)}K`, '+12%', 'up', 'dollar-sign', 'text-gold', 'bg-slate-900')}
                ${renderKPICard('Leads Ativos', activeLeads.toString(), '+8%', 'up', 'users', 'text-blue-400', 'bg-slate-900')}
                ${renderKPICard('Conversão', `${conversionRate}%`, '-0.5%', 'down', 'target', 'text-white', 'bg-gold')}
                ${renderKPICard('Tempo Médio', '15 min', '-2 min', 'up', 'clock', 'text-slate-300', 'bg-slate-800')}
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div class="lg:col-span-2 chart-container">
                   <h3 class="font-bold text-slate-800 flex items-center gap-2 mb-6"><i data-lucide="filter" class="text-gold w-4 h-4"></i> Funil de Vendas</h3>
                   <div class="space-y-4">${renderFunnelBar('Contato', '100%', 'bg-slate-800')}${renderFunnelBar('Visita', '62%', 'bg-slate-600')}${renderFunnelBar('Proposta', '26%', 'bg-gold')}${renderFunnelBar('Contrato', '11%', 'bg-gold-light')}</div>
                </div>
                <div class="chart-container">
                   <h3 class="font-bold text-slate-800 flex items-center gap-2 mb-6"><i data-lucide="pie-chart" class="text-slate-400 w-4 h-4"></i> Origem</h3>
                   <div class="space-y-3">${renderSourceRow('Portal Imob', '45%', 'bg-slate-800')}${renderSourceRow('Instagram', '30%', 'bg-gold')}${renderSourceRow('Google', '10%', 'bg-gray-300')}</div>
                </div>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="chart-container">
                    <h3 class="font-bold text-slate-800 flex items-center gap-2 mb-6"><i data-lucide="trending-up" class="text-gold w-4 h-4"></i> Leads por Departamento</h3>
                    <div class="space-y-4">${renderDepartmentStats()}</div>
                </div>
                <div class="chart-container">
                    <h3 class="font-bold text-slate-800 flex items-center gap-2 mb-6"><i data-lucide="clock" class="text-slate-400 w-4 h-4"></i> Atividade Recente</h3>
                    <div class="space-y-3">${renderRecentActivity()}</div>
                </div>
            </div>
        </div>
    `;
}

function renderKPICard(l, v, c, t, i, col, bg) {
    return `<div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"><div class="flex justify-between items-start mb-4"><div class="p-3 rounded-lg ${bg} ${col}"><i data-lucide="${i}" class="w-5 h-5"></i></div><div class="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${t==='up'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}">${t==='up'?'<i data-lucide="arrow-up-right" class="w-3 h-3"></i>':'<i data-lucide="arrow-down-right" class="w-3 h-3"></i>'} ${c}</div></div><div><p class="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">${l}</p><h3 class="text-2xl font-bold text-slate-800">${v}</h3></div></div>`;
}

function renderFunnelBar(l, w, c) { 
    return `<div class="relative group"><div class="flex justify-between text-sm mb-1 z-10 relative"><span class="font-medium text-slate-700">${l}</span><span class="font-bold text-slate-900">${w}</span></div><div class="w-full h-8 bg-slate-100 rounded-md overflow-hidden relative"><div class="h-full ${c} rounded-md transition-all duration-1000 ease-out" style="width: ${w}"></div></div></div>`; 
}

function renderSourceRow(n, v, c) { 
    return `<div class="flex items-center gap-3"><div class="w-3 h-3 rounded-full ${c}"></div><div class="flex-1"><div class="flex justify-between text-sm mb-1"><span class="text-slate-600">${n}</span><span class="font-bold text-slate-800">${v}</span></div><div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden"><div class="h-full ${c}" style="width: ${v}"></div></div></div></div>`; 
}

function renderDepartmentStats() {
    return DEPARTMENTS.map(dept => {
        const deptLeads = STATE.leads.filter(l => l.dept === dept.id);
        const percentage = Math.round((deptLeads.length / STATE.leads.length) * 100) || 0;
        
        return `
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-3 h-3 rounded-full bg-gold"></div>
                    <span class="text-sm font-medium text-slate-700">${dept.name}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-sm font-bold text-slate-800">${deptLeads.length}</span>
                    <span class="text-xs text-slate-500">(${percentage}%)</span>
                </div>
            </div>
        `;
    }).join('');
}

function renderRecentActivity() {
    const recentLeads = [...STATE.leads]
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 5);
    
    return recentLeads.map(lead => `
        <div class="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
            <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                ${lead.name.substring(0, 2)}
            </div>
            <div class="flex-1">
                <p class="text-sm font-medium text-slate-800">${lead.name}</p>
                <p class="text-xs text-slate-500">${lead.dept} • ${lead.stage}</p>
            </div>
            <span class="text-xs text-slate-400">${formatRelativeTime(lead.updatedAt)}</span>
        </div>
    `).join('');
}

function calculateConversionRate() {
    // Atualizado para considerar o sucesso em Financiamento e Vendas separadamente
    const completed = STATE.leads.filter(l => 
        (l.dept === 'locacao' && l.stage === 'Contrato Assinado') ||
        (l.dept === 'vendas' && l.stage === 'Contrato Compra e Venda') ||
        (l.dept === 'financiamento' && l.stage === 'Registro') ||
        (l.dept === 'vistoria' && l.stage === 'Concluída')
    ).length;
    
    return ((completed / STATE.leads.length) * 100).toFixed(1);
}

function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours} h`;
    return `${diffDays} dias`;
}

// --- MODAL DE LEAD ---
function renderModal() {
    const container = document.getElementById('modal-container');
    if (!STATE.modalOpen) {
        container.classList.add('hidden');
        return;
    }

    const lead = STATE.leads.find(l => l.id === STATE.modalOpen);
    if (!lead) return;
    const activeDept = DEPARTMENTS.find(d => d.id === lead.dept);

    container.classList.remove('hidden');
    
    // Conteúdo das Abas
    let tabContent = '';
    if (STATE.activeModalTab === 'chat') {
        const messagesHtml = lead.messages.map(msg => `
            <div class="flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}">
                <div class="max-w-[70%] p-3 rounded-xl shadow-sm relative text-sm leading-relaxed ${msg.sender === 'agent' ? 'bg-[#d9fdd3] text-slate-900 rounded-tr-none' : 'bg-white text-slate-900 rounded-tl-none'}">
                    ${msg.text}
                    <div class="text-[10px] text-slate-500 text-right mt-1 opacity-70">${msg.time}</div>
                </div>
            </div>
        `).join('');

        tabContent = `
            <div class="flex flex-col h-full bg-[#efeae2] relative rounded-b-xl overflow-hidden">
                <div class="absolute inset-0 opacity-[0.06]" style="background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')"></div>
                <div class="flex-1 overflow-y-auto p-6 space-y-4 relative z-10" id="chat-scroll">
                    <div class="flex justify-center mb-6"><span class="bg-white/80 text-slate-600 text-xs py-1 px-4 rounded-full shadow-sm">Hoje</span></div>
                    ${messagesHtml}
                </div>
                <div class="p-3 bg-slate-100 flex items-center gap-2 border-t border-slate-200 relative z-10">
                    <input type="text" id="chat-input" placeholder="Digite uma mensagem..." class="flex-1 border-none rounded-lg py-2.5 px-4 focus:ring-1 focus:ring-gold shadow-sm text-sm outline-none" onkeydown="if(event.key === 'Enter') sendMessage()">
                    <button onclick="sendMessage()" class="p-2.5 bg-gold text-white rounded-full hover-bg-gold shadow-md active:scale-95"><i data-lucide="send" class="w-4 h-4"></i></button>
                </div>
            </div>
        `;
    } else if (STATE.activeModalTab === 'docs') {
        tabContent = `
            <div class="p-8 h-full overflow-y-auto">
                <div class="border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center text-slate-500 mb-8 bg-white hover:border-gold hover:bg-gold-light/20 transition-all cursor-pointer" onclick="document.getElementById('file-input').click()">
                    <div class="bg-slate-100 p-4 rounded-full mb-3"><i data-lucide="file-text" class="w-8 h-8 text-slate-400"></i></div>
                    <span class="font-medium text-slate-700">Clique para fazer upload</span>
                    <input type="file" id="file-input" class="hidden" onchange="handleFileUpload(this.files)">
                </div>
                <h3 class="font-bold text-slate-700 mb-4">Documentos Anexados</h3>
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-white p-4 rounded-lg border border-slate-200 flex items-center gap-3 shadow-sm hover:border-gold transition-colors">
                        <div class="bg-red-50 p-2 text-red-600 rounded"><i data-lucide="file" class="w-5 h-5"></i></div>
                        <div class="flex-1"><p class="text-sm font-semibold">Renda.pdf</p><p class="text-xs text-slate-400">1.2 MB</p></div>
                    </div>
                </div>
            </div>
        `;
    } else if (STATE.activeModalTab === 'notes') {
        tabContent = `
            <div class="p-8 h-full overflow-y-auto bg-gold-light/30">
                <div class="mb-8">
                    <label class="block text-sm font-bold text-slate-700 mb-2">Nota Interna</label>
                    <textarea id="note-input" class="w-full p-4 border border-slate-200 rounded-xl shadow-sm focus:ring-2 ring-gold outline-none bg-white resize-none" rows="3"></textarea>
                    <button onclick="saveNote()" class="mt-2 bg-gold text-white px-4 py-1.5 rounded-lg font-bold text-xs hover-bg-gold shadow-sm">Salvar</button>
                </div>
                <div class="space-y-4" id="notes-container">
                    <div class="bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                        <div class="flex justify-between"><span class="font-bold text-sm text-slate-800">Corretor Marcos</span><span class="text-[10px] text-slate-400">2h</span></div>
                        <p class="text-sm text-slate-600 mt-1">Cliente interessado no apto do centro.</p>
                    </div>
                </div>
            </div>
        `;
    } else if (STATE.activeModalTab === 'edit') {
        tabContent = `
            <div class="p-8 h-full overflow-y-auto">
                <h3 class="font-bold text-slate-700 mb-6">Editar Lead</h3>
                <form id="edit-lead-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                        <input type="text" value="${lead.name}" class="form-input" name="name" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                        <input type="text" value="${lead.phone}" class="form-input" name="phone" required>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Departamento</label>
                            <select class="form-input" name="dept">
                                ${DEPARTMENTS.map(d => `<option value="${d.id}" ${lead.dept === d.id ? 'selected' : ''}>${d.name}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Estágio</label>
                            <select class="form-input" name="stage">
                                ${activeDept.stages.map(s => `<option value="${s}" ${lead.stage === s ? 'selected' : ''}>${s}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                            <select class="form-input" name="type">
                                <option value="Inquilino" ${lead.type === 'Inquilino' ? 'selected' : ''}>Inquilino</option>
                                <option value="Locador" ${lead.type === 'Locador' ? 'selected' : ''}>Locador</option>
                                <option value="Comprador" ${lead.type === 'Comprador' ? 'selected' : ''}>Comprador</option>
                                <option value="Vendedor" ${lead.type === 'Vendedor' ? 'selected' : ''}>Vendedor</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                            <input type="number" value="${lead.value}" class="form-input" name="value">
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Tags</label>
                        <div class="flex flex-wrap gap-2 mb-2" id="tags-container">
                            ${lead.tags.map(tag => `
                                <span class="badge ${getTagColorClasses(tag)} flex items-center gap-1">
                                    ${tag}
                                    <button type="button" onclick="removeTag('${tag}')" class="text-xs"><i data-lucide="x" class="w-3 h-3"></i></button>
                                </span>
                            `).join('')}
                        </div>
                        <div class="flex gap-2">
                            <input type="text" id="new-tag-input" placeholder="Nova tag" class="form-input flex-1">
                            <button type="button" onclick="addTag()" class="btn-primary text-sm">Adicionar</button>
                        </div>
                    </div>
                    <div class="flex justify-end gap-3 pt-4">
                        <button type="button" onclick="closeModal()" class="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">Cancelar</button>
                        <button type="submit" class="btn-primary">Salvar Alterações</button>
                    </div>
                </form>
            </div>
        `;
    }

    // Construção da Timeline (Pipeline)
    const timelineHtml = activeDept.stages.map((stage, idx) => {
        const currentIdx = activeDept.stages.indexOf(lead.stage);
        const isCurrent = idx === currentIdx;
        const isPast = idx < currentIdx;
        
        let circleClass = isCurrent ? 'bg-gold border-gold scale-125 ring-4 ring-gold-light' : isPast ? 'bg-[#E0C975] border-[#E0C975]' : 'bg-white border-slate-300';
        let textClass = isCurrent ? 'font-bold text-gold-dark' : isPast ? 'text-slate-600' : 'text-slate-400';

        return `
            <div class="relative pb-6 last:pb-0 pl-4 border-l-2 ${isPast ? 'border-[#E0C975]' : 'border-slate-200'}">
                <div class="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 transition-all duration-300 ${circleClass}"></div>
                <p class="text-sm leading-none ${textClass}">${stage}</p>
                ${isCurrent ? '<span class="block mt-1 text-[10px] text-gold font-medium animate-pulse">Em andamento</span>' : ''}
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="bg-white w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex overflow-hidden ring-1 ring-slate-200 animate-[fadeIn_0.2s_ease-out]">
            <!-- Sidebar -->
            <div class="w-80 bg-slate-50 border-r border-slate-200 flex flex-col">
                <div class="p-6 border-b border-slate-200 bg-white">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="w-14 h-14 rounded-full bg-slate-800 border-2 border-gold text-gold flex items-center justify-center text-xl font-bold">${lead.name.substring(0,2)}</div>
                        <div>
                            <h2 class="font-bold text-slate-900 leading-tight">${lead.name}</h2>
                            <div class="mt-1"><span class="text-[10px] px-2 py-0.5 rounded-full bg-gold-light text-gold-dark border border-gold-light font-bold">${activeDept.name}</span></div>
                        </div>
                    </div>
                    <div class="space-y-3 mt-4">
                        <div class="flex items-center gap-3 text-sm text-slate-600"><i data-lucide="phone" class="w-4 h-4"></i> ${lead.phone}</div>
                        <div class="flex items-center gap-3 text-sm text-slate-600"><i data-lucide="user" class="w-4 h-4"></i> ${lead.type}</div>
                        <div class="flex items-center gap-3 text-sm text-slate-600"><i data-lucide="calendar" class="w-4 h-4"></i> Criado em ${formatDate(lead.createdAt)}</div>
                        <div class="pt-2 flex flex-wrap gap-2">
                            ${lead.tags.map(tag => `<span class="text-[10px] px-2 py-0.5 rounded border ${getTagColorClasses(tag)}">${tag}</span>`).join('')}
                            <button class="text-[10px] text-slate-400 border border-dashed border-slate-300 px-2 py-0.5 rounded hover:border-slate-400 hover:text-slate-600">+ Tag</button>
                        </div>
                    </div>
                </div>
                <div class="p-6 flex-1 overflow-y-auto bg-slate-50/50">
                    <h3 class="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider flex items-center gap-2"><i data-lucide="trending-up" class="w-3 h-3"></i> Pipeline</h3>
                    <div class="relative space-y-0 ml-1">
                        ${timelineHtml}
                    </div>
                </div>
                <div class="p-4 bg-white border-t border-slate-200 mt-auto">
                    <button class="w-full bg-slate-800 text-gold py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-900 flex items-center justify-center gap-2 transition-colors shadow-md">
                        <i data-lucide="brain-circuit" class="w-4 h-4"></i> IA: Gerar Resposta
                    </button>
                </div>
            </div>
            
            <!-- Main Content -->
            <div class="flex-1 flex flex-col min-w-0 bg-white">
                <div class="h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-white shrink-0">
                    <div class="flex items-center gap-1 h-full">
                        <button onclick="changeModalTab('chat')" class="h-full border-b-2 px-4 text-sm font-medium transition-all ${STATE.activeModalTab === 'chat' ? 'border-gold text-gold-dark bg-gold-light/20' : 'border-transparent text-slate-500 hover:text-slate-700'}">WhatsApp</button>
                        <button onclick="changeModalTab('docs')" class="h-full border-b-2 px-4 text-sm font-medium transition-all ${STATE.activeModalTab === 'docs' ? 'border-gold text-gold-dark bg-gold-light/20' : 'border-transparent text-slate-500 hover:text-slate-700'}">Docs</button>
                        <button onclick="changeModalTab('notes')" class="h-full border-b-2 px-4 text-sm font-medium transition-all ${STATE.activeModalTab === 'notes' ? 'border-gold text-gold-dark bg-gold-light/20' : 'border-transparent text-slate-500 hover:text-slate-700'}">Notas</button>
                        <button onclick="changeModalTab('edit')" class="h-full border-b-2 px-4 text-sm font-medium transition-all ${STATE.activeModalTab === 'edit' ? 'border-gold text-gold-dark bg-gold-light/20' : 'border-transparent text-slate-500 hover:text-slate-700'}">Editar</button>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="text-right mr-2 hidden lg:block">
                            <p class="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Potencial do Deal</p>
                            <p class="text-sm font-bold text-green-600">R$ ${lead.value.toLocaleString('pt-BR')}</p>
                        </div>
                        <div class="h-8 w-[1px] bg-slate-200 mx-2"></div>
                        <button onclick="closeModal()" class="p-2 hover:bg-slate-100 rounded-full transition-colors"><i data-lucide="x" class="w-5 h-5 text-slate-400"></i></button>
                    </div>
                </div>
                <div class="flex-1 bg-slate-50 relative">${tabContent}</div>
            </div>
        </div>
    `;
    
    // Configurar evento de submit do formulário de edição
    if (STATE.activeModalTab === 'edit') {
        document.getElementById('edit-lead-form').addEventListener('submit', function(e) {
            e.preventDefault();
            updateLead(lead.id, new FormData(this));
        });
    }
    
    setTimeout(() => {
        const scroll = document.getElementById('chat-scroll');
        if(scroll) scroll.scrollTop = scroll.scrollHeight;
    }, 50);
}

// --- MODAL ADICIONAR LEAD ---
function renderAddLeadModal() {
    const container = document.getElementById('add-lead-modal');
    if (!STATE.showAddLeadModal) {
        container.classList.add('hidden');
        return;
    }
    
    container.classList.remove('hidden');
    
    container.innerHTML = `
        <div class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden ring-1 ring-slate-200 animate-[fadeIn_0.2s_ease-out]">
            <div class="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <h2 class="text-xl font-bold text-slate-800">Adicionar Novo Lead</h2>
                <button onclick="closeAddLeadModal()" class="p-2 hover:bg-slate-200 rounded-full transition-colors"><i data-lucide="x" class="w-5 h-5 text-slate-500"></i></button>
            </div>
            <form id="add-lead-form" class="p-6 space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
                        <input type="text" name="name" class="form-input" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Telefone *</label>
                        <input type="text" name="phone" class="form-input" required>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Departamento *</label>
                        <select name="dept" class="form-input" onchange="updateStages(this.value)" required>
                            <option value="">Selecione...</option>
                            ${DEPARTMENTS.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Estágio *</label>
                        <select name="stage" class="form-input" id="stage-select" required>
                            <option value="">Selecione o departamento primeiro</option>
                        </select>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Tipo *</label>
                        <select name="type" class="form-input" required>
                            <option value="">Selecione...</option>
                            <option value="Inquilino">Inquilino</option>
                            <option value="Locador">Locador</option>
                            <option value="Comprador">Comprador</option>
                            <option value="Vendedor">Vendedor</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                        <input type="number" name="value" class="form-input" placeholder="0">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Tags</label>
                    <div class="flex flex-wrap gap-2 mb-2" id="new-lead-tags-container"></div>
                    <div class="flex gap-2">
                        <input type="text" id="new-lead-tag-input" placeholder="Nova tag" class="form-input flex-1">
                        <button type="button" onclick="addNewLeadTag()" class="btn-primary text-sm">Adicionar</button>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Mensagem Inicial</label>
                    <textarea name="lastMsg" class="form-input" rows="3" placeholder="Digite a mensagem inicial do lead..."></textarea>
                </div>
                <div class="flex justify-end gap-3 pt-4">
                    <button type="button" onclick="closeAddLeadModal()" class="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">Cancelar</button>
                    <button type="submit" class="btn-primary">Adicionar Lead</button>
                </div>
            </form>
        </div>
    `;
    
    // Configurar evento de submit do formulário
    document.getElementById('add-lead-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addNewLead(new FormData(this));
    });
}

// --- FUNÇÕES UTILITÁRIAS ---
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function generateId() {
    return 'l' + Math.random().toString(36).substr(2, 9);
}

function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    let bgColor = 'bg-slate-900';
    let icon = 'info';
    
    if (type === 'success') {
        bgColor = 'bg-green-600';
        icon = 'check-circle';
    } else if (type === 'error') {
        bgColor = 'bg-red-600';
        icon = 'alert-circle';
    } else if (type === 'warning') {
        bgColor = 'bg-yellow-600';
        icon = 'alert-triangle';
    }
    
    toast.className = `${bgColor} text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 min-w-[300px] border-l-4 border-gold animate-[slideIn_0.3s_ease-out] pointer-events-auto`;
    toast.innerHTML = `
        <i data-lucide="${icon}" class="w-4 h-4 text-gold"></i>
        <div><p class="text-sm font-semibold">${msg}</p><p class="text-[10px] text-slate-200">Agora mesmo</p></div>
    `;
    container.appendChild(toast);
    lucide.createIcons();
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// --- CONTROLLERS ---
window.changeView = (view) => { 
    STATE.view = view; 
    renderApp(); 
};

window.changeDept = (id) => { 
    STATE.activeDeptId = id; 
    renderApp(); 
};

window.openModal = (id) => { 
    STATE.modalOpen = id; 
    const lead = STATE.leads.find(l => l.id === id);
    if(lead) lead.unread = 0; 
    renderApp(); 
    renderModal(); 
    lucide.createIcons(); 
};

window.closeModal = () => { 
    STATE.modalOpen = null; 
    renderModal(); 
};

window.changeModalTab = (tab) => { 
    STATE.activeModalTab = tab; 
    renderModal(); 
    lucide.createIcons(); 
};

window.sendMessage = () => {
    const input = document.getElementById('chat-input');
    if(!input.value.trim()) return;
    const lead = STATE.leads.find(l => l.id === STATE.modalOpen);
    if(lead) {
        lead.messages.push({ 
            id: Date.now(), 
            text: input.value.trim(), 
            sender: 'agent', 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        });
        lead.lastMsg = input.value.trim();
        lead.lastActive = 'Agora';
        lead.updatedAt = new Date().toISOString();
        input.value = '';
        renderModal();
        saveData();
        lucide.createIcons();
    }
};

// Drag & Drop
let draggedId = null;
window.dragStart = (e, id) => { 
    draggedId = id; 
    e.target.classList.add('dragging'); 
};

window.allowDrop = (e) => { 
    e.preventDefault(); 
    e.currentTarget.classList.add('drag-over'); 
};

window.leaveDrop = (e) => { 
    e.currentTarget.classList.remove('drag-over'); 
};

window.drop = (e, stage) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const lead = STATE.leads.find(l => l.id === draggedId);
    if (lead && lead.stage !== stage) {
        lead.stage = stage;
        lead.updatedAt = new Date().toISOString();
        showToast(`Lead movido para ${stage}`, 'success');
        saveData();
        renderApp();
    }
    draggedId = null;
};

// Filtros
window.toggleFilters = () => {
    STATE.showFilters = !STATE.showFilters;
    renderApp();
};

window.toggleFilter = (filterType, value) => {
    if (filterType === 'tags') {
        const index = STATE.activeFilters.tags.indexOf(value);
        if (index > -1) {
            STATE.activeFilters.tags.splice(index, 1);
        } else {
            STATE.activeFilters.tags.push(value);
        }
    }
    renderApp();
};

window.setFilter = (filterType, value) => {
    STATE.activeFilters[filterType] = value;
    renderApp();
};

window.clearFilters = () => {
    STATE.activeFilters = {
        tags: [],
        type: '',
        minValue: '',
        maxValue: ''
    };
    renderApp();
};

// Adicionar Lead
window.openAddLeadModal = () => {
    STATE.showAddLeadModal = true;
    renderAddLeadModal();
    lucide.createIcons();
};

window.closeAddLeadModal = () => {
    STATE.showAddLeadModal = false;
    renderAddLeadModal();
};

window.updateStages = (deptId) => {
    const dept = DEPARTMENTS.find(d => d.id === deptId);
    const stageSelect = document.getElementById('stage-select');
    
    if (dept) {
        stageSelect.innerHTML = dept.stages.map(stage => 
            `<option value="${stage}">${stage}</option>`
        ).join('');
    } else {
        stageSelect.innerHTML = '<option value="">Selecione o departamento primeiro</option>';
    }
};

window.addNewLeadTag = () => {
    const input = document.getElementById('new-lead-tag-input');
    const container = document.getElementById('new-lead-tags-container');
    
    if (input.value.trim()) {
        const tag = input.value.trim();
        container.innerHTML += `
            <span class="badge bg-slate-100 text-slate-700 flex items-center gap-1">
                ${tag}
                <button type="button" onclick="this.parentElement.remove()" class="text-xs"><i data-lucide="x" class="w-3 h-3"></i></button>
            </span>
        `;
        input.value = '';
        lucide.createIcons();
    }
};

window.addNewLead = (formData) => {
    const name = formData.get('name');
    const phone = formData.get('phone');
    const dept = formData.get('dept');
    const stage = formData.get('stage');
    const type = formData.get('type');
    const value = formData.get('value') || 0;
    const lastMsg = formData.get('lastMsg') || 'Nova conversa iniciada.';
    
    // Coletar tags
    const tags = [];
    const tagElements = document.getElementById('new-lead-tags-container').children;
    for (let el of tagElements) {
        tags.push(el.textContent.trim());
    }
    
    const newLead = {
        id: generateId(),
        name,
        phone,
        dept,
        stage,
        type,
        value: parseInt(value),
        unread: 0,
        lastActive: 'Agora',
        lastMsg,
        tags,
        messages: [
            { id: 1, text: lastMsg, sender: 'lead', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
            { id: 2, text: `Olá ${name}! Sou da KikoBim. Em que posso ajudar?`, sender: 'agent', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    STATE.leads.push(newLead);
    saveData();
    closeAddLeadModal();
    showToast(`Lead ${name} adicionado com sucesso!`, 'success');
    renderApp();
};

// Editar Lead
window.updateLead = (leadId, formData) => {
    const lead = STATE.leads.find(l => l.id === leadId);
    if (!lead) return;
    
    lead.name = formData.get('name');
    lead.phone = formData.get('phone');
    lead.dept = formData.get('dept');
    lead.stage = formData.get('stage');
    lead.type = formData.get('type');
    lead.value = parseInt(formData.get('value') || 0);
    lead.updatedAt = new Date().toISOString();
    
    saveData();
    showToast(`Lead ${lead.name} atualizado com sucesso!`, 'success');
    renderModal();
};

window.addTag = () => {
    const input = document.getElementById('new-tag-input');
    const container = document.getElementById('tags-container');
    const lead = STATE.leads.find(l => l.id === STATE.modalOpen);
    
    if (input.value.trim() && lead) {
        const tag = input.value.trim();
        if (!lead.tags.includes(tag)) {
            lead.tags.push(tag);
            container.innerHTML += `
                <span class="badge ${getTagColorClasses(tag)} flex items-center gap-1">
                    ${tag}
                    <button type="button" onclick="removeTag('${tag}')" class="text-xs"><i data-lucide="x" class="w-3 h-3"></i></button>
                </span>
            `;
            saveData();
            lucide.createIcons();
        }
        input.value = '';
    }
};

window.removeTag = (tag) => {
    const lead = STATE.leads.find(l => l.id === STATE.modalOpen);
    if (lead) {
        lead.tags = lead.tags.filter(t => t !== tag);
        saveData();
        renderModal();
    }
};

// Notas
window.saveNote = () => {
    const input = document.getElementById('note-input');
    if (input.value.trim()) {
        // Em uma aplicação real, isso seria salvo no backend
        showToast('Nota salva com sucesso!', 'success');
        input.value = '';
    }
};

// Upload de arquivos
window.handleFileUpload = (files) => {
    if (files.length > 0) {
        showToast(`Arquivo "${files[0].name}" enviado com sucesso!`, 'success');
    }
};

// Notificações
window.toggleNotifications = () => {
    // Em uma aplicação real, isso abriria um painel de notificações
    showToast('Funcionalidade de notificações em desenvolvimento', 'info');
};

// Exportação
window.exportLeads = () => {
    const filteredLeads = filterLeads();
    const csvContent = "data:text/csv;charset=utf-8," 
        + "Nome,Telefone,Departamento,Estágio,Tipo,Valor,Última Atividade\n"
        + filteredLeads.map(lead => 
            `"${lead.name}","${lead.phone}","${lead.dept}","${lead.stage}","${lead.type}","${lead.value}","${lead.lastActive}"`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "leads_kikobim.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Leads exportados com sucesso!', 'success');
};

// Simulação Realtime
function startSimulation() {
    setInterval(() => {
        const randomIdx = Math.floor(Math.random() * STATE.leads.length);
        const lead = STATE.leads[randomIdx];
        if (STATE.modalOpen !== lead.id && lead.unread < 5 && Math.random() > 0.7) {
            lead.unread += 1;
            lead.lastActive = 'Agora';
            lead.messages.push({ 
                id: Date.now(), 
                text: "Nova mensagem automática...", 
                sender: 'lead', 
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            });
            lead.updatedAt = new Date().toISOString();
            
            // Adicionar notificação
            STATE.notifications.push({
                id: Date.now(),
                type: 'message',
                message: `Nova mensagem de ${lead.name}`,
                read: false,
                timestamp: new Date().toISOString()
            });
            
            showToast(`Nova mensagem de ${lead.name}`);
            saveData();
            renderApp();
        }
    }, 15000);
}

// Event Listeners
function setupEventListeners() {
    document.getElementById('modal-container').addEventListener('click', (e) => {
        if(e.target.id === 'modal-container') closeModal();
    });
    
    document.getElementById('add-lead-modal').addEventListener('click', (e) => {
        if(e.target.id === 'add-lead-modal') closeAddLeadModal();
    });
    
    // Tecla ESC para fechar modais
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeAddLeadModal();
        }
    });
}

// Inicialização
init();