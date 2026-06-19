const PDFDocument = require("pdfkit");
const prisma = require("../utils/prisma");
const path = require("path");
const fs = require("fs");

// ──────────────────────────────────────────────
//  SHARED CONSTANTS
// ──────────────────────────────────────────────
const C = {
  primary: "#1E40AF",
  accent: "#10B981",
  dark: "#1F2937",
  medium: "#4B5563",
  light: "#9CA3AF",
  bgLight: "#F3F4F6",
  bgBlue: "#EFF6FF",
  white: "#FFFFFF",
  border: "#D1D5DB",
};

const A4W = 595.28;
const A4H = 841.89;
const M = 50;                    // margin
const CW = A4W - M * 2;         // content width ≈ 495
const HEADER_H = 15;             // top bar height
const FOOTER_Y = A4H - 35;      // footer line y
const SAFE_Y = A4H - 55;        // max y before we must start a new page

// ──────────────────────────────────────────────
//  SHARED HELPERS
// ──────────────────────────────────────────────
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
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s} detik`;
  if (s === 0) return `${m} menit`;
  return `${m} menit ${s} detik`;
}

function formatIdDate(dateInput) {
  const d = new Date(dateInput);
  const months = [
    "Januari","Februari","Maret","April","Mei","Juni",
    "Juli","Agustus","September","Oktober","November","Desember",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function parseParentExercises(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((i) => String(i).trim()).filter(Boolean);
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return [];
    try {
      const p = JSON.parse(s);
      if (Array.isArray(p)) return p.map((i) => String(i).trim()).filter(Boolean);
      if (typeof p === "string" && p.trim()) return [p.trim()];
    } catch (_) {}
    return s.split(/\r?\n|;\s*|•\s*/g).map((i) => i.trim()).filter(Boolean);
  }
  return [];
}

function cleanLine(line) {
  return line.trim().replace(/^[\-\u2022*"\u201C\u201D\u2018\u2019]+\s*/, "");
}

// ──────────────────────────────────────────────
//  PAGE MANAGER – single object that owns doc,
//  yPos, pageNum, header/footer drawing, and
//  the "ensure space" logic.
// ──────────────────────────────────────────────
class PageManager {
  constructor(doc, pageNum = 1) {
    this.doc = doc;
    this.pageNum = pageNum;
    this.y = M;
  }

  /** Draw header bar at absolute top of current page */
  drawHeader() {
    const d = this.doc;
    d.rect(0, 0, A4W, 10).fill(C.primary);
    d.rect(0, 10, A4W, 3).fill(C.accent);
  }

  /** Draw footer at absolute bottom of current page */
  drawFooter() {
    const d = this.doc;
    d.rect(0, FOOTER_Y, A4W, 0.5).fill(C.border);
    d.fontSize(7.5).fillColor(C.light).font("Helvetica");
    d.text("Pondok Terapi Bicara", M, FOOTER_Y + 6, { width: CW / 2, align: "left" });
    d.text(`Halaman ${this.pageNum}`, M + CW / 2, FOOTER_Y + 6, { width: CW / 2, align: "right" });
    d.fillColor(C.dark);
  }

  /** Add a new page, draw header, reset y */
  newPage() {
    this.drawFooter();
    this.doc.addPage();
    this.pageNum++;
    this.drawHeader();
    this.y = M;
  }

  /** If not enough space, start a new page. minSpace in pt. */
  need(minSpace) {
    if (this.y + minSpace > SAFE_Y) {
      this.newPage();
    }
  }

  /** Section title: blue bar + title + divider */
  section(title) {
    this.need(50);
    this.y += 6;
    this.doc.rect(M, this.y, 4, 16).fill(C.primary);
    this.doc.fontSize(12).font("Helvetica-Bold").fillColor(C.primary);
    this.doc.text(title, M + 12, this.y + 2, { width: CW - 12 });
    this.y += 22;
    this.doc.moveTo(M, this.y).lineTo(M + CW, this.y).strokeColor(C.border).lineWidth(0.5).stroke();
    this.y += 8;
    this.doc.fillColor(C.dark);
  }

  /** Simple label: value row */
  infoRow(label, value) {
    this.doc.fontSize(9.5).font("Helvetica").fillColor(C.medium);
    this.doc.text(label, M, this.y, { width: 140 });
    this.doc.fontSize(9.5).font("Helvetica-Bold").fillColor(C.dark);
    this.doc.text(value || "-", M + 140, this.y, { width: CW - 140 });
    this.y += 16;
  }

  /** Draw text block, auto-advancing y. Returns nothing. */
  text(str, opts = {}) {
    const x = opts.x || M;
    const w = opts.w || CW;
    const size = opts.size || 9.5;
    const font = opts.font || "Helvetica";
    const color = opts.color || C.dark;
    this.doc.fontSize(size).font(font).fillColor(color);
    this.doc.text(str, x, this.y, { width: w });
    this.y += this.doc.heightOfString(str, { width: w }) + (opts.gap || 4);
    this.doc.fillColor(C.dark);
  }

  /** Finish: draw footer on last page and end document */
  end() {
    this.drawFooter();
    this.doc.end();
  }
}

// ──────────────────────────────────────────────
//  FILE PATH HELPER
// ──────────────────────────────────────────────
function getFilePath(prefix, id) {
  const fileName = `${prefix}-${id}-${Date.now()}.pdf`;
  const isVercel = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
  const filePath = isVercel
    ? path.join("/tmp", "uploads", "reports", fileName)
    : path.join(__dirname, "..", "..", "uploads", "reports", fileName);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return { filePath, fileName };
}

function streamToPromise(stream) {
  return new Promise((resolve, reject) => {
    stream.on("finish", () => resolve());
    stream.on("error", reject);
  });
}

// ══════════════════════════════════════════════
//  1.  generateSingleProgressReport
//      (called by both parent & therapist)
// ══════════════════════════════════════════════
const generateSingleProgressReport = async (reportId) => {
  const report = await prisma.progressNote.findUnique({
    where: { id: reportId },
    include: { child: true, therapist: true },
  });
  if (!report) throw new Error("Report not found");

  const { filePath } = getFilePath("laporan", reportId);
  const doc = new PDFDocument({
    size: "A4",
    margin: 0,
    info: {
      Title: `Laporan Perkembangan - ${report.child.name}`,
      Author: "Pondok Terapi Bicara",
      Subject: "Laporan Perkembangan Anak",
    },
  });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  const pm = new PageManager(doc);
  pm.drawHeader();

  // ── TITLE ──
  pm.y += 4;
  doc.fontSize(16).font("Helvetica-Bold").fillColor(C.primary);
  doc.text("LAPORAN PERKEMBANGAN ANAK", M, pm.y, { width: CW, align: "center" });
  pm.y += 26;

  // ── INFO BOX ──
  const age = calculateAge(report.child.dateOfBirth);
  const sessionDate = formatIdDate(report.date);

  doc.rect(M, pm.y, CW, 80).fill(C.bgBlue);
  doc.fillColor(C.dark);

  const bx = M + 14;
  const bw = CW - 28;
  let by = pm.y + 12;

  const infoLine = (label, value) => {
    doc.fontSize(9).font("Helvetica").fillColor(C.medium).text(label, bx, by, { width: 100 });
    doc.fontSize(9).font("Helvetica-Bold").fillColor(C.dark).text(`:  ${value}`, bx + 100, by, { width: bw - 100 });
    by += 16;
  };

  infoLine("Nama Anak", report.child.name);
  infoLine("Usia", age);
  infoLine("Tanggal Sesi", sessionDate);
  infoLine("Terapis", report.therapist?.name || "-");

  pm.y += 90;

  // ── HASIL PERKEMBANGAN ──
  pm.section("HASIL PERKEMBANGAN");

  if (report.content) {
    const lines = report.content.split(/\\n|\n/).filter((l) => l.trim().length > 0);
    lines.forEach((line) => {
      const t = cleanLine(line);
      if (!t) return;
      pm.text(t, { x: M + 6, w: CW - 6, size: 9.5, gap: 5 });
    });
  } else {
    pm.text("Belum ada hasil perkembangan.", { font: "Helvetica-Oblique", color: C.light });
  }
  pm.y += 4;

  // ── HAMBATAN ──
  if (report.barriers && report.barriers.trim()) {
    pm.section("HAMBATAN");
    const bLines = report.barriers.split(/\\n|\n/).filter((l) => l.trim().length > 0);
    bLines.forEach((line) => {
      const t = cleanLine(line);
      if (!t) return;
      pm.text(t, { x: M + 6, w: CW - 6, size: 9.5, gap: 5 });
    });
    pm.y += 4;
  }

  // ── LATIHAN DI RUMAH ──
  pm.section("LATIHAN DI RUMAH");
  const exercises = parseParentExercises(report.parentExercises);
  if (exercises.length > 0) {
    exercises.forEach((ex, idx) => {
      pm.text(`${idx + 1}. ${ex}`, { x: M + 6, w: CW - 6, size: 9.5, gap: 5 });
    });
  } else {
    pm.text("Belum ada saran latihan untuk orang tua.", { font: "Helvetica-Oblique", color: C.light });
  }

  // ── CLOSING ──
  pm.y += 12;
  pm.text(
    "Laporan ini dihasilkan secara otomatis oleh sistem Pondok Terapi Bicara. Untuk informasi lebih lanjut, silakan hubungi terapis yang menangani anak Anda.",
    { size: 7.5, color: C.light, font: "Helvetica-Oblique", w: CW, gap: 0 }
  );

  pm.end();
  await streamToPromise(stream);
  return filePath;
};

// ══════════════════════════════════════════════
//  2.  generatePatientReport
//      (comprehensive report – available but
//       currently not called by any route)
// ══════════════════════════════════════════════
const generatePatientReport = async (childId) => {
  const child = await prisma.child.findUnique({
    where: { id: childId },
    include: {
      parent: { select: { name: true, email: true } },
      diagnoses: { orderBy: { createdAt: "desc" } },
      progressNotes: { orderBy: { date: "desc" }, take: 10 },
      therapySessions: {
        include: { therapist: { select: { name: true } } },
        orderBy: { schedule: "desc" },
      },
      gameLogs: { orderBy: { playedAt: "desc" }, take: 20 },
      progressUploads: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!child) throw new Error("Child not found");

  const { filePath } = getFilePath("report", childId);
  const doc = new PDFDocument({
    size: "A4",
    margin: 0,
    info: {
      Title: `Laporan Perkembangan - ${child.name}`,
      Author: "Pondok Terapi Bicara",
      Subject: "Laporan Perkembangan Anak",
    },
  });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  const pm = new PageManager(doc);
  pm.drawHeader();

  // ── COVER ──
  pm.y += 4;
  doc.rect(M, pm.y, CW, 80).fill(C.bgBlue);
  doc.circle(M + 36, pm.y + 40, 24).fill(C.primary);
  doc.fontSize(16).fillColor(C.white).font("Helvetica-Bold");
  doc.text("PTB", M + 20, pm.y + 30, { width: 32, align: "center" });
  doc.fillColor(C.primary).font("Helvetica-Bold").fontSize(18);
  doc.text("Pondok Terapi Bicara", M + 70, pm.y + 16, { width: CW - 80 });
  doc.fontSize(11).fillColor(C.medium).font("Helvetica");
  doc.text("Laporan Perkembangan Anak", M + 70, pm.y + 38, { width: CW - 80 });
  doc.fontSize(8.5).fillColor(C.light);
  doc.text(
    `Tanggal Cetak: ${new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`,
    M + 70, pm.y + 56, { width: CW - 80 }
  );
  doc.fillColor(C.dark);
  pm.y += 92;

  // ── INFORMASI ANAK ──
  pm.section("INFORMASI ANAK");

  // Stat boxes
  const age = calculateAge(child.dateOfBirth);
  const totalSesi = child.therapySessions.length;
  const totalGame = child.gameLogs.length;
  const boxW = (CW - 20) / 3;

  const statBox = (x, label, value) => {
    doc.rect(x, pm.y, boxW, 30).fill(C.bgBlue);
    doc.fontSize(7.5).fillColor(C.medium).font("Helvetica");
    doc.text(label, x + 8, pm.y + 4, { width: boxW - 16 });
    doc.fontSize(11).fillColor(C.primary).font("Helvetica-Bold");
    doc.text(value, x + 8, pm.y + 16, { width: boxW - 16 });
    doc.fillColor(C.dark);
  };

  statBox(M, "Usia", age);
  statBox(M + boxW + 10, "Total Sesi Terapi", `${totalSesi} sesi`);
  statBox(M + (boxW + 10) * 2, "Total Game", `${totalGame} game`);
  pm.y += 38;

  pm.infoRow("Nama Anak", child.name);
  pm.infoRow("Tanggal Lahir", formatIdDate(child.dateOfBirth));
  pm.infoRow("Jenis Kelamin", child.gender === "MALE" ? "Laki-laki" : "Perempuan");
  pm.infoRow("Orang Tua", child.parent?.name || "-");
  if (child.parent?.email) pm.infoRow("Email Orang Tua", child.parent.email);

  // ── RIWAYAT DIAGNOSIS ──
  if (child.diagnoses.length > 0) {
    pm.section("RIWAYAT DIAGNOSIS");
    drawTable(doc, pm, ["No", "Tanggal", "Level Risiko", "Skor", "Rekomendasi"],
      child.diagnoses.map((d, i) => [
        `${i + 1}`,
        formatIdDate(d.createdAt),
        d.riskLevel || "-",
        String(d.score || "-"),
        (d.recommendation || "-").substring(0, 40),
      ])
    );
  }

  // ── RIWAYAT SESI TERAPI ──
  if (child.therapySessions.length > 0) {
    pm.section("RIWAYAT SESI TERAPI");
    drawTable(doc, pm, ["No", "Tanggal", "Tipe", "Terapis", "Bayar", "Aktif"],
      child.therapySessions.map((s, i) => [
        `${i + 1}`,
        formatIdDate(s.schedule),
        s.therapyType || "-",
        s.therapist?.name || "-",
        s.paymentStatus || "-",
        s.isActive ? "Ya" : "Tidak",
      ])
    );
  }

  // ── LAPORAN TERAPI ──
  if (child.progressNotes.length > 0) {
    pm.section("LAPORAN TERAPI");
    child.progressNotes.forEach((note, i) => {
      pm.need(40);
      const dateStr = formatIdDate(note.date);
      const title = `${i + 1}. ${note.title || "Laporan Perkembangan"} — ${dateStr}`;

      doc.rect(M, pm.y, CW, 0.5).fill(C.border);
      pm.y += 4;
      pm.text(title, { size: 10, font: "Helvetica-Bold", gap: 4 });

      if (note.content) {
        pm.text("Hasil Perkembangan", { size: 8.5, font: "Helvetica-Bold", color: C.primary, x: M + 4, w: CW - 4, gap: 3 });
        note.content.split(/\\n|\n/).filter((l) => l.trim()).forEach((line) => {
          pm.text(cleanLine(line), { x: M + 10, w: CW - 10, size: 9, gap: 3 });
        });
        pm.y += 2;
      }

      if (note.barriers && note.barriers.trim()) {
        pm.text("Hambatan", { size: 8.5, font: "Helvetica-Bold", color: C.primary, x: M + 4, w: CW - 4, gap: 3 });
        note.barriers.split(/\\n|\n/).filter((l) => l.trim()).forEach((line) => {
          pm.text(cleanLine(line), { x: M + 10, w: CW - 10, size: 9, gap: 3 });
        });
        pm.y += 2;
      }

      const exs = parseParentExercises(note.parentExercises);
      if (exs.length > 0) {
        pm.text("Latihan di Rumah", { size: 8.5, font: "Helvetica-Bold", color: C.primary, x: M + 4, w: CW - 4, gap: 3 });
        exs.forEach((ex, idx) => {
          pm.text(`${idx + 1}. ${ex}`, { x: M + 10, w: CW - 10, size: 9, gap: 3 });
        });
      }

      pm.y += 6;
    });
  }

  // ── PROGRESS GAME ──
  if (child.gameLogs.length > 0) {
    pm.section("PROGRESS GAME LATIHAN");
    drawTable(doc, pm, ["No", "Tanggal", "Tipe Game", "Skor", "Durasi"],
      child.gameLogs.map((g, i) => [
        `${i + 1}`,
        formatIdDate(g.playedAt),
        g.gameType || "-",
        String(g.gameScore || 0),
        formatDuration(g.duration || 0),
      ])
    );

    // Summary
    pm.need(40);
    pm.y += 4;
    const tScore = child.gameLogs.reduce((s, g) => s + (g.gameScore || 0), 0);
    const avg = (tScore / child.gameLogs.length).toFixed(1);
    const max = Math.max(...child.gameLogs.map((g) => g.gameScore || 0));
    const tDur = child.gameLogs.reduce((s, g) => s + (g.duration || 0), 0);

    doc.rect(M, pm.y, CW, 30).fill(C.bgBlue);
    const sw = CW / 4;
    [
      { l: "Total Game", v: `${child.gameLogs.length}` },
      { l: "Rata-rata", v: avg },
      { l: "Tertinggi", v: String(max) },
      { l: "Total Durasi", v: formatDuration(tDur) },
    ].forEach((s, i) => {
      doc.fontSize(7.5).fillColor(C.medium).font("Helvetica");
      doc.text(s.l, M + i * sw + 4, pm.y + 4, { width: sw - 8, align: "center" });
      doc.fontSize(11).fillColor(C.primary).font("Helvetica-Bold");
      doc.text(s.v, M + i * sw + 4, pm.y + 16, { width: sw - 8, align: "center" });
    });
    pm.y += 36;
    doc.fillColor(C.dark);
  }

  // ── CATATAN PERKEMBANGAN ──
  if (child.progressUploads.length > 0) {
    pm.section("CATATAN PERKEMBANGAN");
    child.progressUploads.forEach((u, i) => {
      pm.need(30);
      doc.rect(M, pm.y, CW, 0.5).fill(C.border);
      pm.y += 4;
      pm.text(
        `Catatan #${i + 1} — ${formatIdDate(u.createdAt)}`,
        { size: 9.5, font: "Helvetica-Bold", gap: 4 }
      );
      if (u.parentNotes) pm.text(`Catatan Orang Tua: ${u.parentNotes}`, { size: 9, color: C.medium, gap: 3 });
      if (u.therapistEvaluation) pm.text(`Evaluasi Terapis: ${u.therapistEvaluation}`, { size: 9, color: C.accent, font: "Helvetica-Oblique", gap: 3 });
      pm.y += 4;
    });
  }

  // ── CLOSING ──
  pm.y += 10;
  pm.text(
    "Laporan ini dihasilkan secara otomatis oleh sistem Pondok Terapi Bicara. Untuk informasi lebih lanjut, silakan hubungi terapis yang menangani anak Anda.",
    { size: 7.5, color: C.light, font: "Helvetica-Oblique", w: CW, gap: 0 }
  );

  pm.end();
  await streamToPromise(stream);
  return filePath;
};

// ──────────────────────────────────────────────
//  TABLE HELPER (used by generatePatientReport)
// ──────────────────────────────────────────────
function drawTable(doc, pm, headers, rows) {
  const colCount = headers.length;
  const colW = CW / colCount;

  // Header
  doc.rect(M, pm.y, CW, 22).fill(C.primary);
  doc.fontSize(8).fillColor(C.white).font("Helvetica-Bold");
  headers.forEach((h, i) => {
    doc.text(h, M + i * colW + 4, pm.y + 6, { width: colW - 8, align: "left" });
  });
  pm.y += 24;
  doc.fillColor(C.dark);

  // Rows
  rows.forEach((cells, ri) => {
    pm.need(22);
    const bg = ri % 2 === 0 ? C.bgLight : C.white;
    doc.rect(M, pm.y, CW, 20).fill(bg);
    doc.fontSize(8).font("Helvetica").fillColor(C.dark);
    cells.forEach((c, i) => {
      doc.text(String(c || "-"), M + i * colW + 4, pm.y + 5, { width: colW - 8, align: "left" });
    });
    pm.y += 22;
  });
}

// ──────────────────────────────────────────────
//  EXPORTS
// ──────────────────────────────────────────────
module.exports = { generatePatientReport, generateSingleProgressReport };
