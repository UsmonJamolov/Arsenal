const mongoose = require("mongoose");

const authOtpSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, trim: true, index: true },
    code: { type: String, required: true, trim: true },
    telegramChatId: { type: String, default: "" },
    telegramName: { type: String, default: "" },
    expiresAt: { type: Date, required: true },
    consumed: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "auth_otps" },
);

authOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.models.AuthOtp || mongoose.model("AuthOtp", authOtpSchema);
