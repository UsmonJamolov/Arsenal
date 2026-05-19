require("dotenv").config();

module.exports = {
  port: Number(process.env.PORT) || 4000,
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/arsenal_union",
  adminPhone: process.env.ADMIN_PHONE || "+998901111111",
  adminPassword: process.env.ADMIN_PASSWORD || "admin1234",
  adminEmail: process.env.ADMIN_EMAIL || "admin@arsenal.union",
  adminName: process.env.ADMIN_NAME || "Admin",
  agentSecret: process.env.AGENT_SECRET || "arsenal-agent-dev-secret",
  billingProvider: process.env.BILLING_PROVIDER || "custom",
  ggleapApiUrl: process.env.GGLEAP_API_URL || "",
  ggleapApiKey: process.env.GGLEAP_API_KEY || "",
  ccbootApiUrl: process.env.CCBOOT_API_URL || "",
  ccbootApiKey: process.env.CCBOOT_API_KEY || "",
  publicSiteUrl: process.env.PUBLIC_SITE_URL || process.env.CLIENT_ORIGIN || "http://localhost:3000",
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
  telegramBotUsername: process.env.TELEGRAM_BOT_USERNAME || "arsenalGC_bot",
};
