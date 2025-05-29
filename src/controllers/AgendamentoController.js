const AgendamentoService = require('../services/AgendamentoService');

class AgendamentoController {
  constructor() {
    this.agendamentoService = new AgendamentoService();
  }

  // POST /agendamentos - Agendar novo horário
  async agendar(req, res) {
    try {
      const { data_hora, observacoes } = req.body;
      const usuarioId = req.usuario.id;

      // Validação básica
      if (!data_hora) {
        return res.status(400).json({
          erro: 'Data e hora são obrigatórios',
          formato_esperado: 'YYYY-MM-DD HH:MM',
          exemplo: '2024-01-15 14:30'
        });
      }

      const resultado = await this.agendamentoService.agendarHorario(
        usuarioId, 
        data_hora, 
        observacoes || ''
      );

      if (resultado.sucesso) {
        res.status(201).json({
          sucesso: true,
          mensagem: 'Horário agendado com sucesso',
          agendamento: resultado.agendamento
        });
      } else {
        // Usuário foi adicionado à fila de espera
        res.status(202).json(resultado);
      }

    } catch (error) {
      res.status(400).json({
        erro: error.message
      });
    }
  }

  // PUT /agendamentos - Reagendar horário existente
  async reagendar(req, res) {
    try {
      const { nova_data_hora } = req.body;
      const usuarioId = req.usuario.id;

      // Validação básica
      if (!nova_data_hora) {
        return res.status(400).json({
          erro: 'Nova data e hora são obrigatórias',
          formato_esperado: 'YYYY-MM-DD HH:MM'
        });
      }

      const resultado = await this.agendamentoService.reagendarHorario(
        usuarioId, 
        nova_data_hora
      );

      if (resultado.sucesso) {
        res.json({
          sucesso: true,
          mensagem: 'Reagendamento realizado com sucesso',
          agendamento: resultado.agendamento
        });
      } else {
        res.status(400).json({
          erro: resultado.mensagem
        });
      }

    } catch (error) {
      res.status(400).json({
        erro: error.message
      });
    }
  }

  // DELETE /agendamentos - Cancelar agendamento
  async cancelar(req, res) {
    try {
      const usuarioId = req.usuario.id;

      const resultado = await this.agendamentoService.cancelarAgendamento(usuarioId);

      res.json({
        sucesso: true,
        mensagem: resultado.mensagem
      });

    } catch (error) {
      res.status(400).json({
        erro: error.message
      });
    }
  }

  // GET /agendamentos/meus - Consultar agendamento do usuário
  async consultarMeus(req, res) {
    try {
      const usuarioId = req.usuario.id;

      const resultado = await this.agendamentoService.consultarAgendamento(usuarioId);

      res.json({
        usuario: req.usuario.nome,
        agendamento_ativo: resultado.agendamento_ativo,
        fila_espera: resultado.fila_espera
      });

    } catch (error) {
      res.status(500).json({
        erro: error.message
      });
    }
  }

  // GET /agendamentos - Listar todos os horários ocupados (apenas para visualização)
  async listarTodos(req, res) {
    try {
      const agendamentos = await this.agendamentoService.listarHorariosOcupados();

      res.json({
        total: agendamentos.length,
        agendamentos: agendamentos.map(agendamento => ({
          id: agendamento.id,
          data_hora: agendamento.data_hora,
          usuario: agendamento.nome,
          email: agendamento.email,
          observacoes: agendamento.observacoes,
          agendado_em: agendamento.criado_em
        }))
      });

    } catch (error) {
      res.status(500).json({
        erro: error.message
      });
    }
  }

  // GET /agendamentos/horarios-livres - Sugerir horários livres
  async sugerirHorariosLivres(req, res) {
    try {
      const { data } = req.query; // YYYY-MM-DD
      
      if (!data) {
        return res.status(400).json({
          erro: 'Parâmetro data é obrigatório',
          formato: 'YYYY-MM-DD',
          exemplo: '?data=2024-01-15'
        });
      }

      // Simula horários disponíveis (8h às 18h, de hora em hora)
      const horariosLivres = [];
      const agendamentosOcupados = await this.agendamentoService.listarHorariosOcupados();
      
      for (let hora = 8; hora <= 17; hora++) {
        const dataHora = `${data} ${hora.toString().padStart(2, '0')}:00:00.000Z`;
        
        const ocupado = agendamentosOcupados.some(ag => 
          new Date(ag.data_hora).getTime() === new Date(dataHora).getTime()
        );

        if (!ocupado) {
          horariosLivres.push(`${hora.toString().padStart(2, '0')}:00`);
        }
      }

      res.json({
        data_consultada: data,
        horarios_livres: horariosLivres,
        total_disponivel: horariosLivres.length
      });

    } catch (error) {
      res.status(500).json({
        erro: error.message
      });
    }
  }
}

module.exports = AgendamentoController; 