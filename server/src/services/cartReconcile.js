const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");

async function reconcileCartWithActiveBookings(userId, cart) {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return cart;
  }

  const uid = new mongoose.Types.ObjectId(userId);
  const activeBookings = await Booking.find({ userId: uid, status: "active" }).sort({ createdAt: -1 });

  const payments = await Payment.find({ userId: uid }).select("items.id items.type").lean();
  const paidBookingIds = new Set(
    payments
      .flatMap((payment) => payment.items || [])
      .filter((item) => item.type === "booking")
      .map((item) => String(item.id)),
  );

  const activeIds = new Set(
    activeBookings
      .map((booking) => booking._id.toString())
      .filter((id) => !paidBookingIds.has(id)),
  );

  const nextCart = cart.filter(
    (item) =>
      item.type !== "booking" || (activeIds.has(item.id) && !paidBookingIds.has(item.id)),
  );
  const cartIds = new Set(nextCart.map((item) => item.id));

  for (const booking of activeBookings) {
    const id = booking._id.toString();
    if (cartIds.has(id) || paidBookingIds.has(id)) {
      continue;
    }

    nextCart.push({
      id,
      type: "booking",
      title: `${booking.deviceName} bron`,
      price: booking.price,
    });
    cartIds.add(id);
  }

  return nextCart;
}

module.exports = { reconcileCartWithActiveBookings };
