const express = require('express');
const db = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

router.get('/', (req, res) => {
  const settings = db.prepare('SELECT * FROM bot_settings WHERE id = 1').get();
  res.json(settings);
});

router.put('/', (req, res) => {
  const { system_prompt, greeting_message, business_hours } = req.body;
  db.prepare(
    `UPDATE bot_settings SET system_prompt = ?, greeting_message = ?, business_hours = ? WHERE id = 1`
  ).run(system_prompt, greeting_message, business_hours || null);
  res.json({ ok: true });
});

module.exports = router;
