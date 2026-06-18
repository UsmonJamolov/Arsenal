const mongoose = require("mongoose");
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

  return unique.map((booking) => booking.toJSON());
}

module.exports = { listBookingsForUser };
