const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
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

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    })
  }

  const zones = [
    { name: 'Aba', fee: 1500 },
    { name: 'Umuahia', fee: 1500 },
    { name: 'Port Harcourt', fee: 2500 },
    { name: 'Lagos', fee: 3500 },
    { name: 'Abuja', fee: 3500 },
    { name: 'Other', fee: 4500 },
  ]

  for (const z of zones) {
    await prisma.deliveryZone.upsert({
      where: { name: z.name },
      update: {},
      create: z,
    })
  }

  console.log('Seeded products and delivery zones.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
