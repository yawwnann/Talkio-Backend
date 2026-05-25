require('dotenv').config({ override: true });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function test() {
  try {
    const users = await prisma.user.findMany({ select: { email: true, role: true, name: true, password: true } });
    for (const u of users) {
      const valid = await bcrypt.compare('password123', u.password);
      console.log(`${u.email} (${u.role}): password123 = ${valid ? 'OK' : 'FAIL'}`);
    }
  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
