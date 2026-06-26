const mongoose = require("mongoose");

const hookahOrderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", default: null },
    title: { type: String, required: true, trim: true },
    tableIds: { type: [String], default: [] },
    startHour: { type: String, default: "", trim: true },
    quantity: { type: Number, default: 1, min: 1 },
    price: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["active", "accepted", "completed", "cancelled"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true, collection: "hookah_orders" },
);

hookahOrderSchema.methods.toJSON = function toJSON() {
  return {
    id: this._id.toString(),
    kind: "hookah",
    userId: this.userId?.toString() ?? null,
    paymentId: this.paymentId?.toString() ?? null,
    title: this.title,
    tableIds: this.tableIds,
    deviceName: this.title,
    startHour: this.startHour,
    durationHours: this.quantity,
    price: this.price,
    status: this.status,
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
  };
};

module.exports = mongoose.models.HookahOrder || mongoose.model("HookahOrder", hookahOrderSchema);
