const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('../models/Database');

class AuthService {
  constructor() {
    this.db = new Database();
    this.jwtSecret = process.env.JWT_SECRET || 'meu_jwt_secreto_super_seguro';
  }

  // Registra um novo usuário
  async registrarUsuario(nome, email, senha) {
    try {
      await this.db.connect();

      // Verifica se usuário já existe
      const usuarioExistente = await this.db.get(
        'SELECT id FROM usuarios WHERE email = ?',
        [email]
      );

      if (usuarioExistente) {
        throw new Error('Usuário já existe com este email');
      }

      // Criptografa a senha
      const senhaHash = await bcrypt.hash(senha, 10);

      // Insere o usuário
      const resultado = await this.db.run(
        'INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)',
        [nome, email, senhaHash]
      );

      console.log(`✅ Usuário ${nome} registrado com sucesso`);
      return {
        id: resultado.lastID,
        nome,
        email
      };

    } catch (error) {
      console.error('❌ Erro ao registrar usuário:', error.message);
      throw error;
    }
  }

  // Autentica usuário e retorna token JWT
  async login(email, senha) {
    try {
      await this.db.connect();

      // Busca usuário por email
      const usuario = await this.db.get(
        'SELECT id, nome, email, senha_hash FROM usuarios WHERE email = ?',
        [email]
      );

      if (!usuario) {
        throw new Error('Credenciais inválidas');
      }

      // Verifica a senha
      const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
      if (!senhaValida) {
        throw new Error('Credenciais inválidas');
      }

      // Gera token JWT
      const token = jwt.sign(
        { 
          id: usuario.id, 
          email: usuario.email,
          nome: usuario.nome 
        },
        this.jwtSecret,
        { expiresIn: '24h' }
      );

      console.log(`✅ Login realizado: ${usuario.nome}`);
      return {
        token,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email
        }
      };

    } catch (error) {
      console.error('❌ Erro no login:', error.message);
      throw error;
    }
  }

  // Verifica e decodifica token JWT
  verificarToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Token inválido');
    }
  }

  // Middleware para verificar autenticação
  async verificarAutenticacao(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(401).json({
          erro: 'Token de acesso requerido'
        });
      }

      const token = authHeader.split(' ')[1]; // Remove "Bearer "
      
      if (!token) {
        return res.status(401).json({
          erro: 'Token não fornecido'
        });
      }

      const usuarioDecodificado = this.verificarToken(token);
      req.usuario = usuarioDecodificado;
      
      next();
    } catch (error) {
      return res.status(401).json({
        erro: 'Token inválido',
        detalhe: error.message
      });
    }
  }
}

module.exports = AuthService; 