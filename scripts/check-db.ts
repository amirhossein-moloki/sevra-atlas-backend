import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.$connect();
  console.log('SUCCESS');
}
main().catch(e => {
  console.error('FAILURE');
  console.error(e.message);
  process.exit(1);
});
