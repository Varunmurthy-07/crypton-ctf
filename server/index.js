import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import fs from 'node:fs'
import path from 'node:path'
import { ROOT, db } from './db.js'
import { FLAGS, TOTAL_POINTS } from './flags.js'
import {
  hashPassword, verifyPassword, createSession, setSessionCookie, clearSession,
  getPlayer, requirePlayer, leaderboard, playerStats, recordSubmission
} from './players.js'

const app = express()
app.use(cors({ origin: true, credentials: true }))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const PORT = Number(process.env.PORT || 7000)

/* ------------------------------------------------------------------ *
 * RECON                                                               *
 * ------------------------------------------------------------------ */

app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send(fs.readFileSync(path.join(ROOT, 'data/robots.txt'), 'utf8'))
})

app.get('/humans.txt', (_req, res) => {
  res.type('text/plain').send(fs.readFileSync(path.join(ROOT, 'data/humans.txt'), 'utf8'))
})

/* ------------------------------------------------------------------ *
 * VULNERABLE SQL SEARCH - error based SQLi (flag 06)                   *
 * ------------------------------------------------------------------ */

app.get('/api/search', (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q : ''
  // INTENTIONALLY VULNERABLE: the query is built with string concatenation.
  const sql = `SELECT id, name, description FROM vuln_items WHERE name LIKE '%${q}%'`
  try {
    const results = db.prepare(sql).all()
    res.json({ query: q, count: results.length, results })
  } catch (err) {
    res.status(400).json({
      query: q,
      error: 'SQLite query failed',
      detail: String(err.message),
      debug_flag: FLAGS[5].flag
    })
  }
})

/* ------------------------------------------------------------------ *
 * AUTH BYPASS + COOKIE ROLE FORGERY                                    *
 * ------------------------------------------------------------------ */

app.post('/api/login', (req, res) => {
  const username = String(req.body?.username ?? '')
  const password = String(req.body?.password ?? '')
  const sql = `SELECT id, username, role FROM users WHERE username='${username}' AND password='${password}'`
  try {
    const row = db.prepare(sql).get()
    if (!row) return res.json({ ok: false, message: 'Access denied. Invalid credentials.' })

    const injected = username.includes("'") || password.includes("'")
    res.cookie('role', row.role, { httpOnly: false })
    res.cookie('auth', '1', { httpOnly: false })
    if (injected) res.cookie('injected', '1', { httpOnly: false })

    res.json({
      ok: true,
      injected,
      user: { id: row.id, username: row.username, role: row.role },
      message: injected
        ? 'Injection detected by the absolutely-not-broken auth system.'
        : 'Welcome back.'
    })
  } catch (err) {
    res.status(400).json({ error: String(err.message), expression: sql })
  }
})

app.get('/admin', (req, res) => {
  if (req.cookies.injected !== '1') {
    return res.status(403).json({ error: 'Forbidden. Administrator session required.' })
  }
  res.json({ user: 'admin', secret: FLAGS[2].flag, message: 'You bypassed the login.' })
})

app.get('/member', (req, res) => {
  if (req.cookies.role !== 'admin') {
    return res.status(403).json({ error: 'Members area. Your role is not admin.' })
  }
  res.json({ area: 'members', secret: FLAGS[3].flag, message: 'Nice cookie.' })
})

/* ------------------------------------------------------------------ *
 * IDOR                                                                 *
 * ------------------------------------------------------------------ */

app.get('/api/users/:id', (req, res) => {
  const row = db.prepare('SELECT id, username, role, private_note FROM users WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'User not found' })
  res.json(row)
})

/* ------------------------------------------------------------------ *
 * FLAG 07 - EXPOSED DEBUG ENDPOINT                                     *
 * ------------------------------------------------------------------ */

app.get('/api/debug', (_req, res) => {
  res.json({
    service: 'CRYPTON',
    mode: 'debug',
    flag: FLAGS[6].flag,
    config: {
      environment: 'production',
      firewall: 'disabled',
      inputValidation: 'none'
    }
  })
})

/* ------------------------------------------------------------------ *
 * FLAG 08 - FLAG LEAKED IN A RESPONSE HEADER                            *
 * ------------------------------------------------------------------ */

app.get('/api/health', (_req, res) => {
  res.setHeader('Access-Control-Expose-Headers', 'X-CTF-Flag')
  res.setHeader('X-CTF-Flag', FLAGS[7].flag)
  res.json({ ok: true, service: 'CRYPTON', flags: FLAGS.length })
})

/* ------------------------------------------------------------------ *
 * FLAG 10 - LEGACY LOGIN WITH DEFAULT CREDENTIALS                       *
 * ------------------------------------------------------------------ */

app.get('/legacy-login', (_req, res) => {
  res.type('html').send(`<!doctype html>
<html><head><meta charset="utf-8"><title>CRYPTON - Legacy Login</title></head>
<body style="background:#020512;color:#edf3ff;font-family:monospace;padding:40px">
  <h1>LEGACY PORTAL</h1>
  <form method="POST" action="/legacy-login">
    <p>USERNAME <input name="username" autocomplete="off"></p>
    <p>PASSWORD <input name="password" type="password" autocomplete="off"></p>
    <button type="submit">LOGIN</button>
  </form>
  <p><a href="/">Return to CRYPTON</a></p>
</body></html>`)
})

app.post('/legacy-login', (req, res) => {
  const username = String(req.body?.username ?? '')
  const password = String(req.body?.password ?? '')
  if (username === 'admin' && password === 'admin') {
    return res.json({ ok: true, flag: FLAGS[9].flag, message: 'Legacy administrative access granted.' })
  }
  res.json({ ok: false, message: 'Access denied. Invalid credentials.' })
})

/* ------------------------------------------------------------------ *
 * PLAYER ACCOUNTS - required to submit flags                            *
 * /api/login above is the intentionally vulnerable portal login used    *
 * by flags 03/04. Player accounts here are separate and properly hashed.*
 * ------------------------------------------------------------------ */

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/

app.post('/api/player/register', (req, res) => {
  const username = String(req.body?.username ?? '').trim()
  const password = String(req.body?.password ?? '')
  if (!USERNAME_RE.test(username)) {
    return res.status(400).json({ status: 'error', error: 'Username must be 3-20 chars: letters, numbers, underscore.' })
  }
  if (password.length < 8 || password.length > 128) {
    return res.status(400).json({ status: 'error', error: 'Password must be 8-128 characters.' })
  }
  if (db.prepare('SELECT 1 FROM players WHERE username = ?').get(username)) {
    return res.status(409).json({ status: 'error', error: 'Username already taken.' })
  }

  try {
    const info = db.prepare('INSERT INTO players (username, password_hash) VALUES (?, ?)')
      .run(username, hashPassword(password))
    const player = { id: Number(info.lastInsertRowid), username }
    setSessionCookie(res, createSession(player.id))
    broadcastLeaderboard()
    res.status(201).json({ status: 'ok', player, stats: playerStats(player.id) })
  } catch {
    res.status(500).json({ status: 'error', error: 'Could not create account.' })
  }
})

app.post('/api/player/login', (req, res) => {
  const username = String(req.body?.username ?? '').trim()
  const password = String(req.body?.password ?? '')
  const row = db.prepare('SELECT id, username, password_hash FROM players WHERE username = ?').get(username)
  if (!row || !verifyPassword(password, row.password_hash)) {
    return res.status(401).json({ status: 'error', error: 'Invalid username or password.' })
  }
  setSessionCookie(res, createSession(row.id))
  res.json({ status: 'ok', player: { id: row.id, username: row.username }, stats: playerStats(row.id) })
})

app.post('/api/player/logout', (req, res) => {
  clearSession(req, res)
  res.json({ status: 'ok' })
})

app.get('/api/player/me', (req, res) => {
  const player = getPlayer(req)
  res.json({ player, stats: player ? playerStats(player.id) : null })
})

/* ------------------------------------------------------------------ *
 * LIVE LEADERBOARD - REST snapshot + Server-Sent Events stream          *
 * ------------------------------------------------------------------ */

const leaderboardClients = new Set()

function leaderboardPayload() {
  return JSON.stringify({
    type: 'leaderboard',
    rows: leaderboard(),
    totalFlags: FLAGS.length,
    totalPoints: TOTAL_POINTS,
    time: Date.now()
  })
}

function broadcastLeaderboard() {
  const payload = `data: ${leaderboardPayload()}\n\n`
  for (const client of leaderboardClients) client.write(payload)
}

app.get('/api/leaderboard', (_req, res) => {
  res.json({
    rows: leaderboard(),
    totalFlags: FLAGS.length,
    totalPoints: TOTAL_POINTS
  })
})

app.get('/api/leaderboard/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders?.()
  res.write('retry: 3000\n\n')
  res.write(`data: ${leaderboardPayload()}\n\n`)
  leaderboardClients.add(res)

  const heartbeat = setInterval(() => res.write(': keep-alive\n\n'), 20000)
  req.on('close', () => {
    clearInterval(heartbeat)
    leaderboardClients.delete(res)
  })
})

/* ------------------------------------------------------------------ *
 * FLAG SUBMISSION - player session required                             *
 * ------------------------------------------------------------------ */

app.post('/api/submit', requirePlayer, (req, res) => {
  const value = String(req.body?.flag ?? '').trim()
  const match = FLAGS.find((f) => f.flag === value)
  if (!match) return res.json({ status: 'incorrect', message: 'Not a valid flag. Keep digging.' })

  const outcome = recordSubmission(req.player.id, match)
  if (outcome === 'already_submitted') {
    return res.json({ status: 'already_submitted', message: `You already captured flag ${match.id}.` })
  }

  broadcastLeaderboard()
  res.json({
    status: 'correct',
    message: `Flag ${match.id} captured: ${match.name}`,
    name: match.name,
    points: match.points,
    stats: playerStats(req.player.id)
  })
})

app.get('/api/scoreboard', (_req, res) => {
  const rows = leaderboard()
  res.json({
    totalFlags: FLAGS.length,
    totalPoints: TOTAL_POINTS,
    players: rows.length,
    totalSolves: rows.reduce((sum, row) => sum + row.solved, 0),
    leader: rows[0] || null
  })
})

/* ------------------------------------------------------------------ *
 * PRODUCTION: serve the built React app                                *
 * ------------------------------------------------------------------ */

const dist = path.resolve(ROOT, '../client/dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

app.listen(PORT, () => {
  console.log(`[crypton] vulnerable server on http://localhost:${PORT}`)
  console.log(`[crypton] ${FLAGS.length} flags loaded`)
})
