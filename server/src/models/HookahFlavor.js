const mongoose = require("mongoose");

const hookahFlavorSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: "" },
    brand: { type: String, default: "serbetli", trim: true },
    category: { type: String, default: "fruit", trim: true },
  },
  { timestamps: true, collection: "hookah_flavors" },
);

hookahFlavorSchema.methods.toJSON = function toJSON() {
  return {
    id: this.slug,
    title: this.title,
    price: this.price,
    image: this.image || undefined,
    brand: this.brand || undefined,
    category: this.category || undefined,
  };
};

module.exports = mongoose.models.HookahFlavor || mongoose.model("HookahFlavor", hookahFlavorSchema);
