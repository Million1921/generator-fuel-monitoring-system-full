const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const r1 = await prisma.fuelRequest.updateMany({
    where: { status: 'PENDING_MANAGER_APPROVAL' },
    data: { status: 'PENDING_MANAGER' }
  });
  console.log('Migrated PENDING_MANAGER_APPROVAL:', r1.count);

  const r2 = await prisma.fuelRequest.updateMany({
    where: { status: 'APPROVED_REQUEST' },
    data: { status: 'PENDING_FLEET_ADMIN' }
  });
  console.log('Migrated APPROVED_REQUEST:', r2.count);

  const r3 = await prisma.fuelRequest.updateMany({
    where: { status: 'PENDING_FINANCE' },
    data: { status: 'PENDING_FUEL_SUPERVISOR' }
  });
  console.log('Migrated PENDING_FINANCE:', r3.count);

  const r4 = await prisma.fuelRequest.updateMany({
    where: { status: 'FUNDS_RELEASED' },
    data: { status: 'FUNDS_RELEASED_TO_FLEET_ADMIN' }
  });
  console.log('Migrated FUNDS_RELEASED:', r4.count);

  console.log("Database statuses migrated successfully.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
