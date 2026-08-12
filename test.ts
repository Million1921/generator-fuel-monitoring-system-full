import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    // Revert the test site back to NAAR
    await prisma.site.update({ where: { id: 21 }, data: { region: 'NAAR' } });
    console.log('Site 21 reverted to NAAR');
    const cnr = await prisma.site.count({ where: { region: 'CNR' } });
    const naar = await prisma.site.count({ where: { region: 'NAAR' } });
    console.log('CNR:', cnr, '  NAAR:', naar);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
