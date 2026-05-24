// Therapy rooms capacity per 1-hour slot.
// At the same time slot, up to 2 sessions can run in parallel (2 rooms).

const ROOMS_PER_SLOT = 2;

// Reserve capacity for users who are still in the payment flow.
// PENDING sessions older than this are treated as expired reservations.
const PENDING_RESERVATION_MINUTES = 30;

module.exports = {
  ROOMS_PER_SLOT,
  PENDING_RESERVATION_MINUTES,
};
