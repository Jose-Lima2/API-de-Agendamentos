const { autenticar } = require('../lib/auth');
const { 
  agendamentos, 
  processarFilaEspera
} = require('../lib/dados');

// Endpoint para cancelar agendamento
function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'DELETE') {
    return res.status(405).json({ 
      erro: 'Método não permitido. Use DELETE.' 
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
    
    const { agendamentoId } = req.body;
    
    // Validação básica
    if (!agendamentoId) {
      return res.status(400).json({ 
        erro: 'ID do agendamento é obrigatório' 
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
        erro: 'Agendamento não encontrado ou você não tem permissão para cancelá-lo' 
      });
    }
    
    const agendamentoCancelado = agendamentos[agendamentoIndex];
    
    // Salvar dados antes de cancelar
    const dataLiberada = agendamentoCancelado.data;
    const horarioLiberado = agendamentoCancelado.horario;
    
    // Marcar como cancelado ao invés de remover (para histórico)
    agendamentos[agendamentoIndex] = {
      ...agendamentoCancelado,
      status: 'cancelado',
      dataCancelamento: new Date().toISOString()
    };
    
    console.log(`❌ Cancelamento: ${auth.usuario.nome} - ${dataLiberada} às ${horarioLiberado}`);
    
    // Processar fila de espera para o horário liberado
    const novoAgendamentoFila = processarFilaEspera(dataLiberada, horarioLiberado);
    
    const resposta = {
      sucesso: true,
      mensagem: 'Agendamento cancelado com sucesso',
      agendamentoCancelado: {
        id: agendamentoCancelado.id,
        data: dataLiberada,
        horario: horarioLiberado,
        dataCancelamento: agendamentos[agendamentoIndex].dataCancelamento
      }
    };
    
    if (novoAgendamentoFila) {
      resposta.notificacao = `Horário ${dataLiberada} ${horarioLiberado} foi automaticamente preenchido pela fila de espera para ${novoAgendamentoFila.usuario}`;
      resposta.novoAgendamento = novoAgendamentoFila;
    } else {
      resposta.notificacao = `Horário ${dataLiberada} ${horarioLiberado} está agora disponível para novos agendamentos`;
    }
    
    return res.status(200).json(resposta);
    
  } catch (error) {
    console.error('Erro ao cancelar:', error);
    return res.status(500).json({ 
      erro: 'Erro interno do servidor' 
    });
  }
}

module.exports = { default: handler }; 