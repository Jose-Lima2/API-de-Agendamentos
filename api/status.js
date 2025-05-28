const { autenticar } = require('../lib/auth');
const { 
  agendamentos, 
  filaEspera, 
  horariosDisponiveis
} = require('../lib/dados');

// Endpoint para ver status dos agendamentos
function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      erro: 'Método não permitido. Use GET.' 
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
    
    const usuario = auth.usuario.nome;
    
    // Buscar agendamentos do usuário
    const meusAgendamentos = agendamentos.filter(ag => ag.usuario === usuario);
    
    // Buscar posições na fila de espera
    const minhasFilas = [];
    Object.keys(filaEspera).forEach(chave => {
      const [data, horario] = chave.split('-');
      const fila = filaEspera[chave];
      
      const minhaPosicao = fila.findIndex(pos => pos.usuario === usuario);
      if (minhaPosicao !== -1) {
        minhasFilas.push({
          data,
          horario,
          posicao: minhaPosicao + 1, // Posição 1-indexed
          totalNaFila: fila.length,
          id: fila[minhaPosicao].id,
          dataAdicionado: fila[minhaPosicao].dataHoraCadastro
        });
      }
    });
    
    // Separar agendamentos por status
    const agendamentosConfirmados = meusAgendamentos.filter(ag => ag.status === 'confirmado');
    const agendamentosCancelados = meusAgendamentos.filter(ag => ag.status === 'cancelado');
    
    // Verificar horários disponíveis para hoje e próximos dias
    const hoje = new Date();
    const proximosDias = [];
    
    for (let i = 0; i < 7; i++) { // Próximos 7 dias
      const data = new Date(hoje);
      data.setDate(hoje.getDate() + i);
      const dataStr = data.toISOString().split('T')[0];
      
      const horariosLivres = horariosDisponiveis.filter(horario => {
        return !agendamentos.find(ag => 
          ag.data === dataStr && 
          ag.horario === horario && 
          ag.status === 'confirmado'
        );
      });
      
      if (horariosLivres.length > 0) {
        proximosDias.push({
          data: dataStr,
          diaSemana: data.toLocaleDateString('pt-BR', { weekday: 'long' }),
          horariosLivres
        });
      }
    }
    
    const resposta = {
      sucesso: true,
      usuario: {
        nome: auth.usuario.nome,
        email: auth.usuario.email
      },
      agendamentos: {
        confirmados: agendamentosConfirmados.map(ag => ({
          id: ag.id,
          data: ag.data,
          horario: ag.horario,
          dataAgendamento: ag.dataAgendamento,
          dataReagendamento: ag.dataReagendamento || null
        })),
        cancelados: agendamentosCancelados.map(ag => ({
          id: ag.id,
          data: ag.data,
          horario: ag.horario,
          dataCancelamento: ag.dataCancelamento
        }))
      },
      filaEspera: minhasFilas,
      resumo: {
        totalAgendamentosConfirmados: agendamentosConfirmados.length,
        totalNaFilaEspera: minhasFilas.length,
        proximoAgendamento: agendamentosConfirmados.length > 0 ? 
          agendamentosConfirmados.sort((a, b) => new Date(a.data + ' ' + a.horario) - new Date(b.data + ' ' + b.horario))[0] : 
          null
      },
      horariosDisponiveis: proximosDias
    };
    
    return res.status(200).json(resposta);
    
  } catch (error) {
    console.error('Erro ao buscar status:', error);
    return res.status(500).json({ 
      erro: 'Erro interno do servidor' 
    });
  }
}

module.exports = { default: handler }; 