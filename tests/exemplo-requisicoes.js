/**
 * Script de Exemplo - Teste da API de Agendamentos
 * 
 * Este script demonstra como usar todos os endpoints da API.
 * Execute: npm test
 */

const https = require('http');

const BASE_URL = 'http://localhost:3000';
let authToken = '';

// Função auxiliar para fazer requisições HTTP
function fazerRequisicao(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Função para esperar um tempo
function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Função principal de teste
async function executarTestes() {
  console.log('🧪 Iniciando testes da API de Agendamentos...\n');

  try {
    // 1. Testar saúde da API
    console.log('1️⃣ Testando saúde da API...');
    const saude = await fazerRequisicao('GET', '/');
    console.log('✅ Status:', saude.status);
    console.log('📊 Resposta:', saude.data);
    console.log('---\n');

    // 2. Registrar usuário
    console.log('2️⃣ Registrando usuário...');
    const registro = await fazerRequisicao('POST', '/auth/registro', {
      nome: 'João Silva Teste',
      email: 'joao.teste@email.com',
      senha: '123456'
    });
    console.log('✅ Status:', registro.status);
    console.log('📊 Resposta:', registro.data);
    console.log('---\n');

    // 3. Fazer login
    console.log('3️⃣ Fazendo login...');
    const login = await fazerRequisicao('POST', '/auth/login', {
      email: 'joao.teste@email.com',
      senha: '123456'
    });
    console.log('✅ Status:', login.status);
    console.log('📊 Resposta:', login.data);
    
    if (login.data.token) {
      authToken = login.data.token;
      console.log('🔑 Token salvo para próximas requisições');
    }
    console.log('---\n');

    // 4. Ver perfil
    console.log('4️⃣ Consultando perfil...');
    const perfil = await fazerRequisicao('GET', '/auth/perfil', null, {
      'Authorization': `Bearer ${authToken}`
    });
    console.log('✅ Status:', perfil.status);
    console.log('📊 Resposta:', perfil.data);
    console.log('---\n');

    // 5. Agendar horário
    console.log('5️⃣ Agendando horário...');
    const agendamento = await fazerRequisicao('POST', '/agendamentos', {
      data_hora: '2024-01-15 14:30',
      observacoes: 'Consulta de teste via script'
    }, {
      'Authorization': `Bearer ${authToken}`
    });
    console.log('✅ Status:', agendamento.status);
    console.log('📊 Resposta:', agendamento.data);
    console.log('---\n');

    // 6. Consultar meus agendamentos
    console.log('6️⃣ Consultando meus agendamentos...');
    const meusAgendamentos = await fazerRequisicao('GET', '/agendamentos/meus', null, {
      'Authorization': `Bearer ${authToken}`
    });
    console.log('✅ Status:', meusAgendamentos.status);
    console.log('📊 Resposta:', meusAgendamentos.data);
    console.log('---\n');

    // 7. Ver horários disponíveis
    console.log('7️⃣ Consultando horários disponíveis...');
    const horariosLivres = await fazerRequisicao('GET', '/agendamentos/horarios-livres?data=2024-01-15', null, {
      'Authorization': `Bearer ${authToken}`
    });
    console.log('✅ Status:', horariosLivres.status);
    console.log('📊 Resposta:', horariosLivres.data);
    console.log('---\n');

    // 8. Listar todos os agendamentos
    console.log('8️⃣ Listando todos os agendamentos...');
    const todosAgendamentos = await fazerRequisicao('GET', '/agendamentos', null, {
      'Authorization': `Bearer ${authToken}`
    });
    console.log('✅ Status:', todosAgendamentos.status);
    console.log('📊 Resposta:', todosAgendamentos.data);
    console.log('---\n');

    // 9. Testar fila de espera (registrar outro usuário e tentar agendar mesmo horário)
    console.log('9️⃣ Testando sistema de fila de espera...');
    
    // Registrar segundo usuário
    const registro2 = await fazerRequisicao('POST', '/auth/registro', {
      nome: 'Maria Santos Teste',
      email: 'maria.teste@email.com',
      senha: '123456'
    });
    console.log('👤 Segundo usuário registrado:', registro2.status);

    // Login do segundo usuário
    const login2 = await fazerRequisicao('POST', '/auth/login', {
      email: 'maria.teste@email.com',
      senha: '123456'
    });
    const token2 = login2.data.token;
    console.log('🔑 Login do segundo usuário:', login2.status);

    // Tentar agendar mesmo horário (deve ir para fila)
    const agendamentoFila = await fazerRequisicao('POST', '/agendamentos', {
      data_hora: '2024-01-15 14:30',
      observacoes: 'Teste de fila de espera'
    }, {
      'Authorization': `Bearer ${token2}`
    });
    console.log('📋 Resultado da fila de espera:', agendamentoFila.status);
    console.log('📊 Resposta:', agendamentoFila.data);
    console.log('---\n');

    // 10. Reagendar horário do primeiro usuário
    console.log('🔟 Testando reagendamento...');
    const reagendamento = await fazerRequisicao('PUT', '/agendamentos', {
      nova_data_hora: '2024-01-15 16:00'
    }, {
      'Authorization': `Bearer ${authToken}`
    });
    console.log('✅ Status:', reagendamento.status);
    console.log('📊 Resposta:', reagendamento.data);
    console.log('---\n');

    // 11. Cancelar agendamento
    console.log('1️⃣1️⃣ Testando cancelamento...');
    const cancelamento = await fazerRequisicao('DELETE', '/agendamentos', null, {
      'Authorization': `Bearer ${authToken}`
    });
    console.log('✅ Status:', cancelamento.status);
    console.log('📊 Resposta:', cancelamento.data);
    console.log('---\n');

    console.log('🎉 Todos os testes concluídos com sucesso!');
    console.log('📝 Verifique os logs do servidor para ver as notificações automáticas.');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
  }
}

// Verificar se o servidor está rodando
console.log('🔍 Verificando se o servidor está rodando em http://localhost:3000...');
console.log('💡 Certifique-se de que o servidor está rodando com: npm run dev\n');

// Aguardar um pouco antes de iniciar os testes
esperar(1000).then(() => {
  executarTestes();
}); 