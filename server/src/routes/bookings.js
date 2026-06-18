const express = require("express");
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Device = require("../models/Device");
const User = require("../models/User");
const { getUserCartState } = require("../store/cartStore");
const { pushNotification } = require("../services/settings");
const { cancelBooking } = require("../services/bookingService");
const { listBookingsForUser } = require("../services/bookingQuery");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const userId = req.query.userId || req.userId;

    if (userId) {
      const bookings = await listBookingsForUser(userId);
      return res.json(bookings);
    }

    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings.map((b) => b.toJSON()));
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { deviceId, deviceIds, startHour, durationHours, userId } = req.body ?? {};

    if (!startHour || !durationHours) {
      return res.status(400).json({
        message: "deviceId, startHour va durationHours majburiy",
      });
    }

    const requestedIds = Array.isArray(deviceIds)
      ? deviceIds.map((id) => String(id).trim()).filter(Boolean)
      : deviceId
        ? [String(deviceId).trim()]
        : [];

    if (!requestedIds.length) {
      return res.status(400).json({ message: "Kamida bitta qurilma tanlang" });
    }

    const hours = Number(durationHours);

    if (!Number.isFinite(hours) || hours < 1) {
      return res.status(400).json({ message: "durationHours noto'g'ri" });
    }

    const uniqueIds = [...new Set(requestedIds)];
    const devices = await Promise.all(uniqueIds.map((id) => Device.findOne({ slug: id })));

    if (devices.some((device) => !device)) {
      return res.status(404).json({ message: "Qurilma topilmadi" });
    }

    const unavailable = devices.find((device) => device.status !== "available");
    if (unavailable) {
      return res.status(409).json({ message: `${unavailable.name} hozir bo'sh emas` });
    }

    const ownerId = userId || req.userId || null;

    if (!ownerId || !mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(401).json({ message: "Bron uchun avval tizimga kiring" });
    }

    const customer = await User.findById(ownerId);

    if (!customer || customer.role !== "user") {
      return res.status(403).json({ message: "Faqat ro'yxatdan o'tgan mijozlar bron qila oladi" });
    }

    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);
    const ownerCart = getUserCartState(ownerId);
    const bookings = [];
    const cartItems = [];

    for (const device of devices) {
      const price = device.pricePerHour * hours;

      const booking = await Booking.create({
        userId: ownerObjectId,
        deviceId: device.slug,
        deviceName: device.name,
        startHour: String(startHour),
        durationHours: hours,
        price,
        status: "active",
      });

      device.status = "booked";
      await device.save();

      const cartItem = {
        id: booking._id.toString(),
        type: "booking",
        title: `${device.name} bron`,
        price: booking.price,
      };

      ownerCart.cart.push(cartItem);
      bookings.push(booking.toJSON());
      cartItems.push(cartItem);
    }

    await pushNotification("Bron muvaffaqiyatli qo'shildi.", "bookings");

    if (bookings.length === 1) {
      return res.status(201).json({ booking: bookings[0], cartItem: cartItems[0] });
    }

    res.status(201).json({ bookings, cartItems });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/cancel", async (req, res, next) => {
  try {
    const { userId } = req.body ?? {};
    const result = await cancelBooking(req.params.id, userId);

    if (!result.ok) {
      return res.status(400).json({ message: result.message });
    }

    await pushNotification(`Bron bekor qilindi: ${result.booking.deviceName}`, "bookings");

    res.json({
      message: "Bron bekor qilindi",
      booking: result.booking.toJSON(),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
