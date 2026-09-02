const bcrypt = require('bcryptjs');
const db = require('./db');

const passwordHash = bcrypt.hashSync('admin123', 10);

const userExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@exemplo.com');
if (!userExists) {
  db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)').run(
    'Administrador',
    'admin@exemplo.com',
    passwordHash
  );
  console.log('Usuario admin criado: admin@exemplo.com / admin123');
}

const contacts = [
  { wa_id: '5511999990001', name: 'Marcos Vieira' },
  { wa_id: '5511999990002', name: 'Ana Paula Souza' },
  { wa_id: '5511999990003', name: 'Ricardo Lima' }
];

for (const c of contacts) {
  const existing = db.prepare('SELECT id FROM contacts WHERE wa_id = ?').get(c.wa_id);
  if (existing) continue;

  const contactInfo = db.prepare('INSERT INTO contacts (wa_id, name) VALUES (?, ?)').run(c.wa_id, c.name);
  const conversationInfo = db
    .prepare("INSERT INTO conversations (contact_id, mode, status) VALUES (?, 'ia', 'aberta')")
    .run(contactInfo.lastInsertRowid);

  const conversationId = conversationInfo.lastInsertRowid;
  const insertMessage = db.prepare(
    'INSERT INTO messages (conversation_id, direction, sender, body) VALUES (?, ?, ?, ?)'
  );

  insertMessage.run(conversationId, 'saida', 'ia', 'Ola! Sou o assistente virtual. Como posso ajudar?');
  insertMessage.run(conversationId, 'entrada', 'contato', 'Oi, quero saber o horario de funcionamento');
  insertMessage.run(
    conversationId,
    'saida',
    'ia',
    'Atendemos de segunda a sexta, das 9h as 18h. Posso ajudar com mais alguma coisa?'
  );
}

console.log('Seed concluido: contatos e conversas de exemplo criados.');
