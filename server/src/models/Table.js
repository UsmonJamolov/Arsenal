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
  },
  { timestamps: true, collection: "tables" },
);

tableSchema.methods.toJSON = function toJSON() {
  return {
    id: this.slug,
    title: this.title,
    status: this.status,
  };
};

module.exports = mongoose.models.Table || mongoose.model("Table", tableSchema);
