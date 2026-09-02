// Camada de integracao com a WhatsApp Cloud API (Meta for Developers).
// Documentacao: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages

const API_VERSION = process.env.WHATSAPP_API_VERSION || 'v20.0';

function graphUrl() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  return `https://graph.facebook.com/${API_VERSION}/${phoneNumberId}/messages`;
}

// Envia uma mensagem de texto simples para um numero de WhatsApp.
// Em ambiente de desenvolvimento sem credenciais reais, apenas loga a mensagem
// para nao quebrar o fluxo (facilita testar o bot sem uma conta Meta aprovada).
async function sendTextMessage(to, body) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.log(`[whatsapp:mock] Para ${to}: ${body}`);
    return { mocked: true };
  }

  const response = await fetch(graphUrl(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body }
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Falha ao enviar mensagem via WhatsApp Cloud API: ${response.status} ${errorBody}`);
  }

  return response.json();
}

module.exports = { sendTextMessage };
