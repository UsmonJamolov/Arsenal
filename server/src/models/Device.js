const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    pricePerHour: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["available", "busy", "booked"],
      default: "available",
    },
    area: {
      type: String,
      enum: ["zal", "kabina"],
      default: "zal",
    },
    stationId: { type: String, default: null, trim: true },
    agentHost: { type: String, default: null, trim: true },
    macAddress: { type: String, default: null, trim: true },
    billingProvider: {
      type: String,
      enum: ["custom", "ggleap", "ccboot"],
      default: "custom",
    },
    billingStationId: { type: String, default: null, trim: true },
  },
  { timestamps: true, collection: "devices" },
);

deviceSchema.methods.toJSON = function toJSON() {
  return {
    id: this.slug,
    name: this.name,
    type: this.type,
    pricePerHour: this.pricePerHour,
    status: this.status,
    area: this.area,
    stationId: this.stationId,
    agentHost: this.agentHost,
    macAddress: this.macAddress,
    billingProvider: this.billingProvider,
    billingStationId: this.billingStationId,
  };
};

module.exports = mongoose.models.Device || mongoose.model("Device", deviceSchema);
