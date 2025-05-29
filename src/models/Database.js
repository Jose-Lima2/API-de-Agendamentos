const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.dbPath = process.env.DB_PATH || './database/agendamentos.db';
    this.db = null;
  }

  // Conecta ao banco de dados
  async connect() {
    return new Promise((resolve, reject) => {
      // Criar diretório se não existir
      const dbDir = path.dirname(this.dbPath);
      const fs = require('fs');
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Erro ao conectar com banco:', err.message);
          reject(err);
        } else {
          console.log('✅ Conectado ao banco SQLite');
          resolve();
        }
      });
    });
  }

  // Inicializa as tabelas
  async initTables() {
    const queries = [
      // Tabela de usuários
      `CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha_hash TEXT NOT NULL,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabela de agendamentos
      `CREATE TABLE IF NOT EXISTS agendamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        data_hora DATETIME NOT NULL UNIQUE,
        status TEXT DEFAULT 'agendado',
        observacoes TEXT,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
      )`,

      // Tabela de fila de espera
      `CREATE TABLE IF NOT EXISTS fila_espera (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        data_hora_desejada DATETIME NOT NULL,
        posicao INTEGER NOT NULL,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
      )`
    ];

    for (const query of queries) {
      await this.run(query);
    }

    console.log('✅ Tabelas do banco inicializadas');
  }

  // Executa uma query
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  // Busca um registro
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Busca múltiplos registros
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Fecha a conexão
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Erro ao fechar banco:', err.message);
        } else {
          console.log('🔐 Conexão com banco fechada');
        }
      });
    }
  }
}

module.exports = Database; 