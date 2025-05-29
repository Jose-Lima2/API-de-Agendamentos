require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Database = require('./models/Database');

// Importar rotas
const authRoutes = require('./routes/authRoutes');
const agendamentoRoutes = require('./routes/agendamentoRoutes');

const app = express();

// Middleware básico
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de log para debug
app.use((req, res, next) => {
  console.log(`${new Date().toLocaleString()} - ${req.method} ${req.path}`);
  next();
});

// Rota de saúde da API
app.get('/', (req, res) => {
  res.json({
    api: 'Sistema de Agendamentos',
    versao: '1.0.0',
    status: 'ativo',
    endpoints: {
      auth: '/auth (registro, login, perfil)',
      agendamentos: '/agendamentos (CRUD completo)',
      documentacao: '/docs'
    }
  });
});

// Rota de documentação simples
app.get('/docs', (req, res) => {
  res.json({
    titulo: 'API de Agendamentos - Documentação',
    endpoints: {
      autenticacao: {
        'POST /auth/registro': {
          descricao: 'Registrar novo usuário',
          body: { nome: 'string', email: 'string', senha: 'string' }
        },
        'POST /auth/login': {
          descricao: 'Login do usuário',
          body: { email: 'string', senha: 'string' }
        },
        'GET /auth/perfil': {
          descricao: 'Consultar perfil (requer token)',
          headers: { Authorization: 'Bearer <token>' }
        }
      },
      agendamentos: {
        'POST /agendamentos': {
          descricao: 'Agendar horário',
          headers: { Authorization: 'Bearer <token>' },
          body: { data_hora: 'YYYY-MM-DD HH:MM', observacoes: 'string (opcional)' }
        },
        'PUT /agendamentos': {
          descricao: 'Reagendar horário',
          headers: { Authorization: 'Bearer <token>' },
          body: { nova_data_hora: 'YYYY-MM-DD HH:MM' }
        },
        'DELETE /agendamentos': {
          descricao: 'Cancelar agendamento',
          headers: { Authorization: 'Bearer <token>' }
        },
        'GET /agendamentos/meus': {
          descricao: 'Consultar meus agendamentos',
          headers: { Authorization: 'Bearer <token>' }
        },
        'GET /agendamentos/horarios-livres?data=YYYY-MM-DD': {
          descricao: 'Consultar horários disponíveis',
          headers: { Authorization: 'Bearer <token>' }
        },
        'GET /agendamentos': {
          descricao: 'Listar todos os agendamentos',
          headers: { Authorization: 'Bearer <token>' }
        }
      }
    },
    exemplos: {
      formato_data: '2024-01-15 14:30',
      curl_login: 'curl -X POST https://sua-api.vercel.app/auth/login -H "Content-Type: application/json" -d \'{"email":"user@email.com","senha":"123456"}\'',
      curl_agendar: 'curl -X POST https://sua-api.vercel.app/agendamentos -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d \'{"data_hora":"2024-01-15 14:30"}\''
    }
  });
});

// Configurar rotas
app.use('/auth', authRoutes);
app.use('/agendamentos', agendamentoRoutes);

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro interno:', err);
  res.status(500).json({
    erro: 'Erro interno do servidor',
    timestamp: new Date().toISOString()
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    erro: 'Rota não encontrada',
    rota_solicitada: req.originalUrl,
    rotas_disponiveis: ['/auth', '/agendamentos', '/docs']
  });
});

// Inicializar banco de dados apenas uma vez
let dbInitialized = false;
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    try {
      const db = new Database();
      await db.connect();
      await db.initTables();
      console.log('🔧 Banco de dados inicializado (Vercel)');
      dbInitialized = true;
    } catch (error) {
      console.error('❌ Erro ao inicializar banco:', error.message);
    }
  }
  next();
});

module.exports = app; 