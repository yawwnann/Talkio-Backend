/**
 * Minimal Database Seeder (Prisma + MySQL/TiDB)
 *
 * Requirements from request:
 * - Before seeding: delete ALL data (wipe all tables except Prisma migrations)
 * - Seed ONLY:
 *   - Therapists: "Putrining Kurnia Wati, S.Tr" and "Erma Septiarini, S.Tr Kes"
 *   - Parent: orangtua1@gmail.com
 *   - Admin: admin@gmail.com
 * - Everything else stays empty
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
require("dotenv").config({ override: true });

const prisma = new PrismaClient();

async function wipeAllTables() {
  console.log("🧹 Clearing database (all tables)...");

  try {
    await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 0");
  } catch (e) {
    // Some MySQL-compatible engines may not allow this; we'll still try truncates.
  }

  const tables = await prisma.$queryRaw`
    SELECT table_name AS name
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_type = 'BASE TABLE'
  `;

  let cleared = 0;
  for (const t of tables) {
    const name = t.name;

    // Keep Prisma migration history intact
    if (name === "_prisma_migrations") continue;

    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${name}\``);
    } catch (e) {
      await prisma.$executeRawUnsafe(`DELETE FROM \`${name}\``);
    }

    cleared += 1;
  }

  try {
    await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1");
  } catch (e) {
    // ignore
  }

  console.log(`   ✓ ${cleared} tab les cleared\n`);
}

async function seedMinimalUsers() {
  console.log("👥 Seeding users (minimal)...");

  const passwordHash = await bcrypt.hash("password123", 10);

  // Therapist emails were not provided in the request; they must be non-empty & unique.
  const usersToCreate = [
    { email: "admin@gmail.com", role: "ADMIN", name: null },
    { email: "orangtua1@gmail.com", role: "PARENT", name: null },
    {
      email: "putrining.terapis@gmail.com",
      role: "THERAPIST",
      name: "Putrining Kurnia Wati, S.Tr",
    },
    {
      email: "erma.terapis@gmail.com",
      role: "THERAPIST",
      name: "Erma Septiarini, S.Tr Kes",
    },
  ];

  await prisma.user.createMany({
    data: usersToCreate.map((u) => ({
      email: u.email,
      password: passwordHash,
      role: u.role,
      name: u.name,
    })),
  });

  const seeded = await prisma.user.findMany({
    select: { email: true, role: true, name: true },
    orderBy: [{ role: "asc" }, { email: "asc" }],
  });

  console.log(`   ✓ ${seeded.length} users created\n`);
  return seeded;
}

async function main() {
  console.log("🌱 Starting MINIMAL database seed...\n");

  const [rows] = await prisma.$queryRaw`SELECT DATABASE() as db`;
  console.log(`📊 Connected to database: ${rows.db}\n`);

  await wipeAllTables();
  const users = await seedMinimalUsers();

  console.log("🎉 ============================================");
  console.log("✅ Minimal database seeding completed!");
  console.log("📊 ============================================\n");
  console.log("🔐 Default password for ALL seeded users: password123\n");
  console.log("👤 Seeded accounts:");
  for (const u of users) {
    console.log(`   - ${u.role}: ${u.email}${u.name ? ` (${u.name})` : ""}`);
  }
  console.log("");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
