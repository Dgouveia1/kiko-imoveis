// js/clients.js - Visualização de Lista de Clientes

const Clients = {
    filters: {
        search: '',
        pipeline_id: '',
        status: '', // active, inactive, etc (ou stage)
        sortBy: 'updated_at' // updated_at, created_at, name
    },

    init() {
        this.render();
    },

    render() {
        const container = document.getElementById('app');
        
        // Aplica Filtros Localmente
        const filteredClients = this.getFilteredClients();
        const pipelines = Data.pipelines;

        // HTML do Filtro
        const filtersHtml = `
            <div class="bg-white p-4 border-b border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between shrink-0">
                <div class="relative w-full md:w-96 group">
                    <i data-lucide="search" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-gold transition-colors"></i>
                    <input 
                        type="text" 
                        placeholder="Buscar por nome, telefone ou email..." 
                        class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 ring-gold focus:bg-white outline-none transition-all"
                        value="${this.filters.search}"
                        oninput="Clients.setFilter('search', this.value)"
                    >
                </div>
                
                <div class="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    <select onchange="Clients.setFilter('pipeline_id', this.value)" class="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-gold text-slate-700">
                        <option value="">Todos os Setores</option>
                        ${pipelines.map(p => `<option value="${p.id}" ${this.filters.pipeline_id == p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
                    </select>

                    <select onchange="Clients.setFilter('sortBy', this.value)" class="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-gold text-slate-700">
                        <option value="updated_at" ${this.filters.sortBy == 'updated_at' ? 'selected' : ''}>Recentes (Msg)</option>
                        <option value="created_at" ${this.filters.sortBy == 'created_at' ? 'selected' : ''}>Data Criação</option>
                        <option value="deal_value_desc" ${this.filters.sortBy == 'deal_value_desc' ? 'selected' : ''}>Maior Valor</option>
                    </select>
                </div>
            </div>
        `;

        // HTML da Lista (Tabela Responsiva)
        const listHtml = `
            <div class="flex-1 overflow-auto bg-slate-50 p-4 md:p-6">
                <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table class="w-full text-left border-collapse">
                        <thead class="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            <tr>
                                <th class="px-6 py-4">Cliente</th>
                                <th class="px-6 py-4 hidden md:table-cell">Setor / Estágio</th>
                                <th class="px-6 py-4 hidden md:table-cell">Status Msg</th>
                                <th class="px-6 py-4 hidden sm:table-cell">Valor</th>
                                <th class="px-6 py-4 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${filteredClients.map(client => this.renderRow(client)).join('')}
                            ${filteredClients.length === 0 ? `
                                <tr>
                                    <td colspan="5" class="px-6 py-12 text-center text-slate-400">
                                        <div class="flex flex-col items-center gap-2">
                                            <i data-lucide="users" class="w-8 h-8 opacity-50"></i>
                                            <p class="text-sm">Nenhum cliente encontrado com os filtros atuais.</p>
                                        </div>
                                    </td>
                                </tr>
                            ` : ''}
                        </tbody>
                    </table>
                </div>
                <div class="mt-4 text-xs text-slate-400 text-center">
                    Exibindo ${filteredClients.length} de ${Data.clients.length} clientes
                </div>
            </div>
        `;

        container.innerHTML = `
            <div class="flex flex-col h-full animate-[fadeIn_0.3s_ease-out]">
                <div class="px-6 py-4 bg-white border-b border-slate-200 flex justify-between items-center shrink-0">
                    <div>
                        <h2 class="text-lg font-bold text-slate-800">Base de Clientes</h2>
                        <p class="text-xs text-slate-500">Gerencie todos os contatos do sistema</p>
                    </div>
                    <button onclick="Modal.openAddLead()" class="bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-900 flex items-center gap-2 transition-colors">
                        <i data-lucide="plus" class="w-3 h-3"></i> Novo Cliente
                    </button>
                </div>
                ${filtersHtml}
                ${listHtml}
            </div>
        `;

        lucide.createIcons();
    },

    renderRow(client) {
        const pipeline = Data.getPipeline(client.pipeline_id);
        const stage = Data.stages.find(s => s.id === client.stage_id);
        const lastMsg = client.messages && client.messages.length ? client.messages[client.messages.length - 1] : null;
        
        return `
            <tr class="hover:bg-slate-50 transition-colors cursor-pointer group" onclick="Modal.open('${client.id}')">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm border border-slate-200 group-hover:border-gold transition-colors">
                            ${client.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <p class="font-bold text-slate-800 text-sm">${client.name}</p>
                            <p class="text-xs text-slate-500 flex items-center gap-1">
                                <i data-lucide="phone" class="w-3 h-3"></i> ${client.phone}
                            </p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 hidden md:table-cell">
                    <div class="flex flex-col">
                        <span class="text-xs font-bold text-slate-700">${pipeline ? pipeline.name : '-'}</span>
                        <span class="text-[10px] text-slate-500 px-2 py-0.5 bg-slate-100 rounded-full w-fit mt-1 border border-slate-200">
                            ${stage ? stage.name : '-'}
                        </span>
                    </div>
                </td>
                <td class="px-6 py-4 hidden md:table-cell">
                    ${lastMsg ? `
                        <div class="max-w-[200px]">
                            <p class="text-xs text-slate-600 truncate">"${lastMsg.content || lastMsg.text}"</p>
                            <p class="text-[10px] text-slate-400 mt-0.5">${Utils.formatRelativeTime(client.updated_at)}</p>
                        </div>
                    ` : '<span class="text-xs text-slate-300 italic">Sem mensagens</span>'}
                </td>
                <td class="px-6 py-4 hidden sm:table-cell">
                    <p class="text-sm font-bold text-slate-700">${client.deal_value > 0 ? Utils.formatCurrency(client.deal_value) : '-'}</p>
                </td>
                <td class="px-6 py-4 text-right">
                    <button class="text-slate-400 hover:text-gold p-2 rounded-full hover:bg-slate-100 transition-colors">
                        <i data-lucide="chevron-right" class="w-5 h-5"></i>
                    </button>
                </td>
            </tr>
        `;
    },

    getFilteredClients() {
        let list = [...Data.clients];

        // Filtro de Texto
        if (this.filters.search) {
            const term = this.filters.search.toLowerCase();
            list = list.filter(c => 
                c.name.toLowerCase().includes(term) || 
                c.phone.includes(term) ||
                (c.email && c.email.toLowerCase().includes(term))
            );
        }

        // Filtro de Pipeline
        if (this.filters.pipeline_id) {
            list = list.filter(c => c.pipeline_id == this.filters.pipeline_id);
        }

        // Ordenação
        list.sort((a, b) => {
            if (this.filters.sortBy === 'created_at') {
                return new Date(b.created_at) - new Date(a.created_at);
            }
            if (this.filters.sortBy === 'deal_value_desc') {
                return (b.deal_value || 0) - (a.deal_value || 0);
            }
            // Default: updated_at (Recentes)
            return new Date(b.updated_at) - new Date(a.updated_at);
        });

        return list;
    },

    setFilter(key, value) {
        this.filters[key] = value;
        this.render();
    }
};