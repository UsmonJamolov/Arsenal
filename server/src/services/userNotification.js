const User = require("../models/User");
const { sendTelegramMessage } = require("../telegram/client");
const { emitToUser } = require("../realtime");

async function notifyOrderAccepted(userId, orderTitle) {
  if (!userId) {
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    return;
  }

  const title = String(orderTitle || "Buyurtma").trim();
  const message = `Buyurtmangiz qabul qilindi!\n\n${title}\n\nTez orada bajariladi.`;

  if (user.telegramChatId) {
    try {
      await sendTelegramMessage(user.telegramChatId, message);
    } catch (error) {
      console.warn("Telegram xabar yuborilmadi:", error.message);
    }
  }

  emitToUser(user._id.toString(), "order:accepted", {
    title,
    message: "Buyurtmangiz qabul qilindi",
    at: new Date().toISOString(),
  });
}

async function notifyOrderCompleted(userId, orderTitle) {
  if (!userId) {
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    return;
  }

  const title = String(orderTitle || "Buyurtma").trim();
  const message = `Buyurtmangiz tayyor!\n\n${title}\n\nBuyurtmangizni olib ketishingiz mumkin.`;

  if (user.telegramChatId) {
    try {
      await sendTelegramMessage(user.telegramChatId, message);
    } catch (error) {
      console.warn("Telegram xabar yuborilmadi:", error.message);
    }
  }

  emitToUser(user._id.toString(), "order:completed", {
    title,
    message: "Buyurtmangiz tayyor",
    at: new Date().toISOString(),
  });
}

module.exports = { notifyOrderAccepted, notifyOrderCompleted };
