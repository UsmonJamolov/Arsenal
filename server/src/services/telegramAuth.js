const crypto = require("crypto");

const bcrypt = require("bcryptjs");

const AuthOtp = require("../models/AuthOtp");
const User = require("../models/User");

const OTP_TTL_MS = 10 * 60 * 1000;

function normalizePhone(phone) {
  let value = String(phone || "").replace(/\s+/g, "").trim();

  if (!value.startsWith("+")) {
    if (value.startsWith("998")) {
      value = `+${value}`;
    } else if (/^9\d{8}$/.test(value)) {
      value = `+998${value}`;
    } else {
      const digits = value.replace(/\D/g, "");
      value = digits ? `+${digits}` : value;
    }
  }

  const digits = value.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) {
    throw new Error("Telefon raqam noto'g'ri");
  }

  return value;
}

function buildEmail(phone) {
  const digits = normalizePhone(phone).replace(/\D/g, "");
  return `${digits || "user"}@arsenal.union`;
}

function generateOtpCode() {
  return String(crypto.randomInt(100000, 1000000));
}

async function issueOtp({ phone, telegramChatId = "", telegramName = "" }) {
  const phoneValue = normalizePhone(phone);

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await AuthOtp.deleteMany({ phone: phoneValue, consumed: false });

  await AuthOtp.create({
    phone: phoneValue,
    code,
    telegramChatId: String(telegramChatId || ""),
    telegramName: String(telegramName || "").trim(),
    expiresAt,
  });

  return { phone: phoneValue, code, expiresAt };
}

async function verifyOtp({ phone, code }) {
  const codeValue = String(code || "").trim();

  if (codeValue.length !== 6) {
    throw new Error("6 xonali kod noto'g'ri");
  }

  const query = {
    code: codeValue,
    consumed: false,
    expiresAt: { $gt: new Date() },
  };

  if (phone?.trim()) {
    query.phone = normalizePhone(phone);
  }

  const record = await AuthOtp.findOne(query).sort({ createdAt: -1 });

  if (!record) {
    throw new Error("Kod noto'g'ri yoki muddati tugagan");
  }

  record.consumed = true;
  await record.save();

  return {
    phone: record.phone,
    telegramChatId: record.telegramChatId,
    telegramName: record.telegramName,
  };
}

async function findOrCreateUser({ phone, telegramChatId = "", telegramName = "" }) {
  const phoneValue = normalizePhone(phone);
  let user = await User.findOne({ phone: phoneValue });

  if (user) {
    if (telegramChatId && user.telegramChatId !== String(telegramChatId)) {
      user.telegramChatId = String(telegramChatId);
      await user.save();
    }
    return user;
  }

  const name = telegramName?.trim() || "Foydalanuvchi";
  const randomPassword = crypto.randomBytes(18).toString("hex");
  const hashedPassword = await bcrypt.hash(randomPassword, 10);

  user = await User.create({
    name,
    phone: phoneValue,
    email: buildEmail(phoneValue),
    password: hashedPassword,
    telegramChatId: String(telegramChatId || ""),
    loyaltyPoints: 120 + Math.floor(Math.random() * 80),
    role: "user",
  });

  return user;
}

module.exports = {
  normalizePhone,
  issueOtp,
  verifyOtp,
  findOrCreateUser,
};
