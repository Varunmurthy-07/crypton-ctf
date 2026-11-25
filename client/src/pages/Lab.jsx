import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { API } from '../data/hints.js'
import { useScrollReveal } from '../hooks/useScrollReveal.js'

async function call(path, options = {}) {
  try {
    const res = await fetch(`${API}${path}`, { credentials: 'include', ...options })
    const text = await res.text()
    try { return JSON.parse(text) } catch { return text }
  } catch (err) {
    return { error: String(err.message) }
  }
}

function Panel({ id, title, tag, desc, children, result }) {
  return (
    <section className="lab-panel terminal-window" id={id} data-reveal-left>
      <div className="win-chrome">
        <div className="win-dots"><i /><i /><i /></div>
        <div className="win-title">{tag} — {title}</div>
        <div className="win-meta">tty1</div>
      </div>
      <div className="win-body">
        <p className="lab-desc"><span className="prompt">$</span> {desc}</p>
        {children}
        {result !== undefined && result !== null && (
          <pre className="lab-output">{typeof result === 'string' ? result : JSON.stringify(result, null, 2)}</pre>
        )}
      </div>
    </section>
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

export default function Lab() {
  const root = useRef(null)
  useScrollReveal(root)
  const [q, setQ] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginResult, setLoginResult] = useState(null)
  const [userId, setUserId] = useState('1')
  const [userResult, setUserResult] = useState(null)
  const [debugResult, setDebugResult] = useState(null)
  const [legacyUser, setLegacyUser] = useState('admin')
  const [legacyPass, setLegacyPass] = useState('admin')
  const [legacyResult, setLegacyResult] = useState(null)

  const runSearch = async (e) => {
    e.preventDefault()
    setSearchResult(await call(`/api/search?q=${encodeURIComponent(q)}`))
  }

  const runLogin = async (e) => {
    e.preventDefault()
    setLoginResult(await call('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    }))
  }

  const runUser = async (e) => {
    e.preventDefault()
    setUserResult(await call(`/api/users/${encodeURIComponent(userId)}`))
  }

  const runDebug = async () => setDebugResult(await call('/api/debug'))

  const runLegacy = async (e) => {
    e.preventDefault()
    setLegacyResult(await call('/legacy-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: legacyUser, password: legacyPass })
    }))
  }

  return (
    <div className="lab" ref={root}>
      <header className="lab-hero" data-reveal>
        <div className="section-kicker">$ cd /exploit-lab</div>
        <h1>INTERACTIVE TARGETS</h1>
        <p>Every panel talks directly to the vulnerable Express server on port 7000. Payloads are in the <Link to="/">flag directory</Link>.</p>
      </header>

      <div className="lab-grid">
        <Panel id="search" tag="SQLi 06" title="Document Search" desc="String concatenation in the SQL query. Try an apostrophe and read the debug field in the error.">
          <form onSubmit={runSearch} className="lab-form">
            <Field label="QUERY (q)" value={q} onChange={setQ} placeholder="'" mono />
            <button className="btn btn-primary btn-sm" type="submit">RUN QUERY</button>
          </form>
          {searchResult && <pre className="lab-output">{JSON.stringify(searchResult, null, 2)}</pre>}
        </Panel>

        <Panel id="login" tag="AUTH 03 / 04" title="Login + Role Check" desc="Break the login with SQLi for /admin, or forge the role cookie for /member.">
          <form onSubmit={runLogin} className="lab-form lab-form-wide">
            <Field label="USERNAME" value={username} onChange={setUsername} placeholder="' OR '1'='1' -- " mono />
            <Field label="PASSWORD" value={password} onChange={setPassword} placeholder="anything" mono />
            <button className="btn btn-primary btn-sm" type="submit">LOGIN</button>
          </form>
          {loginResult && <pre className="lab-output">{JSON.stringify(loginResult, null, 2)}</pre>}
          <div className="lab-links">
            <a href={`${API}/admin`} target="_blank" rel="noreferrer">/admin ↗</a>
            <a href={`${API}/member`} target="_blank" rel="noreferrer">/member ↗</a>
          </div>
        </Panel>

        <Panel id="users" tag="IDOR 05" title="User Profiles" desc="No authorization check on the numeric user id.">
          <form onSubmit={runUser} className="lab-form">
            <Field label="USER ID" value={userId} onChange={setUserId} placeholder="2" mono />
            <button className="btn btn-primary btn-sm" type="submit">FETCH</button>
          </form>
          {userResult && <pre className="lab-output">{JSON.stringify(userResult, null, 2)}</pre>}
        </Panel>

        <Panel id="debug" tag="MISCONFIG 07" title="Debug Endpoint" desc="A debug route was left enabled in production. It returns everything, including a flag.">
          <div className="lab-form">
            <a className="btn btn-primary btn-sm" href={`${API}/api/debug`} target="_blank" rel="noreferrer">OPEN /api/debug ↗</a>
            <button className="btn btn-ghost btn-sm" type="button" onClick={runDebug}>FETCH HERE</button>
          </div>
          {debugResult && <pre className="lab-output">{JSON.stringify(debugResult, null, 2)}</pre>}
        </Panel>

        <Panel id="headers" tag="DISCLOSURE 08" title="Response Headers" desc="Open DevTools → Network → click the request below and inspect the response headers.">
          <div className="lab-form">
            <a className="btn btn-primary btn-sm" href={`${API}/api/health`} target="_blank" rel="noreferrer">OPEN /api/health ↗</a>
          </div>
          <pre className="lab-output">X-CTF-Flag: look in the response headers, not the JSON body.</pre>
        </Panel>

        <Panel id="config" tag="CLIENT 09" title="Static Config" desc="A build config file is publicly served and still contains a client secret.">
          <div className="lab-form">
            <a className="btn btn-primary btn-sm" href={`${API}/assets/config.js`} target="_blank" rel="noreferrer">OPEN config.js ↗</a>
          </div>
          <pre className="lab-output">Read the CLIENT_SECRET constant.</pre>
        </Panel>

        <Panel id="legacy" tag="ACCESS 10" title="Legacy Portal" desc="An old login endpoint was never removed. Try the vendor default administrative account.">
          <form onSubmit={runLegacy} className="lab-form lab-form-wide">
            <Field label="USERNAME" value={legacyUser} onChange={setLegacyUser} placeholder="admin" mono />
            <Field label="PASSWORD" value={legacyPass} onChange={setLegacyPass} placeholder="admin" mono />
            <button className="btn btn-primary btn-sm" type="submit">LOGIN</button>
          </form>
          {legacyResult && <pre className="lab-output">{JSON.stringify(legacyResult, null, 2)}</pre>}
          <div className="lab-links">
            <a href={`${API}/legacy-login`} target="_blank" rel="noreferrer">/legacy-login ↗</a>
          </div>
        </Panel>
      </div>
    </div>
  )
}
