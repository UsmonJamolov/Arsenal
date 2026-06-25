const AppSettings = require("../models/AppSettings");

async function getSettings() {
  let settings = await AppSettings.findOne({ key: "main" });

  if (!settings) {
    settings = await AppSettings.create({ key: "main" });
  }

  return settings;
}

const { broadcastUpdate } = require("../realtime");

async function pushNotification(message, entity = "all") {
  const settings = await getSettings();
  const previous = Array.isArray(settings.notifications) ? settings.notifications : [];
  settings.notifications = [message, ...previous.slice(0, 9)];
  await settings.save();
  broadcastUpdate({ entity, message });
  return settings.notifications;
}

module.exports = { getSettings, pushNotification };
