const express = require('express');
const db = require('../db');
const whatsapp = require('../services/whatsapp');
const ai = require('../services/ai');

const router = express.Router();

// Etapa de verificacao exigida pela Meta ao cadastrar a URL do webhook.
// https://developers.facebook.com/docs/graph-api/webhooks/getting-started
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

function findOrCreateContact(waId, profileName) {
  let contact = db.prepare('SELECT * FROM contacts WHERE wa_id = ?').get(waId);
  if (!contact) {
    const info = db
      .prepare('INSERT INTO contacts (wa_id, name) VALUES (?, ?)')
      .run(waId, profileName || waId);
    contact = { id: info.lastInsertRowid, wa_id: waId, name: profileName || waId };
  }
  return contact;
}

function findOrCreateConversation(contactId) {
  let conversation = db
    .prepare("SELECT * FROM conversations WHERE contact_id = ? AND status = 'aberta'")
    .get(contactId);
  if (!conversation) {
    const settings = db.prepare('SELECT * FROM bot_settings WHERE id = 1').get();
    const info = db
      .prepare('INSERT INTO conversations (contact_id, mode) VALUES (?, ?)')
      .run(contactId, 'ia');
    conversation = { id: info.lastInsertRowid, contact_id: contactId, mode: 'ia', status: 'aberta' };

    // Primeira interacao: registra a saudacao do bot como mensagem de saida.
    db.prepare(
      'INSERT INTO messages (conversation_id, direction, sender, body) VALUES (?, ?, ?, ?)'
    ).run(conversation.id, 'saida', 'ia', settings.greeting_message);
  }
  return conversation;
}

function recentHistory(conversationId, limit = 10) {
  const rows = db
    .prepare(
      `SELECT direction, sender, body FROM messages
       WHERE conversation_id = ?
       ORDER BY id DESC LIMIT ?`
    )
    .all(conversationId, limit);

  return rows
    .reverse()
    .map((m) => ({ role: m.direction === 'entrada' ? 'user' : 'assistant', content: m.body }));
}

// Recebe as mensagens enviadas pelos contatos via WhatsApp Cloud API.
router.post('/', async (req, res) => {
  // Responde 200 imediatamente: a Meta reenvia o evento se nao houver ACK rapido.
  res.sendStatus(200);

  try {
    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const message = change?.messages?.[0];
    if (!message || message.type !== 'text') return;

    const waId = message.from;
    const profileName = change?.contacts?.[0]?.profile?.name;
    const text = message.text.body;

    const contact = findOrCreateContact(waId, profileName);
    const conversation = findOrCreateConversation(contact.id);

    db.prepare(
      'INSERT INTO messages (conversation_id, direction, sender, body) VALUES (?, ?, ?, ?)'
    ).run(conversation.id, 'entrada', 'contato', text);

    db.prepare('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(conversation.id);

    // Se a conversa estiver em atendimento humano, o bot fica em silencio:
    // a mensagem so aparece no painel para o atendente responder.
    if (conversation.mode !== 'ia') return;

    const settings = db.prepare('SELECT * FROM bot_settings WHERE id = 1').get();
    const history = recentHistory(conversation.id);
    const reply = await ai.generateReply(settings.system_prompt, history);

    db.prepare(
      'INSERT INTO messages (conversation_id, direction, sender, body) VALUES (?, ?, ?, ?)'
    ).run(conversation.id, 'saida', 'ia', reply);

    await whatsapp.sendTextMessage(waId, reply);
  } catch (err) {
    console.error('Erro ao processar mensagem do webhook:', err);
  }
});

module.exports = router;
