const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    deviceId: { type: String, required: true, trim: true },
    deviceName: { type: String, required: true, trim: true },
    stationId: { type: String, required: true, trim: true },
    unlockPin: { type: String, required: true, trim: true },
    durationMinutes: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, default: "" },
    billingProvider: {
      type: String,
      enum: ["custom", "ggleap", "ccboot"],
      default: "custom",
    },
    billingRef: { type: String, default: null },
    status: {
      type: String,
      enum: ["pending_unlock", "active", "completed", "expired", "cancelled"],
      default: "pending_unlock",
    },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, required: true },
    unlockedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "sessions" },
);

sessionSchema.methods.toJSON = function toJSON() {
  return {
    id: this._id.toString(),
    bookingId: this.bookingId?.toString() ?? null,
    userId: this.userId?.toString() ?? null,
    deviceId: this.deviceId,
    deviceName: this.deviceName,
    stationId: this.stationId,
    unlockPin: this.unlockPin,
    durationMinutes: this.durationMinutes,
    amount: this.amount,
    paymentMethod: this.paymentMethod,
    billingProvider: this.billingProvider,
    billingRef: this.billingRef,
    status: this.status,
    startsAt: this.startsAt?.toISOString() ?? null,
    endsAt: this.endsAt.toISOString(),
    unlockedAt: this.unlockedAt?.toISOString() ?? null,
    createdAt: this.createdAt.toISOString(),
  };
};

module.exports = mongoose.models.Session || mongoose.model("Session", sessionSchema);
