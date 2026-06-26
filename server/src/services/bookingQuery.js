const mongoose = require("mongoose");
const HookahOrder = require("../models/HookahOrder");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");

async function listBookingsForUser(userId) {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return [];
  }

  const uid = new mongoose.Types.ObjectId(userId);

  const payments = await Payment.find({ userId: uid }).sort({ paidAt: -1 }).limit(100);
  const paymentBookingIds = payments
    .flatMap((payment) => payment.items)
    .filter((item) => item.type === "booking")
    .map((item) => item.id)
    .filter((id) => mongoose.Types.ObjectId.isValid(id));

  const bookings = await Booking.find({
    $or: [{ userId: uid }, { _id: { $in: paymentBookingIds } }],
  }).sort({ createdAt: -1 });

  const seen = new Set();
  const unique = [];

  for (const booking of bookings) {
    const key = booking._id.toString();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    if (!booking.userId) {
      continue;
    }
    unique.push(booking);
  }

  const hookahOrders = await HookahOrder.find({ userId: uid }).sort({ createdAt: -1 });

  const deviceBookings = unique.map((booking) => booking.toJSON());
  const hookahBookings = hookahOrders.map((order) => ({
    id: order._id.toString(),
    deviceId: "hookah",
    deviceName: order.title,
    startHour: order.startHour,
    durationHours: order.quantity,
    price: order.price,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  }));

  return [...deviceBookings, ...hookahBookings].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

module.exports = { listBookingsForUser };
