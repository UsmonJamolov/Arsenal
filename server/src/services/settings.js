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
  settings.notifications = [message, ...settings.notifications.slice(0, 9)];
  await settings.save();
  broadcastUpdate({ entity, message });
  return settings.notifications;
}

module.exports = { getSettings, pushNotification };
