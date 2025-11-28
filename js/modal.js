// js/modal.js - Lógica de Modais

const Modal = {
    currentLeadId: null,
    activeTab: 'chat',

    open(leadId) {
        this.currentLeadId = leadId;
        const lead = Data.getClientById(leadId);
        
        if (lead.unread_messages_count > 0) {
            Data.updateClient(leadId, { unread_messages_count: 0 });
            if (App.currentView === 'kanban') Kanban.render();
        }

        this.renderDetailModal();
        document.getElementById('modal-container').classList.remove('hidden');
    },

    close() {
        this.currentLeadId = null;
        document.getElementById('modal-container').classList.add('hidden');
    },

    setTab(tab) {
        this.activeTab = tab;
        this.renderDetailModal();
    },

    renderDetailModal() {
        const lead = Data.getClientById(this.currentLeadId);
        if (!lead) return;
        
        const pipeline = Data.getPipeline(lead.pipeline_id);
        const stages = Data.getStagesByPipeline(lead.pipeline_id);
        const container = document.getElementById('modal-container');

        // Renderiza Timeline
        const timelineHtml = stages.map((stage, idx) => {
            const currentStageIdx = stages.findIndex(s => s.id === lead.stage_id);
            const isCurrent = idx === currentStageIdx;
            const isPast = idx < currentStageIdx;
            
            let circleClass = isCurrent ? 'timeline-circle-current' : (isPast ? 'timeline-circle-past' : 'timeline-circle-future');
            let textClass = isCurrent ? 'font-bold text-gold-dark' : (isPast ? 'text-slate-600' : 'text-slate-400');
            
            return `
            <div class="relative pb-6 last:pb-0 pl-4 border-l-2 ${isPast ? 'border-[#E0C975]' : 'border-slate-200'}">
                <div class="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 transition-all duration-300 ${circleClass}"></div>
                <p class="text-sm leading-none ${textClass}">${stage.name}</p>
            </div>`;
        }).join('');

        // Conteúdo Principal da Modal (Container e Sidebar)
        container.innerHTML = `
        <div class="bg-white w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex overflow-hidden modal-content">
            <!-- Sidebar -->
            <div class="w-80 bg-slate-50 border-r border-slate-200 flex flex-col hidden md:flex">
                <div class="p-6 border-b border-slate-200 bg-white">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="w-14 h-14 rounded-full bg-slate-800 border-2 border-gold text-gold flex items-center justify-center text-xl font-bold">${lead.name ? lead.name.substring(0,2).toUpperCase() : '?'}</div>
                        <div>
                            <h2 class="font-bold text-slate-900 leading-tight">${lead.name}</h2>
                            <div class="mt-1"><span class="text-[10px] px-2 py-0.5 rounded-full bg-gold-light text-gold-dark border border-gold-light font-bold">${pipeline ? pipeline.name : '...'}</span></div>
                        </div>
                    </div>
                    <div class="space-y-3 mt-4 text-sm text-slate-600">
                        <div class="flex items-center gap-3"><i data-lucide="phone" class="w-4 h-4"></i> ${lead.phone || '-'}</div>
                        <div class="flex items-center gap-3"><i data-lucide="dollar-sign" class="w-4 h-4"></i> ${Utils.formatCurrency(lead.deal_value)}</div>
                    </div>
                </div>
                <div class="p-6 flex-1 overflow-y-auto">
                    <h3 class="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider">Timeline</h3>
                    ${timelineHtml}
                </div>
            </div>
            
            <!-- Main Content -->
            <div class="flex-1 flex flex-col min-w-0 bg-white">
                <div class="h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-white shrink-0">
                    <div class="flex items-center gap-1 h-full overflow-x-auto no-scrollbar">
                        <button onclick="Modal.setTab('chat')" class="h-full border-b-2 px-4 text-sm font-medium whitespace-nowrap ${this.activeTab === 'chat' ? 'border-gold text-gold-dark' : 'border-transparent text-slate-500'}">WhatsApp</button>
                        <button onclick="Modal.setTab('notes')" class="h-full border-b-2 px-4 text-sm font-medium whitespace-nowrap ${this.activeTab === 'notes' ? 'border-gold text-gold-dark' : 'border-transparent text-slate-500'}">Anotações</button>
                        <button onclick="Modal.setTab('docs')" class="h-full border-b-2 px-4 text-sm font-medium whitespace-nowrap ${this.activeTab === 'docs' ? 'border-gold text-gold-dark' : 'border-transparent text-slate-500'}">Documentos</button>
                        <button onclick="Modal.setTab('edit')" class="h-full border-b-2 px-4 text-sm font-medium whitespace-nowrap ${this.activeTab === 'edit' ? 'border-gold text-gold-dark' : 'border-transparent text-slate-500'}">Editar</button>
                    </div>
                    <button onclick="Modal.close()" class="p-2 hover:bg-slate-100 rounded-full"><i data-lucide="x" class="w-5 h-5 text-slate-400"></i></button>
                </div>
                <div id="tab-content" class="flex-1 bg-slate-50 relative overflow-hidden">
                    <!-- O conteúdo da aba será injetado aqui -->
                </div>
            </div>
        </div>`;

        // Renderiza o conteúdo específico da aba selecionada
        this.renderTabContent(lead);
        lucide.createIcons();
    },

    renderTabContent(lead) {
        const container = document.getElementById('tab-content');
        
        if (this.activeTab === 'chat') {
            const msgs = (lead.messages || []).map(m => `
                <div class="flex ${m.direction === 'outbound' ? 'justify-end' : 'justify-start'}">
                    <div class="max-w-[85%] p-3 rounded-xl shadow-sm relative text-sm leading-relaxed ${m.direction === 'outbound' ? 'chat-bubble-agent' : 'chat-bubble-lead'}">
                        ${m.content || m.text}
                        <div class="text-[10px] text-slate-500 text-right mt-1 opacity-70">${Utils.formatRelativeTime(m.created_at)}</div>
                    </div>
                </div>
            `).join('');
            
            container.innerHTML = `
                <div class="flex flex-col h-full chat-bg-pattern relative rounded-b-xl overflow-hidden">
                    <div class="flex-1 overflow-y-auto p-6 space-y-4 relative z-10" id="chat-scroll">
                        ${msgs.length ? msgs : '<div class="text-center text-slate-400 text-sm mt-4 bg-white/80 p-2 rounded-lg inline-block mx-auto">Nenhuma mensagem ainda.</div>'}
                    </div>
                    <div class="p-3 bg-slate-100 flex items-center gap-2 border-t border-slate-200 relative z-10">
                        <input type="text" id="chat-input" placeholder="Digite..." class="flex-1 border-none rounded-lg py-2.5 px-4 focus:ring-1 focus:ring-gold shadow-sm text-sm outline-none" onkeydown="if(event.key === 'Enter') Modal.sendMessage()">
                        <button onclick="Modal.sendMessage()" class="p-2.5 bg-gold text-white rounded-full hover-bg-gold shadow-md"><i data-lucide="send" class="w-4 h-4"></i></button>
                    </div>
                </div>`;
            
            const scroll = document.getElementById('chat-scroll');
            if(scroll) scroll.scrollTop = scroll.scrollHeight;

        } else if (this.activeTab === 'edit') {
            container.innerHTML = `
            <div class="p-8 h-full overflow-y-auto">
                <h3 class="font-bold text-slate-700 mb-6">Editar Lead</h3>
                <form onsubmit="event.preventDefault(); Modal.saveEdit(new FormData(this))" class="space-y-4 max-w-lg">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                        <input type="text" name="name" value="${lead.name}" class="form-input">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                             <label class="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                             <input type="number" name="deal_value" value="${lead.deal_value}" class="form-input">
                        </div>
                        <div>
                             <label class="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                             <input type="text" name="phone" value="${lead.phone}" class="form-input">
                        </div>
                    </div>
                    <button type="submit" class="btn-primary w-full mt-4">Salvar</button>
                </form>
            </div>`;
        } else if (this.activeTab === 'docs') {
            container.innerHTML = `
                <div class="p-8 h-full overflow-y-auto bg-slate-50">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="font-bold text-slate-700">Documentos Anexados</h3>
                        <label class="btn-primary text-xs cursor-pointer flex items-center gap-2">
                            <i data-lucide="upload-cloud" class="w-4 h-4"></i> Upload
                            <input type="file" class="hidden" onchange="Modal.handleUpload(this.files)">
                        </label>
                    </div>
                    <div id="docs-list" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="col-span-full text-center py-10">
                            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold mx-auto"></div>
                        </div>
                    </div>
                </div>`;
            this.loadDocsList();
        } else if (this.activeTab === 'notes') {
            container.innerHTML = `
                <div class="h-full flex flex-col bg-yellow-50/30">
                    <div class="p-6 border-b border-yellow-100 bg-white shadow-sm z-10">
                        <label class="block text-sm font-bold text-slate-700 mb-2">Nova Anotação</label>
                        <div class="flex gap-2">
                            <textarea id="note-input" class="flex-1 p-3 border border-slate-200 rounded-xl focus:ring-2 ring-gold outline-none bg-slate-50 resize-none text-sm" rows="2" placeholder="Escreva uma observação sobre este cliente..."></textarea>
                            <button onclick="Modal.saveNote()" class="bg-slate-800 text-gold px-4 rounded-xl font-bold hover:bg-slate-900 transition-colors self-end h-full"><i data-lucide="save" class="w-5 h-5"></i></button>
                        </div>
                    </div>
                    <div id="notes-list" class="flex-1 overflow-y-auto p-6 space-y-4">
                        <div class="text-center py-10">
                            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold mx-auto"></div>
                        </div>
                    </div>
                </div>`;
            this.loadNotesList();
        }
    },

    // --- LÓGICA DE DOCUMENTOS ---
    async loadDocsList() {
        const listEl = document.getElementById('docs-list');
        try {
            const docs = await Data.getDocuments(this.currentLeadId);
            
            if (docs.length === 0) {
                listEl.innerHTML = `
                    <div class="col-span-full flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-300 rounded-xl text-slate-400">
                        <i data-lucide="file-x" class="w-10 h-10 mb-2 opacity-50"></i>
                        <p class="text-sm">Nenhum documento encontrado.</p>
                    </div>`;
            } else {
                listEl.innerHTML = docs.map(doc => `
                    <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 hover:border-gold transition-colors group relative">
                        <div class="bg-slate-100 p-3 rounded-lg text-slate-600">
                            <i data-lucide="${Utils.getFileIcon(doc.file_type || '')}" class="w-6 h-6"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <a href="${doc.file_url}" target="_blank" class="block text-sm font-bold text-slate-800 truncate hover:text-gold hover:underline" title="${doc.name}">${doc.name}</a>
                            <p class="text-xs text-slate-400">${Utils.formatBytes(doc.file_size_bytes)} • ${Utils.formatDate(doc.created_at)}</p>
                        </div>
                        <button onclick="Modal.deleteDoc('${doc.id}', '${doc.file_url}')" class="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Excluir">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                `).join('');
            }
            lucide.createIcons();
        } catch (e) {
            listEl.innerHTML = '<p class="col-span-full text-red-500 text-center text-sm">Erro ao carregar documentos.</p>';
        }
    },

    async handleUpload(files) {
        if (!files.length) return;
        const file = files[0];
        
        // Feedback visual imediato
        const btnLabel = document.querySelector('.btn-primary');
        const originalText = btnLabel.innerHTML;
        btnLabel.innerHTML = `<i class="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"></i> Enviando...`;
        
        try {
            await Data.uploadDocument(this.currentLeadId, file);
            Utils.showToast('Upload concluído com sucesso!', 'success');
            this.loadDocsList(); // Recarrega a lista
        } catch (error) {
            Utils.showToast('Erro ao fazer upload.', 'error');
            console.error(error);
        } finally {
            btnLabel.innerHTML = originalText;
        }
    },

    async deleteDoc(id, url) {
        if (!confirm('Tem certeza que deseja excluir este documento?')) return;
        
        try {
            await Data.deleteDocument(id, url);
            Utils.showToast('Documento excluído.', 'success');
            this.loadDocsList();
        } catch (error) {
            Utils.showToast('Erro ao excluir documento.', 'error');
        }
    },

    // --- LÓGICA DE ANOTAÇÕES ---
    async loadNotesList() {
        const listEl = document.getElementById('notes-list');
        try {
            const notes = await Data.getNotes(this.currentLeadId);
            
            if (notes.length === 0) {
                listEl.innerHTML = `
                    <div class="flex flex-col items-center justify-center py-10 text-slate-400">
                        <i data-lucide="clipboard" class="w-10 h-10 mb-2 opacity-50"></i>
                        <p class="text-sm">Nenhuma anotação registrada.</p>
                    </div>`;
            } else {
                listEl.innerHTML = notes.map(note => `
                    <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm relative pl-4 border-l-4 border-l-gold">
                        <div class="flex justify-between items-start mb-2">
                            <div class="flex items-center gap-2">
                                <div class="w-6 h-6 rounded-full bg-slate-800 text-gold text-xs font-bold flex items-center justify-center">
                                    ${note.user_id ? 'U' : 'A'}
                                </div>
                                <span class="font-bold text-xs text-slate-700">Agente</span>
                            </div>
                            <span class="text-[10px] text-slate-400">${Utils.formatDateTime(note.created_at)}</span>
                        </div>
                        <p class="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">${note.content}</p>
                    </div>
                `).join('');
            }
            lucide.createIcons();
        } catch (e) {
            listEl.innerHTML = '<p class="text-red-500 text-center text-sm">Erro ao carregar anotações.</p>';
        }
    },

    async saveNote() {
        const input = document.getElementById('note-input');
        const content = input.value.trim();
        if (!content) return;

        try {
            await Data.addNote(this.currentLeadId, content);
            input.value = ''; // Limpa
            Utils.showToast('Anotação salva!', 'success');
            this.loadNotesList();
        } catch (error) {
            Utils.showToast('Erro ao salvar anotação.', 'error');
        }
    },

    // --- LÓGICA DE CHAT & EDIT (MANTIDA) ---
    async sendMessage() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text) return;
        input.value = ''; 
        await Data.addMessage(this.currentLeadId, text, 'outbound');
        this.renderTabContent(Data.getClientById(this.currentLeadId)); // Re-render só o chat
    },

    async saveEdit(formData) {
        await Data.updateClient(this.currentLeadId, {
            name: formData.get('name'),
            phone: formData.get('phone'),
            deal_value: parseFloat(formData.get('deal_value'))
        });
        Utils.showToast('Lead atualizado!', 'success');
        if(App.currentView === 'kanban') Kanban.render();
        this.renderDetailModal(); // Atualiza header da modal
    },

    openAddLead() {
        const container = document.getElementById('add-lead-modal');
        const pipelineOptions = Data.pipelines.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        
        container.innerHTML = `
        <div class="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6 modal-content">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold text-slate-800">Novo Lead</h2>
                <button onclick="document.getElementById('add-lead-modal').classList.add('hidden')" class="text-slate-400"><i data-lucide="x" class="w-5 h-5"></i></button>
            </div>
            <form id="add-lead-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-slate-700">Nome</label>
                    <input type="text" name="name" class="form-input" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700">Telefone</label>
                    <input type="text" name="phone" class="form-input" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700">Pipeline</label>
                    <select name="pipeline_id" class="form-input" required onchange="Modal.updateStageSelect(this.value)">
                        <option value="">Selecione...</option>
                        ${pipelineOptions}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700">Estágio Inicial</label>
                    <select name="stage_id" id="new-lead-stage" class="form-input" required disabled>
                        <option value="">Selecione pipeline primeiro</option>
                    </select>
                </div>
                <div>
                     <label class="block text-sm font-medium text-slate-700">Mensagem Inicial</label>
                     <textarea name="lastMsg" class="form-input" rows="2"></textarea>
                </div>
                <div class="pt-2 flex justify-end">
                    <button type="button" onclick="Modal.submitAddLead()" class="btn-primary">Adicionar Lead</button>
                </div>
            </form>
        </div>`;
        
        container.classList.remove('hidden');
        lucide.createIcons();
    },

    updateStageSelect(pipelineId) {
        const select = document.getElementById('new-lead-stage');
        if(!pipelineId) {
            select.disabled = true;
            select.innerHTML = '<option value="">Selecione pipeline primeiro</option>';
            return;
        }
        const stages = Data.getStagesByPipeline(pipelineId);
        select.innerHTML = stages.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        select.disabled = false;
    },

    async submitAddLead() {
        const form = document.getElementById('add-lead-form');
        const formData = new FormData(form);
        
        if (!formData.get('name') || !formData.get('pipeline_id')) {
            Utils.showToast('Preencha os campos obrigatórios', 'error');
            return;
        }

        try {
            await Data.addClient({
                name: formData.get('name'),
                phone: formData.get('phone'),
                pipeline_id: parseInt(formData.get('pipeline_id')),
                stage_id: parseInt(formData.get('stage_id')),
                lastMsg: formData.get('lastMsg')
            });

            document.getElementById('add-lead-modal').classList.add('hidden');
            Utils.showToast('Lead criado com sucesso', 'success');
            
            if(App.currentView === 'kanban') Kanban.render();
            else Dashboard.render();
        } catch (e) {
             // Erro já tratado no Data.addClient
        }
    }
};