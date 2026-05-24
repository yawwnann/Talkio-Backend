const GAME_BANDS = require("../config/game-recommendation.config");
const { ageInMonths } = require("../utils/age");

function pickBand(ageMonths) {
  if (!Array.isArray(GAME_BANDS) || GAME_BANDS.length === 0) return null;

  const direct = GAME_BANDS.find(
    (b) => ageMonths >= b.minMonths && ageMonths < b.maxMonths,
  );
  if (direct) return direct;

  // Fallback to nearest band
  const sorted = [...GAME_BANDS].sort((a, b) => a.minMonths - b.minMonths);
  if (ageMonths < sorted[0].minMonths) return sorted[0];
  return sorted[sorted.length - 1];
}

function buildRecommendations(ageMonths) {
  const band = pickBand(ageMonths);
  if (!band) return { band: null, games: [] };

  return {
    band: {
      label: band.label,
      minMonths: band.minMonths,
      maxMonths: band.maxMonths,
    },
    games: (band.games || []).map((g) => ({
      gameType: g.gameType,
      params: g.params || {},
      reason: `Recommended for age band ${band.label}`,
    })),
  };
}

function getRecommendationsForChild(child, now = new Date()) {
  if (!child) throw new Error("child is required");
  const ageMonths = ageInMonths(child.dateOfBirth, now);

  const { band, games } = buildRecommendations(ageMonths);

  return {
    childId: child.id,
    ageMonths,
    band,
    games,
  };
}

module.exports = {
  getRecommendationsForChild,
  // exported for unit tests / future adaptive logic
  pickBand,
  buildRecommendations,
};
