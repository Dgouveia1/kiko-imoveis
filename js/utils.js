// js/utils.js - Funções auxiliares

const Utils = {
    formatCurrency(value) {
        if (!value) return 'R$ 0';
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    },

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    },

    formatDateTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    },

    formatRelativeTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Agora';
        if (diffMins < 60) return `${diffMins} min`;
        if (diffHours < 24) return `${diffHours} h`;
        return `${diffDays} dias`;
    },

    // Novo: Formata bytes para KB/MB
    formatBytes(bytes, decimals = 2) {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    },

    // Novo: Retorna ícone baseado na extensão/tipo
    getFileIcon(fileType) {
        if (fileType.includes('pdf')) return 'file-text';
        if (fileType.includes('image')) return 'image';
        if (fileType.includes('csv') || fileType.includes('excel') || fileType.includes('sheet')) return 'sheet';
        return 'file'; // Default
    },

    getTagColorClasses(tag) {
        const colors = {
            'Urgente': 'bg-red-50 text-red-700 border-red-200',
            'Investidor': 'bg-slate-800 text-[#E6C35C] border-slate-700',
            'À Vista': 'bg-green-50 text-green-700 border-green-200',
            'Fiador': 'bg-blue-50 text-blue-700 border-blue-200',
            'Exclusividade': 'bg-[#F7F2D6] text-[#8F7320] border-[#EEDD9D]',
            'Seguro Fiança': 'bg-slate-100 text-slate-700 border-slate-200',
            'MCMV': 'bg-teal-50 text-teal-700 border-teal-200',
            'Bradesco': 'bg-red-50 text-red-800 border-red-200',
            'Itaú': 'bg-orange-50 text-orange-700 border-orange-200',
            'Caixa': 'bg-blue-50 text-blue-700 border-blue-200',
            'default': 'bg-gray-100 text-gray-700 border-gray-200'
        };
        return colors[tag] || colors['default'];
    },

    showToast(msg, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        
        let bgColor = 'bg-slate-900';
        let icon = 'info';
        
        if (type === 'success') { bgColor = 'bg-green-600'; icon = 'check-circle'; } 
        else if (type === 'error') { bgColor = 'bg-red-600'; icon = 'alert-circle'; } 
        else if (type === 'warning') { bgColor = 'bg-yellow-600'; icon = 'alert-triangle'; }
        
        toast.className = `${bgColor} text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 min-w-[300px] border-l-4 border-gold animate-[slideIn_0.3s_ease-out] pointer-events-auto`;
        toast.innerHTML = `
            <i data-lucide="${icon}" class="w-4 h-4 text-gold"></i>
            <div><p class="text-sm font-semibold">${msg}</p><p class="text-[10px] text-slate-200">Agora mesmo</p></div>
        `;
        container.appendChild(toast);
        lucide.createIcons();
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
};