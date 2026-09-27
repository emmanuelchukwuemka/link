// Promotes an existing user to platform admin (TapConnect operator).
// There is no self-serve signup for this role by design — run manually:
//   node prisma/promote-admin.js user@example.com
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error('Usage: node prisma/promote-admin.js <email>')
    process.exit(1)
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.error(`No user found with email ${email}. Register the account first, then run this script.`)
    process.exit(1)
  }

  await prisma.user.update({ where: { email }, data: { accountType: 'admin' } })
  console.log(`${email} is now a platform admin.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
