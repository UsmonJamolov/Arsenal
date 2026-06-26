const { telegramBotToken } = require("../config");

async function callTelegram(method, payload = {}) {
  if (!telegramBotToken) {
    return null;
  }

  const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!data.ok) {
    throw new Error(data.description || "Telegram API xato");
  }

  return data.result;
}

async function sendTelegramMessage(chatId, text) {
  if (!chatId || !telegramBotToken) {
    return false;
  }

  await callTelegram("sendMessage", {
    chat_id: chatId,
    text,
  });

  return true;
}

module.exports = { callTelegram, sendTelegramMessage };
