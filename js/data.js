// js/data.js - Camada de Dados Conectada ao Supabase

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
    dashboardCache: null, // Cache simples para evitar requests excessivos

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

            console.log('Dados carregados:', this.clients.length, 'clientes');
            return true;

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            alert('Erro ao conectar com o banco de dados. Verifique o console.');
            return false;
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
                    direction: 'inbound',
                    status: 'received'
                };
                const { data: msgData } = await supabase.from('messages').insert(msgPayload).select();
                if(msgData) msgs.push(msgData[0]);
            }

            const newLocalClient = { ...data, messages: msgs, tags: [] };
            this.clients.unshift(newLocalClient);
            return newLocalClient;
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
                    direction: direction,
                    type: 'text',
                    status: 'sent'
                })
                .select()
                .single();
            if (error) throw error;
            const client = this.getClientById(clientId);
            if(client) {
                const uiMsg = { ...data, text: data.content };
                client.messages.push(uiMsg);
            }
            return data;
        } catch (err) { console.error(err); }
    },

    // --- NOVA FUNÇÃO DE MÉTRICAS VIA RPC ---
    async getDashboardMetrics() {
        try {
            // Chama a função RPC criada no Supabase
            const { data, error } = await supabase.rpc('get_dashboard_metrics');
            
            if (error) throw error;
            this.dashboardCache = data;
            return data;
        } catch (error) {
            console.error('Erro ao buscar métricas do dashboard:', error);
            Utils.showToast('Erro ao carregar métricas atualizadas.', 'error');
            return null;
        }
    },

    // --- MÉTODOS DE DOCUMENTOS ---
    async getDocuments(clientId) {
        const { data, error } = await supabase
            .from('client_documents')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error(error);
            return [];
        }
        return data;
    },

    async uploadDocument(clientId, file) {
        try {
            if (!clientId) throw new Error("ID do cliente inválido para upload.");

            const sanitizedName = file.name
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, "") 
                .replace(/[^a-zA-Z0-9.-]/g, "_"); 

            const fileName = `${clientId}/${Date.now()}_${sanitizedName}`;
            
            const { data: uploadData, error: uploadError } = await supabase
                .storage
                .from('documents') 
                .upload(fileName, file, { cacheControl: '3600', upsert: false });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase
                .storage
                .from('documents')
                .getPublicUrl(fileName);

            const { data: dbData, error: dbError } = await supabase
                .from('client_documents')
                .insert({
                    client_id: clientId,
                    name: file.name,
                    file_type: file.type,
                    file_size_bytes: file.size,
                    file_url: publicUrl,
                    uploaded_by: null
                })
                .select()
                .single();

            if (dbError) throw dbError;
            return dbData;

        } catch (error) {
            console.error('Erro no upload:', error);
            if (error.message && error.message.includes('row-level security policy')) {
                Utils.showToast("Erro: Permissões do Bucket não configuradas no Supabase.", "error");
            } else {
                throw error;
            }
        }
    },

    async deleteDocument(documentId, fileUrl) {
        try {
            const path = fileUrl.split('/documents/')[1];
            if (path) {
                const { error: storageError } = await supabase.storage.from('documents').remove([path]);
                if (storageError) console.warn('Aviso: Erro ao deletar do storage, tentando deletar do banco...', storageError);
            }
            const { error: dbError } = await supabase.from('client_documents').delete().eq('id', documentId);
            if (dbError) throw dbError;
            return true;
        } catch (error) {
            console.error('Erro ao deletar documento:', error);
            throw error;
        }
    },

    // --- MÉTODOS DE ANOTAÇÕES ---
    async getNotes(clientId) {
        const { data, error } = await supabase.from('client_notes').select('*').eq('client_id', clientId).order('created_at', { ascending: false });
        if (error) { console.error(error); return []; }
        return data;
    },

    async addNote(clientId, content) {
        try {
            const { data, error } = await supabase.from('client_notes').insert({ client_id: clientId, content: content, user_id: null }).select().single();
            if (error) throw error;
            return data;
        } catch (error) { console.error('Erro ao salvar nota:', error); throw error; }
    }
};