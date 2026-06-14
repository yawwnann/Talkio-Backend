function parseYmdFromIsoString(isoString) {
  if (typeof isoString !== "string") return null;
  const m = isoString.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return {
    year: Number(m[1]),
    month: Number(m[2]),
    day: Number(m[3]),
  };
}

function getUtcWeekdayFromYmd({ year, month, day }) {
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCDay(); // 0=Sun ... 6=Sat
}

function isWeekendIsoDate(isoString) {
  const ymd = parseYmdFromIsoString(isoString);
  if (!ymd) return false;
  const weekday = getUtcWeekdayFromYmd(ymd);
  return weekday === 0 || weekday === 6;
}

function formatDateYmdInTimeZone(date, timeZone = "Asia/Jakarta") {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return null;

  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

module.exports = {
  parseYmdFromIsoString,
  getUtcWeekdayFromYmd,
  isWeekendIsoDate,
  formatDateYmdInTimeZone,
};
