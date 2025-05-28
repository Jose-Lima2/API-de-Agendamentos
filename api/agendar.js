const { autenticar } = require('../lib/auth');
const { 
  agendamentos, 
  horariosDisponiveis, 
  gerarId, 
  verificarDisponibilidade, 
  adicionarFilaEspera 
} = require('../lib/dados');

// Endpoint para agendar horário
function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      erro: 'Método não permitido. Use POST.' 
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
    
    const { data, horario } = req.body;
    
    // Validações básicas
    if (!data || !horario) {
      return res.status(400).json({ 
        erro: 'Data e horário são obrigatórios' 
      });
    }
    
    // Validar formato da data (YYYY-MM-DD)
    const dataRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dataRegex.test(data)) {
      return res.status(400).json({ 
        erro: 'Data deve estar no formato YYYY-MM-DD' 
      });
    }
    
    // Validar se horário está disponível
    if (!horariosDisponiveis.includes(horario)) {
      return res.status(400).json({ 
        erro: `Horário inválido. Horários disponíveis: ${horariosDisponiveis.join(', ')}` 
      });
    }
    
    // Validar se data não é no passado
    const dataAgendamento = new Date(data);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    if (dataAgendamento < hoje) {
      return res.status(400).json({ 
        erro: 'Não é possível agendar para datas passadas' 
      });
    }
    
    // Verificar se usuário já tem agendamento para este horário
    const agendamentoExistente = agendamentos.find(ag => 
      ag.usuario === auth.usuario.nome && 
      ag.data === data && 
      ag.horario === horario && 
      ag.status === 'confirmado'
    );
    
    if (agendamentoExistente) {
      return res.status(409).json({ 
        erro: 'Você já possui um agendamento para este horário' 
      });
    }
    
    // Verificar disponibilidade
    const disponivel = verificarDisponibilidade(data, horario);
    
    if (disponivel) {
      // Criar agendamento
      const novoAgendamento = {
        id: gerarId(),
        usuario: auth.usuario.nome,
        data,
        horario,
        status: 'confirmado',
        dataAgendamento: new Date().toISOString()
      };
      
      agendamentos.push(novoAgendamento);
      
      console.log(`✅ Agendamento criado: ${auth.usuario.nome} - ${data} às ${horario}`);
      
      return res.status(201).json({
        sucesso: true,
        mensagem: 'Agendamento realizado com sucesso',
        agendamento: novoAgendamento
      });
      
    } else {
      // Adicionar à fila de espera
      const posicaoFila = adicionarFilaEspera(data, horario, auth.usuario.nome);
      
      console.log(`📋 Usuário ${auth.usuario.nome} adicionado à fila de espera para ${data} às ${horario}`);
      
      return res.status(202).json({
        sucesso: true,
        mensagem: 'Horário ocupado. Você foi adicionado à fila de espera.',
        filaEspera: {
          id: posicaoFila.id,
          posicao: posicaoFila.id,
          dataHorario: `${data} ${horario}`,
          dataAdicionado: posicaoFila.dataHoraCadastro
        }
      });
    }
    
  } catch (error) {
    console.error('Erro ao agendar:', error);
    return res.status(500).json({ 
      erro: 'Erro interno do servidor' 
    });
  }
}

module.exports = { default: handler }; 