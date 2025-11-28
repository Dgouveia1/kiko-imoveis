// js/app.js - Inicialização e Roteamento

const App = {
    currentView: 'kanban',

    async init() {
        // Exibe loading
        const loadingEl = document.getElementById('loading-screen');
        
        // Aguarda carregamento dos dados reais
        const success = await Data.init();
        
        if (success) {
            // Remove loading com fade out
            loadingEl.style.opacity = '0';
            setTimeout(() => loadingEl.remove(), 500);

            // Renderiza view inicial
            this.changeView('kanban');
            
            // Listener de teclas
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

        // Título e Busca Global
        const titleEl = document.getElementById('page-title');
        const searchContainer = document.getElementById('search-container');
        
        // Esconde busca global se não for Kanban (Clientes tem sua própria busca)
        if (searchContainer) {
            if (viewName === 'kanban') searchContainer.classList.remove('opacity-0', 'pointer-events-none');
            else searchContainer.classList.add('opacity-0', 'pointer-events-none');
        }

        // Roteamento de Views
        if (viewName === 'kanban') {
            titleEl.textContent = 'Gestão de Leads';
            Kanban.init();
        } else if (viewName === 'dashboard') {
            titleEl.textContent = 'Dashboard Executivo';
            Dashboard.init();
        } else if (viewName === 'clients') {
            titleEl.textContent = 'Base de Clientes';
            Clients.init();
        }

        // Setup do Search Input Global (apenas para Kanban agora)
        const searchInput = document.getElementById('search-input');
        if (searchInput && viewName === 'kanban') {
            const newInput = searchInput.cloneNode(true);
            searchInput.parentNode.replaceChild(newInput, searchInput);
            newInput.addEventListener('input', (e) => {
                if (App.currentView === 'kanban') Kanban.setSearch(e.target.value);
            });
            newInput.value = Kanban.searchQuery;
        }
    },

    toggleNotifications() {
        // Obsoleto com a nova aba, mas mantido por compatibilidade se chamado
        Utils.showToast('Use a aba Clientes para ver todos os contatos.');
    }
};

// Iniciar ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});