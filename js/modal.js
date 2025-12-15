// js/modal.js - Modal Simplificado de Resumo

const Modal = {
    currentLeadId: null,

    open(leadId) {
        this.currentLeadId = leadId;
        
        // Marca como lido se necessário (lógica visual)
        const lead = Data.getClientById(leadId);
        if (lead && lead.unread_messages_count > 0) {
            // Apenas atualiza localmente para feedback visual imediato
            lead.unread_messages_count = 0;
            if (App.currentView === 'kanban') Kanban.render();
        }

        this.renderDetailModal();
        document.getElementById('modal-container').classList.remove('hidden');
    },

    close() {
        this.currentLeadId = null;
        document.getElementById('modal-container').classList.add('hidden');
    },

    renderDetailModal() {
        const lead = Data.getClientById(this.currentLeadId);
        if (!lead) return;
        
        const container = document.getElementById('modal-container');
        const pipeline = Data.getPipeline(lead.pipeline_id);

        // Define cor baseada no humor
        let humorColor = 'bg-gray-100 text-gray-600';
        let humorIcon = 'meh';
        
        const humorLower = (lead.humor || '').toLowerCase();
        if (humorLower.includes('quente') || humorLower.includes('bom')) {
            humorColor = 'bg-green-100 text-green-700';
            humorIcon = 'smile';
        } else if (humorLower.includes('frio') || humorLower.includes('ruim')) {
            humorColor = 'bg-blue-100 text-blue-700';
            humorIcon = 'frown';
        } else if (humorLower.includes('morno')) {
            humorColor = 'bg-yellow-100 text-yellow-700';
            humorIcon = 'meh';
        }

        // Layout Simplificado
        container.innerHTML = `
        <div class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden modal-content relative">
            
            <!-- Header -->
            <div class="bg-slate-900 px-6 py-5 flex justify-between items-start">
                <div>
                    <h2 class="text-2xl font-bold text-white mb-1">${lead.nome || 'Cliente sem nome'}</h2>
                    <div class="flex items-center gap-2 text-gold text-sm">
                        <i data-lucide="${pipeline ? pipeline.icon : 'circle'}" class="w-4 h-4"></i>
                        <span>${pipeline ? pipeline.name : 'Pipeline Desconhecido'}</span>
                    </div>
                </div>
                <button onclick="Modal.close()" class="text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-slate-800">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>
            </div>

            <!-- Body -->
            <div class="p-8 bg-slate-50">
                
                <!-- Grid de Metadados -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    
                    <!-- Humor -->
                    <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-2">
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Humor</span>
                        <div class="flex items-center gap-2 ${humorColor} px-3 py-1 rounded-full font-bold text-sm capitalize">
                            <i data-lucide="${humorIcon}" class="w-4 h-4"></i>
                            ${lead.humor || 'Não definido'}
                        </div>
                    </div>

                    <!-- Criado Em -->
                    <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-2">
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Data de Criação</span>
                        <span class="font-bold text-slate-700 text-sm">
                            ${Utils.formatDate(lead.created_at)}
                        </span>
                    </div>

                    <!-- Última Interação -->
                    <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-2">
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Última Interação</span>
                        <span class="font-bold text-slate-700 text-sm">
                            ${Utils.formatRelativeTime(lead.last_interaction_at)}
                        </span>
                    </div>
                </div>

                <!-- Resumo -->
                <div class="mb-6">
                    <h3 class="flex items-center gap-2 text-slate-800 font-bold mb-3">
                        <i data-lucide="file-text" class="text-gold w-5 h-5"></i>
                        Resumo do Atendimento
                    </h3>
                    <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-slate-600 leading-relaxed text-sm min-h-[150px] relative">
                        ${lead.resumo 
                            ? lead.resumo.replace(/\n/g, '<br>') 
                            : '<span class="text-slate-400 italic">Nenhum resumo disponível para este cliente.</span>'
                        }
                    </div>
                </div>

                <!-- Footer / Ações -->
                <div class="flex justify-end gap-3 pt-4 border-t border-slate-200">
                     <div class="text-xs text-slate-400 mr-auto flex items-center gap-1">
                        <i data-lucide="database" class="w-3 h-3"></i>
                        ID: ${lead.id.substring(0, 8)}...
                     </div>
                </div>
            </div>
        </div>`;

        lucide.createIcons();
    },
    
    // Mantendo métodos auxiliares caso precise reativar funcionalidades no futuro
    saveEdit() { /* ... */ },
    openAddLead() { /* ... */ }
};