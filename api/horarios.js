const { 
  agendamentos, 
  horariosDisponiveis,
  filaEspera
} = require('../lib/dados');

// Endpoint para listar horários disponíveis (público)
function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      erro: 'Método não permitido. Use GET.' 
    });
  }
  
  try {
    const { data } = req.query;
    
    if (data) {
      // Buscar horários para uma data específica
      const dataRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dataRegex.test(data)) {
        return res.status(400).json({ 
          erro: 'Data deve estar no formato YYYY-MM-DD' 
        });
      }
      
      const horariosOcupados = agendamentos
        .filter(ag => ag.data === data && ag.status === 'confirmado')
        .map(ag => ag.horario);
      
      const horariosLivres = horariosDisponiveis.filter(horario => 
        !horariosOcupados.includes(horario)
      );
      
      // Verificar fila de espera para cada horário ocupado
      const filaInfo = {};
      horariosOcupados.forEach(horario => {
        const chave = `${data}-${horario}`;
        if (filaEspera[chave] && filaEspera[chave].length > 0) {
          filaInfo[horario] = filaEspera[chave].length;
        }
      });
      
      return res.status(200).json({
        sucesso: true,
        data,
        horariosDisponiveis: horariosLivres,
        horariosOcupados: horariosOcupados.map(horario => ({
          horario,
          filaEspera: filaInfo[horario] || 0
        })),
        resumo: {
          totalHorarios: horariosDisponiveis.length,
          livres: horariosLivres.length,
          ocupados: horariosOcupados.length
        }
      });
    } else {
      // Listar próximos 7 dias com disponibilidade
      const hoje = new Date();
      const proximosDias = [];
      
      for (let i = 0; i < 7; i++) {
        const dataAtual = new Date(hoje);
        dataAtual.setDate(hoje.getDate() + i);
        const dataStr = dataAtual.toISOString().split('T')[0];
        
        const horariosOcupados = agendamentos
          .filter(ag => ag.data === dataStr && ag.status === 'confirmado')
          .map(ag => ag.horario);
        
        const horariosLivres = horariosDisponiveis.filter(horario => 
          !horariosOcupados.includes(horario)
        );
        
        proximosDias.push({
          data: dataStr,
          diaSemana: dataAtual.toLocaleDateString('pt-BR', { weekday: 'long' }),
          dataFormatada: dataAtual.toLocaleDateString('pt-BR'),
          horariosLivres: horariosLivres.length,
          horariosOcupados: horariosOcupados.length,
          totalHorarios: horariosDisponiveis.length
        });
      }
      
      return res.status(200).json({
        sucesso: true,
        proximosDias,
        horariosGerais: horariosDisponiveis,
        info: 'Use ?data=YYYY-MM-DD para ver horários específicos de uma data'
      });
    }
    
  } catch (error) {
    console.error('Erro ao buscar horários:', error);
    return res.status(500).json({ 
      erro: 'Erro interno do servidor' 
    });
  }
}

module.exports = { default: handler }; 