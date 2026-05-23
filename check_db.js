const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sessions = await prisma.therapySession.findMany({
    include: {
      child: true,
      therapist: true,
    }
  });
  
  console.log("All Sessions in DB:");
  sessions.forEach(s => {
    console.log(`- ID: ${s.id}`);
    console.log(`  Therapist: ${s.therapist.name} (ID: ${s.therapistId})`);
    console.log(`  Child: ${s.child.name} (ID: ${s.childId})`);
    console.log(`  Schedule: ${s.schedule}`);
    console.log(`  Type: ${s.therapyType}, Active: ${s.isActive}`);
  });
  
  const users = await prisma.user.findMany({ where: { role: 'THERAPIST' } });
  console.log("\nTherapists in DB:");
  users.forEach(u => console.log(`- ${u.name} (${u.email}) [ID: ${u.id}]`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
