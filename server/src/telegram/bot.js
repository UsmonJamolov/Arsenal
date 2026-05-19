const { publicSiteUrl, telegramBotToken, telegramBotUsername } = require("../config");

async function callTelegram(method, payload = {}) {
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

function siteKeyboard() {
  return {
    inline_keyboard: [[{ text: "🎮 Arsenal Union saytiga o'tish", url: publicSiteUrl }]],
  };
}

async function setupBotProfile() {
  await callTelegram("deleteWebhook", { drop_pending_updates: true });
  await callTelegram("setMyCommands", {
    commands: [
      { command: "start", description: "Saytni ochish" },
      { command: "help", description: "Yordam" },
    ],
  });
  await callTelegram("setMyDescription", {
    description: "Arsenal Union game club — PS/PC bron, kalyan va onlayn to'lov.",
  });
  await callTelegram("setMyShortDescription", {
    short_description: "Game club bron va to'lov",
  });
}

async function sendWelcome(chatId, firstName) {
  const name = firstName ? `, ${firstName}` : "";
  const botLink = telegramBotUsername ? `https://t.me/${telegramBotUsername}` : publicSiteUrl;

  await callTelegram("sendMessage", {
    chat_id: chatId,
    text:
      `Salom${name}!\n\n` +
      `Arsenal Union — kompyuter klubi uchun bron va to'lov.\n\n` +
      `Sayt: ${publicSiteUrl}\n` +
      `Bot: ${botLink}\n\n` +
      `Quyidagi tugma orqali saytga o'ting:`,
    reply_markup: siteKeyboard(),
    disable_web_page_preview: false,
  });
}

async function handleUpdate(update) {
  const message = update.message;
  if (!message?.text) {
    return;
  }

  const text = message.text.trim();
  const chatId = message.chat.id;

  if (text.startsWith("/start") || text.startsWith("/help")) {
    await sendWelcome(chatId, message.from?.first_name);
  }
}

function startTelegramBot() {
  if (!telegramBotToken) {
    console.log("Telegram bot o'chirilgan (TELEGRAM_BOT_TOKEN yo'q).");
    return;
  }

  let offset = 0;
  let polling = false;

  setupBotProfile()
    .then(() => console.log(`Telegram bot tayyor: @${telegramBotUsername || "bot"}`))
    .catch((error) => console.warn("Telegram setup:", error.message));

  async function poll() {
    if (polling) {
      return;
    }
    polling = true;

    try {
      const updates = await callTelegram("getUpdates", {
        offset,
        timeout: 20,
        allowed_updates: ["message"],
      });

      for (const update of updates) {
        offset = update.update_id + 1;
        handleUpdate(update).catch((error) => {
          console.warn("Telegram xabar:", error.message);
        });
      }
    } catch (error) {
      console.warn("Telegram poll:", error.message);
    } finally {
      polling = false;
      setTimeout(poll, 400);
    }
  }

  poll();
}

module.exports = { startTelegramBot };
