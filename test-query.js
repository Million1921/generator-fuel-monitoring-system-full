const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const search = undefined;
    const whereBase = {
      fuelRequest: {
        status: "COMPLETED"
      }
    };
  
    if (search) {
      whereBase.OR = [
        { site: { name: { contains: search, mode: 'insensitive' } } },
        { site: { siteId: { contains: search, mode: 'insensitive' } } },
        { workOrderNumber: { contains: search, mode: 'insensitive' } },
        { fuelRequest: { workRequestNumber: { contains: search, mode: 'insensitive' } } }
      ];
    }
  
    // Fetch refills which are basically completed fuelings
    const refills = await prisma.fuelRefill.findMany({
      where: whereBase,
      include: {
        site: {
          include: {
            generator: true
          }
        },
        fuelRequest: true,
        technician: true
      },
      orderBy: { refillDate: 'desc' },
      take: 100 // Limit for performance, can add pagination later
    });
    
    console.log("Success! Found", refills.length, "refills.");
  } catch (err) {
    console.error("Query Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
