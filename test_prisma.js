const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const session = await prisma.therapySession.findFirst();
  console.log(session);
}

main().catch(console.error).finally(() => prisma.$disconnect());
