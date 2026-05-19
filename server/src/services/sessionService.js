const Booking = require("../models/Booking");
const Device = require("../models/Device");
const Session = require("../models/Session");
const { getUserCartState } = require("../store/cartStore");
const { resolveDeviceProvider } = require("./billing");
const { pushNotification } = require("./settings");

function generatePin() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function resolveStationId(device) {
  return device.stationId || device.billingStationId || device.slug;
}

async function createSessionFromBooking({ booking, paymentMethod, amount }) {
  const device = await Device.findOne({ slug: booking.deviceId });

  if (!device) {
    throw new Error(`Qurilma topilmadi: ${booking.deviceId}`);
  }

  const durationMinutes = booking.durationHours * 60;
  const endsAt = new Date(Date.now() + durationMinutes * 60 * 1000);
  const provider = resolveDeviceProvider(device);

  const session = await Session.create({
    bookingId: booking._id,
    userId: booking.userId,
    deviceId: device.slug,
    deviceName: device.name,
    stationId: resolveStationId(device),
    unlockPin: generatePin(),
    durationMinutes,
    amount: amount ?? booking.price,
    paymentMethod: paymentMethod || "",
    billingProvider: device.billingProvider || "custom",
    status: "pending_unlock",
    endsAt,
  });

  const billing = await provider.startSession({ device, session });

  session.billingRef = billing.billingRef;
  await session.save();

  device.status = "booked";
  await device.save();

  await pushNotification(
    `${device.name} uchun sessiya yaratildi. PIN: ${session.unlockPin}`,
    "devices",
  );

  return session;
}

async function unlockSessionWithPin({ pin, deviceId, stationId }) {
  const query = {
    unlockPin: String(pin).trim(),
    status: "pending_unlock",
    endsAt: { $gt: new Date() },
  };

  if (deviceId) {
    query.deviceId = deviceId;
  }
  if (stationId) {
    query.stationId = stationId;
  }

  const session = await Session.findOne(query).sort({ createdAt: -1 });

  if (!session) {
    return { ok: false, message: "PIN noto'g'ri yoki sessiya muddati tugagan" };
  }

  const device = await Device.findOne({ slug: session.deviceId });

  if (!device) {
    return { ok: false, message: "Qurilma topilmadi" };
  }

  const provider = resolveDeviceProvider(device);
  await provider.unlockSession({ device, session });

  session.status = "active";
  session.startsAt = new Date();
  session.unlockedAt = new Date();
  await session.save();

  device.status = "busy";
  await device.save();

  await pushNotification(`${device.name} ochildi — sessiya boshlandi.`, "devices");

  return { ok: true, session };
}

async function completeSession(sessionId, reason = "completed") {
  const session = await Session.findById(sessionId);

  if (!session || ["completed", "cancelled", "expired"].includes(session.status)) {
    return null;
  }

  const device = await Device.findOne({ slug: session.deviceId });

  if (device) {
    const provider = resolveDeviceProvider(device);
    await provider.stopSession({ device, session });
    device.status = "available";
    await device.save();
  }

  if (reason === "expired") {
    session.status = "expired";
  } else if (reason === "cancelled") {
    session.status = "cancelled";
  } else {
    session.status = "completed";
  }
  await session.save();

  if (session.bookingId) {
    const bookingStatus = reason === "cancelled" ? "cancelled" : "completed";
    await Booking.findByIdAndUpdate(session.bookingId, { status: bookingStatus });
  }

  await pushNotification(`${session.deviceName} sessiyasi yakunlandi.`, "devices");

  return session;
}

async function expireDueSessions() {
  const now = new Date();
  const due = await Session.find({
    status: { $in: ["pending_unlock", "active"] },
    endsAt: { $lte: now },
  });

  for (const session of due) {
    await completeSession(session._id, "expired");
  }

  return due.length;
}

async function cancelSessionById(sessionId, options = {}) {
  const { userId, skipBookingUpdate = false } = options;
  const session = await Session.findById(sessionId);

  if (!session) {
    return null;
  }

  if (["completed", "cancelled", "expired"].includes(session.status)) {
    return null;
  }

  if (userId && session.userId && session.userId.toString() !== String(userId)) {
    return null;
  }

  const device = await Device.findOne({ slug: session.deviceId });

  if (device) {
    const provider = resolveDeviceProvider(device);
    await provider.stopSession({ device, session });
    device.status = "available";
    await device.save();
  }

  session.status = "cancelled";
  await session.save();

  if (!skipBookingUpdate && session.bookingId) {
    await Booking.findByIdAndUpdate(session.bookingId, { status: "cancelled" });
  }

  const cartState = getUserCartState(session.userId?.toString());
  if (session.bookingId) {
    cartState.cart = cartState.cart.filter((item) => item.id !== session.bookingId.toString());
  }

  await pushNotification(`${session.deviceName} sessiyasi bekor qilindi.`, "devices");

  return session;
}

module.exports = {
  createSessionFromBooking,
  unlockSessionWithPin,
  completeSession,
  cancelSessionById,
  expireDueSessions,
  generatePin,
};
