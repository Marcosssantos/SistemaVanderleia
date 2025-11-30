document.addEventListener('DOMContentLoaded', () => {
    // 1. Definição das variáveis de elementos HTML
    const formAgendamento = document.getElementById('form-agendamento');
    const listaAgendamentosDiv = document.getElementById('lista-agendamentos');
    const mensagemDiv = document.getElementById('mensagem');
    
    // Elementos do Administrador/Feedback
    const btnAdminAccess = document.getElementById('btn-admin-access');
    const loginModal = document.getElementById('login-modal');
    const formLogin = document.getElementById('form-login');
    const loginMessage = document.getElementById('login-message');
    const adminTools = document.getElementById('admin-tools');
    const feedbackForm = document.getElementById('form-feedback');
    const feedbackDisplay = document.getElementById('feedback-display');
    const listaPromocoes = document.getElementById('lista-promocoes');
    
    let isAdminLoggedIn = false;

    // 2. Carregar dados do LocalStorage
    let agendamentos = JSON.parse(localStorage.getItem('agendamentosVanderleia')) || [];
    let clientesFieis = JSON.parse(localStorage.getItem('clientesFieisVanderleia')) || [];
    // Mantendo a lista de promoções para que o admin possa editá-la
    let promocoesAtuais = JSON.parse(localStorage.getItem('promocoesVanderleia')) || [
        "Segunda-feira: Manicure & Pedicure por R$ 50.",
        "Mês de Aniversário: 10% OFF em qualquer serviço."
    ];
    
    // 3. Mapeamento de IDs
    const profissoes = {
        '1': 'Vanderleia',
        '2': 'Mayara',
        '3': 'Michele'
    };
    const servicosMap = {
        '20': 'Corte Masculino',
        '30': 'Corte Feminino',
        '60': 'Coloração',
        '45': 'Manicure e Pedicure',
        '120': 'Mechas/Luzes'
    };

    // Função auxiliar para formatar a data
    const formatarData = (data) => {
        const d = new Date(data);
        return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    // ==========================================================
    // FUNÇÕES DE UTILIDADE E RENDERIZAÇÃO
    // ==========================================================

    const exibirMensagem = (texto, tipo) => {
        mensagemDiv.textContent = texto;
        mensagemDiv.className = tipo === 'sucesso' ? 'mensagem-sucesso' : 'mensagem-erro';
        mensagemDiv.classList.remove('hidden');
        setTimeout(() => {
            mensagemDiv.classList.add('hidden');
        }, 5000);
    };

    // RENDERIZAÇÃO DA LISTA DE PROMOÇÕES
    const renderizarPromocoes = () => {
        listaPromocoes.innerHTML = '';
        if (promocoesAtuais.length === 0) {
            listaPromocoes.innerHTML = '<li>Nenhuma promoção ativa no momento.</li>';
            return;
        }
        promocoesAtuais.forEach(promo => {
            const item = document.createElement('li');
            item.textContent = promo;
            listaPromocoes.appendChild(item);
        });
    };

    // RENDERIZAÇÃO DA GRADE DE AGENDAMENTOS
    const renderizarAgendamentos = () => {
        listaAgendamentosDiv.innerHTML = '';
        
        // Ordenação por Prioridade (Fiel) e Data
        const agendamentosOrdenados = agendamentos.sort((a, b) => {
            const aIsFiel = clientesFieis.includes(a.cliente);
            const bIsFiel = clientesFieis.includes(b.cliente);

            if (aIsFiel && !bIsFiel) return -1;
            if (!aIsFiel && bIsFiel) return 1;

            return new Date(a.inicio) - new Date(b.inicio);
        });

        if (agendamentosOrdenados.length === 0) {
            listaAgendamentosDiv.innerHTML = '<p>Nenhum agendamento registrado localmente.</p>';
            return;
        }

        agendamentosOrdenados.forEach(agendamento => {
            const item = document.createElement('div');
            item.className = 'agendamento-item';
            
            const duracao = parseInt(agendamento.duracaoMinutos);
            const fim = new Date(agendamento.inicio);
            fim.setMinutes(fim.getMinutes() + duracao);

            const isFiel = clientesFieis.includes(agendamento.cliente);
            const statusFiel = isFiel ? ' 🌟 (Cliente Fiel)' : '';
            
            item.innerHTML = `
                <strong>ID: #${agendamento.id}</strong><br>
                <strong>Cliente:</strong> ${agendamento.cliente} ${statusFiel}<br>
                <strong>Profissional:</strong> ${profissoes[agendamento.profissionalId]}<br>
                <strong>Serviço:</strong> ${servicosMap[agendamento.duracaoMinutos]} (${agendamento.duracaoMinutos} min)<br>
                <strong>Início:</strong> ${formatarData(agendamento.inicio)}<br>
                <strong>Fim Estimado:</strong> ${formatarData(fim)}
                `;
            listaAgendamentosDiv.appendChild(item);
        });
    };


    // ==========================================================
    // LÓGICA DE ADMINISTRAÇÃO (LOGIN E FERRAMENTAS)
    // ==========================================================
    
    btnAdminAccess.addEventListener('click', () => {
        loginModal.classList.remove('hidden');
        loginMessage.classList.add('hidden');
    });

    window.closeModal = () => {
        loginModal.classList.add('hidden');
    };

    formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('admin-user').value;
        const pass = document.getElementById('admin-pass').value;

        // Credenciais Simples: user: admin, pass: 123
        if (user === 'Leia' && pass === '123') {
            isAdminLoggedIn = true;
            closeModal();
            adminTools.classList.remove('hidden'); 
            exibirMensagem('Acesso de administrador concedido. Ferramentas disponíveis.', 'sucesso');
        } else {
            loginMessage.textContent = 'Usuário ou Senha incorretos.';
            loginMessage.className = 'mensagem-erro';
            loginMessage.classList.remove('hidden');
        }
    });

    // Função Admin: Excluir Agendamento
    window.excluirAgendamentoAdmin = () => {
        if (!isAdminLoggedIn) return exibirMensagem('Ação restrita!', 'erro');

        const id = prompt("Digite o ID do agendamento para EXCLUIR:");
        if (id) {
            const agendamentoAntes = agendamentos.length;
            agendamentos = agendamentos.filter(agendamento => agendamento.id != id);

            if (agendamentos.length < agendamentoAntes) {
                localStorage.setItem('agendamentosVanderleia', JSON.stringify(agendamentos));
                renderizarAgendamentos();
                exibirMensagem(`Agendamento #${id} excluído com sucesso!`, 'sucesso');
            } else {
                 exibirMensagem(`Agendamento #${id} não encontrado.`, 'erro');
            }
        }
    };

    // Função Admin: Editar Horário
    window.editarHorarioAdmin = () => {
        if (!isAdminLoggedIn) return exibirMensagem('Ação restrita!', 'erro');

        const id = prompt("Digite o ID do agendamento que deseja editar:");
        if (id) {
            const agendamentoParaEditar = agendamentos.find(a => a.id == id);
            if (agendamentoParaEditar) {
                const novoInicio = prompt(`Agendamento #${id}. Digite a nova data e hora (Ex: 2025-12-15 10:00):`);
                if (novoInicio) {
                    agendamentoParaEditar.inicio = new Date(novoInicio).toISOString();
                    localStorage.setItem('agendamentosVanderleia', JSON.stringify(agendamentos));
                    renderizarAgendamentos();
                    exibirMensagem(`Agendamento #${id} atualizado com sucesso!`, 'sucesso');
                }
            } else {
                 exibirMensagem(`Agendamento #${id} não encontrado.`, 'erro');
            }
        }
    };
    
    // NOVO: Função Admin: Gerenciar/Editar Promoções
    window.gerenciarPromocoesAdmin = () => {
        if (!isAdminLoggedIn) return exibirMensagem('Ação restrita!', 'erro');

        let promptMessage = `Promoções Atuais:\n`;
        promocoesAtuais.forEach((promo, index) => {
            promptMessage += `${index + 1}. ${promo}\n`;
        });
        promptMessage += `\nDigite o NÚMERO da promoção que deseja editar (1 a ${promocoesAtuais.length}), ou digite NOVO para adicionar uma, ou VAZIO para cancelar.`;

        const choice = prompt(promptMessage);

        if (choice === null || choice.trim() === '') return;

        if (choice.toUpperCase() === 'NOVO') {
            const novaPromo = prompt("Digite o texto da nova promoção:");
            if (novaPromo && novaPromo.trim().length > 0) {
                promocoesAtuais.push(novaPromo.trim());
                localStorage.setItem('promocoesVanderleia', JSON.stringify(promocoesAtuais));
                renderizarPromocoes();
                exibirMensagem('Nova promoção adicionada com sucesso!', 'sucesso');
            }
        } else {
            const index = parseInt(choice) - 1;
            
            if (index >= 0 && index < promocoesAtuais.length) {
                const novaTexto = prompt(`Editando Promoção ${index + 1}: Digite o novo texto para "${promocoesAtuais[index]}":`);
                if (novaTexto !== null && novaTexto.trim().length > 0) {
                    promocoesAtuais[index] = novaTexto.trim();
                    localStorage.setItem('promocoesVanderleia', JSON.stringify(promocoesAtuais));
                    renderizarPromocoes();
                    exibirMensagem(`Promoção ${index + 1} editada com sucesso!`, 'sucesso');
                }
            } else {
                exibirMensagem('Número de promoção inválido.', 'erro');
            }
        }
    };

    // Função Admin: Cadastrar Cliente Fiel
    window.cadastrarClienteFielAdmin = () => {
        if (!isAdminLoggedIn) return exibirMensagem('Ação restrita!', 'erro');

        const nome = prompt("Digite o nome completo do Cliente Fiel:");
        if (nome && nome.trim() !== '') {
            const nomeFormatado = nome.trim();
            if (!clientesFieis.includes(nomeFormatado)) {
                clientesFieis.push(nomeFormatado);
                localStorage.setItem('clientesFieisVanderleia', JSON.stringify(clientesFieis));
                exibirMensagem(`Cliente Fiel "${nomeFormatado}" cadastrado. Total: ${clientesFieis.length}`, 'sucesso');
                renderizarAgendamentos(); 
            } else {
                exibirMensagem(`Cliente "${nomeFormatado}" já está na lista de fiéis.`, 'erro');
            }
        }
    };
    
    // Função Admin: Excluir Cliente Fiel
    window.excluirClienteFielAdmin = () => {
        if (!isAdminLoggedIn) return exibirMensagem('Ação restrita!', 'erro');

        const lista = clientesFieis.join(', ');
        const nome = prompt(`Clientes Fiéis Atuais: ${lista}\n\nDigite o nome completo do cliente fiel para EXCLUIR:`);
        
        if (nome && nome.trim() !== '') {
            const nomeFormatado = nome.trim();
            const index = clientesFieis.indexOf(nomeFormatado);
            
            if (index > -1) {
                clientesFieis.splice(index, 1);
                localStorage.setItem('clientesFieisVanderleia', JSON.stringify(clientesFieis));
                exibirMensagem(`Cliente Fiel "${nomeFormatado}" excluído. Total: ${clientesFieis.length}`, 'sucesso');
                renderizarAgendamentos(); 
            } else {
                exibirMensagem(`Cliente "${nomeFormatado}" não encontrado na lista de fiéis.`, 'erro');
            }
        }
    };


    // ==========================================================
    // LÓGICA DE SATISFAÇÃO E LINKS RÁPIDOS
    // ==========================================================

    // NOVO: Formulário de Feedback com Nome
    feedbackForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = document.getElementById('feedback-name').value;
        const feedback = document.getElementById('feedback-input').value;

        // Atualiza a exibição para incluir o nome do cliente
        feedbackDisplay.innerHTML = `<p>Feedback recente de **${nome.trim()}**: "${feedback}"</p>`;
        
        feedbackForm.reset();
        exibirMensagem('Seu feedback foi registrado!', 'sucesso');
    });

    window.showFeedback = () => {
        document.getElementById('satisfacao-cliente').scrollIntoView({ behavior: 'smooth' });
    };

    window.showPromotions = () => {
        document.getElementById('promocoes-display').scrollIntoView({ behavior: 'smooth' });
    };


    // ==========================================================
    // LISTENER PRINCIPAL DE AGENDAMENTO
    // ==========================================================
    formAgendamento.addEventListener('submit', (e) => {
        e.preventDefault();

        const cliente = document.getElementById('cliente').value;
        const profissionalId = document.getElementById('profissional').value;
        const duracaoMinutos = document.getElementById('servico').value;
        const dataHoraInput = document.getElementById('data-hora').value;

        // ... Validação e Lógica de Conflito ...
        
        const inicio = new Date(dataHoraInput);
        const duracao = parseInt(duracaoMinutos);
        const fim = new Date(inicio);
        fim.setMinutes(fim.getMinutes() + duracao);

        if (inicio < new Date()) {
             exibirMensagem('Não é possível agendar no passado.', 'erro');
             return;
        }

        const novoAgendamento = {
            id: Date.now(), 
            cliente: cliente.trim(), 
            profissionalId,
            duracaoMinutos,
            inicio: inicio.toISOString(),
            fim: fim.toISOString()
        };

        agendamentos.push(novoAgendamento);
        localStorage.setItem('agendamentosVanderleia', JSON.stringify(agendamentos));
        
        exibirMensagem('Agendamento realizado com sucesso!', 'sucesso');
        formAgendamento.reset();
        renderizarAgendamentos();
    });

    // Inicialização de todas as listas
    renderizarAgendamentos();
    renderizarPromocoes();
});

