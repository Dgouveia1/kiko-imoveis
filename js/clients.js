// js/clients.js - Monitoramento de Atendimento (Consumindo view_whatsapp_control)

const Clients = {
    init() {
        this.render();
    },

    render() {
        const container = document.getElementById('app');
        
        // Busca dados da View específica de WhatsApp
        const feed = Data.getWhatsappFeed();

        // Ordenação: Prioridade para quem está aguardando, depois data mais recente
        feed.sort((a, b) => {
            if (a.aguardando_resposta && !b.aguardando_resposta) return -1;
            if (!a.aguardando_resposta && b.aguardando_resposta) return 1;
            return new Date(b.last_msg_time) - new Date(a.last_msg_time);
        });

        // Cabeçalho da Página
        const headerHtml = `
            <div class="px-8 py-6 bg-white border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                <div>
                    <h2 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <i data-lucide="message-square" class="text-green-600 fill-current"></i>
                        Monitoramento de Atendimento
                    </h2>
                    <p class="text-sm text-slate-500 mt-1">Acompanhamento em tempo real da fila do WhatsApp</p>
                </div>
                <div class="flex gap-2">
                     <button onclick="Data.loadWhatsappData()" class="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg text-sm font-bold transition-colors">
                        <i data-lucide="refresh-cw" class="w-4 h-4"></i> Atualizar
                    </button>
                </div>
            </div>
        `;

        // Cabeçalho da Tabela
        const tableHeader = `
            <thead class="bg-slate-50 sticky top-0 z-10 shadow-sm">
                <tr>
                    <th class="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Contato</th>
                    <th class="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Vínculo</th>
                    <th class="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Tempo Espera</th>
                    <th class="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-1/3 hidden sm:table-cell">Última Mensagem</th>
                    <th class="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Ação</th>
                </tr>
            </thead>
        `;

        // Linhas da Tabela
        const tableRows = feed.map(item => {
            const isWaiting = item.aguardando_resposta;
            
            // Status Visual
            const statusHtml = isWaiting 
                ? `<div class="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-2 py-1 rounded-md w-fit border border-orange-100 animate-pulse">
                     <i data-lucide="hourglass" class="w-3.5 h-3.5"></i>
                     <span class="text-xs font-bold">Aguardando</span>
                   </div>`
                : `<div class="flex items-center gap-1.5 text-green-600 bg-green-50 px-2 py-1 rounded-md w-fit border border-green-100">
                     <i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i>
                     <span class="text-xs font-bold">Respondido</span>
                   </div>`;

            // Tempo de Espera
            const waitTime = Utils.formatRelativeTime(item.last_msg_time).replace('há ', '');

            // Vínculo
            const vinculoClass = item.is_client 
                ? 'bg-green-100 text-green-700 border-green-200' 
                : 'bg-slate-100 text-slate-600 border-slate-200';

            // --- LÓGICA DO BOTÃO WHATSAPP ---
            // Remove caracteres não numéricos para criar o link limpo
            const rawPhone = item.telefone || '';
            const cleanPhone = rawPhone.replace(/\D/g, ''); 
            
            // Se o número não tiver DDI (menos de 12 dígitos), sugerimos adicionar 55 (Brasil) por padrão, 
            // mas mantendo simples: wa.me/numero
            const whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone.length <= 11 ? '55' + cleanPhone : cleanPhone}` : '#';
            const isDisabled = !cleanPhone ? 'opacity-50 pointer-events-none' : '';

            const actionButton = `
                <a href="${whatsappUrl}" target="_blank"
                    class="inline-flex items-center gap-2 px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded shadow-sm hover:shadow transition-all active:scale-95 no-underline ${isDisabled}">
                    <i data-lucide="message-circle" class="w-4 h-4"></i>
                    WhatsApp
                </a>`;

            return `
                <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100 group">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex flex-col">
                            <span class="text-sm font-bold text-slate-800">${item.nome}</span>
                            <span class="text-xs text-slate-400 mt-0.5 font-mono">${item.telefone || '-'}</span>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${vinculoClass}">
                            ${item.tipo_vinculo || 'Lead'}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        ${statusHtml}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap hidden lg:table-cell text-sm text-slate-500 font-mono">
                        ${isWaiting ? waitTime : '-'}
                    </td>
                    <td class="px-6 py-4 hidden sm:table-cell">
                        <div class="text-sm text-slate-600 line-clamp-1 max-w-xs italic" title="${item.last_msg_content || ''}">
                            ${item.last_msg_content || '<span class="text-slate-300">---</span>'}
                        </div>
                        <div class="text-[10px] text-slate-400 mt-1">
                            ${Utils.formatDate(item.last_msg_time)}
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right">
                        ${actionButton}
                    </td>
                </tr>
            `;
        }).join('');

        // Montagem Final
        container.innerHTML = `
            <div class="flex flex-col h-full bg-slate-50">
                ${headerHtml}
                <div class="flex-1 overflow-auto bg-white mx-8 my-6 rounded-xl shadow-sm border border-slate-200 custom-scrollbar">
                    <table class="min-w-full divide-y divide-slate-200">
                        ${tableHeader}
                        <tbody class="bg-white divide-y divide-slate-100">
                            ${feed.length > 0 ? tableRows : `
                                <tr>
                                    <td colspan="6" class="px-6 py-20 text-center text-slate-400">
                                        <div class="flex flex-col items-center justify-center">
                                            <i data-lucide="inbox" class="w-12 h-12 mb-3 opacity-20"></i>
                                            <p class="text-sm">Nenhum atendimento encontrado.</p>
                                        </div>
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        lucide.createIcons();
    }
};