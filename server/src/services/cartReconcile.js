const mongoose = require("mongoose");
const Booking = require("../models/Booking");

async function reconcileCartWithActiveBookings(userId, cart) {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return cart;
  }

  const uid = new mongoose.Types.ObjectId(userId);
  const activeBookings = await Booking.find({ userId: uid, status: "active" }).sort({ createdAt: -1 });
  const cartIds = new Set(cart.map((item) => item.id));

  for (const booking of activeBookings) {
    const id = booking._id.toString();
    if (cartIds.has(id)) {
      continue;
    }

    cart.push({
      id,
      type: "booking",
      title: `${booking.deviceName} bron`,
      price: booking.price,
    });
    cartIds.add(id);
  }

  return cart;
}

module.exports = { reconcileCartWithActiveBookings };
