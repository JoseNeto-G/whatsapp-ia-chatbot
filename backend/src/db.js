const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const dbFile = process.env.DB_FILE || path.join(__dirname, '..', 'data.sqlite');
const db = new Database(dbFile);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wa_id TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id INTEGER NOT NULL,
    mode TEXT NOT NULL DEFAULT 'ia',
    status TEXT NOT NULL DEFAULT 'aberta',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts (id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    direction TEXT NOT NULL,
    sender TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations (id)
  );

  CREATE TABLE IF NOT EXISTS bot_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    system_prompt TEXT NOT NULL,
    greeting_message TEXT NOT NULL,
    business_hours TEXT
  );
`);

const hasSettings = db.prepare('SELECT COUNT(*) as count FROM bot_settings').get();
if (hasSettings.count === 0) {
  db.prepare(
    `INSERT INTO bot_settings (id, system_prompt, greeting_message, business_hours)
     VALUES (1, ?, ?, ?)`
  ).run(
    'Voce e um assistente de atendimento ao cliente, educado e objetivo. Responda em portugues do Brasil, de forma curta e clara. Se nao souber a resposta, diga que vai encaminhar para um atendente humano.',
    'Ola! Sou o assistente virtual. Como posso ajudar?',
    'Seg a Sex, 9h as 18h'
  );
}

module.exports = db;
