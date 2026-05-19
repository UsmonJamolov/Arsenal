const express = require("express");
const Booking = require("../models/Booking");
const Device = require("../models/Device");
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
    const { deviceId, startHour, durationHours, userId } = req.body ?? {};

    if (!deviceId || !startHour || !durationHours) {
      return res.status(400).json({
        message: "deviceId, startHour va durationHours majburiy",
      });
    }

    const device = await Device.findOne({ slug: deviceId });

    if (!device) {
      return res.status(404).json({ message: "Qurilma topilmadi" });
    }

    if (device.status !== "available") {
      return res.status(409).json({ message: "Tanlangan qurilma hozir bo'sh emas" });
    }

    const hours = Number(durationHours);

    if (!Number.isFinite(hours) || hours < 1) {
      return res.status(400).json({ message: "durationHours noto'g'ri" });
    }

    const price = device.pricePerHour * hours;

    const ownerId = userId || req.userId || null;

    const booking = await Booking.create({
      userId: ownerId,
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

    req.userCart.cart.push(cartItem);
    await pushNotification("Bron muvaffaqiyatli qo'shildi.", "bookings");

    res.status(201).json({ booking: booking.toJSON(), cartItem });
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
