const mongoose = require("mongoose");

const hookahBrandSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "hookah_brands" },
);

hookahBrandSchema.methods.toJSON = function toJSON() {
  return {
    id: this.slug,
    title: this.title,
    sortOrder: this.sortOrder ?? 0,
  };
};

module.exports = mongoose.models.HookahBrand || mongoose.model("HookahBrand", hookahBrandSchema);
