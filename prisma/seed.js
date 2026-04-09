/**
 * Complete Database Seeder for TiDB MySQL
 *
 * Seeds all tables with realistic sample data:
 * - Users (Admin, Therapists, Parents)
 * - Children
 * - Diagnoses
 * - Therapy Sessions
 * - Game Logs
 * - Progress Uploads
 * - ML Predictions
 * - Education Contents
 */

const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
require("dotenv").config({ override: true });

const { DATABASE_URL } = require("../src/config/database");

async function main() {
  console.log("🌱 Starting complete database seed...\n");

  // Parse MySQL connection URL
  const url = new URL(DATABASE_URL);
  const connection = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port),
    user: url.username,
    password: url.password,
    database: url.pathname.substring(1),
    ssl: { rejectUnauthorized: true },
  });

  const [rows] = await connection.query("SELECT DATABASE() as db");
  console.log(`📊 Connected to database: ${rows[0].db}\n`);

  // 1. Seed Users
  console.log("👥 Seeding users...");
  const password = await bcrypt.hash("password123", 10);

  await connection.execute(
    `
    INSERT INTO users (id, email, password, role, name, createdAt, updatedAt, isBlocked)
    VALUES 
      (UUID(), 'admin@example.com', ?, 'ADMIN', 'Admin User', NOW(), NOW(), FALSE),
      (UUID(), 'therapist1@example.com', ?, 'THERAPIST', 'Dr. Sarah Wijaya', NOW(), NOW(), FALSE),
      (UUID(), 'therapist2@example.com', ?, 'THERAPIST', 'Dr. Budi Santoso', NOW(), NOW(), FALSE),
      (UUID(), 'parent1@example.com', ?, 'PARENT', 'Ibu Anna', NOW(), NOW(), FALSE),
      (UUID(), 'parent2@example.com', ?, 'PARENT', 'Bapak Rudi', NOW(), NOW(), FALSE)
    ON DUPLICATE KEY UPDATE email=email;
  `,
    [password, password, password, password, password],
  );

  // Get user IDs for relationships
  const [users] = await connection.query(`
    SELECT id, email, role FROM users 
    WHERE email IN (
      'admin@example.com', 'therapist1@example.com', 'therapist2@example.com',
      'parent1@example.com', 'parent2@example.com'
    )
  `);

  const admin = users.find((u) => u.email === "admin@example.com");
  const therapist1 = users.find((u) => u.email === "therapist1@example.com");
  const therapist2 = users.find((u) => u.email === "therapist2@example.com");
  const parent1 = users.find((u) => u.email === "parent1@example.com");
  const parent2 = users.find((u) => u.email === "parent2@example.com");

  console.log(`   ✓ ${users.length} users created\n`);

  // 2. Seed Children
  console.log("👶 Seeding children...");

  await connection.execute(
    `
    INSERT INTO children (id, parentId, name, dateOfBirth, gender, createdAt, updatedAt)
    VALUES 
      (UUID(), ?, 'Ahmad Rizky', DATE_SUB(NOW(), INTERVAL 3 YEAR), 'MALE', NOW(), NOW()),
      (UUID(), ?, 'Siti Nurhaliza', DATE_SUB(NOW(), INTERVAL 4 YEAR), 'FEMALE', NOW(), NOW()),
      (UUID(), ?, 'Budi Pratama', DATE_SUB(NOW(), INTERVAL 2 YEAR), 'MALE', NOW(), NOW()),
      (UUID(), ?, 'Dewi Lestari', DATE_SUB(NOW(), INTERVAL 5 YEAR), 'FEMALE', NOW(), NOW()),
      (UUID(), ?, 'Fajar Nugroho', DATE_SUB(NOW(), INTERVAL 3 YEAR), 'MALE', NOW(), NOW())
    ON DUPLICATE KEY UPDATE name=name;
  `,
    [parent1.id, parent1.id, parent1.id, parent2.id, parent2.id],
  );

  const [children] = await connection.query(`
    SELECT id, name FROM children WHERE name IN (
      'Ahmad Rizky', 'Siti Nurhaliza', 'Budi Pratama', 'Dewi Lestari', 'Fajar Nugroho'
    )
  `);

  console.log(`   ✓ ${children.length} children created\n`);

  // 3. Seed Diagnoses
  console.log(" Seeding diagnoses...");

  const diagnosesData = [
    {
      childId: children[0].id,
      symptoms: JSON.stringify([
        "tidak_menyapa",
        "tidak_menatap_mata",
        "kosakata_terbatas",
        "tidak_menunjuk",
      ]),
      riskLevel: "HIGH",
      score: 0.85,
      recommendation:
        "Segera jadwalkan konsultasi dengan terapis bicara profesional.",
    },
    {
      childId: children[1].id,
      symptoms: JSON.stringify(["kosakata_terbatas", "sulit_mengucapkan_kata"]),
      riskLevel: "MEDIUM",
      score: 0.45,
      recommendation:
        "Perlu observasi lebih lanjut. Pantau perkembangan anak secara berkala.",
    },
    {
      childId: children[2].id,
      symptoms: JSON.stringify(["tidak_merespon_nama", "tidak_meniru_suara"]),
      riskLevel: "HIGH",
      score: 0.78,
      recommendation: "Disarankan untuk melakukan assessment lebih lanjut.",
    },
    {
      childId: children[3].id,
      symptoms: JSON.stringify(["normal"]),
      riskLevel: "LOW",
      score: 0.15,
      recommendation:
        "Terus pantau perkembangan bicara anak. Tidak ada risiko terdeteksi.",
    },
    {
      childId: children[4].id,
      symptoms: JSON.stringify([
        "terlambat_bicara",
        "tidak_bersosialisasi",
        "kosakata_terbatas",
      ]),
      riskLevel: "MEDIUM",
      score: 0.55,
      recommendation:
        "Observasi diperlukan. Pertimbangkan stimulasi bicara di rumah.",
    },
  ];

  for (const d of diagnosesData) {
    await connection.execute(
      `
      INSERT INTO diagnoses (id, childId, symptoms, riskLevel, score, recommendation, createdAt)
      VALUES (UUID(), ?, ?, ?, ?, ?, NOW())
    `,
      [d.childId, d.symptoms, d.riskLevel, d.score, d.recommendation],
    );
  }

  const [diagnoses] = await connection.query(
    `SELECT id, childId, riskLevel FROM diagnoses`,
  );
  console.log(`   ✓ ${diagnoses.length} diagnoses created\n`);

  // 4. Seed ML Predictions
  console.log("🤖 Seeding ML predictions...");

  for (const diagnosis of diagnoses) {
    await connection.execute(
      `
      INSERT INTO ml_predictions (id, diagnosisId, inputData, modelVersion, predictionResult, createdAt)
      VALUES (UUID(), ?, '{"features": [1, 0, 1, 1, 0, 1], "child_age_months": 36}', 'v1.0.0', ?, NOW())
    `,
      [diagnosis.id, parseFloat((Math.random() * 0.8 + 0.1).toFixed(2))],
    );
  }

  const [mlPredictions] = await connection.query(
    `SELECT COUNT(*) as count FROM ml_predictions`,
  );
  console.log(`   ✓ ${mlPredictions[0].count} ML predictions created\n`);

  // 5. Seed Therapy Sessions
  console.log("🏥 Seeding therapy sessions...");

  const therapySessionsData = [
    {
      childId: children[0].id,
      therapistId: therapist1.id,
      schedule: "2026-04-10 10:00:00",
      therapyType: "Speech Therapy",
      paymentStatus: "SUCCESS",
      isActive: true,
    },
    {
      childId: children[1].id,
      therapistId: therapist2.id,
      schedule: "2026-04-12 14:00:00",
      therapyType: "Language Therapy",
      paymentStatus: "SUCCESS",
      isActive: true,
    },
    {
      childId: children[2].id,
      therapistId: therapist1.id,
      schedule: "2026-04-15 09:00:00",
      therapyType: "Articulation Therapy",
      paymentStatus: "PENDING",
      isActive: false,
    },
    {
      childId: children[4].id,
      therapistId: therapist2.id,
      schedule: "2026-04-20 11:00:00",
      therapyType: "Speech Therapy",
      paymentStatus: "SUCCESS",
      isActive: true,
    },
  ];

  for (const session of therapySessionsData) {
    await connection.execute(
      `
      INSERT INTO therapy_sessions (id, childId, therapistId, schedule, therapyType, paymentStatus, isActive, createdAt, updatedAt)
      VALUES (UUID(), ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `,
      [
        session.childId,
        session.therapistId,
        session.schedule,
        session.therapyType,
        session.paymentStatus,
        session.isActive,
      ],
    );
  }

  const [sessions] = await connection.query(
    `SELECT COUNT(*) as count FROM therapy_sessions`,
  );
  console.log(`   ✓ ${sessions[0].count} therapy sessions created\n`);

  // 6. Seed Game Logs
  console.log("🎮 Seeding game logs...");

  const gameTypes = [
    "Kata Bergambar",
    "Suara Binatang",
    "Latihan Artikulasi",
    "Cerita Interaktif",
    "Tebak Suara",
  ];

  for (const child of children) {
    for (let i = 0; i < 5; i++) {
      await connection.execute(
        `
        INSERT INTO game_logs (id, childId, gameScore, duration, gameType, playedAt)
        VALUES (UUID(), ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY))
      `,
        [
          child.id,
          Math.floor(Math.random() * 100),
          Math.floor(Math.random() * 300) + 60,
          gameTypes[Math.floor(Math.random() * gameTypes.length)],
          Math.floor(Math.random() * 30),
        ],
      );
    }
  }

  const [gameLogs] = await connection.query(
    `SELECT COUNT(*) as count FROM game_logs`,
  );
  console.log(`   ✓ ${gameLogs[0].count} game logs created\n`);

  // 7. Seed Progress Uploads
  console.log("📸 Seeding progress uploads...");

  const progressData = [
    {
      childId: children[0].id,
      fileUrl: "/uploads/progress-child1-video1.mp4",
      parentNotes: "Anak mulai bisa mengucapkan kata 'mama' dengan lebih jelas",
    },
    {
      childId: children[1].id,
      fileUrl: "/uploads/progress-child2-photo1.jpg",
      parentNotes: "Anak sudah bisa menunjuk gambar saat diminta",
    },
    {
      childId: children[2].id,
      fileUrl: "/uploads/progress-child3-video1.mp4",
      parentNotes: "Perkembangan kosakata meningkat, sudah 15 kata baru",
    },
    {
      childId: children[3].id,
      fileUrl: "/uploads/progress-child4-photo1.jpg",
      parentNotes: "Anak mulai bersosialisasi dengan teman sebaya",
    },
  ];

  for (const progress of progressData) {
    await connection.execute(
      `
      INSERT INTO progress_uploads (id, childId, fileUrl, parentNotes, therapistEvaluation, createdAt)
      VALUES (UUID(), ?, ?, ?, ?, NOW())
    `,
      [progress.childId, progress.fileUrl, progress.parentNotes, null],
    );
  }

  const [progressUploads] = await connection.query(
    `SELECT COUNT(*) as count FROM progress_uploads`,
  );
  console.log(`   ✓ ${progressUploads[0].count} progress uploads created\n`);

  // 8. Seed Education Contents
  console.log("📚 Seeding education contents...");

  const educationData = [
    {
      title: "Tahapan Perkembangan Bicara Anak",
      content:
        "Artikel lengkap tentang milestone perkembangan bicara anak dari usia 0-5 tahun...",
      type: "ARTICLE",
      authorId: admin.id,
    },
    {
      title: "Cara Stimulasi Bicara di Rumah",
      content:
        "Tips dan teknik stimulasi bicara yang bisa dilakukan orang tua di rumah...",
      type: "ARTICLE",
      authorId: admin.id,
    },
    {
      title: "Video: Latihan Artikulasi untuk Anak",
      content: "https://youtube.com/watch?v=example1",
      type: "VIDEO",
      authorId: therapist1.id,
    },
    {
      title: "Tanda-Tanda Speech Delay",
      content:
        "Kenali tanda-tanda awal speech delay pada anak dan kapan harus ke profesional...",
      type: "ARTICLE",
      authorId: therapist2.id,
    },
    {
      title: "Video: Bermain sambil Belajar Bicara",
      content: "https://youtube.com/watch?v=example2",
      type: "VIDEO",
      authorId: admin.id,
    },
  ];

  for (const edu of educationData) {
    await connection.execute(
      `
      INSERT INTO education_contents (id, title, content, type, authorId, createdAt, updatedAt)
      VALUES (UUID(), ?, ?, ?, ?, NOW(), NOW())
    `,
      [edu.title, edu.content, edu.type, edu.authorId],
    );
  }

  const [educationContents] = await connection.query(
    `SELECT COUNT(*) as count FROM education_contents`,
  );
  console.log(
    `   ✓ ${educationContents[0].count} education contents created\n`,
  );

  await connection.end();

  console.log("🎉 ============================================");
  console.log("✅ Database seeding completed successfully!");
  console.log("📊 ============================================\n");
  console.log("📈 Summary:");
  console.log(`   👥 Users:              ${users.length}`);
  console.log(`   👶 Children:           ${children.length}`);
  console.log(`   🔍 Diagnoses:          ${diagnoses.length}`);
  console.log(`   🤖 ML Predictions:     ${mlPredictions[0].count}`);
  console.log(`   🏥 Therapy Sessions:   ${sessions[0].count}`);
  console.log(`   🎮 Game Logs:          ${gameLogs[0].count}`);
  console.log(`   📸 Progress Uploads:   ${progressUploads[0].count}`);
  console.log(`   📚 Education Contents: ${educationContents[0].count}\n`);
  console.log("============================================\n");
  console.log("🔐 Default Login Credentials:");
  console.log("   Admin:     admin@example.com / password123");
  console.log("   Therapist: therapist1@example.com / password123");
  console.log("   Therapist: therapist2@example.com / password123");
  console.log("   Parent:    parent1@example.com / password123");
  console.log("   Parent:    parent2@example.com / password123\n");
}

main().catch((e) => {
  console.error("❌ Seed failed:", e.message);
  console.error(e);
  process.exit(1);
});
