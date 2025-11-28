// js/kanban.js - Lógica do Board Kanban

const Kanban = {
    activePipelineId: 1, // Default: Locação
    searchQuery: '',
    activeFilters: { tags: [], type: '', minVal: '', maxVal: '' },
    draggedId: null,
    showFilters: false,

    init() {
        this.render();
    },

    setPipeline(id) {
        this.activePipelineId = parseInt(id);
        this.render();
    },

    setSearch(query) {
        this.searchQuery = query;
        this.render();
    },

    render() {
        const container = document.getElementById('app');
        const pipeline = Data.getPipeline(this.activePipelineId);
        
        // Se ainda não carregou ou pipeline inválido
        if (!pipeline) {
            container.innerHTML = '<div class="p-10 text-center text-slate-400">Pipeline não encontrado ou dados carregando...</div>';
            return;
        }

        const stages = Data.getStagesByPipeline(this.activePipelineId);
        
        // Obter leads filtrados
        const filters = { 
            pipeline_id: this.activePipelineId, 
            search: this.searchQuery,
            ...this.activeFilters
        };
        const leads = Data.getClients(filters);
        
        const totalValue = leads.reduce((acc, curr) => acc + (parseFloat(curr.deal_value) || 0), 0);

        // HTML das Abas (Departamentos)
        const tabsHtml = Data.pipelines.map(p => `
            <button onclick="Kanban.setPipeline('${p.id}')" class="py-1.5 px-4 text-xs font-semibold rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${this.activePipelineId === p.id ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}">
                <span class="w-1.5 h-1.5 rounded-full ${this.activePipelineId === p.id ? 'bg-gold' : 'bg-slate-300'}"></span>
                ${p.name}
            </button>
        `).join('');

        // HTML das Colunas
        const columnsHtml = stages.map(stage => {
            const stageLeads = leads.filter(l => l.stage_id === stage.id);
            return this.renderColumn(stage, stageLeads);
        }).join('');

        const filtersHtml = this.renderFilters();

        container.innerHTML = `
            <div class="bg-white border-b border-slate-200 px-6 py-2 flex items-center gap-4 shadow-sm z-10 shrink-0 overflow-x-auto no-scrollbar">
                <div class="flex items-center bg-slate-100 p-1 rounded-lg shrink-0">
                    ${tabsHtml}
                </div>
                <div class="h-6 w-[1px] bg-slate-200 hidden sm:block"></div>
                <div class="flex items-center gap-6 hidden md:flex">
                    <div>
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Leads Ativos</p>
                        <p class="text-sm font-bold text-slate-700">${leads.length} <span class="text-slate-400 font-normal">clientes</span></p>
                    </div>
                    <div>
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Potencial</p>
                        <p class="text-sm font-bold text-gold-dark">${Utils.formatCurrency(totalValue)}</p>
                    </div>
                </div>
                <div class="ml-auto flex items-center gap-2">
                    <button onclick="Kanban.toggleFilters()" class="text-slate-500 hover:text-slate-700 flex items-center gap-1 text-sm">
                        <i data-lucide="filter" class="w-4 h-4"></i> Filtros
                    </button>
                    <button onclick="Kanban.exportLeads()" class="text-slate-500 hover:text-slate-700 flex items-center gap-1 text-sm">
                        <i data-lucide="download" class="w-4 h-4"></i> Exportar
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
        
        lucide.createIcons();
    },

    renderColumn(stage, leads) {
        const cardsHtml = leads.map(lead => {
            // Adaptação para campo 'content' vs 'text'
            const lastMsgObj = lead.messages && lead.messages.length > 0 ? lead.messages[lead.messages.length - 1] : null;
            const lastMsgText = lastMsgObj ? (lastMsgObj.content || lastMsgObj.text) : 'Sem mensagens';
            
            return `
            <div 
                draggable="true" 
                ondragstart="Kanban.dragStart(event, '${lead.id}')"
                onclick="Modal.open('${lead.id}')"
                class="lead-card bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md hover:border-gold-light group relative select-none mb-3"
            >
                <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200">
                            ${lead.name ? lead.name.substring(0, 2).toUpperCase() : '??'}
                        </div>
                        <div>
                            <h4 class="font-bold text-sm text-slate-800 leading-tight">${lead.name}</h4>
                            <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">${lead.type || 'Cliente'}</span>
                        </div>
                    </div>
                    ${lead.unread_messages_count > 0 ? `<span class="flex items-center justify-center min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold px-1 rounded-full animate-bounce shadow-sm">${lead.unread_messages_count}</span>` : ''}
                </div>
                
                <div class="flex flex-wrap gap-1 mb-3">
                    ${(lead.tags || []).map(tag => `<span class="text-[10px] px-2 py-0.5 rounded border ${Utils.getTagColorClasses(tag)} font-medium">${tag}</span>`).join('')}
                </div>
                
                <div class="bg-slate-50 p-2.5 rounded border border-slate-100 mb-3">
                    <p class="text-xs text-slate-500 line-clamp-2 italic">"${lastMsgText}"</p>
                </div>

                <div class="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-50">
                    <div class="flex items-center gap-1.5">
                        <i data-lucide="activity" class="w-3 h-3"></i>
                        ${Utils.formatRelativeTime(lead.updated_at || lead.created_at)}
                    </div>
                    ${lead.deal_value > 0 ? `<span class="font-bold text-slate-600">${Utils.formatCurrency(lead.deal_value)}</span>` : ''}
                </div>
            </div>
            `;
        }).join('');

        return `
            <div 
                class="flex-shrink-0 w-80 flex flex-col rounded-xl border-2 border-transparent bg-slate-100 drop-zone"
                ondrop="Kanban.drop(event, ${stage.id})"
                ondragover="Kanban.allowDrop(event)"
                ondragleave="Kanban.leaveDrop(event)"
            >
                <div class="p-3 flex items-center justify-between sticky top-0 backdrop-blur-sm rounded-t-xl z-10 border-b border-slate-200/50">
                    <h3 class="font-bold text-xs text-slate-600 uppercase tracking-wider flex items-center gap-2">
                        ${stage.name}
                        <span class="bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm">${leads.length}</span>
                    </h3>
                    <button class="text-slate-400 hover:text-gold hover:bg-white p-1 rounded transition-colors"><i data-lucide="plus" class="w-4 h-4"></i></button>
                </div>
                <div class="flex-1 overflow-y-auto p-2 custom-scrollbar">
                    ${cardsHtml}
                    ${leads.length === 0 ? `
                        <div class="h-32 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 gap-2">
                           <div class="p-2 bg-slate-100 rounded-full"><i data-lucide="plus" class="w-4 h-4"></i></div>
                           <span class="text-xs font-medium">Vazio</span>
                         </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    renderFilters() {
        if (!this.showFilters) return '';
        const allTags = [...new Set(Data.clients.flatMap(c => c.tags))];
        
        return `
        <div class="bg-white border-b border-slate-200 p-4 shadow-sm animate-[fadeIn_0.2s]">
            <div class="flex flex-wrap gap-4 items-center">
                <div>
                    <label class="block text-xs text-slate-500 font-medium mb-1">Tags</label>
                    <div class="flex flex-wrap gap-2">
                        ${allTags.map(tag => `
                            <button 
                                onclick="Kanban.toggleTagFilter('${tag}')" 
                                class="text-xs px-3 py-1 rounded-full border transition-all ${this.activeFilters.tags.includes(tag) ? 'filter-active' : 'bg-white border-slate-200 text-slate-600'}"
                            >
                                ${tag}
                            </button>
                        `).join('')}
                    </div>
                </div>
                <div class="ml-auto">
                    <button onclick="Kanban.clearFilters()" class="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
                        <i data-lucide="x" class="w-3 h-3"></i> Limpar
                    </button>
                </div>
            </div>
        </div>
        `;
    },

    toggleFilters() {
        this.showFilters = !this.showFilters;
        this.render();
    },

    toggleTagFilter(tag) {
        const idx = this.activeFilters.tags.indexOf(tag);
        if (idx > -1) this.activeFilters.tags.splice(idx, 1);
        else this.activeFilters.tags.push(tag);
        this.render();
    },

    clearFilters() {
        this.activeFilters = { tags: [], type: '', minVal: '', maxVal: '' };
        this.render();
    },

    exportLeads() {
        const leads = Data.getClients({ pipeline_id: this.activePipelineId });
        const csvContent = "data:text/csv;charset=utf-8," 
            + "Nome,Telefone,Tipo,Valor,Criado em\n"
            + leads.map(l => `"${l.name}","${l.phone}","${l.type}","${l.deal_value}","${l.created_at}"`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.href = encodedUri;
        link.download = "leads_kikobim.csv";
        link.click();
        Utils.showToast('Exportação concluída!', 'success');
    },

    dragStart(e, id) {
        this.draggedId = id;
        e.target.classList.add('dragging');
    },
    allowDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    },
    leaveDrop(e) {
        e.currentTarget.classList.remove('drag-over');
    },
    
    async drop(e, stageId) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        
        const lead = Data.getClientById(this.draggedId);
        if (lead && lead.stage_id !== stageId) {
            // Atualização Otimista
            const oldStageId = lead.stage_id;
            
            // Atualiza no banco
            await Data.updateClient(lead.id, { stage_id: stageId });
            
            const stageName = Data.stages.find(s => s.id === stageId)?.name;
            Utils.showToast(`Movido para ${stageName}`, 'success');
            
            this.render(); // Re-renderiza para confirmar posição
        }
        this.draggedId = null;
    }
};