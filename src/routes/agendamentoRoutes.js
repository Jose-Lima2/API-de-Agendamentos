const express = require('express');
const AgendamentoController = require('../controllers/AgendamentoController');
const AuthService = require('../services/AuthService');

const router = express.Router();
const agendamentoController = new AgendamentoController();
const authService = new AuthService();

// Middleware de autenticação para todas as rotas
const verificarAuth = authService.verificarAutenticacao.bind(authService);
router.use(verificarAuth);

// POST /agendamentos - Agendar novo horário
router.post('/', async (req, res) => {
  await agendamentoController.agendar(req, res);
});

// PUT /agendamentos - Reagendar horário existente
router.put('/', async (req, res) => {
  await agendamentoController.reagendar(req, res);
});

// DELETE /agendamentos - Cancelar agendamento
router.delete('/', async (req, res) => {
  await agendamentoController.cancelar(req, res);
});

// GET /agendamentos/meus - Consultar meus agendamentos
router.get('/meus', async (req, res) => {
  await agendamentoController.consultarMeus(req, res);
});

// GET /agendamentos/horarios-livres - Consultar horários disponíveis
router.get('/horarios-livres', async (req, res) => {
  await agendamentoController.sugerirHorariosLivres(req, res);
});

// GET /agendamentos - Listar todos os agendamentos (visualização)
router.get('/', async (req, res) => {
  await agendamentoController.listarTodos(req, res);
});

module.exports = router; 