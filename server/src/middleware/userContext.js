const { resolveUserId, getUserCartState } = require("../store/cartStore");

function attachUserContext(req, res, next) {
  req.userId = resolveUserId(req);
  req.userCart = getUserCartState(req.userId);
  next();
}

module.exports = { attachUserContext };
