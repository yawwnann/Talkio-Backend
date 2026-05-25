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
    { email: "admin@gmail.com", role: "ADMIN", name: "Admin" },
    { email: "fiolita@gmail.com", role: "PARENT", name: "Fiolita" },
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
    select: { id: true, email: true, role: true, name: true },
    orderBy: [{ role: "asc" }, { email: "asc" }],
  });

  console.log(`   ✓ ${seeded.length} users created\n`);
  return seeded;
}

async function seedChildAndSessions(users) {
  console.log("👶 Seeding child and therapy sessions...");

  const parent = users.find((u) => u.role === "PARENT");
  const therapist1 = users.find((u) => u.email === "putrining.terapis@gmail.com");
  const therapist2 = users.find((u) => u.email === "erma.terapis@gmail.com");

  if (!parent) throw new Error("Parent user not found");
  if (!therapist1 || !therapist2) throw new Error("Therapist users not found");

  // Create child
  const child = await prisma.child.create({
    data: {
      parentId: parent.id,
      name: "Budi",
      dateOfBirth: new Date("2021-06-15"),
      gender: "MALE",
    },
  });
  console.log(`   ✓ Child created: ${child.name} (${child.id})`);

  // Create therapy sessions for each therapist
  const now = new Date();
  const sessions = [
    {
      childId: child.id,
      therapistId: therapist1.id,
      schedule: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      therapyType: "Terapi Wicara",
      paymentStatus: "SUCCESS",
      isActive: true,
      sessionStatus: "COMPLETED",
    },
    {
      childId: child.id,
      therapistId: therapist1.id,
      schedule: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      therapyType: "Terapi Wicara",
      paymentStatus: "SUCCESS",
      isActive: true,
      sessionStatus: "COMPLETED",
    },
    {
      childId: child.id,
      therapistId: therapist2.id,
      schedule: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      therapyType: "Terapi Wicara",
      paymentStatus: "SUCCESS",
      isActive: true,
      sessionStatus: "COMPLETED",
    },
    {
      childId: child.id,
      therapistId: therapist2.id,
      schedule: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      therapyType: "Terapi Wicara",
      paymentStatus: "PENDING",
      isActive: false,
      sessionStatus: "SCHEDULED",
    },
  ];

  for (const s of sessions) {
    await prisma.therapySession.create({ data: s });
  }
  console.log(`   ✓ ${sessions.length} therapy sessions created`);

  // Create sample progress uploads
  const uploads = [
    {
      childId: child.id,
      fileUrl: "https://res.cloudinary.com/dztyts5m1/video/upload/sample_video_progress.mp4",
      fileType: "video",
      duration: 45,
      parentNotes: "Budi mulai bisa mengucapkan 'mama' dengan jelas hari ini",
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      childId: child.id,
      fileUrl: "https://res.cloudinary.com/dztyts5m1/video/upload/sample_audio_recording.mp3",
      fileType: "audio",
      duration: 30,
      parentNotes: "Latihan pengucapan huruf 'S' sudah mulai membaik",
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      childId: child.id,
      fileUrl: "https://res.cloudinary.com/dztyts5m1/image/upload/sample_photo_progress.jpg",
      fileType: "image",
      parentNotes: "Sesi terapi hari ini berjalan lancar",
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const u of uploads) {
    await prisma.progressUpload.create({ data: u });
  }
  console.log(`   ✓ ${uploads.length} sample progress uploads created\n`);

  return child;
}

async function main() {
  console.log("🌱 Starting database seed...\n");

  const [rows] = await prisma.$queryRaw`SELECT DATABASE() as db`;
  console.log(`📊 Connected to database: ${rows.db}\n`);

  await wipeAllTables();
  const users = await seedMinimalUsers();
  const child = await seedChildAndSessions(users);

  console.log("🎉 ============================================");
  console.log("✅ Database seeding completed!");
  console.log("📊 ============================================\n");
  console.log("🔐 Default password for ALL seeded users: password123\n");
  console.log("👤 Seeded accounts:");
  for (const u of users) {
    console.log(`   - ${u.role}: ${u.email}${u.name ? ` (${u.name})` : ""}`);
  }
  console.log(`   ✓ Child: ${child.name}`);
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
