const Booking = require("../models/Booking");
const Session = require("../models/Session");const { getUserCartState } = require("../store/cartStore");
const { pushNotification } = require("./settings");
const { cancelSessionById } = require("./sessionService");
const { releaseDeviceIfIdle } = require("./deviceRelease");
const { syncAllTableStatuses } = require("./tableSync");
const { broadcastUpdate } = require("../realtime");

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
    await releaseDeviceIfIdle(booking.deviceId, booking.deviceName, booking._id);
  }

  booking.status = "cancelled";
  await booking.save();

  await pushNotification(`${booking.deviceName} broni bekor qilindi.`, "bookings");
  await syncAllTableStatuses({ broadcast: true });
  broadcastUpdate({ entity: "devices", message: `${booking.deviceName} bo'sh` });
  broadcastUpdate({ entity: "bookings", message: `${booking.deviceName} broni bekor qilindi` });

  return { ok: true, booking };
}

module.exports = { cancelBooking };
