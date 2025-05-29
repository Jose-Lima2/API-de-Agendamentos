const Database = require('../models/Database');

class AgendamentoService {
  constructor() {
    this.db = new Database();
  }

  // Converte string de data em objeto Date
  parseDataHora(dataHoraString) {
    const data = new Date(dataHoraString);
    if (isNaN(data.getTime())) {
      throw new Error('Formato de data inválido. Use: YYYY-MM-DD HH:MM');
    }
    return data;
  }

  // Verifica se horário está disponível
  async verificarHorarioDisponivel(dataHora) {
    await this.db.connect();
    
    const agendamentoExistente = await this.db.get(
      'SELECT id FROM agendamentos WHERE data_hora = ? AND status = "agendado"',
      [dataHora]
    );

    return !agendamentoExistente;
  }

  // Agenda um novo horário
  async agendarHorario(usuarioId, dataHoraString, observacoes = '') {
    try {
      await this.db.connect();
      
      const dataHora = this.parseDataHora(dataHoraString);
      const dataHoraISO = dataHora.toISOString();

      // Verifica se horário está disponível
      const disponivel = await this.verificarHorarioDisponivel(dataHoraISO);

      if (!disponivel) {
        // Adiciona à fila de espera
        return await this.adicionarFilaEspera(usuarioId, dataHoraISO);
      }

      // Agenda o horário
      const resultado = await this.db.run(
        'INSERT INTO agendamentos (usuario_id, data_hora, observacoes) VALUES (?, ?, ?)',
        [usuarioId, dataHoraISO, observacoes]
      );

      console.log(`✅ Horário agendado para usuário ${usuarioId}: ${dataHoraString}`);
      
      return {
        sucesso: true,
        agendamento: {
          id: resultado.lastID,
          usuario_id: usuarioId,
          data_hora: dataHoraString,
          status: 'agendado',
          observacoes
        }
      };

    } catch (error) {
      console.error('❌ Erro ao agendar:', error.message);
      throw error;
    }
  }

  // Adiciona usuário à fila de espera
  async adicionarFilaEspera(usuarioId, dataHora) {
    try {
      // Verifica se usuário já está na fila para este horário
      const jaEstaNaFila = await this.db.get(
        'SELECT id FROM fila_espera WHERE usuario_id = ? AND data_hora_desejada = ?',
        [usuarioId, dataHora]
      );

      if (jaEstaNaFila) {
        throw new Error('Usuário já está na fila de espera para este horário');
      }

      // Calcula próxima posição na fila
      const ultimaPosicao = await this.db.get(
        'SELECT MAX(posicao) as max_posicao FROM fila_espera WHERE data_hora_desejada = ?',
        [dataHora]
      );

      const novaPosicao = (ultimaPosicao?.max_posicao || 0) + 1;

      // Adiciona à fila
      const resultado = await this.db.run(
        'INSERT INTO fila_espera (usuario_id, data_hora_desejada, posicao) VALUES (?, ?, ?)',
        [usuarioId, dataHora, novaPosicao]
      );

      console.log(`📋 Usuário ${usuarioId} adicionado à fila de espera - Posição: ${novaPosicao}`);

      return {
        sucesso: false,
        em_fila: true,
        posicao: novaPosicao,
        mensagem: `Horário ocupado. Você está na posição ${novaPosicao} da fila de espera.`
      };

    } catch (error) {
      console.error('❌ Erro ao adicionar na fila:', error.message);
      throw error;
    }
  }

  // Reagenda um horário existente
  async reagendarHorario(usuarioId, novaDataHoraString) {
    try {
      await this.db.connect();
      
      const novaDataHora = this.parseDataHora(novaDataHoraString);
      const novaDataHoraISO = novaDataHora.toISOString();

      // Busca agendamento atual do usuário
      const agendamentoAtual = await this.db.get(
        'SELECT * FROM agendamentos WHERE usuario_id = ? AND status = "agendado"',
        [usuarioId]
      );

      if (!agendamentoAtual) {
        throw new Error('Nenhum agendamento ativo encontrado para reagendar');
      }

      // Verifica se novo horário está disponível
      const disponivel = await this.verificarHorarioDisponivel(novaDataHoraISO);

      if (!disponivel) {
        return {
          sucesso: false,
          mensagem: 'Novo horário não está disponível'
        };
      }

      // Cancela agendamento atual
      await this.cancelarAgendamento(usuarioId);

      // Agenda novo horário
      const resultado = await this.db.run(
        'INSERT INTO agendamentos (usuario_id, data_hora, observacoes) VALUES (?, ?, ?)',
        [usuarioId, novaDataHoraISO, agendamentoAtual.observacoes]
      );

      console.log(`✅ Reagendamento realizado para usuário ${usuarioId}: ${novaDataHoraString}`);

      return {
        sucesso: true,
        agendamento: {
          id: resultado.lastID,
          usuario_id: usuarioId,
          data_hora: novaDataHoraString,
          status: 'agendado',
          observacoes: agendamentoAtual.observacoes
        }
      };

    } catch (error) {
      console.error('❌ Erro ao reagendar:', error.message);
      throw error;
    }
  }

  // Cancela agendamento e processa fila de espera
  async cancelarAgendamento(usuarioId) {
    try {
      await this.db.connect();

      // Busca agendamento do usuário
      const agendamento = await this.db.get(
        'SELECT * FROM agendamentos WHERE usuario_id = ? AND status = "agendado"',
        [usuarioId]
      );

      if (!agendamento) {
        throw new Error('Nenhum agendamento ativo encontrado');
      }

      // Cancela o agendamento
      await this.db.run(
        'UPDATE agendamentos SET status = "cancelado", atualizado_em = CURRENT_TIMESTAMP WHERE id = ?',
        [agendamento.id]
      );

      console.log(`❌ Agendamento cancelado: usuário ${usuarioId}`);

      // Processa fila de espera para o horário liberado
      await this.processarFilaEspera(agendamento.data_hora);

      return {
        sucesso: true,
        mensagem: 'Agendamento cancelado com sucesso'
      };

    } catch (error) {
      console.error('❌ Erro ao cancelar agendamento:', error.message);
      throw error;
    }
  }

  // Processa fila de espera quando um horário é liberado
  async processarFilaEspera(dataHora) {
    try {
      // Busca primeiro da fila
      const primeiroFila = await this.db.get(
        'SELECT * FROM fila_espera WHERE data_hora_desejada = ? ORDER BY posicao ASC LIMIT 1',
        [dataHora]
      );

      if (!primeiroFila) {
        console.log('📋 Nenhum usuário na fila de espera para este horário');
        return;
      }

      // Agenda automaticamente para o primeiro da fila
      await this.db.run(
        'INSERT INTO agendamentos (usuario_id, data_hora, observacoes) VALUES (?, ?, ?)',
        [primeiroFila.usuario_id, dataHora, 'Agendado automaticamente da fila de espera']
      );

      // Remove da fila de espera
      await this.db.run(
        'DELETE FROM fila_espera WHERE id = ?',
        [primeiroFila.id]
      );

      // Atualiza posições restantes na fila
      await this.db.run(
        'UPDATE fila_espera SET posicao = posicao - 1 WHERE data_hora_desejada = ? AND posicao > ?',
        [dataHora, primeiroFila.posicao]
      );

      // Simula notificação (como solicitado)
      console.log(`🔔 NOTIFICAÇÃO: Usuário ${primeiroFila.usuario_id} foi notificado e agendado automaticamente para ${dataHora}`);

    } catch (error) {
      console.error('❌ Erro ao processar fila de espera:', error.message);
    }
  }

  // Consulta agendamento atual do usuário
  async consultarAgendamento(usuarioId) {
    try {
      await this.db.connect();

      // Busca agendamento ativo
      const agendamento = await this.db.get(
        'SELECT * FROM agendamentos WHERE usuario_id = ? AND status = "agendado"',
        [usuarioId]
      );

      // Busca posição na fila de espera
      const filaEspera = await this.db.all(
        'SELECT * FROM fila_espera WHERE usuario_id = ? ORDER BY posicao ASC',
        [usuarioId]
      );

      return {
        agendamento_ativo: agendamento,
        fila_espera: filaEspera
      };

    } catch (error) {
      console.error('❌ Erro ao consultar agendamento:', error.message);
      throw error;
    }
  }

  // Lista todos os horários ocupados
  async listarHorariosOcupados() {
    try {
      await this.db.connect();

      const agendamentos = await this.db.all(
        'SELECT a.*, u.nome, u.email FROM agendamentos a JOIN usuarios u ON a.usuario_id = u.id WHERE a.status = "agendado" ORDER BY a.data_hora'
      );

      return agendamentos;

    } catch (error) {
      console.error('❌ Erro ao listar horários:', error.message);
      throw error;
    }
  }
}

module.exports = AgendamentoService; 