// js/data.js - Camada de Dados Conectada ao Supabase com Realtime

const SUPABASE_URL = 'https://mivgqkiucmqypxqrclrg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pdmdxa2l1Y21xeXB4cXJjbHJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNzY0MzksImV4cCI6MjA3OTc1MjQzOX0.INrWiRr9ApW_CwYlCra9PVDfwt2aT7N7XSHwbsU9G1M';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const Data = {
    pipelines: [],
    stages: [],
    clients: [], // Dados do Kanban (Negócios)
    whatsappFeed: [], // Dados do Monitoramento (Atendimento)

    async init() {
        console.log('Iniciando sistema KikoBim...');
        try {
            // 1. Carrega Estrutura (Pipelines e Estágios)
            const [pipelinesRes, stagesRes] = await Promise.all([
                supabase.from('pipelines').select('*').order('id'),
                supabase.from('pipeline_stages').select('*').order('position')
            ]);

            this.pipelines = pipelinesRes.data || [];
            this.stages = stagesRes.data || [];

            // 2. Carrega Dados do Kanban (Tabela Clients)
            await this.loadKanbanData();

            // 3. Carrega Dados do Monitoramento (View WhatsApp)
            await this.loadWhatsappData();

            // 4. Inicia Realtime
            this.subscribeToChanges();

            return true;
        } catch (error) {
            console.error('Erro fatal ao carregar dados:', error);
            Utils.showToast('Erro de conexão com o servidor', 'error');
            return false;
        }
    },

    async loadKanbanData() {
        // Carrega clientes para o Kanban
        const { data, error } = await supabase
            .from('clients')
            .select(`
                id, nome, telefone, resumo, humor, 
                deal_value, unread_messages_count, 
                created_at, last_update, 
                pipeline_id, stage_id
            `)
            .order('last_update', { ascending: false, nullsFirst: false });

        if (error) throw error;

        this.clients = (data || []).map(c => ({
            ...c,
            name: c.nome, 
            lastMsg: c.resumo ? c.resumo.substring(0, 50) + '...' : 'Sem resumo...',
            last_update: c.last_update || c.created_at,
            humor: c.humor || 'neutro'
        }));
    },

    async loadWhatsappData() {
        // Consome a View criada especificamente para o monitoramento
        const { data, error } = await supabase
            .from('view_whatsapp_control')
            .select('*')
            .order('last_msg_time', { ascending: false });

        if (error) {
            console.error('Erro ao carregar feed do WhatsApp:', error);
            return;
        }

        this.whatsappFeed = data || [];
        
        // Atualiza a tela se estiver na visualização de clientes
        if (typeof Clients !== 'undefined' && App.currentView === 'clients') {
            Clients.render();
        }
    },

    subscribeToChanges() {
        // 1. Monitora tabela Clients (Para o Kanban)
        supabase.channel('kanban-changes')
            .on(
                'postgres_changes', 
                { event: '*', schema: 'public', table: 'clients' }, 
                (payload) => {
                    this.handleKanbanUpdate(payload);
                }
            )
            .subscribe();

        // 2. Monitora tabela raw_atendimentos_whatsapp (Para recarregar a View de Monitoramento)
        // Como Views não têm realtime direto, monitoramos a tabela base e recarregamos a lista
        supabase.channel('whatsapp-changes')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'raw_atendimentos_whatsapp' },
                () => {
                    // Quando chega nova mensagem, recarrega o feed do monitoramento
                    console.log('Nova mensagem detectada. Atualizando monitoramento...');
                    this.loadWhatsappData();
                }
            )
            .subscribe();
    },

    handleKanbanUpdate(payload) {
        if (payload.eventType === 'INSERT') {
            const newClient = { ...payload.new, name: payload.new.nome };
            this.clients.unshift(newClient);
        } else if (payload.eventType === 'UPDATE') {
            const index = this.clients.findIndex(c => c.id === payload.new.id);
            if (index !== -1) {
                this.clients[index] = { ...this.clients[index], ...payload.new, name: payload.new.nome };
            }
        }
        if (typeof Kanban !== 'undefined' && App.currentView === 'kanban') Kanban.render();
    },

    // Getters
    getPipeline(id) { return this.pipelines.find(p => p.id == id); },
    getStagesByPipeline(pipelineId) { return this.stages.filter(s => s.pipeline_id == pipelineId); },

    // Retorna clientes do Kanban
    getClients(filters = {}) {
        let result = this.clients;
        if (filters.pipeline_id) result = result.filter(c => c.pipeline_id == filters.pipeline_id);
        if (filters.search) {
            const term = filters.search.toLowerCase();
            result = result.filter(c => (c.name && c.name.toLowerCase().includes(term)));
        }
        return result;
    },
    
    // Retorna dados do Monitoramento WhatsApp
    getWhatsappFeed() {
        return this.whatsappFeed;
    },

    getClientById(id) {
        return this.clients.find(c => c.id === id);
    },

    // Funções de Escrita
    async updateClientStage(clientId, newStageId) {
        const { error } = await supabase
            .from('clients')
            .update({ stage_id: newStageId, last_update: new Date().toISOString() })
            .eq('id', clientId);
        return !error;
    },
    
    async getDashboardMetrics() {
        const { data, error } = await supabase.rpc('get_dashboard_metrics');
        if (error) return null;
        return data;
    }
};