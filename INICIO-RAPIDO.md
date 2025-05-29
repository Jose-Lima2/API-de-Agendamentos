# 🚀 Início Rápido - API de Agendamentos

## ⚡ Para testar AGORA em 30 segundos:

### 1. Instalar e iniciar
```bash
# Já feito ✅
npm install
npm start
```

### 2. Testar endpoints básicos

#### 🔐 Registrar usuário
```bash
curl -X POST http://localhost:3000/auth/registro -H "Content-Type: application/json" -d "{\"nome\":\"Teste Usuario\",\"email\":\"teste@email.com\",\"senha\":\"123456\"}"
```

#### 🔑 Fazer login
```bash
curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d "{\"email\":\"teste@email.com\",\"senha\":\"123456\"}"
```

**📋 Copie o TOKEN da resposta!**

#### 📅 Agendar horário (substitua SEU_TOKEN)
```bash
curl -X POST http://localhost:3000/agendamentos -H "Authorization: Bearer SEU_TOKEN" -H "Content-Type: application/json" -d "{\"data_hora\":\"2024-01-15 14:30\",\"observacoes\":\"Teste de agendamento\"}"
```

#### 👀 Ver meus agendamentos
```bash
curl -X GET http://localhost:3000/agendamentos/meus -H "Authorization: Bearer SEU_TOKEN"
```

## 🧪 Teste automatizado completo
```bash
npm test
```

## 📚 Documentação completa
- **URL da API**: http://localhost:3000
- **Documentação**: http://localhost:3000/docs
- **Arquivo**: README.md

## 🎯 Funcionalidades testadas:
- ✅ Autenticação JWT
- ✅ Agendamento de horários
- ✅ Sistema de fila de espera
- ✅ Reagendamento
- ✅ Cancelamento
- ✅ Notificações automáticas (via console)

---
**Servidor rodando em: http://localhost:3000** 🚀 