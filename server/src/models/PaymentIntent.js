const mongoose = require("mongoose");

const intentItemSchema = new mongoose.Schema(
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

const paymentIntentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [intentItemSchema], default: [] },
    total: { type: Number, required: true, min: 0 },
    method: { type: String, required: true, trim: true },
    provider: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "expired", "cancelled"],
      default: "pending",
      index: true,
    },
    mode: { type: String, enum: ["sandbox", "live"], default: "sandbox" },
    externalTransactionId: { type: String, default: "", trim: true },
    checkoutUrl: { type: String, default: "", trim: true },
    returnUrl: { type: String, default: "", trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    paidAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true, collection: "payment_intents" },
);

paymentIntentSchema.methods.toJSON = function toJSON() {
  return {
    id: this._id.toString(),
    userId: this.userId.toString(),
    items: this.items,
    total: this.total,
    method: this.method,
    provider: this.provider,
    status: this.status,
    mode: this.mode,
    externalTransactionId: this.externalTransactionId,
    checkoutUrl: this.checkoutUrl,
    returnUrl: this.returnUrl,
    paidAt: this.paidAt ? this.paidAt.toISOString() : null,
    expiresAt: this.expiresAt.toISOString(),
    createdAt: this.createdAt.toISOString(),
  };
};

module.exports =
  mongoose.models.PaymentIntent || mongoose.model("PaymentIntent", paymentIntentSchema);
