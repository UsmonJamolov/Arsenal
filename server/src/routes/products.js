const express = require("express");
const Product = require("../models/Product");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const products = await Product.find({ quantity: { $gt: 0 } }).sort({ createdAt: 1 });
    res.json(products.map((product) => product.toJSON()));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
