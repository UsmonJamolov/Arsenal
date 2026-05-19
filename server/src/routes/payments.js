const express = require("express");
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const { pushNotification: pushStoreNotification } = require("../store");
const { pushNotification } = require("../services/settings");
const { createSessionFromBooking } = require("../services/sessionService");

const router = express.Router();

router.get("/history", async (req, res, next) => {
  try {
    const userId = req.userId || req.query.userId;

    if (!userId) {
      return res.json({ payments: [], orders: [] });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "userId noto'g'ri" });
    }

    const payments = await Payment.find({ userId })
      .sort({ paidAt: -1 })
      .limit(50);

    const orders = payments.flatMap((payment) =>
      payment.items.map((item) => ({
        id: item.id,
        title: item.title,
        price: item.price,
        type: item.type,
        paymentMethod: payment.method,
        paidAt: payment.paidAt.toISOString(),
        paymentId: payment._id.toString(),
      })),
    );

    res.json({
      payments: payments.map((p) => p.toJSON()),
      orders,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const userId = req.userId || req.body?.userId;
    const { method } = req.body ?? {};
    const { cart, paymentStatus } = req.userCart;

    if (!userId) {
      return res.status(401).json({ message: "To'lov uchun avval tizimga kiring" });
    }

    if (!cart.length) {
      return res.status(400).json({ message: "Savat bo'sh: avval mahsulot yoki bron qo'shing" });
    }

    const state = require("../store").getState();
    const allowed = state.paymentMethods;
    const paymentMethod = method || allowed[0];

    if (!allowed.includes(paymentMethod)) {
      return res.status(400).json({ message: "To'lov usuli noto'g'ri" });
    }

    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const sessions = [];
    const paidAt = new Date();

    for (const item of cart) {
      if (item.type !== "booking") {
        continue;
      }

      const booking = await Booking.findById(item.id);

      if (!booking || booking.status !== "active") {
        continue;
      }

      const session = await createSessionFromBooking({
        booking,
        paymentMethod,
        amount: item.price,
      });

      if (!booking.userId) {
        booking.userId = userId;
        await booking.save();
      }

      sessions.push({
        id: session._id.toString(),
        deviceId: session.deviceId,
        deviceName: session.deviceName,
        stationId: session.stationId,
        unlockPin: session.unlockPin,
        endsAt: session.endsAt.toISOString(),
        durationMinutes: session.durationMinutes,
        status: session.status,
      });
    }

    await Payment.create({
      userId,
      items: cart.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        price: item.price,
      })),
      total,
      method: paymentMethod,
      paidAt,
    });

    cart.length = 0;
    req.userCart.paymentStatus = "paid";

    const message = `To'lov muvaffaqiyatli! Jami: ${total} so'm (${paymentMethod}).`;
    pushStoreNotification(message);
    await pushNotification(message, "bookings");

    res.json({
      status: "paid",
      method: paymentMethod,
      total,
      paidAt: paidAt.toISOString(),
      sessions,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
