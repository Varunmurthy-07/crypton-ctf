import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { API, HINTS, TOTAL_POINTS } from '../data/hints.js'
import { usePlayer } from '../contexts/PlayerContext.jsx'
import { useScrollReveal } from '../hooks/useScrollReveal.js'

export default function Submit() {
  const root = useRef(null)
  const { player, stats, setStats } = usePlayer()
  const [flag, setFlag] = useState('')
  const [status, setStatus] = useState(null)
  useScrollReveal(root, [player?.id, stats?.solved])

  const submit = async (e) => {
    e.preventDefault()
    setStatus(null)
    const res = await fetch(`${API}/api/submit`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flag })
    })
    const data = await res.json()
    setStatus(data)
    if (data.status === 'correct') {
      setFlag('')
      setStats(data.stats)
    }
  }

  const solvedIds = stats?.solvedIds || []
  const pct = Math.round((solvedIds.length / HINTS.length) * 100)

  return (
    <div className="submit-page" ref={root}>
      <header className="lab-hero" data-reveal>
        <div className="section-kicker">$ ./capture --interactive</div>
        <h1>SUBMIT FLAGS</h1>
        <p>Paste a flag in the format <span className="mono">RITCTF&#123;TECHNICAL_PHRASE&#125;</span>. Only logged-in players can capture flags.</p>
      </header>

      {!player && (
        <div className="terminal-window auth-gate" data-reveal-left>
          <div className="win-chrome">
            <div className="win-dots"><i /><i /><i /></div>
            <div className="win-title">access_denied.sh</div>
            <div className="win-meta">tty1</div>
          </div>
          <div className="win-body">
            <p className="gate-line">[!] NO PLAYER SESSION FOUND.</p>
            <p className="note-line">Register or log in before submitting flags. Captures are scored per account.</p>
            <Link to="/login?next=/submit" className="btn btn-primary">./register_or_login</Link>
          </div>
        </div>
      )}

      <div className="submit-layout">
        <div className="submit-box terminal-window" data-reveal-left>
          <div className="win-chrome">
            <div className="win-dots"><i /><i /><i /></div>
            <div className="win-title">capture_terminal — bash</div>
            <div className="win-meta">tty1</div>
          </div>
          <div className="win-body">
            <form onSubmit={submit} className="lab-form lab-form-wide">
              <Field label="FLAG" value={flag} onChange={setFlag} placeholder="RITCTF{...}" mono />
              <button className="btn btn-primary btn-sm" type="submit" disabled={!player}>CAPTURE</button>
            </form>
            {status && (
              <div className={`submit-status ${status.status}`}>
                {status.status === 'correct' ? `[+] ${status.message} (+${status.points})` : `[-] ${status.message}`}
              </div>
            )}
            <div className="progress-meta">
              <span>{solvedIds.length} / {HINTS.length} CAPTURED</span>
              <span>{stats?.points ?? 0} / {TOTAL_POINTS} PTS</span>
            </div>
            <div className="progress-track"><div className="progress-bar" style={{ width: `${pct}%` }} /></div>
            <div className="lab-links">
              <Link to="/">← ALL HINTS</Link>
              <Link to="/leaderboard">LIVE LEADERBOARD →</Link>
            </div>
          </div>
        </div>

        <div className="capture-list terminal-window" data-reveal>
          <div className="win-chrome">
            <div className="win-dots"><i /><i /><i /></div>
            <div className="win-title">scoreboard.log</div>
            <div className="win-meta">ro</div>
          </div>
          <div className="win-body">
            {HINTS.map((h) => {
              const solved = solvedIds.includes(h.id)
              return (
                <div className={`capture-row ${solved ? 'solved' : ''}`} key={h.id} data-reveal-row>
                  <span>{String(h.id).padStart(2, '0')}</span>
                  <span>{solved ? h.title : 'ENCRYPTED'}</span>
                  <span>{solved ? 'CAPTURED' : h.points + ' PTS'}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, mono }) {
  return (
    <label className="lab-field">
      <span>{label}</span>
      <input
        className={mono ? 'mono-input' : ''}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  )
}
