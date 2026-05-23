const PDFDocument = require("pdfkit");
const prisma = require("../utils/prisma");
const path = require("path");
const fs = require("fs");

/**
 * Generate PDF report for patient progress
 * @param {string} childId - Child's UUID
 * @returns {string} Path to generated PDF
 */
const generatePatientReport = async (childId) => {
  // Fetch all data
  const child = await prisma.child.findUnique({
    where: { id: childId },
    include: {
      parent: {
        select: { name: true, email: true },
      },
      diagnoses: {
        orderBy: { createdAt: "desc" },
      },
      therapySessions: {
        include: {
          therapist: {
            select: { name: true, email: true },
          },
        },
        orderBy: { schedule: "desc" },
      },
      gameLogs: {
        orderBy: { playedAt: "desc" },
        take: 20,
      },
      progressUploads: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!child) {
    throw new Error("Child not found");
  }

  // Create PDF document
  const doc = new PDFDocument({ margin: 50 });
  const fileName = `report-${childId}-${Date.now()}.pdf`;
  const isVercel = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
  const filePath = isVercel 
    ? path.join("/tmp", "uploads", "reports", fileName)
    : path.join(__dirname, "..", "..", "uploads", "reports", fileName);

  // Ensure reports directory exists
  const reportsDir = path.dirname(filePath);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // Header
  doc.fontSize(24).text("Laporan Perkembangan Terapi", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Tanggal Generate: ${new Date().toLocaleDateString("id-ID")}`, {
    align: "center",
  });
  doc.moveDown();

  // Patient Information
  doc.fontSize(18).text("Informasi Pasien", { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12);
  doc.text(`Nama: ${child.name}`);
  doc.text(`Tanggal Lahir: ${new Date(child.dateOfBirth).toLocaleDateString("id-ID")}`);
  doc.text(`Jenis Kelamin: ${child.gender === "MALE" ? "Laki-laki" : "Perempuan"}`);
  doc.text(`Umur: ${calculateAge(child.dateOfBirth)}`);
  doc.text(`Orang Tua: ${child.parent.name}`);
  doc.text(`Email Orang Tua: ${child.parent.email}`);
  doc.moveDown();

  // Diagnosis History
  doc.fontSize(18).text("Riwayat Diagnosis", { underline: true });
  doc.moveDown(0.5);
  
  if (child.diagnoses.length > 0) {
    child.diagnoses.forEach((diagnosis, index) => {
      doc.fontSize(12);
      doc.text(`Diagnosis #${index + 1}`);
      doc.text(`Tanggal: ${new Date(diagnosis.createdAt).toLocaleDateString("id-ID")}`);
      doc.text(`Level Risiko: ${diagnosis.riskLevel}`);
      doc.text(`Skor: ${diagnosis.score}`);
      if (diagnosis.recommendation) {
        doc.text(`Rekomendasi: ${diagnosis.recommendation}`);
      } else {
        doc.text(`Rekomendasi: -`);
      }
      
      doc.moveDown(0.5);
    });
  } else {
    doc.fontSize(12).text("Belum ada diagnosis");
    doc.moveDown();
  }

  // Therapy Sessions
  doc.fontSize(18).text("Riwayat Terapi", { underline: true });
  doc.moveDown(0.5);
  
  if (child.therapySessions.length > 0) {
    child.therapySessions.forEach((session, index) => {
      doc.fontSize(12);
      doc.text(`Sesi #${index + 1}`);
      doc.text(`Tanggal: ${new Date(session.schedule).toLocaleDateString("id-ID")}`);
      doc.text(`Tipe: ${session.therapyType}`);
      doc.text(`Status Pembayaran: ${session.paymentStatus}`);
      doc.text(`Status Aktif: ${session.isActive ? "Ya" : "Tidak"}`);
      
      if (session.therapist) {
        doc.text(`Terapis: ${session.therapist.name}`);
      }
      
      doc.moveDown(0.5);
    });
  } else {
    doc.fontSize(12).text("Belum ada sesi terapi");
    doc.moveDown();
  }

  // Game Progress
  doc.fontSize(18).text("Progress Game (20 Terakhir)", { underline: true });
  doc.moveDown(0.5);
  
  if (child.gameLogs.length > 0) {
    child.gameLogs.forEach((log, index) => {
      doc.fontSize(12);
      doc.text(`Game #${index + 1}`);
      doc.text(`Tanggal: ${new Date(log.playedAt).toLocaleDateString("id-ID")}`);
      doc.text(`Tipe Game: ${log.gameType}`);
      doc.text(`Skor: ${log.gameScore}`);
      doc.text(`Durasi: ${formatDuration(log.duration)}`);
      doc.moveDown(0.5);
    });
  } else {
    doc.fontSize(12).text("Belum ada log game");
    doc.moveDown();
  }

  // Progress Uploads
  doc.fontSize(18).text("Upload Perkembangan (10 Terakhir)", { underline: true });
  doc.moveDown(0.5);
  
  if (child.progressUploads.length > 0) {
    child.progressUploads.forEach((upload, index) => {
      doc.fontSize(12);
      doc.text(`Upload #${index + 1}`);
      doc.text(`Tanggal: ${new Date(upload.createdAt).toLocaleDateString("id-ID")}`);
      doc.text(`File: ${upload.fileUrl}`);
      doc.text(`Catatan: ${upload.parentNotes || "-"}`);
      
      if (upload.therapistEvaluation) {
        doc.text(`Evaluasi Terapis: ${upload.therapistEvaluation}`);
      }
      
      doc.moveDown(0.5);
    });
  } else {
    doc.fontSize(12).text("Belum ada upload progress");
    doc.moveDown();
  }

  // Footer
  doc.moveDown();
  doc.fontSize(10).text("--- Akhir Laporan ---", { align: "center" });
  doc.text(`Generated by Speech Delay Detection System`, { align: "center" });

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
};

/**
 * Calculate age from birth date
 */
function calculateAge(dateOfBirth) {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  const years = today.getFullYear() - birth.getFullYear();
  const months = today.getMonth() - birth.getMonth();
  
  if (years === 0) {
    return `${months} bulan`;
  }
  return `${years} tahun ${months} bulan`;
}

/**
 * Format duration from seconds to human-readable
 */
function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes} menit ${secs} detik`;
}

module.exports = {
  generatePatientReport,
};
