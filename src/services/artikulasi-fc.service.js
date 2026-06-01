/**
 * Forward Chaining Service for Artikulasi Progress
 *
 * Evaluates child's articulation practice progress and generates hints/recommendations
 * based on the rules defined in the forward chaining pattern.
 */

const prisma = require("../utils/prisma");

const SOUND_TARGETS = ["R", "S", "L", "N"];

/**
 * Get preparation sound for a target sound
 * Based on speech therapy progression hierarchy
 */
function getPreparationSound(targetSound) {
  const prepMap = {
    R: "T", // Bilabial preparation for alveolar
    S: "T", // Tongue tip preparation
    L: "T", // Tongue tip preparation
    N: "M", // Nasal foundation
  };
  return prepMap[targetSound] || "T";
}

/**
 * Get all sound targets in order of difficulty
 */
function getSoundOrder() {
  return ["R", "S", "L", "N"];
}

/**
 * Aggregate sessions into sound statistics
 */
function aggregateSoundStats(sessions) {
  const stats = {};

  for (const sound of SOUND_TARGETS) {
    const soundSessions = sessions.filter((s) => s.targetSound === sound);
    const total = soundSessions.length;
    const correct = soundSessions.filter((s) => s.parentRating === true).length;
    const incorrect = total - correct;
    const rate = total > 0 ? correct / total : 0;

    stats[sound] = {
      sound,
      total,
      correct,
      incorrect,
      rate: Math.round(rate * 100),
      // Determine status based on rules
      status: getSoundStatus(total, rate),
    };
  }

  return stats;
}

/**
 * Determine sound mastery status based on forward chaining rules
 */
function getSoundStatus(total, correctRate) {
  if (total === 0) return "not_started";
  if (total >= 7 && correctRate >= 0.7) return "mastered";
  if (total >= 5 && correctRate >= 0.5) return "improving";
  if (total >= 5 && correctRate < 0.4) return "struggling";
  if (total >= 3) return "practicing";
  return "not_started";
}

/**
 * Get the next sound to focus on based on current progress
 * Priority: struggling sounds > not_started > improving
 */
function getNextSoundToFocus(stats) {
  const order = getSoundOrder();

  // First: focus on struggling sounds
  for (const sound of order) {
    const s = stats[sound];
    if (s && s.status === "struggling") {
      return { sound, reason: "struggling", suggestion: getSuggestion(sound, "alternative") };
    }
  }

  // Second: start new sounds that haven't been practiced
  for (const sound of order) {
    const s = stats[sound];
    if (!s || s.status === "not_started") {
      return { sound, reason: "new", suggestion: getSuggestion(sound, "start") };
    }
  }

  // Third: continue improving sounds
  for (const sound of order) {
    const s = stats[sound];
    if (s && (s.status === "practicing" || s.status === "improving")) {
      return { sound, reason: "continue", suggestion: getSuggestion(sound, "continue") };
    }
  }

  // All mastered
  return null;
}

/**
 * Get suggestion message based on sound and action type
 */
function getSuggestion(sound, action) {
  const suggestions = {
    R: {
      start: "Latihan bunyi R dimulai! Fokus gulungkan lidah ke atas gigi.",
      continue: "Lanjutkan latihan bunyi R. Konsistensi adalah kunci!",
      alternative: "Bunyi R sulit? Coba latihan bunyi T dulu untuk preparation.",
      mastered: "Bunyi R sudah dikuasai! 🎉",
    },
    S: {
      start: "Bunyi S butuh lidah di atas gigi. Mulai dari 'Sssss' pelan!",
      continue: "Bunyi S makin bagus! Coba gabungkan dengan vokal.",
      alternative: "Bunyi S masih sulit? Kembali ke bunyi T dulu.",
      mastered: "Bunyi S sudah dikuasai! 🎉",
    },
    L: {
      start: "Bunyi L butuh ujung lidah sentuh gigi atas. Mulai dari 'Lllll'!",
      continue: "Bunyi L makin jelas! Ayo gabungkan dengan kata.",
      alternative: "Bunyi L sulit? Latihan bunyi N dulu.",
      mastered: "Bunyi L sudah dikuasai! 🎉",
    },
    N: {
      start: "Bunyi N dari hidung! Rasmkan 'Nnnn' dulu.",
      continue: "Bunyi N makin stabil! Gabungkan dengan vokal.",
      alternative: "Konsisten latihan bunyi N ya!",
      mastered: "Bunyi N sudah dikuasai! 🎉",
    },
  };

  return suggestions[sound]?.[action] || `Latihan bunyi ${sound}!`;
}

/**
 * Get status icon and color
 */
function getStatusInfo(status) {
  const info = {
    mastered: { icon: "check_circle", color: "16A34A", label: "Dikuasai" },
    improving: { icon: "trending_up", color: "2563EB", label: "Berkembang" },
    practicing: { icon: "autorenew", color: "D97706", label: "Berlatih" },
    struggling: { icon: "warning", color: "DC2626", label: "Perlu Bantuan" },
    not_started: { icon: "circle_outlined", color: "64748B", label: "Belum Mulai" },
  };
  return info[status] || info.not_started;
}

/**
 * Build progress timeline for chart visualization
 */
function buildTimeline(sessions, limit = 10) {
  const recent = sessions.slice(0, limit).reverse();
  const timeline = [];

  for (const session of recent) {
    timeline.push({
      date: session.createdAt,
      sound: session.targetSound,
      correct: session.parentRating,
      word: session.targetWord,
    });
  }

  return timeline;
}

/**
 * Main evaluation function - processes all rules and returns hints
 */
async function evaluateArtikulasiProgress(childId) {
  const sessions = await prisma.articulationSession.findMany({
    where: { childId },
    orderBy: { createdAt: "desc" },
  });

  const stats = aggregateSoundStats(sessions);
  const hints = [];
  let recommendation = null;
  let nextSound = null;

  // Process each sound with forward chaining rules
  for (const sound of SOUND_TARGETS) {
    const s = stats[sound];
    if (!s || s.total === 0) continue;

    const rule = processSoundRules(sound, s);
    if (rule) {
      hints.push(rule);
    }
  }

  // Get overall recommendation
  nextSound = getNextSoundToFocus(stats);

  if (nextSound) {
    recommendation = nextSound.suggestion;
  } else {
    // All sounds mastered
    const allMastered = SOUND_TARGETS.every(
      (sound) => stats[sound]?.status === "mastered"
    );
    if (allMastered) {
      recommendation = "Semua bunyi sudah dikuasai! 🎉";
    }
  }

  // Build timeline
  const timeline = buildTimeline(sessions);

  return {
    hints,
    recommendation,
    nextSound,
    stats,
    timeline,
    totalSessions: sessions.length,
    // Quick summary
    summary: {
      masteredSounds: SOUND_TARGETS.filter((s) => stats[s]?.status === "mastered"),
      strugglingSounds: SOUND_TARGETS.filter((s) => stats[s]?.status === "struggling"),
      totalPractice: sessions.length,
    },
  };
}

/**
 * Process forward chaining rules for a single sound
 */
function processSoundRules(sound, s) {
  // Rule 1: Sound mastered
  if (s.total >= 7 && s.rate >= 70) {
    return {
      sound,
      rule: "mastered",
      status: "mastered",
      message: getSuggestion(sound, "mastered"),
      nextAction: "unlock_next",
    };
  }

  // Rule 2: Good progress improving
  if (s.total >= 5 && s.rate >= 50 && s.rate < 70) {
    return {
      sound,
      rule: "improving",
      status: "improving",
      message: getSuggestion(sound, "continue"),
      nextAction: "continue",
    };
  }

  // Rule 3: Struggling - suggest alternative
  if (s.total >= 5 && s.rate < 40) {
    return {
      sound,
      rule: "struggling",
      status: "struggling",
      message: getSuggestion(sound, "alternative"),
      suggestion: `Coba latihan bunyi ${getPreparationSound(sound)} dulu.`,
      nextAction: "alternative",
    };
  }

  // Rule 4: Started but not enough data
  if (s.total >= 1 && s.total < 5) {
    return {
      sound,
      rule: "practicing",
      status: "practicing",
      message: `Bunyi ${sound}: ${s.correct}/${s.total} benar. Lanjutkan latihan!`,
      nextAction: "continue",
    };
  }

  return null;
}

/**
 * Get simple progress data for parent app
 */
async function getParentProgress(childId) {
  const sessions = await prisma.articulationSession.findMany({
    where: { childId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const stats = aggregateSoundStats(sessions);
  const evaluation = await evaluateArtikulasiProgress(childId);

  return {
    sessions: sessions.slice(0, 10), // Last 10 sessions
    stats,
    nextRecommendation: evaluation.recommendation,
    nextSound: evaluation.nextSound,
  };
}

/**
 * Get detailed progress for therapist dashboard
 */
async function getTherapistProgress(childId) {
  const sessions = await prisma.articulationSession.findMany({
    where: { childId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const stats = aggregateSoundStats(sessions);
  const evaluation = await evaluateArtikulasiProgress(childId);

  // Get sound-specific trends
  const trends = {};
  for (const sound of SOUND_TARGETS) {
    const soundSessions = sessions
      .filter((s) => s.targetSound === sound)
      .slice(0, 10);
    trends[sound] = {
      recent: soundSessions.map((s) => ({
        date: s.createdAt,
        correct: s.parentRating,
        word: s.targetWord,
      })),
      statusInfo: getStatusInfo(stats[sound]?.status || "not_started"),
    };
  }

  // Count sessions that need review (no therapist review yet)
  const needsReview = sessions.filter(s => !s.therapistRating).length;

  return {
    stats,
    summary: evaluation.summary,
    timeline: evaluation.timeline,
    latestSessions: sessions.slice(0, 10).map(s => ({
      id: s.id,
      targetWord: s.targetWord,
      targetSound: s.targetSound,
      roundNumber: s.roundNumber,
      parentRating: s.parentRating,
      therapistRating: s.therapistRating,
      therapistScore: s.therapistScore,
      therapistNotes: s.therapistNotes,
      audioUrl: s.audioUrl,
      createdAt: s.createdAt,
      playedAt: s.playedAt,
      reviewedAt: s.reviewedAt,
      suggestedWords: s.suggestedWords,
      needsReview: !s.therapistRating, // Flag for UI
    })),
    trends,
    evaluation,
    needsReview,
    // For chart
    chartData: buildChartData(stats, evaluation.timeline),
  };
}

/**
 * Build chart-ready data structure
 */
function buildChartData(stats, timeline) {
  // Get last 7 days of data
  const days = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    // Count sessions per day per sound
    const dayData = { date: dateStr };
    for (const sound of SOUND_TARGETS) {
      const count = timeline.filter(
        (t) =>
          t.date.toISOString().split("T")[0] === dateStr &&
          t.sound === sound &&
          t.correct
      ).length;
      dayData[sound] = count;
    }
    days.push(dayData);
  }

  return days;
}

module.exports = {
  evaluateArtikulasiProgress,
  getParentProgress,
  getTherapistProgress,
  aggregateSoundStats,
  buildTimeline,
  getStatusInfo,
  getSoundOrder,
  getSuggestion,
};
