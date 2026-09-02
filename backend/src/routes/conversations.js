const express = require('express');
const db = require('../db');
const whatsapp = require('../services/whatsapp');
const { authRequired } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

// Lista as conversas com dados do contato e previa da ultima mensagem,
// para montar a caixa de entrada do painel.
router.get('/', (req, res) => {
  const conversations = db
    .prepare(
      `SELECT
         c.id, c.mode, c.status, c.updated_at,
         ct.name as contact_name, ct.wa_id,
         (SELECT body FROM messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) as last_message
       FROM conversations c
       JOIN contacts ct ON ct.id = c.contact_id
       ORDER BY c.updated_at DESC`
    )
    .all();
  res.json(conversations);
});

router.get('/:id/messages', (req, res) => {
  const messages = db
    .prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY id ASC')
    .all(req.params.id);
  res.json(messages);
});

// Alterna entre resposta automatica por IA e atendimento humano.
router.patch('/:id/mode', (req, res) => {
  const { mode } = req.body;
  if (!['ia', 'humano'].includes(mode)) {
    return res.status(400).json({ error: "mode deve ser 'ia' ou 'humano'" });
  }
  db.prepare('UPDATE conversations SET mode = ? WHERE id = ?').run(mode, req.params.id);
  res.json({ ok: true });
});

// Envio manual de mensagem pelo atendente (usado no modo humano).
router.post('/:id/messages', async (req, res) => {
  const { body } = req.body;
  if (!body) return res.status(400).json({ error: 'Mensagem vazia' });

  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);
  if (!conversation) return res.status(404).json({ error: 'Conversa nao encontrada' });

  const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(conversation.contact_id);

  db.prepare(
    'INSERT INTO messages (conversation_id, direction, sender, body) VALUES (?, ?, ?, ?)'
  ).run(conversation.id, 'saida', 'atendente', body);
  db.prepare('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(conversation.id);

  try {
    await whatsapp.sendTextMessage(contact.wa_id, body);
  } catch (err) {
    console.error('Erro ao enviar mensagem manual via WhatsApp:', err);
  }

  res.status(201).json({ ok: true });
});

module.exports = router;
