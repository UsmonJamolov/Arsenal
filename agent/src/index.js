const { agentFetch, loadConfig } = require("./api");
const { executeCommand } = require("./commands");

async function heartbeat(config) {
  await agentFetch(config, "/agent/heartbeat", {
    method: "POST",
    body: JSON.stringify({ status: "online", agentVersion: "1.0.0" }),
  });
}

async function pollCommands(config) {
  const commands = await agentFetch(config, "/agent/commands?limit=5");

  for (const command of commands) {
    try {
      await executeCommand(command);
      await agentFetch(config, `/agent/commands/${command.id}/ack`, {
        method: "POST",
        body: JSON.stringify({ status: "completed", message: "ok" }),
      });
    } catch (error) {
      console.error(`Buyruq xato (${command.command}):`, error.message);
      await agentFetch(config, `/agent/commands/${command.id}/ack`, {
        method: "POST",
        body: JSON.stringify({ status: "failed", message: error.message }),
      }).catch(() => {});
    }
  }
}

async function main() {
  const config = loadConfig();
  console.log(`Arsenal agent: ${config.stationId} → ${config.apiUrl}`);

  await heartbeat(config);

  setInterval(() => {
    heartbeat(config).catch((error) => console.warn("heartbeat:", error.message));
  }, config.heartbeatIntervalMs || 15000);

  setInterval(() => {
    pollCommands(config).catch((error) => console.warn("poll:", error.message));
  }, config.pollIntervalMs || 3000);
}

main().catch((error) => {
  console.error("Agent ishga tushmadi:", error.message);
  process.exit(1);
});
