const fs = require("fs");
const path = require("path");

function loadConfig() {
  const configPath = path.join(__dirname, "..", "config.json");
  const examplePath = path.join(__dirname, "..", "config.example.json");
  const file = fs.existsSync(configPath) ? configPath : examplePath;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

async function agentFetch(config, route, options = {}) {
  const url = `${config.apiUrl.replace(/\/$/, "")}${route}`;
  const headers = {
    "Content-Type": "application/json",
    "X-Agent-Key": config.agentKey,
    "X-Station-Id": config.stationId,
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status} ${text}`);
  }

  return response.json();
}

module.exports = { loadConfig, agentFetch };
