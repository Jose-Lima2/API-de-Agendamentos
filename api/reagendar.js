const { autenticar } = require('../lib/auth');
const { 
  agendamentos, 
  horariosDisponiveis, 
  verificarDisponibilidade, 
  adicionarFilaEspera,
  processarFilaEspera
} = require('../lib/dados');

// Endpoint para reagendar horário
function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'PUT') {
    return res.status(405).json({ 
      erro: 'Método não permitido. Use PUT.' 
    });
  }
  
  try {
    // Verificar autenticação
    const auth = autenticar(req);
    if (!auth.autenticado) {
      return res.status(401).json({ 
        erro: auth.erro 
      });
    }
    
    const { agendamentoId, novaData, novoHorario } = req.body;
    
    // Validações básicas
    if (!agendamentoId || !novaData || !novoHorario) {
      return res.status(400).json({ 
        erro: 'ID do agendamento, nova data e novo horário são obrigatórios' 
      });
    }
    
    // Validar formato da data (YYYY-MM-DD)
    const dataRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dataRegex.test(novaData)) {
      return res.status(400).json({ 
        erro: 'Data deve estar no formato YYYY-MM-DD' 
      });
    }
    
    // Validar se horário está disponível
    if (!horariosDisponiveis.includes(novoHorario)) {
      return res.status(400).json({ 
        erro: `Horário inválido. Horários disponíveis: ${horariosDisponiveis.join(', ')}` 
      });
    }
    
    // Validar se data não é no passado
    const dataAgendamento = new Date(novaData);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    if (dataAgendamento < hoje) {
      return res.status(400).json({ 
        erro: 'Não é possível reagendar para datas passadas' 
      });
    }
    
    // Buscar agendamento existente
    const agendamentoIndex = agendamentos.findIndex(ag => 
      ag.id === agendamentoId && 
      ag.usuario === auth.usuario.nome && 
      ag.status === 'confirmado'
    );
    
    if (agendamentoIndex === -1) {
      return res.status(404).json({ 
        erro: 'Agendamento não encontrado ou você não tem permissão para alterá-lo' 
      });
    }
    
    const agendamentoAtual = agendamentos[agendamentoIndex];
    
    // Verificar disponibilidade do novo horário
    const disponivel = verificarDisponibilidade(novaData, novoHorario);
    
    if (!disponivel) {
      // Adicionar à fila de espera para novo horário
      const posicaoFila = adicionarFilaEspera(novaData, novoHorario, auth.usuario.nome);
      
      console.log(`📋 Reagendamento: ${auth.usuario.nome} adicionado à fila de espera para ${novaData} às ${novoHorario}`);
      
      return res.status(202).json({
        sucesso: true,
        mensagem: 'Novo horário ocupado. Você foi adicionado à fila de espera. Seu agendamento atual permanece ativo.',
        agendamentoAtual,
        filaEspera: {
          id: posicaoFila.id,
          posicao: posicaoFila.id,
          dataHorario: `${novaData} ${novoHorario}`,
          dataAdicionado: posicaoFila.dataHoraCadastro
        }
      });
    }
    
    // Salvar dados do agendamento antigo para processar fila
    const dataAnterior = agendamentoAtual.data;
    const horarioAnterior = agendamentoAtual.horario;
    
    // Atualizar agendamento
    agendamentos[agendamentoIndex] = {
      ...agendamentoAtual,
      data: novaData,
      horario: novoHorario,
      dataReagendamento: new Date().toISOString()
    };
    
    console.log(`🔄 Reagendamento: ${auth.usuario.nome} - de ${dataAnterior} ${horarioAnterior} para ${novaData} ${novoHorario}`);
    
    // Processar fila de espera para o horário liberado
    const novoAgendamentoFila = processarFilaEspera(dataAnterior, horarioAnterior);
    
    const resposta = {
      sucesso: true,
      mensagem: 'Agendamento reagendado com sucesso',
      agendamento: agendamentos[agendamentoIndex]
    };
    
    if (novoAgendamentoFila) {
      resposta.notificacao = `Horário ${dataAnterior} ${horarioAnterior} foi automaticamente preenchido pela fila de espera`;
    }
    
    return res.status(200).json(resposta);
    
  } catch (error) {
    console.error('Erro ao reagendar:', error);
    return res.status(500).json({ 
      erro: 'Erro interno do servidor' 
    });
  }
}

module.exports = { default: handler }; 