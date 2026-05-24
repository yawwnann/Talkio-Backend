function ageInMonths(dateOfBirth, now = new Date()) {
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) {
    throw new Error("Invalid dateOfBirth");
  }

  let months =
    (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());

  // If we haven't reached the birth day-of-month yet, subtract one month.
  if (now.getDate() < dob.getDate()) {
    months -= 1;
  }

  return Math.max(0, months);
}

module.exports = { ageInMonths };
