const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const PaymentIntent = require("../models/PaymentIntent");
const { getUserCartState } = require("../store/cartStore");
const { pushNotification: pushStoreNotification } = require("../store");
const { pushNotification } = require("./settings");
const { createSessionFromBooking } = require("./sessionService");

async function completePaymentIntent(intentId, { externalTransactionId = "", metadata = {} } = {}) {
  const intent = await PaymentIntent.findById(intentId);

  if (!intent) {
    return { ok: false, status: 404, message: "To'lov topilmadi" };
  }

  if (intent.status === "paid") {
    const payment = await Payment.findOne({ intentId: intent._id }).sort({ paidAt: -1 });
    return {
      ok: true,
      status: 200,
      alreadyPaid: true,
      intent,
      payment,
      sessions: intent.metadata?.sessions || [],
      total: intent.total,
      method: intent.method,
      paidAt: intent.paidAt?.toISOString(),
    };
  }

  if (intent.status !== "pending") {
    return { ok: false, status: 409, message: `To'lov holati: ${intent.status}` };
  }

  if (intent.expiresAt < new Date()) {
    intent.status = "expired";
    await intent.save();
    return { ok: false, status: 410, message: "To'lov muddati tugagan" };
  }

  const sessions = [];
  const paidAt = new Date();

  for (const item of intent.items) {
    if (item.type !== "booking") {
      continue;
    }

    const booking = await Booking.findById(item.id);

    if (!booking || booking.status !== "active") {
      continue;
    }

    try {
      const session = await createSessionFromBooking({
        booking,
        paymentMethod: intent.method,
        amount: item.price,
      });

      if (!booking.userId) {
        booking.userId = intent.userId;
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
    } catch (error) {
      console.error(`[payment] sessiya yaratilmadi (${item.id}):`, error.message);
    }
  }

  const payment = await Payment.create({
    userId: intent.userId,
    intentId: intent._id,
    items: intent.items,
    total: intent.total,
    method: intent.method,
    provider: intent.provider,
    externalTransactionId: externalTransactionId || intent.externalTransactionId,
    paidAt,
  });

  intent.status = "paid";
  intent.paidAt = paidAt;
  if (externalTransactionId) {
    intent.externalTransactionId = externalTransactionId;
  }
  intent.metadata = { ...intent.metadata, ...metadata, sessions };
  await intent.save();

  const userCart = getUserCartState(intent.userId.toString());
  userCart.cart = [];
  userCart.paymentStatus = "paid";

  const message = `To'lov muvaffaqiyatli! Jami: ${intent.total} so'm (${intent.method}).`;
  pushStoreNotification(message);
  await pushNotification(message, "bookings");

  return {
    ok: true,
    status: 200,
    intent,
    payment,
    sessions,
    total: intent.total,
    method: intent.method,
    paidAt: paidAt.toISOString(),
  };
}

module.exports = { completePaymentIntent };
