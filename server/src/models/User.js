const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, select: false },
    tier: {
      type: String,
      enum: ["Bronze", "Silver", "Gold", "Platinum"],
      default: "Gold",
    },
    loyaltyPoints: { type: Number, default: 120 },
    telegramChatId: { type: String, default: "" },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  {
    timestamps: true,
    collection: "users",
  },
);

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    phone: this.phone,
    email: this.email,
    tier: this.tier,
    loyaltyPoints: this.loyaltyPoints,
    role: this.role,
    joinedAt: this.createdAt.toISOString(),
  };
};

const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;
