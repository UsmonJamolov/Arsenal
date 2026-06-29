const app = require("./app");
const { port } = require("./config");
const { connectDatabase } = require("./db/connect");
const { seedDatabase } = require("./db/seedData");
const { initRealtime } = require("./realtime");
const { expireDueSessions } = require("./services/sessionService");
const { startTelegramBot } = require("./telegram/bot");
const { startSupportBot } = require("./telegram/supportBot");

const SESSION_SWEEP_MS = 60 * 1000;

async function start() {
  try {
    await connectDatabase();
    await seedDatabase();

    const server = app.listen(port, () => {
      console.log(`Arsenal Union server ishga tushdi: http://localhost:${port}`);
      console.log(`API: http://localhost:${port}/api/health`);
    });

    initRealtime(server);
    startTelegramBot();
    startSupportBot();

    setInterval(() => {
      expireDueSessions().catch((error) => {
        console.warn("Sessiya tekshiruvi:", error.message);
      });
    }, SESSION_SWEEP_MS);

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(
          `Port ${port} band. Eski serverni to'xtating: netstat -ano | findstr :${port}`,
        );
      } else {
        console.error("Server tinglashda xato:", error.message);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error("Server ishga tushmadi:", error.message);
    process.exit(1);
  }
}

start();

