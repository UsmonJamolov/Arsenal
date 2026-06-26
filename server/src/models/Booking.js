const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    deviceId: { type: String, required: true, trim: true },
    deviceName: { type: String, required: true, trim: true },
    startHour: { type: String, required: true, trim: true },
    durationHours: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["active", "accepted", "paid", "completed", "cancelled"],
      default: "active",
    },
  },
  { timestamps: true, collection: "bookings" },
);

bookingSchema.methods.toJSON = function toJSON() {
  return {
    id: this._id.toString(),
    userId: this.userId?.toString() ?? null,
    deviceId: this.deviceId,
    deviceName: this.deviceName,
    startHour: this.startHour,
    durationHours: this.durationHours,
    price: this.price,
    status: this.status,
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
  };
};

module.exports = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
