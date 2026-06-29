const {
  telegramAdminBotToken,
  telegramAdminBotUsername,
  telegramAdminChatId,
} = require("../config");

async function callTelegram(method, payload = {}) {
  const response = await fetch(
    `https://api.telegram.org/bot${telegramAdminBotToken}/${method}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  const data = await response.json();

  if (!data.ok) {
    throw new Error(data.description || "Telegram API xato");
  }

  return data.result;
}

// Admin chatdagi relay xabar message_id -> foydalanuvchi chat_id
// (qayta ishga tushganda reply matnidagi ID orqali tiklanadi)
const replyMap = new Map();

const USER_ID_RE = /ID:\s*(-?\d+)/;

function userName(from) {
  return [from?.first_name, from?.last_name].filter(Boolean).join(" ") || "Foydalanuvchi";
}

async function setupBotProfile() {
  await callTelegram("deleteWebhook", { drop_pending_updates: true });
  await callTelegram("setMyCommands", {
    commands: [{ command: "start", description: "Qo'llab-quvvatlash" }],
  });
  await callTelegram("setMyDescription", {
    description: "Arsenal Union — qo'llab-quvvatlash xizmati. Savolingizni yozing, operator javob beradi.",
  });
  await callTelegram("setMyShortDescription", {
    short_description: "Arsenal Union qo'llab-quvvatlash",
  });
}

async function handleAdminReply(message) {
  const replyTo = message.reply_to_message;
  if (!replyTo) {
    return false;
  }

  let userChatId = replyMap.get(replyTo.message_id);

  if (!userChatId) {
    const match = (replyTo.text || replyTo.caption || "").match(USER_ID_RE);
    if (match) {
      userChatId = match[1];
    }
  }

  if (!userChatId) {
    await callTelegram("sendMessage", {
      chat_id: message.chat.id,
      text: "⚠️ Bu xabarga javob berib bo'lmadi (foydalanuvchi aniqlanmadi). Iltimos, kerakli xabarga reply qiling.",
    });
    return true;
  }

  try {
    await callTelegram("sendMessage", {
      chat_id: userChatId,
      text: `📩 Qo'llab-quvvatlash javobi:\n\n${message.text}`,
    });
    await callTelegram("sendMessage", {
      chat_id: message.chat.id,
      text: "✅ Javob foydalanuvchiga yuborildi.",
      reply_to_message_id: message.message_id,
    });
  } catch (error) {
    await callTelegram("sendMessage", {
      chat_id: message.chat.id,
      text: `❌ Yuborilmadi: ${error.message}`,
    });
  }

  return true;
}

async function relayToAdmin(message) {
  const from = message.from;
  const header =
    `💬 Yangi qo'llab-quvvatlash xabari\n` +
    `👤 ${userName(from)}` +
    (from?.username ? ` (@${from.username})` : "") +
    `\n🆔 ID: ${message.chat.id}\n\n` +
    `${message.text}\n\n` +
    `↩️ Javob berish uchun shu xabarga reply qiling.`;

  const sent = await callTelegram("sendMessage", {
    chat_id: telegramAdminChatId,
    text: header,
  });

  replyMap.set(sent.message_id, String(message.chat.id));

  await callTelegram("sendMessage", {
    chat_id: message.chat.id,
    text: "✅ Xabaringiz qabul qilindi. Operatorlar tez orada javob beradi.",
  });
}

async function handleUpdate(update) {
  const message = update.message;
  if (!message || !message.text) {
    return;
  }

  const chatId = String(message.chat.id);

  // Sozlash uchun: istalgan chatda chat ID ni ko'rsatadi
  if (message.text.trim().startsWith("/id")) {
    await callTelegram("sendMessage", {
      chat_id: message.chat.id,
      text: `🆔 Chat ID: ${chatId}\n\nUni TELEGRAM_ADMIN_CHAT_ID ga yozing.`,
    });
    return;
  }

  const isAdminChat = telegramAdminChatId && chatId === String(telegramAdminChatId);

  if (isAdminChat) {
    if (message.reply_to_message) {
      await handleAdminReply(message);
    }
    return;
  }

  const text = message.text.trim();

  if (text.startsWith("/start")) {
    await callTelegram("sendMessage", {
      chat_id: message.chat.id,
      text:
        `Assalomu alaykum, ${userName(message.from)}! 👋\n\n` +
        `Bu Arsenal Union qo'llab-quvvatlash xizmati.\n` +
        `Savol yoki muammoyingizni shu yerga yozing — operatorlar tez orada javob beradi.`,
    });
    return;
  }

  if (!telegramAdminChatId) {
    await callTelegram("sendMessage", {
      chat_id: message.chat.id,
      text: "⚠️ Qo'llab-quvvatlash hozircha sozlanmagan. Iltimos keyinroq urinib ko'ring.",
    });
    return;
  }

  await relayToAdmin(message);
}

function startSupportBot() {
  if (!telegramAdminBotToken) {
    console.log("Support bot o'chirilgan (TELEGRAM_ADMIN_BOT_TOKEN yo'q).");
    return;
  }

  if (!telegramAdminChatId) {
    console.log(
      "Support bot: TELEGRAM_ADMIN_CHAT_ID o'rnatilmagan — foydalanuvchi xabarlari adminga yetkazilmaydi.",
    );
  }

  let offset = 0;
  let polling = false;

  setupBotProfile()
    .then(() => console.log(`Support bot tayyor: @${telegramAdminBotUsername || "bot"}`))
    .catch((error) => console.warn("Support bot setup:", error.message));

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
          console.warn("Support bot xabar:", error.message);
        });
      }
    } catch (error) {
      console.warn("Support bot poll:", error.message);
    } finally {
      polling = false;
      setTimeout(poll, 400);
    }
  }

  poll();
}

module.exports = { startSupportBot };
