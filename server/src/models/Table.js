const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["available", "busy", "booked"],
      default: "available",
    },
    seats: { type: Number, default: 4, min: 1 },
    zone: { type: String, default: "Kafe zonasi", trim: true },
    image: { type: String, default: "" },
  },
  { timestamps: true, collection: "tables" },
);

tableSchema.methods.toJSON = function toJSON() {
  return {
    id: this.slug,
    title: this.title,
    status: this.status,
    seats: this.seats ?? 4,
    zone: this.zone || "Kafe zonasi",
    image: this.image || undefined,
  };
};

module.exports = mongoose.models.Table || mongoose.model("Table", tableSchema);
