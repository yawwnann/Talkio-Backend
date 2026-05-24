const WIB_UTC_OFFSET_HOURS = 7;

// Working hours in WIB (UTC+7)
const WORK_START_HOUR_WIB = 14; // 14:00
const WORK_END_HOUR_WIB = 21; // 21:00 (end boundary; last 1h slot starts at 20:00)

const getWibHour = (date) => (date.getUTCHours() + WIB_UTC_OFFSET_HOURS) % 24;

const isWithinWorkingHoursWib = (date) => {
  const hour = getWibHour(date);
  return hour >= WORK_START_HOUR_WIB && hour < WORK_END_HOUR_WIB;
};

module.exports = {
  WORK_START_HOUR_WIB,
  WORK_END_HOUR_WIB,
  getWibHour,
  isWithinWorkingHoursWib,
};
