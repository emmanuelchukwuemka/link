// Custom server entry point for cPanel's Passenger-based Node.js App hosting,
// which starts this file directly (not `next start`) and passes the port to
// listen on via process.env.PORT. Plain CommonJS since package.json has no
// "type": "module" and Passenger invokes this file directly with `node`.
/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer } = require('http')
const { readFileSync, existsSync, rmSync, openSync, closeSync, statSync } = require('fs')
const { join } = require('path')
const { execSync } = require('child_process')

// cPanel's Fileman API (the only remote file-management access this host
// gives us — no shell/SSH) refuses to create brand-new top-level directories
// during tar extraction ("Cannot mkdir: Permission denied"), even though the
// account owns the whole tree and uploading individual files works fine —
// this is host-side hardening against exactly this kind of deploy. The node
// process itself runs under the account's normal permissions, so self-
// extracting from here (instead of through Fileman) works. Only runs when
// .next is actually missing, so a normal deploy with .next already in place
// never shells out.
function selfExtractIfMissing() {
  const nextDir = join(__dirname, '.next')
  const buildIdFile = join(nextDir, 'BUILD_ID')
  // BUILD_ID alone isn't proof of a complete extraction — tar writes files
  // in archive order, and a large archive extracted via a synchronous,
  // blocking execSync() can get killed mid-extraction by Passenger's startup
  // timeout. BUILD_ID is tiny and can land before the (much larger) static/
  // chunk tree finishes, leaving a half-extracted build that looks "real" by
  // BUILD_ID's presence alone and then never gets re-extracted on later boots.
  // Checking for the static dir too catches that half-extracted state.
  const staticDir = join(nextDir, 'static')
  const tarball = join(__dirname, 'next-prod.tar.gz')
  const lockFile = join(__dirname, '.next-extract.lock')
  const hasRealBuild = () => existsSync(buildIdFile) && existsSync(staticDir)

  console.error('[self-extract] __dirname=' + __dirname + ' hasRealBuild=' + hasRealBuild() + ' tarballExists=' + existsSync(tarball))
  if (hasRealBuild() || !existsSync(tarball)) return

  // Passenger sometimes runs more than one copy of this process around a
  // restart (observed: interleaved "removing incomplete .next" lines from
  // what should be a single boot). Without coordination, two processes
  // racing rmSync+tar on the same .next directory corrupt each other — one
  // process's tar writes a file into a subdir the instant after the other's
  // rmSync thought that subdir was empty, throwing ENOTEMPTY. That used to
  // be uncaught (crashing the process, which Passenger just respawned into
  // the same race forever). An exclusive lock file serializes the actual
  // extraction; any process that loses the race just waits for the winner.
  //
  // The lock itself can go stale: if the holder gets SIGKILLed mid-extraction
  // (seen in practice — Passenger's startup timeout killing a slow tar run),
  // its `finally` cleanup never runs and the lock file is orphaned forever,
  // deadlocking every future boot (each one waits out the timeout, gives up
  // with hasRealBuild=false, and crashes on the missing build — forever).
  // Treating a lock older than STALE_MS as abandoned and stealing it recovers
  // from that without needing a manual fix on the server.
  const STALE_MS = 45000
  function acquireLock() {
    try {
      closeSync(openSync(lockFile, 'wx'))
      return true
    } catch (err) {
      if (err.code !== 'EEXIST') {
        console.error('[self-extract] lock acquire failed: ' + err.message)
        return false
      }
      try {
        const age = Date.now() - statSync(lockFile).mtimeMs
        if (age > STALE_MS) {
          console.error('[self-extract] lock is stale (' + Math.round(age / 1000) + 's old) — stealing it')
          rmSync(lockFile, { force: true })
          closeSync(openSync(lockFile, 'wx'))
          return true
        }
      } catch {}
      return false
    }
  }

  const haveLock = acquireLock()

  if (!haveLock) {
    console.error('[self-extract] lock held by another process — waiting for it to finish')
    const deadline = Date.now() + 90000
    while (Date.now() < deadline && !hasRealBuild()) {
      try { execSync('sleep 1') } catch {}
    }
    console.error('[self-extract] done waiting, hasRealBuild=' + hasRealBuild())
    return
  }

  try {
    if (existsSync(nextDir)) {
      console.error('[self-extract] removing incomplete .next before extracting')
      rmSync(nextDir, { recursive: true, force: true })
    }
    console.error('[self-extract] extracting ' + tarball)
    const out = execSync('tar xzf next-prod.tar.gz 2>&1', { cwd: __dirname }).toString()
    console.error('[self-extract] tar output: ' + out)
    console.error('[self-extract] done, BUILD_ID exists now: ' + existsSync(buildIdFile) + ' static exists now: ' + existsSync(staticDir))
  } catch (err) {
    console.error('[self-extract] failed: ' + err.message + ' stdout=' + (err.stdout ? err.stdout.toString() : '') + ' stderr=' + (err.stderr ? err.stderr.toString() : ''))
  } finally {
    try { rmSync(lockFile, { force: true }) } catch {}
  }
}
selfExtractIfMissing()

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
        ['ER_FK_DUP_NAME', 'ER_DUP_KEYNAME', 'ER_TABLE_EXISTS_ERROR', 'ER_DUP_FIELDNAME'].includes(err.code) ||
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

// Previously this awaited syncSchema() before starting the HTTP listener,
// so every single boot paid the full cost of 46 sequential MySQL statements
// before Passenger/LiteSpeed could see the process as ready. Under repeated
// or concurrent cold spawns that pushed boot time well past LiteSpeed's
// connect timeout, so it kept giving up and spawning fresh workers before
// any of them finished — a self-reinforcing pileup. The schema sync is
// idempotent and safe to run in the background: starting the listener
// immediately means Passenger sees "Ready" right away, which is what
// actually breaks that loop.
app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res)
  }).listen(port, () => {
    console.error(`> Ready on port ${port} as ${dev ? 'development' : process.env.NODE_ENV}`)
  })
})

syncSchema().catch((err) => console.error('[schema sync] failed:', err))
