import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { FLAGS } from './flags.js'

export const ROOT = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(ROOT, 'ctf.db')

fs.mkdirSync(path.join(ROOT, 'uploads'), { recursive: true })

export const db = new DatabaseSync(DB_PATH)

db.exec(`
  CREATE TABLE IF NOT EXISTS vuln_items (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS secret_flags (
    id INTEGER PRIMARY KEY,
    flag TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS vault (
    id INTEGER PRIMARY KEY,
    note TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    private_note TEXT
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author TEXT NOT NULL,
    body TEXT NOT NULL
  );

  /* Player accounts - separate from the intentionally vulnerable users table. */
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS player_sessions (
    token TEXT PRIMARY KEY,
    player_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS player_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    flag_id INTEGER NOT NULL,
    points INTEGER NOT NULL,
    submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (player_id, flag_id)
  );

  CREATE INDEX IF NOT EXISTS idx_submissions_player ON player_submissions (player_id);
`)

const insertItem = db.prepare('INSERT OR IGNORE INTO vuln_items (id, name, description) VALUES (?, ?, ?)')
;[
  [1, 'Welcome Note', 'Welcome to the CRYPTON internal portal.'],
  [2, 'Search Help', 'Use the search bar to find internal documents.'],
  [3, 'Memorandum', 'All sensitive data is stored securely. Trust us.']
].forEach((row) => insertItem.run(...row))

// id 7 = union-based flag, id 8 = boolean-blind flag
const insertSecret = db.prepare('INSERT OR IGNORE INTO secret_flags (id, flag) VALUES (?, ?)')
insertSecret.run(7, FLAGS[6].flag)
insertSecret.run(8, FLAGS[7].flag)

const insertVault = db.prepare('INSERT OR IGNORE INTO vault (id, note) VALUES (?, ?)')
insertVault.run(15, FLAGS[14].flag)

const insertUser = db.prepare('INSERT OR IGNORE INTO users (id, username, password, role, private_note) VALUES (?, ?, ?, ?, ?)')
insertUser.run(1, 'admin', 's3cr3t-admin-pass', 'admin', 'Root administrator account.')
insertUser.run(2, 'ghost', 'n0body-kn0ws', 'user', FLAGS[4].flag)
insertUser.run(3, 'varun', 'hunter2', 'user', 'Just a regular MCA student.')

const countComments = db.prepare('SELECT COUNT(*) AS n FROM comments').get().n
if (countComments === 0) {
  const insertComment = db.prepare('INSERT INTO comments (author, body) VALUES (?, ?)')
  insertComment.run('sysop', 'Portal is online. Report anomalies to the MCA dept.')
}

export const tables = { vulnItems: 'vuln_items', secretFlags: 'secret_flags', vault: 'vault', users: 'users' }
