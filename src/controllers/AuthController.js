const AuthService = require('../services/AuthService');

class AuthController {
  constructor() {
    this.authService = new AuthService();
  }

  // POST /auth/registro - Registrar novo usuário
  async registro(req, res) {
    try {
      const { nome, email, senha } = req.body;

      // Validação básica
      if (!nome || !email || !senha) {
        return res.status(400).json({
          erro: 'Nome, email e senha são obrigatórios',
          campos_obrigatorios: ['nome', 'email', 'senha']
        });
      }

      if (senha.length < 6) {
        return res.status(400).json({
          erro: 'Senha deve ter pelo menos 6 caracteres'
        });
      }

      const usuario = await this.authService.registrarUsuario(nome, email, senha);

      res.status(201).json({
        sucesso: true,
        mensagem: 'Usuário registrado com sucesso',
        usuario
      });

    } catch (error) {
      res.status(400).json({
        erro: error.message
      });
    }
  }

  // POST /auth/login - Login do usuário
  async login(req, res) {
    try {
      const { email, senha } = req.body;

      // Validação básica
      if (!email || !senha) {
        return res.status(400).json({
          erro: 'Email e senha são obrigatórios'
        });
      }

      const resultado = await this.authService.login(email, senha);

      res.json({
        sucesso: true,
        mensagem: 'Login realizado com sucesso',
        ...resultado
      });

    } catch (error) {
      res.status(401).json({
        erro: error.message
      });
    }
  }

  // GET /auth/perfil - Consultar dados do usuário logado
  async perfil(req, res) {
    try {
      // req.usuario vem do middleware de autenticação
      res.json({
        usuario: req.usuario
      });

    } catch (error) {
      res.status(500).json({
        erro: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = AuthController; 