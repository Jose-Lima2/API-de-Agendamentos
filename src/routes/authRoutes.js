const express = require('express');
const AuthController = require('../controllers/AuthController');
const AuthService = require('../services/AuthService');

const router = express.Router();
const authController = new AuthController();
const authService = new AuthService();

// Middleware de autenticação
const verificarAuth = authService.verificarAutenticacao.bind(authService);

// POST /auth/registro - Registrar novo usuário
router.post('/registro', async (req, res) => {
  await authController.registro(req, res);
});

// POST /auth/login - Login do usuário
router.post('/login', async (req, res) => {
  await authController.login(req, res);
});

// GET /auth/perfil - Consultar perfil do usuário logado (protegida)
router.get('/perfil', verificarAuth, async (req, res) => {
  await authController.perfil(req, res);
});

module.exports = router; 