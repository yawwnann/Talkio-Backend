const PDFDocument = require("pdfkit");
const prisma = require("../utils/prisma");
const path = require("path");
const fs = require("fs");

// Color palette
const COLORS = {
  primary: "#1E40AF",      // Deep blue
  primaryLight: "#3B82F6", // Light blue
  accent: "#10B981",       // Green accent
  dark: "#1F2937",         // Dark gray
  medium: "#4B5563",       // Medium gray
  light: "#9CA3AF",        // Light gray
  bgLight: "#F3F4F6",      // Background
  bgBlue: "#EFF6FF",       // Light blue bg
  white: "#FFFFFF",
  border: "#D1D5DB",
  success: "#059669",
  warning: "#D97706",
  danger: "#DC2626",
};

/**
 * Generate professional PDF report for patient progress
 */
const generatePatientReport = async (childId) => {
  const child = await prisma.child.findUnique({
    where: { id: childId },
    include: {
      parent: { select: { name: true, email: true } },
      diagnoses: { orderBy: { createdAt: "desc" } },
      progressNotes: {
        orderBy: { date: "desc" },
        take: 10,
      },
      therapySessions: {
        include: { therapist: { select: { name: true, email: true } } },
        orderBy: { schedule: "desc" },
      },
      gameLogs: { orderBy: { playedAt: "desc" }, take: 20 },
      progressUploads: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!child) throw new Error("Child not found");

  const doc = new PDFDocument({
    size: "A4",
    margin: 0,
    info: {
      Title: `Laporan Perkembangan - ${child.name}`,
      Author: "Pondok Terapi Bicara",
      Subject: "Laporan Perkembangan Anak",
    },
  });

  const fileName = `report-${childId}-${Date.now()}.pdf`;
  const isVercel = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
  const filePath = isVercel
    ? path.join("/tmp", "uploads", "reports", fileName)
    : path.join(__dirname, "..", "..", "uploads", "reports", fileName);

  const reportsDir = path.dirname(filePath);
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 0;
  let pageNum = 1;

  // ========== HELPER FUNCTIONS ==========

  function checkPageBreak(requiredSpace = 80) {
    if (yPos + requiredSpace > pageHeight - 80) {
      addFooter();
      doc.addPage();
      pageNum++;
      yPos = margin;
      drawHeaderBar();
    }
  }

  function drawHeaderBar() {
    doc.rect(0, 0, pageWidth, 12).fill(COLORS.primary);
    doc.rect(0, 12, pageWidth, 3).fill(COLORS.accent);
    yPos = margin;
  }

  function addFooter() {
    const footerY = pageHeight - 40;
    doc.rect(0, footerY, pageWidth, 1).fill(COLORS.border);
    doc.fontSize(8).fillColor(COLORS.light);
    doc.text("Pondok Terapi Bicara", margin, footerY + 8, { width: contentWidth / 2, align: "left" });
    doc.text(`Halaman ${pageNum}`, margin + contentWidth / 2, footerY + 8, { width: contentWidth / 2, align: "right" });
    doc.fillColor(COLORS.dark);
  }

  function drawSectionTitle(title, icon) {
    checkPageBreak(50);
    yPos += 10;
    // Blue bar
    doc.rect(margin, yPos, 4, 20).fill(COLORS.primary);
    doc.fontSize(14).fillColor(COLORS.primary).font("Helvetica-Bold");
    doc.text(title, margin + 12, yPos + 3, { width: contentWidth - 12 });
    yPos += 28;
    // Thin line
    doc.moveTo(margin, yPos).lineTo(margin + contentWidth, yPos).strokeColor(COLORS.border).lineWidth(0.5).stroke();
    yPos += 12;
  }

  function drawInfoRow(label, value, opts = {}) {
    const labelWidth = opts.labelWidth || 160;
    const valWidth = contentWidth - labelWidth;

    doc.fontSize(10).fillColor(COLORS.medium).font("Helvetica");
    doc.text(label, margin, yPos, { width: labelWidth, align: "left" });
    doc.fontSize(10).fillColor(COLORS.dark).font("Helvetica-Bold");
    doc.text(value || "-", margin + labelWidth, yPos, { width: valWidth, align: "left" });
    yPos += 18;
  }

  function parseParentExercises(rawExercises) {
    if (!rawExercises) return [];
    if (Array.isArray(rawExercises)) {
      return rawExercises.map((item) => String(item).trim()).filter(Boolean);
    }

    if (typeof rawExercises === "string") {
      const normalized = rawExercises.trim();
      if (!normalized) return [];

      try {
        const parsed = JSON.parse(normalized);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item).trim()).filter(Boolean);
        }
        if (typeof parsed === "string" && parsed.trim()) {
          return [parsed.trim()];
        }
      } catch (_err) {
        // Fall through to plain-text parsing.
      }

      return normalized
        .split(/\r?\n|;\s*|•\s*/g)
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  }

  function drawWrappedBlock(label, value, opts = {}) {
    const fontSize = opts.fontSize || 9;
    const labelColor = opts.labelColor || COLORS.medium;
    const textColor = opts.textColor || COLORS.dark;
    const prefix = opts.prefix || "";
    const width = contentWidth - 8;
    const text = value || "-";

    checkPageBreak(40);
    doc.fontSize(fontSize).fillColor(labelColor).font("Helvetica-Bold");
    doc.text(label, margin + 4, yPos, { width });
    yPos += fontSize + 3;

    const body = prefix ? `${prefix}${text}` : text;
    const bodyHeight = doc.heightOfString(body, { width });
    checkPageBreak(bodyHeight + 18);
    doc.fontSize(fontSize).fillColor(textColor).font("Helvetica");
    doc.text(body, margin + 4, yPos, { width });
    yPos += bodyHeight + 10;
    doc.fillColor(COLORS.dark);
  }

  function drawExerciseList(exercises) {
    const items = parseParentExercises(exercises);
    if (items.length === 0) {
      doc.fontSize(9).fillColor(COLORS.light).font("Helvetica-Oblique");
      doc.text("Belum ada latihan di rumah", margin + 4, yPos, { width: contentWidth - 8 });
      yPos += 18;
      doc.fillColor(COLORS.dark);
      return;
    }

    items.forEach((exercise, index) => {
      const line = `${index + 1}. ${exercise}`;
      const height = doc.heightOfString(line, { width: contentWidth - 20 });
      checkPageBreak(height + 14);
      doc.fontSize(9).fillColor(COLORS.dark).font("Helvetica");
      doc.text(line, margin + 14, yPos, { width: contentWidth - 20 });
      yPos += height + 6;
    });
  }

  function drawTableHeader(headers) {
    checkPageBreak(30);
    const colWidth = contentWidth / headers.length;
    doc.rect(margin, yPos, contentWidth, 24).fill(COLORS.primary);
    doc.fontSize(9).fillColor(COLORS.white).font("Helvetica-Bold");
    headers.forEach((h, i) => {
      doc.text(h, margin + i * colWidth + 6, yPos + 7, { width: colWidth - 12, align: "left" });
    });
    yPos += 26;
    doc.fillColor(COLORS.dark);
  }

  function drawTableRow(cells, rowIndex) {
    checkPageBreak(24);
    const colWidth = contentWidth / cells.length;
    const bgColor = rowIndex % 2 === 0 ? COLORS.bgLight : COLORS.white;
    doc.rect(margin, yPos, contentWidth, 22).fill(bgColor);
    doc.fontSize(8.5).fillColor(COLORS.dark).font("Helvetica");
    cells.forEach((c, i) => {
      doc.text(String(c || "-"), margin + i * colWidth + 6, yPos + 6, { width: colWidth - 12, align: "left" });
    });
    yPos += 24;
    doc.fillColor(COLORS.dark);
  }

  function drawRiskBadge(level) {
    const colors = {
      RINGAN: COLORS.success,
      SEDANG: COLORS.warning,
      BERAT: COLORS.danger,
    };
    return colors[level?.toUpperCase()] || COLORS.light;
  }

  function drawKeyValueBox(key, value) {
    const boxWidth = (contentWidth - 10) / 2;
    const x = margin;
    doc.rect(x, yPos, boxWidth, 32).fill(COLORS.bgBlue);
    doc.fontSize(8).fillColor(COLORS.medium).font("Helvetica");
    doc.text(key, x + 8, yPos + 4, { width: boxWidth - 16 });
    doc.fontSize(11).fillColor(COLORS.primary).font("Helvetica-Bold");
    doc.text(value, x + 8, yPos + 17, { width: boxWidth - 16 });
    doc.fillColor(COLORS.dark);
  }

  // ========== START DRAWING ==========

  // Top color bar
  drawHeaderBar();

  // ---- HEADER / COVER ----
  doc.rect(margin, yPos, contentWidth, 90).fill(COLORS.bgBlue);
  // Logo area (circle)
  doc.circle(margin + 40, yPos + 45, 28).fill(COLORS.primary);
  doc.fontSize(20).fillColor(COLORS.white).font("Helvetica-Bold");
  doc.text("PTB", margin + 22, yPos + 33, { width: 36, align: "center" });

  doc.fillColor(COLORS.primary).font("Helvetica-Bold").fontSize(20);
  doc.text("Pondok Terapi Bicara", margin + 80, yPos + 18, { width: contentWidth - 90 });
  doc.fontSize(11).fillColor(COLORS.medium).font("Helvetica");
  doc.text("Laporan Perkembangan Anak", margin + 80, yPos + 44, { width: contentWidth - 90 });
  doc.fontSize(9).fillColor(COLORS.light);
  doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`, margin + 80, yPos + 62, { width: contentWidth - 90 });
  doc.fillColor(COLORS.dark);
  yPos += 100;

  // ---- PATIENT INFO SECTION ----
  drawSectionTitle("INFORMASI ANAK");

  // Summary boxes row
  const age = calculateAge(child.dateOfBirth);
  const totalSesi = child.therapySessions.length;
  const totalGame = child.gameLogs.length;
  const latestDiag = child.diagnoses[0];

  const boxW = (contentWidth - 20) / 3;
  drawKeyValueBox("Usia", age);
  // Move x for next box
  const savedY = yPos;
  yPos = savedY;
  doc.rect(margin + boxW + 10, savedY, boxW, 32).fill(COLORS.bgBlue);
  doc.fontSize(8).fillColor(COLORS.medium).font("Helvetica");
  doc.text("Total Sesi Terapi", margin + boxW + 18, savedY + 4, { width: boxW - 16 });
  doc.fontSize(11).fillColor(COLORS.primary).font("Helvetica-Bold");
  doc.text(`${totalSesi} sesi`, margin + boxW + 18, savedY + 17, { width: boxW - 16 });

  doc.rect(margin + (boxW + 10) * 2, savedY, boxW, 32).fill(COLORS.bgBlue);
  doc.fontSize(8).fillColor(COLORS.medium).font("Helvetica");
  doc.text("Total Game Dimainkan", margin + (boxW + 10) * 2 + 8, savedY + 4, { width: boxW - 16 });
  doc.fontSize(11).fillColor(COLORS.primary).font("Helvetica-Bold");
  doc.text(`${totalGame} game`, margin + (boxW + 10) * 2 + 8, savedY + 17, { width: boxW - 16 });
  doc.fillColor(COLORS.dark);

  yPos = savedY + 42;

  // Detail info
  drawInfoRow("Nama Anak", child.name);
  drawInfoRow("Tanggal Lahir", new Date(child.dateOfBirth).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" }));
  drawInfoRow("Jenis Kelamin", child.gender === "MALE" ? "Laki-laki" : "Perempuan");
  drawInfoRow("Orang Tua", child.parent?.name || "-");
  if (child.parent?.email) drawInfoRow("Email Orang Tua", child.parent.email);

  // ---- DIAGNOSIS SECTION ----
  drawSectionTitle("RIWAYAT DIAGNOSIS");

  if (child.diagnoses.length > 0) {
    drawTableHeader(["No", "Tanggal", "Level Risiko", "Skor", "Rekomendasi"]);
    child.diagnoses.forEach((d, i) => {
      const cells = [
        `${i + 1}`,
        new Date(d.createdAt).toLocaleDateString("id-ID"),
        d.riskLevel || "-",
        String(d.score || "-"),
        (d.recommendation || "-").substring(0, 40),
      ];
      drawTableRow(cells, i);
    });
  } else {
    doc.fontSize(10).fillColor(COLORS.light).font("Helvetica-Oblique");
    doc.text("Belum ada riwayat diagnosis", margin, yPos);
    yPos += 24;
    doc.fillColor(COLORS.dark);
  }

  // ---- THERAPY SESSIONS SECTION ----
  drawSectionTitle("RIWAYAT SESI TERAPI");

  if (child.therapySessions.length > 0) {
    drawTableHeader(["No", "Tanggal", "Tipe Terapi", "Terapis", "Status Bayar", "Aktif"]);
    child.therapySessions.forEach((s, i) => {
      const cells = [
        `${i + 1}`,
        new Date(s.schedule).toLocaleDateString("id-ID"),
        s.therapyType || "-",
        s.therapist?.name || "-",
        s.paymentStatus || "-",
        s.isActive ? "Ya" : "Tidak",
      ];
      drawTableRow(cells, i);
    });
  } else {
    doc.fontSize(10).fillColor(COLORS.light).font("Helvetica-Oblique");
    doc.text("Belum ada riwayat sesi terapi", margin, yPos);
    yPos += 24;
    doc.fillColor(COLORS.dark);
  }

  // ---- LAPORAN TERAPI & LATIHAN DI RUMAH ----
  drawSectionTitle("LAPORAN TERAPI & LATIHAN DI RUMAH");

  if (child.progressNotes.length > 0) {
    child.progressNotes.forEach((note, i) => {
      const header = `${i + 1}. ${note.title || "Laporan Perkembangan"}  —  ${new Date(note.date).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}`;

      const headerHeight = doc.heightOfString(header, { width: contentWidth - 8 });
      checkPageBreak(headerHeight + 22);

      doc.rect(margin, yPos, contentWidth, 1).fill(COLORS.border);
      yPos += 6;

      doc.fontSize(10).fillColor(COLORS.dark).font("Helvetica-Bold");
      doc.text(header, margin + 4, yPos, { width: contentWidth - 8 });
      yPos += headerHeight + 8;

      if (note.status) {
        drawInfoRow("Status", note.status, { labelWidth: 120 });
      }

      if (note.sessionDate) {
        drawInfoRow(
          "Tanggal Sesi",
          new Date(note.sessionDate).toLocaleDateString("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          { labelWidth: 120 },
        );
      }

      if (note.content) {
        drawWrappedBlock("Ringkasan Progress", note.content);
      }

      if (note.barriers) {
        drawWrappedBlock("Hambatan", note.barriers);
      }

      const exercises = parseParentExercises(note.parentExercises);
      if (exercises.length > 0) {
        checkPageBreak(40);
        doc.fontSize(9).fillColor(COLORS.medium).font("Helvetica-Bold");
        doc.text("Latihan di Rumah", margin + 4, yPos, { width: contentWidth - 8 });
        yPos += 14;
        drawExerciseList(exercises);
      } else {
        checkPageBreak(24);
        doc.fontSize(9).fillColor(COLORS.light).font("Helvetica-Oblique");
        doc.text("Latihan di rumah belum diisi pada laporan ini.", margin + 4, yPos, {
          width: contentWidth - 8,
        });
        yPos += 16;
      }

      const scoreParts = [];
      if (note.speechClarity !== null && note.speechClarity !== undefined) {
        scoreParts.push(`Kejelasan Bicara: ${note.speechClarity}`);
      }
      if (note.vocabulary !== null && note.vocabulary !== undefined) {
        scoreParts.push(`Kosakata: ${note.vocabulary}`);
      }
      if (note.socialInteraction !== null && note.socialInteraction !== undefined) {
        scoreParts.push(`Interaksi Sosial: ${note.socialInteraction}`);
      }
      if (scoreParts.length > 0) {
        drawWrappedBlock("Skor Evaluasi", scoreParts.join(" | "));
      }

      yPos += 4;
    });
  } else {
    doc.fontSize(10).fillColor(COLORS.light).font("Helvetica-Oblique");
    doc.text("Belum ada laporan terapi", margin, yPos);
    yPos += 24;
    doc.fillColor(COLORS.dark);
  }

  // ---- GAME PROGRESS SECTION ----
  drawSectionTitle("PROGRESS GAME LATIHAN (20 Terakhir)");

  if (child.gameLogs.length > 0) {
    drawTableHeader(["No", "Tanggal", "Tipe Game", "Skor", "Durasi"]);
    child.gameLogs.forEach((g, i) => {
      const cells = [
        `${i + 1}`,
        new Date(g.playedAt).toLocaleDateString("id-ID"),
        g.gameType || "-",
        String(g.gameScore || 0),
        formatDuration(g.duration || 0),
      ];
      drawTableRow(cells, i);
    });

    // Summary stats
    checkPageBreak(60);
    yPos += 6;
    const totalScore = child.gameLogs.reduce((sum, g) => sum + (g.gameScore || 0), 0);
    const avgScore = (totalScore / child.gameLogs.length).toFixed(1);
    const maxScore = Math.max(...child.gameLogs.map((g) => g.gameScore || 0));
    const totalDuration = child.gameLogs.reduce((sum, g) => sum + (g.duration || 0), 0);

    doc.rect(margin, yPos, contentWidth, 36).fill(COLORS.bgBlue);
    const statW = contentWidth / 4;
    const stats = [
      { label: "Total Game", value: `${child.gameLogs.length}` },
      { label: "Rata-rata Skor", value: avgScore },
      { label: "Skor Tertinggi", value: String(maxScore) },
      { label: "Total Durasi", value: formatDuration(totalDuration) },
    ];
    stats.forEach((s, i) => {
      doc.fontSize(8).fillColor(COLORS.medium).font("Helvetica");
      doc.text(s.label, margin + i * statW + 6, yPos + 4, { width: statW - 12, align: "center" });
      doc.fontSize(12).fillColor(COLORS.primary).font("Helvetica-Bold");
      doc.text(s.value, margin + i * statW + 6, yPos + 18, { width: statW - 12, align: "center" });
    });
    yPos += 44;
    doc.fillColor(COLORS.dark);
  } else {
    doc.fontSize(10).fillColor(COLORS.light).font("Helvetica-Oblique");
    doc.text("Belum ada progress game", margin, yPos);
    yPos += 24;
    doc.fillColor(COLORS.dark);
  }

  // ---- PROGRESS UPLOADS SECTION ----
  drawSectionTitle("CATATAN PERKEMBANGAN (10 Terakhir)");

  if (child.progressUploads.length > 0) {
    child.progressUploads.forEach((u, i) => {
      checkPageBreak(50);
      doc.rect(margin, yPos, contentWidth, 1).fill(COLORS.border);
      yPos += 6;
      doc.fontSize(10).fillColor(COLORS.dark).font("Helvetica-Bold");
      doc.text(`Catatan #${i + 1}  —  ${new Date(u.createdAt).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}`, margin + 4, yPos);
      yPos += 16;

      if (u.parentNotes) {
        doc.fontSize(9).fillColor(COLORS.medium).font("Helvetica");
        doc.text(`Catatan Orang Tua: ${u.parentNotes}`, margin + 4, yPos, { width: contentWidth - 8 });
        yPos += 14;
      }
      if (u.therapistEvaluation) {
        doc.fontSize(9).fillColor(COLORS.accent).font("Helvetica-Oblique");
        doc.text(`Evaluasi Terapis: ${u.therapistEvaluation}`, margin + 4, yPos, { width: contentWidth - 8 });
        yPos += 14;
      }
      yPos += 6;
      doc.fillColor(COLORS.dark);
    });
  } else {
    doc.fontSize(10).fillColor(COLORS.light).font("Helvetica-Oblique");
    doc.text("Belum ada catatan perkembangan", margin, yPos);
    yPos += 24;
    doc.fillColor(COLORS.dark);
  }

  // ---- FINAL FOOTER ----
  checkPageBreak(80);
  yPos += 16;
  doc.rect(margin, yPos, contentWidth, 1).fill(COLORS.border);
  yPos += 14;

  doc.fontSize(9).fillColor(COLORS.light).font("Helvetica-Oblique");
  doc.text("Laporan ini digenerate secara otomatis oleh sistem Pondok Terapi Bicara.", margin, yPos, { width: contentWidth, align: "center" });
  yPos += 14;
  doc.text("Untuk informasi lebih lanjut, silakan hubungi terapis yang menangani anak Anda.", margin, yPos, { width: contentWidth, align: "center" });
  doc.fillColor(COLORS.dark);

  addFooter();
  doc.end();

  return new Promise((resolve, reject) => {
    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
};

function calculateAge(dateOfBirth) {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  const years = today.getFullYear() - birth.getFullYear();
  const months = today.getMonth() - birth.getMonth();
  if (years === 0) return `${Math.abs(months)} bulan`;
  if (months < 0) return `${years - 1} tahun ${12 + months} bulan`;
  return `${years} tahun ${months} bulan`;
}

function formatDuration(seconds) {
  if (!seconds || seconds === 0) return "0 menit";
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes === 0) return `${secs} detik`;
  if (secs === 0) return `${minutes} menit`;
  return `${minutes} menit ${secs} detik`;
}

/**
 * Generate PDF for a single progress report (based on ID)
 */
const generateSingleProgressReport = async (reportId) => {
  const report = await prisma.progressNote.findUnique({
    where: { id: reportId },
    include: {
      child: true,
      therapist: true,
    },
  });

  if (!report) throw new Error("Report not found");

  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
    info: {
      Title: `Laporan Perkembangan - ${report.child.name}`,
      Author: "Pondok Terapi Bicara",
      Subject: "Laporan Perkembangan Anak",
    },
  });

  const fileName = `laporan-${reportId}-${Date.now()}.pdf`;
  const isVercel = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
  const filePath = isVercel
    ? path.join("/tmp", "uploads", "reports", fileName)
    : path.join(__dirname, "..", "..", "uploads", "reports", fileName);

  const reportsDir = path.dirname(filePath);
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const contentWidth = pageWidth - 100;
  let yPos = 50;

  // Header Bar
  doc.rect(0, 0, pageWidth, 12).fill(COLORS.primary);
  doc.rect(0, 12, pageWidth, 3).fill(COLORS.accent);
  
  yPos = 50;

  // Title
  doc.fontSize(20).font("Helvetica-Bold").fillColor(COLORS.primary).text("LAPORAN PERKEMBANGAN ANAK", 50, yPos, { align: "center" });
  yPos += 30;

  // Info Box
  doc.rect(50, yPos, contentWidth, 90).fill(COLORS.bgBlue);
  
  doc.fontSize(11).font("Helvetica").fillColor(COLORS.dark);
  const age = calculateAge(report.child.dateOfBirth);
  const dateObj = new Date(report.date);
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const dateStr = `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
  
  const boxPadding = 15;
  const rowHeight = 18;
  
  doc.text("Nama Anak", 50 + boxPadding, yPos + boxPadding);
  doc.text(`:  ${report.child.name}`, 150 + boxPadding, yPos + boxPadding);
  
  doc.text("Usia", 50 + boxPadding, yPos + boxPadding + rowHeight);
  doc.text(`:  ${age}`, 150 + boxPadding, yPos + boxPadding + rowHeight);
  
  doc.text("Tanggal", 50 + boxPadding, yPos + boxPadding + rowHeight * 2);
  doc.text(`:  ${dateStr}`, 150 + boxPadding, yPos + boxPadding + rowHeight * 2);
  
  doc.text("Terapis", 50 + boxPadding, yPos + boxPadding + rowHeight * 3);
  doc.text(`:  ${report.therapist.name}`, 150 + boxPadding, yPos + boxPadding + rowHeight * 3);

  yPos += 110;

  // Helper for Section Title
  const drawSectionTitle = (title) => {
    doc.rect(50, yPos, 4, 18).fill(COLORS.primary);
    doc.fontSize(14).font("Helvetica-Bold").fillColor(COLORS.primary);
    doc.text(title, 62, yPos + 2, { width: contentWidth - 12 });
    yPos += 24;
    doc.moveTo(50, yPos).lineTo(50 + contentWidth, yPos).strokeColor(COLORS.border).lineWidth(1).stroke();
    yPos += 12;
  };

  // HASIL PERKEMBANGAN
  drawSectionTitle("HASIL PERKEMBANGAN");
  
  doc.fontSize(11).font("Helvetica").fillColor(COLORS.dark);
  if (report.content) {
    const contentLines = report.content.split('\\n').filter(l => l.trim().length > 0);
    contentLines.forEach(line => {
      doc.fillColor(COLORS.success).text("✓ ", 50, yPos, { continued: true });
      doc.fillColor(COLORS.dark).text(`${line.trim().replace(/^[-•]\\s*/, '')}`, 65, yPos, { width: contentWidth - 15 });
      yPos += doc.heightOfString(line, { width: contentWidth - 15 }) + 8;
    });
  }

  if (report.barriers) {
    const barrierLines = report.barriers.split('\\n').filter(l => l.trim().length > 0);
    barrierLines.forEach(line => {
      doc.fillColor(COLORS.warning).text("⚠ ", 50, yPos, { continued: true });
      doc.fillColor(COLORS.dark).text(`${line.trim().replace(/^[-•]\\s*/, '')}`, 65, yPos, { width: contentWidth - 15 });
      yPos += doc.heightOfString(line, { width: contentWidth - 15 }) + 8;
    });
  }
  yPos += 10;

  // KESIMPULAN
  drawSectionTitle("KESIMPULAN");
  doc.fontSize(11).font("Helvetica").fillColor(COLORS.dark);
  
  const kesimpulan = "Perkembangan kemampuan bicara anak mengalami peningkatan dibandingkan evaluasi sebelumnya.";
  doc.text(kesimpulan, 50, yPos, { width: contentWidth });
  yPos += doc.heightOfString(kesimpulan, { width: contentWidth }) + 20;

  // SARAN UNTUK ORANG TUA
  drawSectionTitle("SARAN UNTUK ORANG TUA");
  doc.fontSize(11).font("Helvetica").fillColor(COLORS.dark);
  
  if (report.parentExercises) {
    let exercises = [];
    try {
      exercises = JSON.parse(report.parentExercises);
      if (!Array.isArray(exercises)) {
        exercises = report.parentExercises.split('\\n');
      }
    } catch(e) {
      exercises = report.parentExercises.split('\\n');
    }
    exercises.forEach(ex => {
      if (ex && ex.trim()) {
        doc.fillColor(COLORS.primary).text("• ", 50, yPos, { continued: true });
        doc.fillColor(COLORS.dark).text(`${ex.trim().replace(/^[-•]\\s*/, '')}`, 65, yPos, { width: contentWidth - 15 });
        yPos += doc.heightOfString(ex, { width: contentWidth - 15 }) + 8;
      }
    });
  } else {
    doc.fillColor(COLORS.primary).text("• ", 50, yPos, { continued: true });
    doc.fillColor(COLORS.dark).text("Lanjutkan stimulasi di rumah sesuai anjuran terapis.", 65, yPos, { width: contentWidth - 15 });
  }

  // Footer
  const footerY = pageHeight - 40;
  doc.rect(0, footerY, pageWidth, 1).fill(COLORS.border);
  doc.fontSize(8).fillColor(COLORS.light);
  doc.text("Pondok Terapi Bicara", 50, footerY + 8, { width: contentWidth / 2, align: "left" });
  doc.text("Laporan Perkembangan", 50 + contentWidth / 2, footerY + 8, { width: contentWidth / 2, align: "right" });

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
};

module.exports = { generatePatientReport, generateSingleProgressReport };
