const mongoose = require("mongoose");

const appSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "main" },
    paymentMethods: { type: [String], default: ["Payme", "Click", "Uzum Bank"] },
    supportPhone: { type: String, default: "+998 90 123 45 67", trim: true },
    supportTelegramUrl: { type: String, default: "https://t.me/arsenal_union_bot", trim: true },
    notifications: {
      type: [String],
      default: ["Xush kelibsiz! Bugun maxsus bonuslar mavjud."],
    },
  },
  { timestamps: true, collection: "app_settings" },
);

module.exports = mongoose.models.AppSettings || mongoose.model("AppSettings", appSettingsSchema);
