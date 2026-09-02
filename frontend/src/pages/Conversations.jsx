import { useEffect, useState } from 'react'
import api from '../api.js'

export default function Conversations() {
  const [conversations, setConversations] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadConversations() {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/conversations')
      setConversations(res.data)
      if (!selectedId && res.data.length > 0) {
        setSelectedId(res.data[0].id)
      }
    } catch (err) {
      setError('Erro ao carregar conversas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConversations()
    const interval = setInterval(loadConversations, 8000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!selectedId) return
    loadMessages(selectedId)
  }, [selectedId])

  async function loadMessages(conversationId) {
    try {
      const res = await api.get(`/conversations/${conversationId}/messages`)
      setMessages(res.data)
    } catch (err) {
      setError('Erro ao carregar mensagens.')
    }
  }

  async function handleToggleMode(conversation) {
    const nextMode = conversation.mode === 'ia' ? 'humano' : 'ia'
    try {
      await api.patch(`/conversations/${conversation.id}/mode`, { mode: nextMode })
      loadConversations()
    } catch (err) {
      setError('Erro ao alternar modo de atendimento.')
    }
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!draft.trim() || !selectedId) return
    try {
      await api.post(`/conversations/${selectedId}/messages`, { body: draft })
      setDraft('')
      loadMessages(selectedId)
      loadConversations()
    } catch (err) {
      setError('Erro ao enviar mensagem.')
    }
  }

  const selectedConversation = conversations.find((c) => c.id === selectedId)

  return (
    <div className="conversations">
      {error && <p className="error">{error}</p>}
      <div className="conversations-layout">
        <aside className="conversation-list">
          {loading ? (
            <p className="muted">Carregando...</p>
          ) : conversations.length === 0 ? (
            <p className="muted">Nenhuma conversa ainda.</p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                className={`conversation-item ${c.id === selectedId ? 'active' : ''}`}
                onClick={() => setSelectedId(c.id)}
              >
                <div className="conversation-item-top">
                  <strong>{c.contact_name}</strong>
                  <span className={`mode-badge mode-${c.mode}`}>{c.mode === 'ia' ? 'IA' : 'Humano'}</span>
                </div>
                <p className="conversation-preview">{c.last_message}</p>
              </button>
            ))
          )}
        </aside>

        <section className="conversation-panel">
          {!selectedConversation ? (
            <p className="muted">Selecione uma conversa.</p>
          ) : (
            <>
              <header className="conversation-header">
                <div>
                  <h2>{selectedConversation.contact_name}</h2>
                  <span className="muted">{selectedConversation.wa_id}</span>
                </div>
                <button className="toggle-mode-btn" onClick={() => handleToggleMode(selectedConversation)}>
                  {selectedConversation.mode === 'ia' ? 'Assumir atendimento' : 'Devolver para a IA'}
                </button>
              </header>

              <div className="message-list">
                {messages.map((m) => (
                  <div key={m.id} className={`message-bubble ${m.direction === 'entrada' ? 'in' : 'out'}`}>
                    <span className="message-sender">{senderLabel(m.sender)}</span>
                    <p>{m.body}</p>
                  </div>
                ))}
              </div>

              <form className="message-form" onSubmit={handleSend}>
                <input
                  type="text"
                  placeholder="Escreva uma mensagem..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button type="submit">Enviar</button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

function senderLabel(sender) {
  if (sender === 'contato') return 'Cliente'
  if (sender === 'ia') return 'IA'
  return 'Atendente'
}
