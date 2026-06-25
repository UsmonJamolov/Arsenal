const HookahOrder = require("../models/HookahOrder");
const Payment = require("../models/Payment");
const Table = require("../models/Table");const { broadcastUpdate } = require("../realtime");

async function createHookahOrderFromPaymentItem({ userId, paymentId, item }) {
  return HookahOrder.create({
    userId,
    paymentId,
    title: item.title,
    tableIds: Array.isArray(item.tableIds) ? item.tableIds : [],
    startHour: item.startHour ? String(item.startHour).trim() : "",
    quantity: Math.max(1, Number(item.quantity) || 1),
    price: item.price,
    status: "active",
  });
}

async function releaseHookahOrderTables(tableIds) {
  const slugs = [...new Set(tableIds.map((id) => String(id || "").trim()).filter(Boolean))];

  if (!slugs.length) {
    return;
  }

  await Table.updateMany({ slug: { $in: slugs } }, { status: "available" });
  broadcastUpdate({ entity: "tables", message: "Stol bo'shatildi" });
}

async function completeHookahOrder(orderId) {
  const order = await HookahOrder.findById(orderId);

  if (!order || order.status !== "active") {
    return { ok: false, message: "Kalyan buyurtmasi topilmadi" };
  }

  order.status = "completed";
  await order.save();
  await releaseHookahOrderTables(order.tableIds);

  broadcastUpdate({ entity: "bookings", message: "Kalyan buyurtmasi yakunlandi" });

  return { ok: true, order };
}

async function cancelHookahOrder(orderId) {
  const order = await HookahOrder.findById(orderId);

  if (!order) {
    return { ok: false, message: "Kalyan buyurtmasi topilmadi" };
  }

  if (order.status === "cancelled") {
    return { ok: true, order };
  }

  order.status = "cancelled";
  await order.save();
  await releaseHookahOrderTables(order.tableIds);

  broadcastUpdate({ entity: "bookings", message: "Kalyan buyurtmasi bekor qilindi" });

  return { ok: true, order };
}

async function backfillHookahOrdersFromPayments() {
  const payments = await Payment.find().sort({ paidAt: 1 });

  for (const payment of payments) {
    for (const item of payment.items) {
      if (item.type !== "hookah") {
        continue;
      }

      const existing = await HookahOrder.findOne({
        paymentId: payment._id,
        title: item.title,
      });

      if (existing) {
        continue;
      }

      await createHookahOrderFromPaymentItem({
        userId: payment.userId,
        paymentId: payment._id,
        item,
      });
    }
  }
}

module.exports = {
  createHookahOrderFromPaymentItem,
  completeHookahOrder,
  cancelHookahOrder,
  backfillHookahOrdersFromPayments,
};
