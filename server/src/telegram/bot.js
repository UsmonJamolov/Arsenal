const { publicSiteUrl, telegramBotToken, telegramBotUsername } = require("../config");
const { issueOtp, normalizePhone } = require("../services/telegramAuth");

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
  const url = String(publicSiteUrl || "").trim();
  if (!isPublicTelegramUrl(url)) {
    return undefined;
  }

  return {
    inline_keyboard: [[{ text: "🎮 Saytga qaytish", url }]],
  };
}

function isPublicTelegramUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") {
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    return host !== "localhost" && host !== "127.0.0.1";
  } catch {
    return false;
  }
}

function phoneKeyboard() {
  return {
    keyboard: [[{ text: "📱 Telefon raqamni yuborish", request_contact: true }]],
    resize_keyboard: true,
    one_time_keyboard: true,
  };
}

async function setupBotProfile() {
  await callTelegram("deleteWebhook", { drop_pending_updates: true });
  await callTelegram("setMyCommands", {
    commands: [
      { command: "start", description: "Kirish / ro'yxatdan o'tish" },
      { command: "help", description: "Yordam" },
    ],
  });
  await callTelegram("setMyDescription", {
    description: "Arsenal Union — telefon orqali kirish, PS/PC bron va to'lov.",
  });
  await callTelegram("setMyShortDescription", {
    short_description: "Telefon + OTP orqali kirish",
  });
}

async function sendWelcome(chatId, firstName) {
  const name = firstName ? `, ${firstName}` : "";

  await callTelegram("sendMessage", {
    chat_id: chatId,
    text:
      `Salom${name}!\n\n` +
      `Arsenal Union ga kirish uchun telefon raqamingizni yuboring.\n\n` +
      `1) Quyidagi tugmani bosing\n` +
      `2) 6 xonali kodni oling\n` +
      `3) Saytda kodni kiriting`,
    reply_markup: phoneKeyboard(),
  });
}

async function handleContact(chatId, contact, from) {
  const phone = normalizePhone(contact.phone_number);
  const telegramName = [from?.first_name, from?.last_name].filter(Boolean).join(" ");

  let code;

  try {
    ({ code } = await issueOtp({
      phone,
      telegramChatId: String(chatId),
      telegramName,
    }));
  } catch (error) {
    console.warn("Telegram OTP:", error.message);
    await callTelegram("sendMessage", {
      chat_id: chatId,
      text: "Telefon raqam noto'g'ri yoki saqlanmadi. Qayta telefon raqamingizni yuboring.",
      reply_markup: phoneKeyboard(),
    });
    return;
  }

  const siteHint = publicSiteUrl ? `\n\n🎮 Sayt: ${publicSiteUrl}` : "";

  try {
    await callTelegram("sendMessage", {
      chat_id: chatId,
      text:
        `✅ Telefon qabul qilindi: <code>${phone}</code>\n\n` +
        `🔐 Tasdiqlash kodingiz:\n` +
        `<code>${code}</code>\n\n` +
        `Kodga bosing — nusxa olinadi.\n` +
        `Kod 10 daqiqa amal qiladi. Saytda kiriting.${siteHint}`,
      parse_mode: "HTML",
      reply_markup: { remove_keyboard: true },
    });
  } catch (error) {
    console.warn("Telegram OTP xabar:", error.message);
    await callTelegram("sendMessage", {
      chat_id: chatId,
      text:
        `✅ Telefon qabul qilindi: ${phone}\n\n` +
        `🔐 Tasdiqlash kodingiz: ${code}\n\n` +
        `Kod 10 daqiqa amal qiladi. Saytda kiriting.${siteHint}`,
      reply_markup: { remove_keyboard: true },
    });
  }

  const keyboard = siteKeyboard();
  if (keyboard) {
    try {
      await callTelegram("sendMessage", {
        chat_id: chatId,
        text: "Saytga qaytish uchun tugmani bosing:",
        reply_markup: keyboard,
      });
    } catch (error) {
      console.warn("Telegram sayt tugmasi:", error.message);
    }
  }
}

async function handleUpdate(update) {
  const message = update.message;
  if (!message) {
    return;
  }

  const chatId = message.chat.id;

  if (message.contact) {
    await handleContact(chatId, message.contact, message.from);
    return;
  }

  if (!message.text) {
    return;
  }

  const text = message.text.trim();

  if (text.startsWith("/start") || text.startsWith("/help") || text === "📱 Telefon raqamni yuborish") {
    await sendWelcome(chatId, message.from?.first_name);
    return;
  }

  await callTelegram("sendMessage", {
    chat_id: chatId,
    text: "Kirish uchun telefon raqamingizni yuboring:",
    reply_markup: phoneKeyboard(),
  });
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
