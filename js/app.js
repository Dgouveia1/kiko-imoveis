// js/app.js

const App = {
    currentView: 'kanban', // Views: kanban, dashboard, clients

    async init() {
        // Exibe loading enquanto o Data.init() conecta no Supabase
        const loadingEl = document.getElementById('loading-screen');
        
        const success = await Data.init();
        
        if (success) {
            // Remove loading
            loadingEl.style.opacity = '0';
            setTimeout(() => loadingEl.remove(), 500);

            // Renderiza inicial
            this.changeView('kanban');
            
            // Listener de teclado global
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') Modal.close();
            });
        }
    },

    changeView(viewName) {
        this.currentView = viewName;
        
        // Atualiza UI da Navegação
        document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('nav-active', 'text-slate-900'));
        const activeBtn = document.getElementById(`nav-${viewName}`);
        if(activeBtn) {
            activeBtn.classList.add('nav-active', 'text-slate-900');
            activeBtn.classList.remove('text-slate-400');
        }

        // Título Header
        const titleEl = document.getElementById('page-title');
        
        // Roteamento
        if (viewName === 'kanban') {
            titleEl.textContent = 'Gestão de Pipelines';
            Kanban.init();
        } else if (viewName === 'dashboard') {
            titleEl.textContent = 'Métricas Executivas';
            Dashboard.init();
        } else if (viewName === 'clients') {
            titleEl.textContent = 'Fila de Atendimento';
            Clients.init();
        }

        // Atualiza busca global (Search Input)
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            // Limpa listeners antigos clonando o elemento
            const newInput = searchInput.cloneNode(true);
            searchInput.parentNode.replaceChild(newInput, searchInput);
            
            newInput.value = Kanban.searchQuery; // Restaura busca anterior
            newInput.addEventListener('input', (e) => {
                const val = e.target.value;
                if (App.currentView === 'kanban') {
                    Kanban.searchQuery = val;
                    Kanban.render();
                } else if (App.currentView === 'clients') {
                    // Implementar busca em clientes se necessário
                }
            });
        }
    }
};

// Start
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});