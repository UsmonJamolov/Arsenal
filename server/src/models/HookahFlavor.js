const mongoose = require("mongoose");

const hookahFlavorSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
  },
  { timestamps: true, collection: "hookah_flavors" },
);

hookahFlavorSchema.methods.toJSON = function toJSON() {
  return {
    id: this.slug,
    title: this.title,
    price: this.price,
  };
};

module.exports = mongoose.models.HookahFlavor || mongoose.model("HookahFlavor", hookahFlavorSchema);
