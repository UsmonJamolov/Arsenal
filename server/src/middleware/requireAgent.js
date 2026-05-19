const { agentSecret } = require("../config");

function requireAgent(req, res, next) {
  const key = req.header("X-Agent-Key");
  const stationId = req.header("X-Station-Id") || req.query.stationId || req.body?.stationId;

  if (!key || key !== agentSecret) {
    return res.status(401).json({ message: "Agent kaliti noto'g'ri" });
  }

  if (!stationId) {
    return res.status(400).json({ message: "stationId majburiy (header yoki query)" });
  }

  req.stationId = String(stationId).trim();
  next();
}

module.exports = { requireAgent };
