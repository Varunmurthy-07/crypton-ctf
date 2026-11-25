import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { API, HINTS, TOTAL_POINTS } from '../data/hints.js'
import { useScrollReveal } from '../hooks/useScrollReveal.js'

export default function Leaderboard() {
  const root = useRef(null)
  const [rows, setRows] = useState([])
  const [live, setLive] = useState(false)
  const [totalPoints, setTotalPoints] = useState(TOTAL_POINTS)
  useScrollReveal(root, [rows.length])

  useEffect(() => {
    let source = null
    let poller = null

    const applySnapshot = (data) => {
      if (Array.isArray(data.rows)) setRows(data.rows)
      if (data.totalPoints) setTotalPoints(data.totalPoints)
    }

    const startPolling = () => {
      setLive(false)
      if (poller) return
      poller = setInterval(async () => {
        try {
          const res = await fetch(`${API}/api/leaderboard`)
          applySnapshot(await res.json())
        } catch { /* server may be restarting */ }
      }, 3000)
    }

    fetch(`${API}/api/leaderboard`).then((r) => r.json()).then(applySnapshot).catch(() => {})

    if (typeof EventSource !== 'undefined') {
      source = new EventSource(`${API}/api/leaderboard/stream`, { withCredentials: true })
      source.onopen = () => setLive(true)
      source.onmessage = (event) => {
        try { applySnapshot(JSON.parse(event.data)) } catch { /* ignore malformed frame */ }
      }
      source.onerror = () => {
        setLive(false)
        source.close()
        source = null
        startPolling()
      }
    } else {
      startPolling()
    }

    return () => {
      if (source) source.close()
      if (poller) clearInterval(poller)
    }
  }, [])

  return (
    <div className="leaderboard-page" ref={root}>
      <header className="lab-hero" data-reveal>
        <div className="section-kicker">$ watch -n 1 leaderboard.log</div>
        <h1>LIVE LEADERBOARD</h1>
        <p>Ranks refresh automatically whenever a player captures a flag. No reload required.</p>
      </header>

      <div className="terminal-window board-window" data-reveal-left>
        <div className="win-chrome">
          <div className="win-dots"><i /><i /><i /></div>
          <div className="win-title">/api/leaderboard/stream</div>
          <div className={`live-badge ${live ? 'on' : ''}`}><span /> {live ? 'LIVE' : 'RECONNECTING'}</div>
        </div>
        <div className="win-body">
          {rows.length === 0 ? (
            <div className="board-empty">NO PLAYERS YET. BE THE FIRST TO CAPTURE A FLAG.</div>
          ) : (
            <div className="board-table">
              <div className="board-head">
                <span>RANK</span><span>PLAYER</span><span>FLAGS</span><span>POINTS</span>
              </div>
              {rows.map((row) => (
                <div className={`board-row ${row.rank <= 3 ? 'top' : ''}`} key={row.id} data-reveal-row>
                  <span className="board-rank">#{String(row.rank).padStart(2, '0')}</span>
                  <span className="board-user">{row.username}</span>
                  <span>{row.solved} / {HINTS.length}</span>
                  <span className="board-points">{row.points} / {totalPoints}</span>
                </div>
              ))}
            </div>
          )}
          <div className="lab-links">
            <Link to="/submit">SUBMIT A FLAG →</Link>
            <Link to="/">ALL HINTS →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
