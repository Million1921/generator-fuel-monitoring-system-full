const { PrismaClient } = require('@prisma/client')

// Uses the same DATABASE_URL the app connects with — never hardcode
// credentials in a script that might get committed or shared.
const prisma = new PrismaClient()

async function main() {
  try {
    const result = await prisma.site.updateMany({
      data: { region: "NAAR" }
    })
    console.log(`Updated ${result.count} sites to NAAR region.`)
  } catch (error) {
    console.error(error)
  }
}

main().finally(() => prisma.$disconnect())
