const express = require("express");

const { telegramBotUsername } = require("../config");
const User = require("../models/User");
const { findOrCreateUser, normalizePhone, verifyOtp } = require("../services/telegramAuth");

const router = express.Router();

router.get("/telegram/config", (req, res) => {
  res.json({
    botUsername: telegramBotUsername,
    botUrl: `https://t.me/${telegramBotUsername}?start=login`,
  });
});

router.post("/telegram/verify", async (req, res, next) => {
  try {
    const { phone, code } = req.body ?? {};

    if (!code || String(code).trim().length !== 6) {
      return res.status(400).json({ message: "6 xonali kod majburiy" });
    }

    const verified = await verifyOtp({ phone, code });
    const user = await findOrCreateUser({
      phone: verified.phone,
      telegramChatId: verified.telegramChatId,
      telegramName: verified.telegramName,
    });

    res.json({ user: user.toPublicJSON() });
  } catch (error) {
    if (error.message.includes("noto'g'ri") || error.message.includes("muddati")) {
      return res.status(401).json({ message: error.message });
    }

    next(error);
  }
});

router.get("/users/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
    }

    res.json({ user: user.toPublicJSON() });
  } catch (error) {
    next(error);
  }
});

router.patch("/users/:id", async (req, res, next) => {
  try {
    const { name, phone, email } = req.body ?? {};
    const updates = {};

    if (name !== undefined) {
      updates.name = String(name).trim();
    }

    if (phone !== undefined) {
      updates.phone = normalizePhone(phone);
    }

    if (email !== undefined) {
      updates.email = String(email).trim().toLowerCase();
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
    }

    res.json({ user: user.toPublicJSON() });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Telefon yoki email band" });
    }

    next(error);
  }
});

module.exports = router;
