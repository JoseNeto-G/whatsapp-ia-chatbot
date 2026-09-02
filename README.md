# Chatbot WhatsApp + IA

Sistema de atendimento automatizado via WhatsApp com respostas geradas por IA e painel web para handoff (transferência) para atendimento humano. Projeto de portfólio construído com Node.js/Express no backend e React (Vite) no frontend, integrando a WhatsApp Cloud API (Meta) e um provedor de IA no formato "chat completions" (compatível com OpenAI).

## Como funciona

1. O cliente manda uma mensagem para o número de WhatsApp Business conectado.
2. A Meta envia essa mensagem para o endpoint `/webhook` deste backend.
3. Se a conversa estiver no modo **IA**, o backend monta o histórico recente e chama o provedor de IA configurado, envia a resposta de volta pelo WhatsApp e salva tudo no banco.
4. Se a conversa estiver no modo **Humano**, o bot fica em silêncio e a mensagem só aparece no painel, para um atendente responder manualmente.
5. O painel web permite ver todas as conversas em andamento, ler o histórico, alternar entre IA e atendimento humano a qualquer momento, responder manualmente e editar o "prompt de sistema" (personalidade/regras) do bot.

```
Cliente (WhatsApp) <--> WhatsApp Cloud API (Meta) <--> /webhook (backend)
                                                             |
                                                     IA (chat completions) ou atendente humano
                                                             |
                                                        Painel web (React)
```

## Stack

- **Backend:** Node.js, Express, better-sqlite3, JWT (jsonwebtoken), bcryptjs
- **Frontend:** React, Vite, axios
- **Integrações:** WhatsApp Cloud API (Meta for Developers), qualquer API de IA compatível com o formato de chat completions da OpenAI (OpenAI, Groq, OpenRouter, Azure OpenAI, etc.)

## Funcionalidades

- Webhook completo (verificação + recebimento de mensagens) da WhatsApp Cloud API
- Respostas automáticas geradas por IA, com histórico de conversa como contexto
- Alternância entre atendimento por IA e atendimento humano por conversa
- Painel web com lista de conversas, histórico de mensagens e envio manual
- Configuração do prompt de sistema, mensagem de saudação e horário de atendimento direto pelo painel
- Modo de demonstração: sem credenciais reais da Meta/IA configuradas, o sistema simula os envios (loga no console) para permitir testar o fluxo completo localmente

## Como rodar localmente

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run seed   # cria usuario admin e conversas de exemplo
npm run dev
```

A API sobe em `http://localhost:3334`. Usuário de teste após o seed: `admin@exemplo.com` / `admin123`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

O frontend sobe em `http://localhost:5173` e usa proxy para a API em `/api`.

## Configurando a WhatsApp Cloud API (produção)

1. Crie um app no [Meta for Developers](https://developers.facebook.com/) e ative o produto **WhatsApp**.
2. Copie o **token de acesso** e o **Phone Number ID** de teste (ou configure um número real depois).
3. Preencha `WHATSAPP_TOKEN` e `WHATSAPP_PHONE_NUMBER_ID` no `.env`.
4. Defina um valor qualquer para `WHATSAPP_VERIFY_TOKEN` e cadastre a URL pública deste backend (`https://SEU_DOMINIO/webhook`) mais esse token no painel da Meta, na seção de configuração do webhook.
5. Assine o campo `messages` do webhook para começar a receber as mensagens dos contatos.

## Configurando o provedor de IA

Preencha `AI_API_URL`, `AI_API_KEY` e `AI_MODEL` no `.env` com os dados do provedor escolhido (por padrão, aponta para a API da OpenAI). Qualquer serviço que siga o mesmo contrato de "chat completions" funciona sem alterar o código.

## Estrutura

```
backend/
  src/
    routes/        # auth, webhook (Meta), conversations (painel), settings
    services/       # integracao com WhatsApp Cloud API e com o provedor de IA
    middleware/      # autenticacao JWT do painel
    db.js            # setup do banco (SQLite)
    server.js         # entrada da aplicacao
frontend/
  src/
    pages/          # Login, Conversations (caixa de entrada), Settings
    api.js           # instancia axios
    App.jsx           # navegacao entre conversas e configuracoes
```

## Endpoints principais

| Método | Rota | Descrição |
|---|---|---|
| GET | `/webhook` | Verificação do webhook exigida pela Meta |
| POST | `/webhook` | Recebe mensagens dos contatos e aciona a IA ou registra para atendimento humano |
| GET | `/api/conversations` | Lista conversas com prévia da última mensagem |
| GET | `/api/conversations/:id/messages` | Histórico de mensagens de uma conversa |
| PATCH | `/api/conversations/:id/mode` | Alterna entre atendimento por IA e humano |
| POST | `/api/conversations/:id/messages` | Envia uma mensagem manual como atendente |
| GET/PUT | `/api/settings` | Lê ou atualiza o prompt de sistema, saudação e horário de atendimento |

---

Desenvolvido por [Jose Neto](https://github.com/JoseNeto-G).
