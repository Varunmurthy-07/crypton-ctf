import { useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { API } from '../data/hints.js'
import { usePlayer } from '../contexts/PlayerContext.jsx'
import { useScrollReveal } from '../hooks/useScrollReveal.js'

export default function Auth() {
  const root = useRef(null)
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { setPlayer, setStats } = usePlayer()
  const [mode, setMode] = useState(params.get('mode') === 'login' ? 'login' : 'register')
  useScrollReveal(root, [mode])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`${API}/api/player/${mode}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (!res.ok || data.status !== 'ok') throw new Error(data.error || 'Authentication failed')
      setPlayer(data.player)
      setStats(data.stats)
      navigate(params.get('next') || '/submit')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page" ref={root}>
      <header className="lab-hero" data-reveal>
        <div className="section-kicker">$ ./auth --player</div>
        <h1>PLAYER ACCESS</h1>
        <p>Register once, log in, then submit flags. Your captures are tied to your account and appear on the live leaderboard.</p>
      </header>

      <div className="auth-layout">
        <div className="terminal-window auth-window" data-reveal-left>
          <div className="win-chrome">
            <div className="win-dots"><i /><i /><i /></div>
            <div className="win-title">{mode === 'register' ? 'register.sh' : 'login.sh'} — bash</div>
            <div className="win-meta">tty1</div>
          </div>
          <div className="win-body">
            <div className="auth-tabs">
              <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError('') }}>[ REGISTER ]</button>
              <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError('') }}>[ LOGIN ]</button>
            </div>

            <form onSubmit={submit} className="auth-form">
              <label className="lab-field">
                <span>USERNAME</span>
                <input className="mono-input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="3-20 chars, letters/numbers/_" autoComplete="username" />
              </label>
              <label className="lab-field">
                <span>PASSWORD</span>
                <input className="mono-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="min 8 characters" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} />
              </label>
              <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'WAIT...' : mode === 'register' ? './create_account' : './login'}</button>
            </form>

            {error && <div className="submit-status incorrect">[-] {error}</div>}
            <div className="lab-links">
              <Link to="/">← ALL HINTS</Link>
              <Link to="/leaderboard">LIVE LEADERBOARD →</Link>
            </div>
          </div>
        </div>

        <div className="terminal-window auth-note" data-reveal>
          <div className="win-chrome">
            <div className="win-dots"><i /><i /><i /></div>
            <div className="win-title">README.md</div>
            <div className="win-meta">ro</div>
          </div>
          <div className="win-body">
            <div className="sys-head">WHY AN ACCOUNT?</div>
            <p className="note-line">01 / Flags are scored per player, not per browser.</p>
            <p className="note-line">02 / Duplicate submissions are ignored.</p>
            <p className="note-line">03 / The leaderboard updates live as flags fall.</p>
            <p className="note-line dim">04 / This account system is not part of the CTF. The broken /api/login portal is — that is flag 03.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
