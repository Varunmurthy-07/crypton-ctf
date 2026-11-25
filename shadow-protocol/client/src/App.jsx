import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Lab from './pages/Lab.jsx'
import Submit from './pages/Submit.jsx'
import Auth from './pages/Auth.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import { PlayerProvider, usePlayer } from './contexts/PlayerContext.jsx'
import { API } from './data/hints.js'

const BOOT_LINES = [
  '[  OK  ] mounting /dev/crypton',
  '[  OK  ] loading exploit modules ......... 15',
  '[  OK  ] starting sqlite engine',
  '[ WARN ] input validation: DISABLED',
  '[  OK  ] firewall: OFFLINE (organiser override)',
  '$ initializing crypton v1.0_'
]

function BootScreen() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2300)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div className="boot" aria-hidden="true">
      <div className="boot-inner">
        <div className="boot-brand">CRYPTON <span>BIOS v1.0</span></div>
        {BOOT_LINES.map((line, i) => (
          <div className="boot-line" key={line} style={{ animationDelay: `${i * 0.16}s` }}>{line}</div>
        ))}
        <div className="boot-progress"><span /></div>
      </div>
    </div>
  )
}

function Shell({ children }) {
  const { player, stats, logout } = usePlayer()

  return (
    <div className="app-shell">
      <BootScreen />
      <div className="matrix-grid" aria-hidden="true" />
      <div className="scanlines" aria-hidden="true" />
      <header className="term-nav">
        <Link to="/" className="nav-prompt">root<span>@crypton</span>:~$</Link>
        <nav>
          <Link to="/">[ HINTS ]</Link>
          <Link to="/lab">[ LAB ]</Link>
          <Link to="/leaderboard">[ LEADERBOARD ]</Link>
          <Link to="/submit">[ SUBMIT ]</Link>
          <a href={`${API}/robots.txt`} target="_blank" rel="noreferrer">[ ROBOTS.TXT ]</a>
        </nav>
        <div className="nav-account">
          {player ? (
            <>
              <span className="nav-user">{player.username} <b>{stats?.points ?? 0} PTS</b></span>
              <button className="nav-logout" onClick={logout}>[ LOGOUT ]</button>
            </>
          ) : (
            <Link to="/login" className="nav-login">[ REGISTER / LOGIN ]</Link>
          )}
        </div>
      </header>
      <main>{children}</main>
      <footer className="footer">
        <span>CRYPTON · IEEE TECHNICAL EVENT · DEPT OF MCA · RAMAIAH INSTITUTE OF TECHNOLOGY</span>
        <span className="footer-credit">Made by SINCHANA SHETTY &amp; VARUN MURTHY</span>
        <span>15 FLAGS · 0 FIREWALLS · ROOT ACCESS PENDING</span>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <PlayerProvider>
        <Shell>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/lab" element={<Lab />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/submit" element={<Submit />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Shell>
      </PlayerProvider>
    </Router>
  )
}
