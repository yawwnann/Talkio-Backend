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
        gameType: "Kata Bergambar",
        params: { choicesCount: 2, rounds: 6, hintMode: "highlight" },
      },
      {
        gameType: "Suara Binatang",
        params: { choicesCount: 3, rounds: 6, hintMode: "audio" },
      },
      {
        gameType: "Cerita Interaktif",
        params: { choicesCount: 2, rounds: 3, hintMode: "highlight" },
      },
    ],
  },
  {
    label: "24–36 months",
    minMonths: 24,
    maxMonths: 36,
    games: [
      {
        gameType: "Kata Bergambar",
        params: { choicesCount: 3, rounds: 8, hintMode: "highlight" },
      },
      {
        gameType: "Cerita Interaktif",
        params: { choicesCount: 3, rounds: 4, hintMode: "none" },
      },
      {
        gameType: "Tebak Suara",
        params: { choicesCount: 3, rounds: 6, hintMode: "audio" },
      },
    ],
  },
  {
    label: "36–48 months",
    minMonths: 36,
    maxMonths: 48,
    games: [
      {
        gameType: "Kata Bergambar",
        params: { choicesCount: 4, rounds: 10, hintMode: "none" },
      },
      {
        gameType: "Cerita Interaktif",
        params: { choicesCount: 4, rounds: 5, hintMode: "none" },
      },
      {
        gameType: "Latihan Artikulasi",
        params: { rounds: 6, hintMode: "audio" },
      },
    ],
  },
];
