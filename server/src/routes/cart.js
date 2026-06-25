const express = require("express");
const { pushNotification } = require("../services/settings");
const { cancelBooking } = require("../services/bookingService");
const { reconcileCartWithActiveBookings } = require("../services/cartReconcile");

const router = express.Router();

function cartTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

router.get("/", async (req, res, next) => {
  try {
    const { paymentStatus } = req.userCart;
    const items = await reconcileCartWithActiveBookings(req.userId, [...req.userCart.cart]);
    req.userCart.cart = items;

    res.json({
      items,
      total: cartTotal(items),
      paymentStatus,
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/", async (req, res, next) => {
  try {
    const items = [...req.userCart.cart];

    for (const item of items) {
      if (item.type !== "booking") {
        continue;
      }

      await cancelBooking(item.id, req.userId);
    }

    req.userCart.cart = [];
    req.userCart.paymentStatus = "pending";
    await pushNotification("Savat tozalandi.", "cart");

    res.json({ items: [], total: 0, paymentStatus: req.userCart.paymentStatus });
  } catch (error) {
    next(error);
  }
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
