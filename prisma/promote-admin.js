// Promotes an existing user to platform admin (TapConnect operator).
// There is no self-serve signup for this role by design — run manually:
//   node prisma/promote-admin.js user@example.com
const mysql = require('mysql2/promise')

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error('Usage: node prisma/promote-admin.js <email>')
    process.exit(1)
  }

  const pool = mysql.createPool({ uri: process.env.DATABASE_URL })

  const [rows] = await pool.query('SELECT id FROM `User` WHERE `email` = ? LIMIT 1', [email])
  if (rows.length === 0) {
    console.error(`No user found with email ${email}. Register the account first, then run this script.`)
    process.exit(1)
  }

  await pool.query('UPDATE `User` SET `accountType` = ? WHERE `email` = ?', ['admin', email])
  console.log(`${email} is now a platform admin.`)
  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
