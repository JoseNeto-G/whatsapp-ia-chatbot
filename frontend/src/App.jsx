import { useState } from 'react'
import Login from './pages/Login.jsx'
import Conversations from './pages/Conversations.jsx'
import Settings from './pages/Settings.jsx'

export default function App() {
  const [user, setUser] = useState(null)
  const [view, setView] = useState('conversas')

  function handleLogout() {
    localStorage.removeItem('token')
    setUser(null)
  }

  if (!user) {
    return <Login onLogin={setUser} />
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Chatbot WhatsApp + IA</h1>
        <nav className="app-nav">
          <button className={view === 'conversas' ? 'active' : ''} onClick={() => setView('conversas')}>
            Conversas
          </button>
          <button className={view === 'config' ? 'active' : ''} onClick={() => setView('config')}>
            Configuracoes
          </button>
        </nav>
        <div className="user-info">
          <span>Ola, {user?.name}</span>
          <button onClick={handleLogout}>Sair</button>
        </div>
      </header>

      {view === 'conversas' ? <Conversations /> : <Settings />}
    </div>
  )
}
