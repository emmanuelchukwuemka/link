// Seeds the marketplace Product catalog and delivery zones.
// Plain JS + mysql2 directly (not the TS src/lib/db helper) since this runs
// standalone via `node prisma/seed.js`, outside the Next.js/TS build.
const mysql = require('mysql2/promise')
const { v4: uuidv4 } = require('uuid')

async function upsert(pool, table, where, data) {
  const [rows] = await pool.query(`SELECT id FROM \`${table}\` WHERE ${Object.keys(where).map((k) => `\`${k}\` = ?`).join(' AND ')} LIMIT 1`, Object.values(where))
  if (rows.length > 0) return
  const row = { id: uuidv4(), ...where, ...data }
  const keys = Object.keys(row)
  await pool.query(
    `INSERT INTO \`${table}\` (${keys.map((k) => `\`${k}\``).join(',')}) VALUES (${keys.map(() => '?').join(',')})`,
    keys.map((k) => row[k])
  )
}

async function main() {
  const pool = mysql.createPool({ uri: process.env.DATABASE_URL })

  const products = [
    {
      name: 'TapConnect Mini',
      slug: 'tapconnect-mini',
      description: 'A compact NFC card that opens your TapConnect profile with a single tap.',
      length: 5,
      width: 3,
      colors: JSON.stringify(['Black', 'White']),
      priceRegular: 15000,
      priceSale: 10000,
      productionTime: '3-5 business days',
    },
    {
      name: 'TapConnect Standard',
      slug: 'tapconnect-standard',
      description: 'Our full-size NFC card, built for everyday networking.',
      length: 8.55,
      width: 5.4,
      colors: JSON.stringify(['Black', 'White']),
      priceRegular: 20000,
      priceSale: 15000,
      productionTime: '3-5 business days',
    },
    {
      name: 'TapConnect Wristband',
      slug: 'tapconnect-wristband',
      description: 'A wearable NFC wristband for events, hospitality and active lifestyles.',
      colors: JSON.stringify(['Black']),
      priceRegular: 25000,
      priceSale: 20000,
      productionTime: '3-5 business days',
    },
  ]

  for (const { slug, ...rest } of products) {
    await upsert(pool, 'Product', { slug }, rest)
  }

  const zones = [
    { name: 'Aba', fee: 1500 },
    { name: 'Umuahia', fee: 1500 },
    { name: 'Port Harcourt', fee: 2500 },
    { name: 'Lagos', fee: 3500 },
    { name: 'Abuja', fee: 3500 },
    { name: 'Other', fee: 4500 },
  ]

  for (const { name, ...rest } of zones) {
    await upsert(pool, 'DeliveryZone', { name }, rest)
  }

  console.log('Seeded products and delivery zones.')
  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
