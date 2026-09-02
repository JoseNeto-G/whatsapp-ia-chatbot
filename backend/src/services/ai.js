// Camada de integracao com um provedor de IA compativel com o formato
// "chat completions" da OpenAI (funciona com OpenAI, Azure OpenAI, Groq,
// OpenRouter e outros que seguem o mesmo contrato de API).

// Gera a resposta do bot a partir do prompt de sistema (personalidade/regras)
// e do historico recente da conversa (lista de { role, content }).
async function generateReply(systemPrompt, history) {
  const apiKey = process.env.AI_API_KEY;
  const apiUrl = process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions';
  const model = process.env.AI_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    // Sem chave configurada: resposta simulada, para permitir testar o fluxo
    // do webhook e do painel sem depender de uma chave de API paga.
    return 'Recebi sua mensagem! (modo de demonstracao: configure AI_API_KEY no .env para respostas geradas por IA de verdade)';
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: systemPrompt }, ...history],
      temperature: 0.6,
      max_tokens: 300
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Falha ao gerar resposta com IA: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || 'Desculpe, nao consegui gerar uma resposta agora.';
}

module.exports = { generateReply };
