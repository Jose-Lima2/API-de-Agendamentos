const { autenticarUsuario } = require('../lib/auth');

// Endpoint de login para obter token JWT
function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      erro: 'Método não permitido. Use POST.' 
    });
  }
  
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        erro: 'Email é obrigatório' 
      });
    }
    
    const resultado = autenticarUsuario(email);
    
    if (!resultado.sucesso) {
      return res.status(401).json({ 
        erro: resultado.erro 
      });
    }
    
    return res.status(200).json({
      sucesso: true,
      mensagem: 'Login realizado com sucesso',
      token: resultado.token,
      usuario: {
        id: resultado.usuario.id,
        nome: resultado.usuario.nome,
        email: resultado.usuario.email
      }
    });
    
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ 
      erro: 'Erro interno do servidor' 
    });
  }
}

module.exports = { default: handler }; 