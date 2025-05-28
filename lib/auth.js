const jwt = require('jsonwebtoken');

// Chave secreta simples para JWT (em produção deve estar em variável de ambiente)
const JWT_SECRET = 'sistema-agendamento-secret-key-2024';

// Usuários válidos (simulando uma base de usuários)
const usuarios = [
  { id: 1, email: 'usuario1@email.com', nome: 'João Silva' },
  { id: 2, email: 'usuario2@email.com', nome: 'Maria Santos' },
  { id: 3, email: 'admin@email.com', nome: 'Admin Sistema' }
];

// Função para gerar token JWT
function gerarToken(usuario) {
  return jwt.sign(
    { 
      id: usuario.id, 
      email: usuario.email, 
      nome: usuario.nome 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// Função para verificar e decodificar token
function verificarToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Middleware de autenticação para as APIs
function autenticar(req) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return { 
      autenticado: false, 
      erro: 'Token de autorização não fornecido' 
    };
  }
  
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader;
  
  const usuario = verificarToken(token);
  
  if (!usuario) {
    return { 
      autenticado: false, 
      erro: 'Token inválido ou expirado' 
    };
  }
  
  return { 
    autenticado: true, 
    usuario 
  };
}

// Função para autenticar usuário (login simples)
function autenticarUsuario(email) {
  const usuario = usuarios.find(u => u.email === email);
  if (usuario) {
    return {
      sucesso: true,
      usuario,
      token: gerarToken(usuario)
    };
  }
  
  return {
    sucesso: false,
    erro: 'Usuário não encontrado'
  };
}

module.exports = {
  gerarToken,
  verificarToken,
  autenticar,
  autenticarUsuario,
  usuarios
}; 