# 📅 Sistema de Agendamento com Fila de Espera

API RESTful desenvolvida com Vercel Serverless Functions para gerenciar agendamentos com sistema de fila de espera automática.

## 🚀 Funcionalidades

- ✅ **Autenticação JWT** - Segurança básica via token
- ✅ **Agendamento de horários** - Reserve horários disponíveis
- ✅ **Sistema de fila de espera** - Entre na fila quando horário estiver ocupado
- ✅ **Reagendamento** - Altere seus agendamentos existentes
- ✅ **Cancelamento** - Cancele agendamentos e libere para a fila
- ✅ **Status personalizado** - Veja seus agendamentos e posição na fila
- ✅ **Notificações automáticas** - Receba avisos quando horário for liberado
- ✅ **Consulta de disponibilidade** - Veja horários livres por data

## 🛠️ Tecnologias

- **Runtime**: Node.js 18.x
- **Platform**: Vercel Serverless Functions
- **Autenticação**: JSON Web Tokens (JWT)
- **Armazenamento**: Dados em memória (não persistem entre reinicializações)

## 📚 Endpoints da API

### 🔐 Autenticação

#### POST `/api/login`
Gera token JWT para acessar os endpoints protegidos.

**Body:**
```json
{
  "email": "usuario1@email.com"
}
```

**Resposta:**
```json
{
  "sucesso": true,
  "mensagem": "Login realizado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 1,
    "nome": "João Silva",
    "email": "usuario1@email.com"
  }
}
```

**Usuários disponíveis:**
- `usuario1@email.com` - João Silva
- `usuario2@email.com` - Maria Santos  
- `admin@email.com` - Admin Sistema

---

### 📅 Agendamentos

#### POST `/api/agendar`
Agenda um novo horário ou entra na fila de espera.

**Headers:**
```
Authorization: Bearer SEU_TOKEN_JWT
```

**Body:**
```json
{
  "data": "2024-12-15",
  "horario": "14:00"
}
```

**Resposta (Sucesso):**
```json
{
  "sucesso": true,
  "mensagem": "Agendamento realizado com sucesso",
  "agendamento": {
    "id": "1734123456789abc12",
    "usuario": "João Silva",
    "data": "2024-12-15",
    "horario": "14:00",
    "status": "confirmado",
    "dataAgendamento": "2024-12-14T10:30:00.000Z"
  }
}
```

**Resposta (Fila de Espera):**
```json
{
  "sucesso": true,
  "mensagem": "Horário ocupado. Você foi adicionado à fila de espera.",
  "filaEspera": {
    "id": "1734123456789def34",
    "posicao": "1734123456789def34",
    "dataHorario": "2024-12-15 14:00",
    "dataAdicionado": "2024-12-14T10:30:00.000Z"
  }
}
```

---

#### PUT `/api/reagendar`
Reagenda um agendamento existente.

**Headers:**
```
Authorization: Bearer SEU_TOKEN_JWT
```

**Body:**
```json
{
  "agendamentoId": "1734123456789abc12",
  "novaData": "2024-12-16",
  "novoHorario": "15:00"
}
```

**Resposta:**
```json
{
  "sucesso": true,
  "mensagem": "Agendamento reagendado com sucesso",
  "agendamento": {
    "id": "1734123456789abc12",
    "usuario": "João Silva",
    "data": "2024-12-16",
    "horario": "15:00",
    "status": "confirmado",
    "dataAgendamento": "2024-12-14T10:30:00.000Z",
    "dataReagendamento": "2024-12-14T11:00:00.000Z"
  },
  "notificacao": "Horário 2024-12-15 14:00 foi automaticamente preenchido pela fila de espera"
}
```

---

#### DELETE `/api/cancelar`
Cancela um agendamento e processa a fila de espera.

**Headers:**
```
Authorization: Bearer SEU_TOKEN_JWT
```

**Body:**
```json
{
  "agendamentoId": "1734123456789abc12"
}
```

**Resposta:**
```json
{
  "sucesso": true,
  "mensagem": "Agendamento cancelado com sucesso",
  "agendamentoCancelado": {
    "id": "1734123456789abc12",
    "data": "2024-12-15",
    "horario": "14:00",
    "dataCancelamento": "2024-12-14T11:30:00.000Z"
  },
  "notificacao": "Horário 2024-12-15 14:00 foi automaticamente preenchido pela fila de espera para Maria Santos",
  "novoAgendamento": {
    "id": "1734123456789ghi56",
    "usuario": "Maria Santos",
    "data": "2024-12-15",
    "horario": "14:00",
    "status": "confirmado",
    "origem": "fila_espera"
  }
}
```

---

### 📊 Consultas

#### GET `/api/status`
Mostra status completo do usuário autenticado.

**Headers:**
```
Authorization: Bearer SEU_TOKEN_JWT
```

**Resposta:**
```json
{
  "sucesso": true,
  "usuario": {
    "nome": "João Silva",
    "email": "usuario1@email.com"
  },
  "agendamentos": {
    "confirmados": [
      {
        "id": "1734123456789abc12",
        "data": "2024-12-16",
        "horario": "15:00",
        "dataAgendamento": "2024-12-14T10:30:00.000Z",
        "dataReagendamento": "2024-12-14T11:00:00.000Z"
      }
    ],
    "cancelados": []
  },
  "filaEspera": [
    {
      "data": "2024-12-17",
      "horario": "09:00",
      "posicao": 2,
      "totalNaFila": 3,
      "id": "1734123456789def34",
      "dataAdicionado": "2024-12-14T12:00:00.000Z"
    }
  ],
  "resumo": {
    "totalAgendamentosConfirmados": 1,
    "totalNaFilaEspera": 1,
    "proximoAgendamento": {
      "id": "1734123456789abc12",
      "data": "2024-12-16",
      "horario": "15:00"
    }
  },
  "horariosDisponiveis": [
    {
      "data": "2024-12-14",
      "diaSemana": "Saturday",
      "horariosLivres": ["09:00", "10:00", "11:00"]
    }
  ]
}
```

---

#### GET `/api/horarios`
Lista horários disponíveis (endpoint público).

**Parâmetros de Query:**
- `data` (opcional): Data específica no formato YYYY-MM-DD

**Exemplos:**
- `GET /api/horarios` - Lista próximos 7 dias
- `GET /api/horarios?data=2024-12-15` - Horários para data específica

**Resposta (sem data):**
```json
{
  "sucesso": true,
  "proximosDias": [
    {
      "data": "2024-12-14",
      "diaSemana": "sábado",
      "dataFormatada": "14/12/2024",
      "horariosLivres": 7,
      "horariosOcupados": 2,
      "totalHorarios": 9
    }
  ],
  "horariosGerais": ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"],
  "info": "Use ?data=YYYY-MM-DD para ver horários específicos de uma data"
}
```

**Resposta (com data):**
```json
{
  "sucesso": true,
  "data": "2024-12-15",
  "horariosDisponiveis": ["09:00", "10:00", "11:00", "12:00", "13:00", "15:00", "16:00", "17:00"],
  "horariosOcupados": [
    {
      "horario": "14:00",
      "filaEspera": 2
    }
  ],
  "resumo": {
    "totalHorarios": 9,
    "livres": 8,
    "ocupados": 1
  }
}
```

---

## 🚀 Como usar

### 1. Instalar dependências
```bash
npm install
```

### 2. Executar localmente
```bash
npm run dev
```

### 3. Deploy para Vercel
```bash
npm run deploy
```

### 4. Teste a API

1. **Fazer login:**
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "usuario1@email.com"}'
```

2. **Agendar horário:**
```bash
curl -X POST http://localhost:3000/api/agendar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"data": "2024-12-15", "horario": "14:00"}'
```

3. **Ver status:**
```bash
curl -X GET http://localhost:3000/api/status \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

## 📋 Horários Disponíveis

**Horários de funcionamento:** 09:00 às 17:00
**Slots disponíveis:** 9 horários por dia
- 09:00, 10:00, 11:00, 12:00, 13:00, 14:00, 15:00, 16:00, 17:00

---

## 🔔 Sistema de Notificações

Quando um horário é liberado (por cancelamento ou reagendamento), o sistema:

1. ✅ Processa automaticamente a fila de espera
2. ✅ Cria agendamento para próximo da fila
3. ✅ Envia notificação via `console.log`
4. ✅ Remove usuário da fila de espera

**Exemplo de notificação:**
```
📲 NOTIFICAÇÃO: Horário 14:00 do dia 2024-12-15 foi liberado para Maria Santos!
✅ Agendamento automático criado para Maria Santos: 2024-12-15 às 14:00
```

---

## ⚠️ Limitações

- **Dados em memória**: Dados não persistem entre reinicializações
- **JWT simples**: Chave secreta hardcoded (use variáveis de ambiente em produção)
- **Usuários fixos**: Lista de usuários está hardcoded no código
- **Sem validação avançada**: Validações básicas implementadas
- **Notificações mock**: Notificações apenas via console.log

---

## 🛡️ Segurança

- ✅ Autenticação JWT em todos endpoints protegidos
- ✅ Validação de dados de entrada
- ✅ Controle de acesso por usuário
- ✅ CORS configurado
- ✅ Sanitização básica de inputs

---

## 📝 Códigos de Resposta HTTP

- **200**: Sucesso
- **201**: Criado com sucesso
- **202**: Aceito (adicionado à fila)
- **400**: Erro de validação
- **401**: Não autorizado
- **404**: Não encontrado
- **405**: Método não permitido
- **409**: Conflito (agendamento duplicado)
- **500**: Erro interno do servidor

---

## 🎯 Próximos Passos

Para uma versão de produção, considere:

- [ ] Persistência de dados (banco de dados)
- [ ] Variáveis de ambiente para configurações
- [ ] Sistema de notificações real (email, SMS, push)
- [ ] Autenticação mais robusta
- [ ] Rate limiting
- [ ] Logs estruturados
- [ ] Testes automatizados
- [ ] Monitoramento e métricas

---

**Desenvolvido como exemplo de sistema de agendamento com Vercel Serverless Functions** 🚀 