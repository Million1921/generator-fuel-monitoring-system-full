import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    const t = await prisma.technician.create({
      data: {
        userId: 'user_2kI0F7UHTL6s4t4bE8fV1uE8z0m',
        email: 'milliontesfahun1921@gmail.com',
        name: 'million tesfahun'
      }
    });
    console.log(t);
  } catch (e) {
    console.error(e);
  }
}
main();
