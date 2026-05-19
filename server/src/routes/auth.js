const bcrypt = require("bcryptjs");
const express = require("express");

const User = require("../models/User");

const router = express.Router();

function normalizePhone(phone) {
  return String(phone).replace(/\s+/g, "").trim();
}

function normalizeEmail(email, phone) {
  const value = String(email || "").trim().toLowerCase();
  if (value) {
    return value;
  }

  return `${normalizePhone(phone)}@arsenal.union`;
}

router.post("/register", async (req, res, next) => {
  try {
    const { name, phone, email, password } = req.body ?? {};

    if (!name?.trim()) {
      return res.status(400).json({ message: "Ism majburiy" });
    }

    if (!phone?.trim() || normalizePhone(phone).length < 8) {
      return res.status(400).json({ message: "Telefon raqam noto'g'ri" });
    }

    if (!password || String(password).length < 4) {
      return res.status(400).json({ message: "Parol kamida 4 ta belgidan iborat bo'lishi kerak" });
    }

    const phoneValue = normalizePhone(phone);
    const emailValue = normalizeEmail(email, phoneValue);

    const exists = await User.findOne({
      $or: [{ phone: phoneValue }, { email: emailValue }],
    });

    if (exists) {
      return res.status(409).json({ message: "Bu telefon yoki email allaqachon ro'yxatdan o'tgan" });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    const user = await User.create({
      name: name.trim(),
      phone: phoneValue,
      email: emailValue,
      password: hashedPassword,
      loyaltyPoints: 120 + Math.floor(Math.random() * 80),
    });

    res.status(201).json({ user: user.toPublicJSON() });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { phone, password } = req.body ?? {};

    if (!phone?.trim() || !password) {
      return res.status(400).json({ message: "Telefon va parol majburiy" });
    }

    const user = await User.findOne({ phone: normalizePhone(phone) }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Telefon yoki parol noto'g'ri" });
    }

    const valid = await bcrypt.compare(String(password), user.password);

    if (!valid) {
      return res.status(401).json({ message: "Telefon yoki parol noto'g'ri" });
    }

    res.json({ user: user.toPublicJSON() });
  } catch (error) {
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
