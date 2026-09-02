const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const webhookRoutes = require('./routes/webhook');
const conversationRoutes = require('./routes/conversations');
const settingsRoutes = require('./routes/settings');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'whatsapp-ia-chatbot-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/webhook', webhookRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/settings', settingsRoutes);

const PORT = process.env.PORT || 3334;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
