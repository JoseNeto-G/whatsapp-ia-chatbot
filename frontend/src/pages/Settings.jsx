import { useEffect, useState } from 'react'
import api from '../api.js'

export default function Settings() {
  const [settings, setSettings] = useState(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const res = await api.get('/settings')
      setSettings(res.data)
    } catch (err) {
      setError('Erro ao carregar configuracoes.')
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaved(false)
    setError('')
    try {
      await api.put('/settings', settings)
      setSaved(true)
    } catch (err) {
      setError('Erro ao salvar configuracoes.')
    }
  }

  if (!settings) return <p className="muted">Carregando...</p>

  return (
    <div className="settings">
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSave}>
        <label>
          Prompt de sistema (personalidade e regras da IA)
          <textarea
            rows={6}
            value={settings.system_prompt}
            onChange={(e) => setSettings({ ...settings, system_prompt: e.target.value })}
          />
        </label>
        <label>
          Mensagem de saudacao (primeira mensagem enviada ao contato)
          <textarea
            rows={3}
            value={settings.greeting_message}
            onChange={(e) => setSettings({ ...settings, greeting_message: e.target.value })}
          />
        </label>
        <label>
          Horario de atendimento
          <input
            type="text"
            value={settings.business_hours || ''}
            onChange={(e) => setSettings({ ...settings, business_hours: e.target.value })}
          />
        </label>
        <button type="submit">Salvar</button>
        {saved && <span className="saved-hint">Configuracoes salvas!</span>}
      </form>
    </div>
  )
}
