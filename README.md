# 🗓️ API de Agendamentos

Uma API RESTful completa para sistema de agendamentos com fila de espera, desenvolvida em Node.js + Express + SQLite.

## 🚀 Funcionalidades

- ✅ **Autenticação JWT** - Sistema seguro de login e registro
- ✅ **Agendamento de Horários** - Criar, editar e cancelar agendamentos
- ✅ **Sistema de Fila de Espera** - Automaticamente adiciona usuários em fila quando horário está ocupado
- ✅ **Notificações Automáticas** - Simula notificações quando horário é liberado
- ✅ **Reagendamento** - Permite alterar horários existentes
- ✅ **Consulta de Status** - Ver agendamentos ativos e posição na fila
- ✅ **Horários Disponíveis** - Sugestão de horários livres

## 🛠️ Tecnologias

- **Backend**: Node.js + Express.js
- **Banco de Dados**: SQLite (fácil para desenvolvimento)
- **Autenticação**: JWT (JSON Web Tokens)
- **Criptografia**: bcryptjs para senhas
- **Arquitetura**: MVC (Model-View-Controller)

## 📚 Documentação da API

### Base URL
```
http://localhost:3000
```

### 🔐 Autenticação

#### Registrar Usuário
```http
POST /auth/registro
Content-Type: application/json

{
  "nome": "João Silva",
  "email": "joao@email.com",
  "senha": "123456"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "joao@email.com",
  "senha": "123456"
}
```

**Resposta:**
```json
{
  "sucesso": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@email.com"
  }
}
```

#### Ver Perfil
```http
GET /auth/perfil
Authorization: Bearer <token>
```

### 📅 Agendamentos

> **Nota:** Todas as rotas de agendamento requerem autenticação (header `Authorization: Bearer <token>`)

#### Agendar Horário
```http
POST /agendamentos
Authorization: Bearer <token>
Content-Type: application/json

{
  "data_hora": "2024-01-15 14:30",
  "observacoes": "Consulta de rotina"
}
```

**Possíveis Respostas:**

✅ **Sucesso (201):**
```json
{
  "sucesso": true,
  "mensagem": "Horário agendado com sucesso",
  "agendamento": {
    "id": 1,
    "usuario_id": 1,
    "data_hora": "2024-01-15 14:30",
    "status": "agendado"
  }
}
```

📋 **Fila de Espera (202):**
```json
{
  "sucesso": false,
  "em_fila": true,
  "posicao": 2,
  "mensagem": "Horário ocupado. Você está na posição 2 da fila de espera."
}
```

#### Reagendar Horário
```http
PUT /agendamentos
Authorization: Bearer <token>
Content-Type: application/json

{
  "nova_data_hora": "2024-01-15 16:00"
}
```

#### Cancelar Agendamento
```http
DELETE /agendamentos
Authorization: Bearer <token>
```

#### Consultar Meus Agendamentos
```http
GET /agendamentos/meus
Authorization: Bearer <token>
```

#### Ver Horários Disponíveis
```http
GET /agendamentos/horarios-livres?data=2024-01-15
Authorization: Bearer <token>
```

#### Listar Todos os Agendamentos
```http
GET /agendamentos
Authorization: Bearer <token>
```

## 🧪 Exemplos com cURL

### 1. Registrar usuário
```bash
curl -X POST http://localhost:3000/auth/registro \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Maria Santos",
    "email": "maria@email.com",
    "senha": "123456"
  }'
```

### 2. Fazer login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "maria@email.com",
    "senha": "123456"
  }'
```

### 3. Agendar horário (use o token do login)
```bash
curl -X POST http://localhost:3000/agendamentos \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "data_hora": "2024-01-15 14:30",
    "observacoes": "Primeira consulta"
  }'
```

### 4. Ver meus agendamentos
```bash
curl -X GET http://localhost:3000/agendamentos/meus \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 5. Cancelar agendamento
```bash
curl -X DELETE http://localhost:3000/agendamentos \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## 🔄 Sistema de Fila de Espera

### Como Funciona

1. **Horário Livre**: Usuário agenda normalmente
2. **Horário Ocupado**: Usuário é adicionado à fila de espera automaticamente
3. **Cancelamento**: Primeiro da fila é notificado e agendado automaticamente
4. **Notificação**: Sistema simula envio via `console.log`

### Exemplo de Fluxo

```
1. João agenda 14:00 ✅
2. Maria tenta agendar 14:00 → Vai para fila (posição 1) 📋
3. Pedro tenta agendar 14:00 → Vai para fila (posição 2) 📋
4. João cancela ❌
5. Sistema notifica Maria automaticamente 🔔
6. Maria é agendada para 14:00 ✅
7. Pedro sobe para posição 1 na fila 📋
```

## 🏗️ Arquitetura

```
src/
├── models/          # Modelos de dados e banco
│   └── Database.js
├── services/        # Lógica de negócio
│   ├── AuthService.js
│   └── AgendamentoService.js
├── controllers/     # Controladores das rotas
│   ├── AuthController.js
│   └── AgendamentoController.js
├── routes/          # Definição das rotas
│   ├── authRoutes.js
│   └── agendamentoRoutes.js
└── server.js        # Servidor principal
```

## 📊 Banco de Dados

### Tabelas

#### usuarios
- `id` (Primary Key)
- `nome`
- `email` (Unique)
- `senha_hash`
- `criado_em`

#### agendamentos
- `id` (Primary Key)
- `usuario_id` (Foreign Key)
- `data_hora` (Unique)
- `status` ('agendado', 'cancelado')
- `observacoes`
- `criado_em`
- `atualizado_em`

#### fila_espera
- `id` (Primary Key)
- `usuario_id` (Foreign Key)
- `data_hora_desejada`
- `posicao`
- `criado_em`

## 🔒 Segurança

- ✅ Senhas criptografadas com bcrypt
- ✅ Autenticação JWT com expiração
- ✅ Validação de entrada
- ✅ Proteção de rotas sensíveis
- ✅ Headers CORS configurados

## 🎯 Próximos Passos (Melhorias)

- [ ] Validação mais robusta de datas
- [ ] Sistema de notificações real (email/SMS)
- [ ] Interface web simples
- [ ] Testes unitários automatizados
- [ ] Docker para deploy
- [ ] Logs estruturados
- [ ] Rate limiting
- [ ] Backup automático do banco

## 🐛 Troubleshooting

### Erro: "JWT malformed"
```bash
# Verifique se está enviando o token no formato:
# Authorization: Bearer <token>
```

### Erro: "Port already in use"
```bash
# Mude a porta no arquivo .env
PORT=3001
```

## 📞 Suporte

Em caso de dúvidas ou problemas:

1. Verifique os logs no console
2. Teste os endpoints na documentação: `/docs`
3. Confirme se o banco está sendo criado

---

**Desenvolvido como exemplo de API RESTful com arquitetura MVC** 🚀 