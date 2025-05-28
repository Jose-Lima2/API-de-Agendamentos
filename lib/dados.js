// Dados em memória para o sistema de agendamento
// ATENÇÃO: Estes dados não persistem entre reinicializações do servidor

// Estrutura de dados para agendamentos
let agendamentos = [];

// Estrutura de dados para fila de espera por horário
let filaEspera = {};

// Horários disponíveis (simulando slots de 1 hora das 9h às 17h)
const horariosDisponiveis = [
  '09:00', '10:00', '11:00', '12:00', 
  '13:00', '14:00', '15:00', '16:00', '17:00'
];

// Função para gerar ID único simples
function gerarId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 5);
}

// Função para verificar se horário está disponível
function verificarDisponibilidade(data, horario) {
  return !agendamentos.find(ag => 
    ag.data === data && 
    ag.horario === horario && 
    ag.status === 'confirmado'
  );
}

// Função para adicionar à fila de espera
function adicionarFilaEspera(data, horario, usuario) {
  const chave = `${data}-${horario}`;
  if (!filaEspera[chave]) {
    filaEspera[chave] = [];
  }
  
  const posicao = {
    id: gerarId(),
    usuario,
    dataHoraCadastro: new Date().toISOString()
  };
  
  filaEspera[chave].push(posicao);
  return posicao;
}

// Função para processar fila quando horário é liberado
function processarFilaEspera(data, horario) {
  const chave = `${data}-${horario}`;
  const fila = filaEspera[chave];
  
  if (fila && fila.length > 0) {
    const proximoUsuario = fila.shift();
    
    // Simular notificação
    console.log(`📲 NOTIFICAÇÃO: Horário ${horario} do dia ${data} foi liberado para ${proximoUsuario.usuario}!`);
    
    // Criar agendamento automático para o próximo da fila
    const novoAgendamento = {
      id: gerarId(),
      usuario: proximoUsuario.usuario,
      data,
      horario,
      status: 'confirmado',
      dataAgendamento: new Date().toISOString(),
      origem: 'fila_espera'
    };
    
    agendamentos.push(novoAgendamento);
    
    console.log(`✅ Agendamento automático criado para ${proximoUsuario.usuario}: ${data} às ${horario}`);
    
    return novoAgendamento;
  }
  
  return null;
}

// Exportar funções e dados
module.exports = {
  agendamentos,
  filaEspera,
  horariosDisponiveis,
  gerarId,
  verificarDisponibilidade,
  adicionarFilaEspera,
  processarFilaEspera
}; 