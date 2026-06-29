const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    price: { type: Number, required: true, min: 0, default: 0 },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    image: { type: String, default: "", trim: true },
  },
  { timestamps: true, collection: "products" },
);

productSchema.methods.toJSON = function toJSON() {
  return {
    id: this._id.toString(),
    title: this.title,
    description: this.description,
    price: this.price,
    quantity: this.quantity,
    image: this.image,
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
  };
};

module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);
