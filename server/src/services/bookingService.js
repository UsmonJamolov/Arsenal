const Booking = require("../models/Booking");
const Device = require("../models/Device");
const Session = require("../models/Session");
const { getUserCartState } = require("../store/cartStore");
const { pushNotification } = require("./settings");
const { cancelSessionById } = require("./sessionService");

function assertBookingOwner(booking, userId) {
  if (!userId) {
    return true;
  }
  if (!booking.userId) {
    return true;
  }
  return booking.userId.toString() === String(userId);
}

async function cancelBooking(bookingId, userId) {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    return { ok: false, message: "Bron topilmadi" };
  }

  if (!assertBookingOwner(booking, userId)) {
    return { ok: false, message: "Bu bronni bekor qila olmaysiz" };
  }

  if (booking.status === "cancelled") {
    return { ok: false, message: "Bron allaqachon bekor qilingan" };
  }

  if (booking.status === "completed") {
    return { ok: false, message: "Tugallangan bronni bekor qilib bo'lmaydi" };
  }

  const cartState = getUserCartState(booking.userId?.toString() || userId);
  cartState.cart = cartState.cart.filter((item) => item.id !== booking._id.toString());

  const session = await Session.findOne({
    bookingId: booking._id,
    status: { $in: ["pending_unlock", "active"] },
  });

  if (session) {
    const cancelled = await cancelSessionById(session._id, { userId, skipBookingUpdate: true });
    if (!cancelled) {
      return { ok: false, message: "Sessiyani bekor qilib bo'lmadi" };
    }
  } else {
    await Device.findOneAndUpdate({ slug: booking.deviceId }, { status: "available" });
  }

  booking.status = "cancelled";
  await booking.save();

  await pushNotification(`${booking.deviceName} broni bekor qilindi.`, "bookings");

  return { ok: true, booking };
}

module.exports = { cancelBooking };
