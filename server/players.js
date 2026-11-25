import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { db } from './db.js'

const COOKIE = 'player_session'
const SESSION_MS = 7 * 24 * 60 * 60 * 1000

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password, stored) {
  const [salt, hex] = String(stored).split(':')
  if (!salt || !hex) return false
  const actual = scryptSync(password, salt, 64)
  const expected = Buffer.from(hex, 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export function createSession(playerId) {
  const token = randomBytes(32).toString('hex')
  db.prepare('INSERT INTO player_sessions (token, player_id) VALUES (?, ?)').run(token, playerId)
  return token
}

export function setSessionCookie(res, token) {
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: SESSION_MS,
    secure: process.env.COOKIE_SECURE === 'true'
  })
}

export function clearSession(req, res) {
  const token = req.cookies?.[COOKIE]
  if (token) db.prepare('DELETE FROM player_sessions WHERE token = ?').run(token)
  res.clearCookie(COOKIE, { httpOnly: true, sameSite: 'lax' })
}

export function getPlayer(req) {
  const token = req.cookies?.[COOKIE]
  if (!token) return null
  return db.prepare(`
    SELECT p.id, p.username, p.created_at
    FROM player_sessions s JOIN players p ON p.id = s.player_id
    WHERE s.token = ?
  `).get(token) || null
}

export function requirePlayer(req, res, next) {
  const player = getPlayer(req)
  if (!player) {
    return res.status(401).json({ status: 'error', error: 'Register and log in to submit flags.' })
  }
  req.player = player
  next()
}

export function leaderboard() {
  const rows = db.prepare(`
    SELECT p.id, p.username,
           COUNT(s.id) AS solved,
           COALESCE(SUM(s.points), 0) AS points,
           MAX(s.submitted_at) AS last_solve
    FROM players p
    LEFT JOIN player_submissions s ON s.player_id = p.id
    GROUP BY p.id
    ORDER BY points DESC, solved DESC, last_solve ASC, p.id ASC
  `).all()

  return rows.map((row, index) => ({
    rank: index + 1,
    id: row.id,
    username: row.username,
    solved: row.solved,
    points: row.points,
    lastSolve: row.last_solve
  }))
}

export function playerStats(playerId) {
  const solvedIds = db.prepare('SELECT flag_id FROM player_submissions WHERE player_id = ? ORDER BY flag_id')
    .all(playerId).map((row) => row.flag_id)
  const entry = leaderboard().find((row) => row.id === playerId) || {
    id: playerId, rank: 0, username: null, solved: 0, points: 0, lastSolve: null
  }
  return { ...entry, solvedIds }
}

export function recordSubmission(playerId, flag) {
  const existing = db.prepare('SELECT 1 FROM player_submissions WHERE player_id = ? AND flag_id = ?')
    .get(playerId, flag.id)
  if (existing) return 'already_submitted'

  db.prepare('INSERT INTO player_submissions (player_id, flag_id, points) VALUES (?, ?, ?)')
    .run(playerId, flag.id, flag.points)
  return 'correct'
}
