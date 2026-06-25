const mongoose = require("mongoose");

const paymentItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ["booking", "hookah"], required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    tableIds: { type: [String], default: undefined },
    startHour: { type: String, default: undefined },
    quantity: { type: Number, default: undefined },
  },
  { _id: false },
);

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    intentId: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentIntent", default: null, index: true },
    items: { type: [paymentItemSchema], default: [] },
    total: { type: Number, required: true, min: 0 },
    method: { type: String, required: true, trim: true },
    provider: { type: String, default: "", trim: true },
    externalTransactionId: { type: String, default: "", trim: true },
    paidAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "payments" },
);

paymentSchema.methods.toJSON = function toJSON() {
  return {
    id: this._id.toString(),
    userId: this.userId.toString(),
    items: this.items,
    total: this.total,
    method: this.method,
    paymentMethod: this.method,
    provider: this.provider,
    externalTransactionId: this.externalTransactionId,
    intentId: this.intentId ? this.intentId.toString() : null,
    paidAt: this.paidAt.toISOString(),
  };
};

module.exports = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
