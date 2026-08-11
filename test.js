const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    await prisma.transaction.create({
      data: {
        type: 'FUND_RELEASE',
        paidAmount: 100,
        remark: 'Test',
        receiptNo: 'TEST-1',
        siteId: 1,
        payerName: 'Finance Department'
      }
    });
    console.log('success');
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
