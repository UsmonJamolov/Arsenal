const GUEST_KEY = "guest";

/** @type {Map<string, { cart: object[], paymentStatus: string }>} */
const userCarts = new Map();

function cartKey(userId) {
  return userId ? String(userId) : GUEST_KEY;
}

function getUserCartState(userId) {
  const key = cartKey(userId);
  if (!userCarts.has(key)) {
    userCarts.set(key, { cart: [], paymentStatus: "pending" });
  }
  return userCarts.get(key);
}

function resolveUserId(req) {
  return req.header("X-User-Id") || req.query.userId || req.body?.userId || null;
}

module.exports = { getUserCartState, resolveUserId, cartKey };
