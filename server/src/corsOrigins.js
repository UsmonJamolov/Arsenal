const { clientOrigin } = require("./config");

function getAllowedOrigins() {
  const fromEnv = (process.env.CLIENT_ORIGIN || clientOrigin || "http://localhost:3000")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return [...new Set([...fromEnv, "http://localhost:3000", "http://127.0.0.1:3000"])];
}

function isOriginAllowed(origin) {
  if (!origin) {
    return true;
  }

  if (getAllowedOrigins().includes(origin)) {
    return true;
  }

  return /^https:\/\/[\w-]+\.trycloudflare\.com$/.test(origin);
}

module.exports = { getAllowedOrigins, isOriginAllowed };
