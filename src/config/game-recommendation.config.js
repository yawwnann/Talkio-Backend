// MVP rules for age-based game recommendation.
// Keep this simple first; later it can be moved to DB tables + admin UI.

module.exports = [
  {
    label: "12–18 months",
    minMonths: 12,
    maxMonths: 18,
    games: [
      {
        gameType: "Suara Binatang",
        params: { choicesCount: 2, rounds: 5, hintMode: "audio" },
      },
      {
        gameType: "Tebak Suara",
        params: { choicesCount: 2, rounds: 5, hintMode: "audio" },
      },
    ],
  },
  {
    label: "18–24 months",
    minMonths: 18,
    maxMonths: 24,
    games: [
      {
        gameType: "Suara Binatang",
        params: { choicesCount: 2, rounds: 6, hintMode: "audio" },
      },
    ],
  },
  {
    label: "24–36 months",
    minMonths: 24,
    maxMonths: 36,
    games: [
      {
        gameType: "Tebak Suara",
        params: { choicesCount: 3, rounds: 6, hintMode: "audio" },
      },
      {
        gameType: "Suara Binatang",
        params: { choicesCount: 2, rounds: 6, hintMode: "audio" },
      },
    ],
  },
  {
    label: "36–48 months",
    minMonths: 36,
    maxMonths: 48,
    games: [
      {
        gameType: "Latihan Artikulasi",
        params: { rounds: 6, hintMode: "audio" },
      },

      {
        gameType: "Suara Binatang",
        params: { choicesCount: 2, rounds: 6, hintMode: "audio" },
      },
    ],
  },
  {
    label: "48–60 months",
    minMonths: 48,
    maxMonths: 60,
    games: [
      {
        gameType: "Latihan Artikulasi",
        params: { rounds: 8, hintMode: "audio" },
      },
      {
        gameType: "Tebak Suara",
        params: { choicesCount: 4, rounds: 8, hintMode: "audio" },
      },
      {
        gameType: "Suara Binatang",
        params: { choicesCount: 2, rounds: 8, hintMode: "audio" },
      },
    ],
  },
];
