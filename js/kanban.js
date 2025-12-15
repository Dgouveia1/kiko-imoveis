// js/kanban.js

const Kanban = {
    // Pipeline padrão: Locação (ID 1)
    activePipelineId: 1,
    searchQuery: '',

    init() {
        this.render();
    },

    setPipeline(id) {
        this.activePipelineId = id;
        this.render();
    },

    render() {
        const container = document.getElementById('app');
        const pipeline = Data.getPipeline(this.activePipelineId);
        const stages = Data.getStagesByPipeline(this.activePipelineId);
        
        // Filtra clientes deste pipeline + busca
        const leads = Data.getClients({ 
            pipeline_id: this.activePipelineId,
            search: this.searchQuery
        });

        // 1. Renderiza Abas de Setores
        const tabsHtml = Data.pipelines.map(p => `
            <button onclick="Kanban.setPipeline(${p.id})" 
                class="px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors flex items-center gap-2
                ${this.activePipelineId === p.id 
                    ? `border-${p.color_theme}-500 text-${p.color_theme}-600 bg-white` 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }">
                <i data-lucide="${p.icon || 'circle'}" class="w-4 h-4"></i>
                ${p.name}
            </button>
        `).join('');

        // 2. Renderiza Colunas
        const columnsHtml = stages.map(stage => {
            const stageLeads = leads.filter(l => l.stage_id === stage.id);
            const totalValue = stageLeads.reduce((acc, curr) => acc + (parseFloat(curr.deal_value) || 0), 0);

            return `
            <div class="flex-shrink-0 w-80 flex flex-col h-full bg-slate-100 rounded-xl border border-slate-200">
                <!-- Header da Coluna -->
                <div class="p-3 border-b border-slate-200 flex justify-between items-center bg-white rounded-t-xl sticky top-0 z-10">
                    <div class="flex items-center gap-2">
                        <span class="font-bold text-slate-700 text-sm">${stage.name}</span>
                        <span class="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full font-bold border border-slate-200">${stageLeads.length}</span>
                    </div>
                    <div class="text-xs font-bold text-slate-400">
                        ${Utils.formatCurrency(totalValue)}
                    </div>
                </div>

                <!-- Lista de Cards -->
                <div class="flex-1 p-2 overflow-y-auto space-y-2 custom-scrollbar drop-zone"
                     ondrop="Kanban.drop(event, ${stage.id})"
                     ondragover="Kanban.allowDrop(event)">
                    
                    ${stageLeads.map(lead => this.renderCard(lead)).join('')}
                    
                    ${stageLeads.length === 0 ? `
                        <div class="h-24 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-xs">
                            Vazio
                        </div>
                    ` : ''}
                </div>
            </div>`;
        }).join('');

        // Montagem final do HTML
        container.innerHTML = `
            <div class="flex flex-col h-full bg-slate-50">
                <!-- Barra Superior de Abas -->
                <div class="px-6 pt-4 border-b border-slate-200 bg-white shadow-sm shrink-0 flex gap-2 overflow-x-auto no-scrollbar">
                    ${tabsHtml}
                </div>

                <!-- Container do Board -->
                <div class="flex-1 overflow-x-auto overflow-y-hidden p-6">
                    <div class="flex gap-4 h-full min-w-max">
                        ${columnsHtml}
                    </div>
                </div>
            </div>
        `;
        
        lucide.createIcons();
    },

    renderCard(lead) {
        // Verifica se tem mensagens não lidas
        const unreadBadge = lead.unread_messages_count > 0 
            ? `<div class="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md animate-bounce z-20">
                 ${lead.unread_messages_count}
               </div>` 
            : '';

        const waitingBorder = lead.unread_messages_count > 0 ? 'border-l-4 border-l-red-500' : '';

        // Prepara o conteúdo do resumo ou fallback
        const summaryContent = lead.resumo 
            ? lead.resumo 
            : (lead.lastMsg || 'Sem informações adicionais.');

        return `
        <div draggable="true" 
             ondragstart="Kanban.dragStart(event, '${lead.id}')"
             onclick="Modal.open('${lead.id}')"
             class="bg-white p-3 rounded-lg shadow-sm border border-slate-200 hover:shadow-md cursor-grab relative group ${waitingBorder}">
            
            ${unreadBadge}

            <div class="flex justify-between items-start mb-2">
                <h4 class="font-bold text-slate-800 text-sm leading-tight line-clamp-1">${lead.name || 'Sem Nome'}</h4>
                <span class="text-[10px] text-slate-400">${Utils.formatRelativeTime(lead.last_update || lead.created_at)}</span>
            </div>
            
            <!-- Resumo do Lead -->
            <p class="text-xs text-slate-600 mb-3 line-clamp-3 leading-relaxed bg-slate-50 p-1.5 rounded border border-slate-100" title="${summaryContent}">
                ${summaryContent}
            </p>

            <div class="flex justify-between items-center pt-2 border-t border-slate-100">
                <span class="text-xs font-bold text-slate-700">${Utils.formatCurrency(lead.deal_value)}</span>
                
                <div class="flex items-center gap-2">
                    ${lead.unread_messages_count > 0 ? '<span class="text-[10px] font-bold text-red-500 flex items-center gap-1"><i data-lucide="message-circle" class="w-3 h-3"></i> Nova</span>' : ''}
                    ${lead.humor ? `<span class="text-[10px] px-1.5 py-0.5 rounded border bg-white border-slate-200 text-slate-500 capitalize">${lead.humor}</span>` : ''}
                </div>
            </div>
        </div>`;
    },

    // Drag and Drop Logic
    draggedId: null,

    dragStart(event, id) {
        this.draggedId = id;
        event.target.classList.add('opacity-50');
    },

    allowDrop(event) {
        event.preventDefault();
    },

    async drop(event, stageId) {
        event.preventDefault();
        const id = this.draggedId;
        
        // Atualização Otimista (Visual)
        const lead = Data.clients.find(c => c.id === id);
        if (lead && lead.stage_id !== stageId) {
            lead.stage_id = stageId;
            lead.last_update = new Date().toISOString();
            this.render(); // Re-renderiza para mudar de coluna visualmente
            
            // Persistência no Banco
            await Data.updateClientStage(id, stageId);
        }
        this.draggedId = null;
    }
};