const express = require("express");
const { pushNotification } = require("../services/settings");

const router = express.Router();

function cartTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

router.get("/", (req, res) => {
  const { cart, paymentStatus } = req.userCart;
  res.json({
    items: cart,
    total: cartTotal(cart),
    paymentStatus,
  });
});

router.delete("/", async (req, res) => {
  req.userCart.cart = [];
  req.userCart.paymentStatus = "pending";
  await pushNotification("Savat tozalandi.", "cart");
  res.json({ items: [], total: 0, paymentStatus: req.userCart.paymentStatus });
});

router.delete("/:id", async (req, res) => {
  const before = req.userCart.cart.length;
  req.userCart.cart = req.userCart.cart.filter((item) => item.id !== req.params.id);

  if (req.userCart.cart.length === before) {
    return res.status(404).json({ message: "Savat elementi topilmadi" });
  }

  await pushNotification("Savatdan element olib tashlandi.", "cart");

  res.json({
    items: req.userCart.cart,
    total: cartTotal(req.userCart.cart),
    paymentStatus: req.userCart.paymentStatus,
  });
});

module.exports = router;
