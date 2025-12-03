// js/data.js - Camada de Dados Conectada ao Supabase com Realtime

const SUPABASE_URL = 'https://mivgqkiucmqypxqrclrg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pdmdxa2l1Y21xeXB4cXJjbHJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNzY0MzksImV4cCI6MjA3OTc1MjQzOX0.INrWiRr9ApW_CwYlCra9PVDfwt2aT7N7XSHwbsU9G1M';

// Inicializa cliente
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const Data = {
    pipelines: [],
    stages: [],
    clients: [],
    notifications: [],
    tags: [],
    dashboardCache: null,

    async init() {
        console.log('Iniciando conexão com Supabase...');
        try {
            const [pipelinesRes, stagesRes, clientsRes, tagsRes, clientTagsRes, msgsRes] = await Promise.all([
                supabase.from('pipelines').select('*').order('id'),
                supabase.from('pipeline_stages').select('*').order('position'),
                supabase.from('clients').select('*').order('updated_at', { ascending: false }),
                supabase.from('tags').select('*'),
                supabase.from('client_tags').select('*'),
                supabase.from('messages').select('*').order('created_at')
            ]);

            if (pipelinesRes.error) throw pipelinesRes.error;
            if (clientsRes.error) throw clientsRes.error;

            this.pipelines = pipelinesRes.data;
            this.stages = stagesRes.data;
            this.tags = tagsRes.data;

            const allMessages = msgsRes.data || [];
            const allClientTags = clientTagsRes.data || [];

            this.clients = clientsRes.data.map(client => {
                const clientMsgs = allMessages.filter(m => m.client_id === client.id);
                const clientTagIds = allClientTags
                    .filter(ct => ct.client_id === client.id)
                    .map(ct => ct.tag_id);
                
                const clientTagNames = this.tags
                    .filter(t => clientTagIds.includes(t.id))
                    .map(t => t.name);

                return {
                    ...client,
                    messages: clientMsgs,
                    tags: clientTagNames
                };
            });

            // Inicia escuta em tempo real
            this.subscribeToRealtime();

            console.log('Dados carregados:', this.clients.length, 'clientes');
            return true;

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            alert('Erro ao conectar com o banco de dados. Verifique o console.');
            return false;
        }
    },

    // --- REALTIME SUBSCRIPTION ---
    subscribeToRealtime() {
        console.log('Conectando ao Realtime...');
        
        // 1. Escuta alterações na tabela de CLIENTES (Update genérico)
        supabase.channel('public:clients')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, payload => {
                this.handleRealtimeUpdate(payload);
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') console.log('Escutando tabela clients...');
            });

        // 2. Escuta inserções no HISTÓRICO DE ESTÁGIOS (Para garantir atualização do Kanban)
        // Isso resolve o problema onde o to_stage_id existe no histórico mas o cliente não atualizou visualmente
        supabase.channel('public:client_stage_history')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'client_stage_history' }, payload => {
                this.handleStageHistoryUpdate(payload);
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') console.log('Escutando tabela client_stage_history...');
            });
    },

    // Handler para tabela clients
    handleRealtimeUpdate(payload) {
        console.log('Alteração em Clients:', payload);
        const { eventType, new: newRecord, old: oldRecord } = payload;

        if (eventType === 'INSERT') {
            const newClient = { ...newRecord, messages: [], tags: [] };
            this.clients.unshift(newClient);
            Utils.showToast(`Novo cliente: ${newRecord.name}`, 'success');
        } 
        else if (eventType === 'UPDATE') {
            const index = this.clients.findIndex(c => c.id === newRecord.id);
            if (index !== -1) {
                const existingMsgs = this.clients[index].messages;
                const existingTags = this.clients[index].tags;
                
                this.clients[index] = { 
                    ...newRecord, 
                    messages: existingMsgs, 
                    tags: existingTags 
                };
                
                // Feedback visual de mudança de estágio
                if (oldRecord && oldRecord.stage_id !== newRecord.stage_id) {
                     // Lógica opcional de toast, mas a atualização visual é feita pelo render
                }
            }
        } 
        else if (eventType === 'DELETE') {
            this.clients = this.clients.filter(c => c.id !== oldRecord.id);
        }

        this.refreshUI();
    },

    // Handler específico para client_stage_history (Correção do Bug to_stage_id)
    handleStageHistoryUpdate(payload) {
        console.log('Novo histórico de estágio:', payload);
        const { new: historyRecord } = payload;
        
        if (historyRecord && historyRecord.client_id && historyRecord.to_stage_id) {
            const index = this.clients.findIndex(c => c.id === historyRecord.client_id);
            
            if (index !== -1) {
                // Força a atualização do estágio no modelo local
                const oldStageId = this.clients[index].stage_id;
                this.clients[index].stage_id = historyRecord.to_stage_id;
                this.clients[index].updated_at = historyRecord.created_at || new Date().toISOString();
                
                if (oldStageId !== historyRecord.to_stage_id) {
                    console.log(`Atualizando cliente ${historyRecord.client_id} para estágio ${historyRecord.to_stage_id} via histórico.`);
                    this.refreshUI();
                    
                    const stageName = this.stages.find(s => s.id === historyRecord.to_stage_id)?.name;
                    Utils.showToast(`Cliente movido para ${stageName || 'novo estágio'}`, 'info');
                }
            }
        }
    },

    refreshUI() {
        if (typeof Kanban !== 'undefined' && App.currentView === 'kanban') {
            Kanban.render();
        } else if (typeof Clients !== 'undefined' && App.currentView === 'clients') {
            Clients.render();
        }
    },

    getPipeline(id) { return this.pipelines.find(p => p.id == id); },
    getStagesByPipeline(pipelineId) { return this.stages.filter(s => s.pipeline_id == pipelineId).sort((a,b) => a.position - b.position); },
    getClientById(id) { return this.clients.find(c => c.id === id); },

    getClients(filters = {}) {
        let results = this.clients;
        if (filters.pipeline_id) results = results.filter(c => c.pipeline_id == filters.pipeline_id);
        if (filters.search) {
            const term = filters.search.toLowerCase();
            results = results.filter(c => c.name.toLowerCase().includes(term));
        }
        if (filters.tags && filters.tags.length > 0) results = results.filter(c => filters.tags.some(tag => c.tags.includes(tag)));
        return results;
    },

    async updateClient(id, updates) {
        const index = this.clients.findIndex(c => c.id === id);
        if (index === -1) return;
        const oldData = { ...this.clients[index] };
        const newData = { ...oldData, ...updates, updated_at: new Date().toISOString() };
        this.clients[index] = newData;

        const { messages, tags, ...dbPayload } = updates;
        try {
            if (Object.keys(dbPayload).length > 0) {
                const { error } = await supabase.from('clients').update(dbPayload).eq('id', id);
                if (error) throw error;
            }
        } catch (err) {
            console.error("Erro ao salvar:", err);
            Utils.showToast("Erro ao salvar alterações", "error");
            this.clients[index] = oldData;
            this.refreshUI();
        }
    },

    async addClient(clientData) {
        const { lastMsg, tags, ...dbData } = clientData;
        const newClientPayload = {
            ...dbData,
            unread_messages_count: 0,
            deal_value: dbData.deal_value || 0
        };

        try {
            const { data, error } = await supabase.from('clients').insert(newClientPayload).select().single();
            if (error) throw error;

            let msgs = [];
            if (lastMsg) {
                const msgPayload = {
                    client_id: data.id,
                    content: lastMsg,
                    type: 'text',
                    from_me: false,
                    status: 'received'
                };
                const { data: msgData } = await supabase.from('messages').insert(msgPayload).select();
                if(msgData) msgs.push(msgData[0]);
            }
            
            return { ...data, messages: msgs, tags: [] };
        } catch (err) {
            console.error("Erro ao criar lead:", err);
            Utils.showToast("Erro ao criar lead", "error");
            throw err;
        }
    },

    async addMessage(clientId, text, direction) {
        try {
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    client_id: clientId,
                    content: text,
                    from_me: true,
                    type: 'text',
                    status: 'sent'
                })
                .select()
                .single();
            if (error) throw error;
            const client = this.getClientById(clientId);
            if(client) {
                client.messages.push(data);
            }
            return data;
        } catch (err) { console.error(err); }
    },

    // --- MÉTODOS DE DOCUMENTOS E ANOTAÇÕES (Mantidos iguais) ---
    async getDashboardMetrics() {
        try {
            const { data, error } = await supabase.rpc('get_dashboard_metrics');
            if (error) throw error;
            this.dashboardCache = data;
            return data;
        } catch (error) {
            console.error('Erro dashboard:', error);
            return null;
        }
    },

    async getDocuments(clientId) {
        const { data, error } = await supabase
            .from('client_documents')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });
        return error ? [] : data;
    },

    async uploadDocument(clientId, file) {
        try {
            if (!clientId) throw new Error("ID inválido");
            const sanitizedName = file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9.-]/g, "_"); 
            const fileName = `${clientId}/${Date.now()}_${sanitizedName}`;
            
            const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, file, { cacheControl: '3600', upsert: false });
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName);
            const { data: dbData, error: dbError } = await supabase.from('client_documents').insert({
                client_id: clientId, name: file.name, file_type: file.type, file_size_bytes: file.size, file_url: publicUrl, uploaded_by: null
            }).select().single();

            if (dbError) throw dbError;
            return dbData;
        } catch (error) {
            console.error('Erro no upload:', error);
            if (error.message && error.message.includes('row-level security policy')) Utils.showToast("Erro de Permissão Supabase", "error");
            else throw error;
        }
    },

    async deleteDocument(documentId, fileUrl) {
        try {
            const path = fileUrl.split('/documents/')[1];
            if (path) await supabase.storage.from('documents').remove([path]);
            const { error } = await supabase.from('client_documents').delete().eq('id', documentId);
            if (error) throw error;
            return true;
        } catch (error) { console.error(error); throw error; }
    },

    async getNotes(clientId) {
        const { data, error } = await supabase.from('client_notes').select('*').eq('client_id', clientId).order('created_at', { ascending: false });
        return error ? [] : data;
    },

    async addNote(clientId, content) {
        try {
            const { data, error } = await supabase.from('client_notes').insert({ client_id: clientId, content: content, user_id: null }).select().single();
            if (error) throw error;
            return data;
        } catch (error) { console.error(error); throw error; }
    }
};