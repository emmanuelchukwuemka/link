// Custom server entry point for cPanel's Passenger-based Node.js App hosting,
// which starts this file directly (not `next start`) and passes the port to
// listen on via process.env.PORT. Plain CommonJS since package.json has no
// "type": "module" and Passenger invokes this file directly with `node`.
/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer } = require('http')
const { readFileSync, existsSync } = require('fs')
const { join } = require('path')

// Passenger's PassengerEnvVar injection isn't reaching this process reliably
// (confirmed: NODE_ENV arrives, DATABASE_URL doesn't), and this plain-Node
// entry point runs before Next's own .env loader would. Load .env directly
// here so both this file and the Next app it starts see the same vars —
// process.env is global for the whole process once set here.
function loadDotEnv() {
  const envPath = join(__dirname, '.env')
  if (!existsSync(envPath)) return
  const content = readFileSync(envPath, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}
loadDotEnv()

const next = require('next')

const port = parseInt(process.env.PORT || '3000', 10)
const dev = process.env.NODE_ENV !== 'production'

// This host has no shell/SSH access and no API to run a migration step out
// of band, so the schema is synced here at boot instead — the only place
// with local (non-firewalled) access to the production DB. Next's
// instrumentation.ts hook turned out not to fire reliably under this custom
// server, so this runs directly in the file that's proven to execute.
async function syncSchema() {
  console.error('[schema sync] start — dev=' + dev + ' DATABASE_URL set=' + !!process.env.DATABASE_URL)
  if (dev || !process.env.DATABASE_URL) {
    console.error('[schema sync] skipped (dev or no DATABASE_URL)')
    return
  }
  const mysql = require('mysql2/promise')
  const pool = mysql.createPool({ uri: process.env.DATABASE_URL })
  const sql = readFileSync(join(__dirname, 'src/lib/schema.sql'), 'utf8')
  // Strip comment LINES before splitting on ';' — every statement here is
  // preceded by a `-- CreateTable`-style comment with no semicolon between
  // them, so splitting first would merge the comment into the statement
  // chunk and make every chunk "start with --", silently dropping all of them.
  const withoutComments = sql.split('\n').filter((line) => !line.trim().startsWith('--')).join('\n')
  const statements = withoutComments.split(';').map((s) => s.trim()).filter((s) => s.length > 0)
  console.error('[schema sync] running ' + statements.length + ' statements')
  let ok = 0
  for (const stmt of statements) {
    try {
      await pool.query(stmt)
      ok++
    } catch (err) {
      // MySQL wraps a duplicate FK constraint name as ER_CANT_CREATE_TABLE
      // with "(errno: 121 ...)" embedded in the message text, not as its own
      // top-level code/errno — matching on the message is what's reliable.
      // Expected on every restart once the constraints already exist.
      const alreadyExists =
        ['ER_FK_DUP_NAME', 'ER_DUP_KEYNAME', 'ER_TABLE_EXISTS_ERROR'].includes(err.code) ||
        /errno:\s*121\b/.test(err.message || '')
      if (alreadyExists) continue
      console.error('[schema sync] statement failed:', stmt.slice(0, 80), err.message)
    }
  }
  await pool.end()
  console.error('[schema sync] done, ' + ok + '/' + statements.length + ' ok')
}

const app = next({ dev })
const handle = app.getRequestHandler()

syncSchema()
  .catch((err) => console.error('[schema sync] failed:', err))
  .finally(() => {
    app.prepare().then(() => {
      createServer((req, res) => {
        handle(req, res)
      }).listen(port, () => {
        console.error(`> Ready on port ${port} as ${dev ? 'development' : process.env.NODE_ENV}`)
      })
    })
  })
