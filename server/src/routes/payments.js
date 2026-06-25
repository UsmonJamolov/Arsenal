const express = require("express");
const mongoose = require("mongoose");
const config = require("../config");
const Payment = require("../models/Payment");
const PaymentIntent = require("../models/PaymentIntent");
const { getState } = require("../store");
const { getUserCartState } = require("../store/cartStore");
const { reconcileCartWithActiveBookings } = require("../services/cartReconcile");
const { completePaymentIntent } = require("../services/paymentCompletion");
const {
  createCheckout,
  getWebhookVerifier,
  resolveProviderKey,
  shouldUseSandbox,
} = require("../services/paymentProviders");

const router = express.Router();

const INTENT_TTL_MINUTES = 30;

function resolveClientOrigin(req) {
  const origin = req.get("origin");
  if (origin) {
    return origin.replace(/\/$/, "");
  }

  const referer = req.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      /* noto'g'ri referer */
    }
  }

  const forwardedHost = req.get("x-forwarded-host");
  if (forwardedHost) {
    const proto = req.get("x-forwarded-proto") || "https";
    return `${proto}://${forwardedHost}`.replace(/\/$/, "");
  }

  return config.publicSiteUrl.replace(/\/$/, "");
}

function buildReturnUrl(intentId, siteOrigin) {
  const base = siteOrigin || config.publicSiteUrl.replace(/\/$/, "");
  return `${base}/payment/return?intent=${intentId}`;
}

function snapshotCart(cart) {
  return cart.map((item) => {
    const snapshot = {
      id: item.id,
      type: item.type,
      title: item.title,
      price: item.price,
    };

    if (item.type === "hookah") {
      if (Array.isArray(item.tableIds) && item.tableIds.length) {
        snapshot.tableIds = item.tableIds;
      }
      if (item.startHour) {
        snapshot.startHour = String(item.startHour).trim();
      }
      if (item.quantity) {
        snapshot.quantity = Number(item.quantity) || 1;
      }
    }

    return snapshot;
  });
}

router.get("/history", async (req, res, next) => {
  try {
    const userId = req.userId || req.query.userId;

    if (!userId) {
      return res.json({ payments: [], orders: [] });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "userId noto'g'ri" });
    }

    const payments = await Payment.find({ userId })
      .sort({ paidAt: -1 })
      .limit(50);

    const orders = payments.flatMap((payment) =>
      payment.items.map((item) => ({
        id: item.id,
        title: item.title,
        price: item.price,
        type: item.type,
        paymentMethod: payment.method,
        paidAt: payment.paidAt.toISOString(),
        paymentId: payment._id.toString(),
      })),
    );

    res.json({
      payments: payments.map((p) => p.toJSON()),
      orders,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/status/:intentId", async (req, res, next) => {
  try {
    const intent = await PaymentIntent.findById(req.params.intentId);

    if (!intent) {
      return res.status(404).json({ message: "To'lov topilmadi" });
    }

    if (req.userId && intent.userId.toString() !== String(req.userId)) {
      return res.status(403).json({ message: "Ruxsat yo'q" });
    }

    let sessions = [];

    if (intent.status === "paid") {
      const result = await completePaymentIntent(intent._id);
      sessions = result.sessions || [];
    }

    res.json({
      intent: intent.toJSON(),
      status: intent.status,
      sessions,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/checkout", handleCheckout);
router.post("/", handleCheckout);

async function handleCheckout(req, res, next) {
  try {
    const userId = req.userId || req.body?.userId;
    const { method, phoneNumber } = req.body ?? {};

    if (!userId) {
      return res.status(401).json({ message: "To'lov uchun avval tizimga kiring" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Foydalanuvchi ID noto'g'ri" });
    }

    const userCart = getUserCartState(userId);
    const cart = await reconcileCartWithActiveBookings(userId, [...userCart.cart]);
    userCart.cart = cart;

    if (!cart.length) {
      return res.status(400).json({ message: "Savat bo'sh: avval mahsulot yoki bron qo'shing" });
    }

    const state = getState();
    const allowed = state.paymentMethods;
    const paymentMethod = method || allowed[0];

    if (!allowed.includes(paymentMethod)) {
      return res.status(400).json({ message: "To'lov usuli noto'g'ri" });
    }

    const providerKey = resolveProviderKey(paymentMethod);

    if (!providerKey) {
      return res.status(400).json({ message: "To'lov provayderi topilmadi" });
    }

    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const expiresAt = new Date(Date.now() + INTENT_TTL_MINUTES * 60 * 1000);

    await PaymentIntent.updateMany(
      {
        userId,
        status: "pending",
        expiresAt: { $lt: new Date() },
      },
      { status: "expired" },
    );

    const intent = await PaymentIntent.create({
      userId,
      items: snapshotCart(cart),
      total,
      method: paymentMethod,
      provider: shouldUseSandbox(providerKey) ? "sandbox" : providerKey,
      status: "pending",
      mode: shouldUseSandbox(providerKey) ? "sandbox" : "live",
      expiresAt,
    });

    const siteOrigin = resolveClientOrigin(req);
    const returnUrl = buildReturnUrl(intent._id.toString(), siteOrigin);
    const description = `Arsenal Union — ${cart.length} ta buyurtma`;

    const checkout = await createCheckout({
      method: paymentMethod,
      intentId: intent._id.toString(),
      amount: total,
      description,
      returnUrl,
      phoneNumber,
      siteOrigin,
    });

    intent.provider = checkout.provider;
    intent.mode = checkout.mode;
    intent.externalTransactionId = checkout.externalTransactionId || "";
    intent.checkoutUrl = checkout.checkoutUrl;
    intent.returnUrl = checkout.returnUrl || returnUrl;
    intent.metadata = checkout.metadata || {};
    await intent.save();

    res.status(201).json({
      intentId: intent._id.toString(),
      status: "pending",
      method: paymentMethod,
      provider: intent.provider,
      mode: intent.mode,
      total,
      checkoutUrl: intent.checkoutUrl,
      returnUrl: intent.returnUrl,
      expiresAt: intent.expiresAt.toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

router.post("/sandbox/:intentId/complete", async (req, res, next) => {
  try {
    const intent = await PaymentIntent.findById(req.params.intentId);

    if (!intent) {
      return res.status(404).json({ message: "To'lov topilmadi" });
    }

    if (intent.mode !== "sandbox" && config.paymentMode !== "sandbox") {
      return res.status(403).json({ message: "Demo to'lov faqat test rejimida" });
    }

    if (req.userId && intent.userId.toString() !== String(req.userId)) {
      return res.status(403).json({ message: "Ruxsat yo'q" });
    }

    const result = await completePaymentIntent(intent._id, {
      externalTransactionId: `sandbox_${intent._id}`,
      metadata: { sandbox: true },
    });

    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }

    res.json({
      status: "paid",
      method: result.method,
      total: result.total,
      paidAt: result.paidAt,
      sessions: result.sessions,
      intent: result.intent.toJSON(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/return", async (req, res, next) => {
  try {
    const { intent, status } = req.query;

    if (!intent) {
      return res.status(400).json({ message: "intent parametri kerak" });
    }

    const paymentIntent = await PaymentIntent.findById(intent);

    if (!paymentIntent) {
      return res.status(404).json({ message: "To'lov topilmadi" });
    }

    if (status === "cancel" || status === "cancelled") {
      paymentIntent.status = "cancelled";
      await paymentIntent.save();
      return res.json({ status: "cancelled", intent: paymentIntent.toJSON() });
    }

    if (paymentIntent.status === "paid") {
      const result = await completePaymentIntent(paymentIntent._id);
      return res.json({
        status: "paid",
        intent: paymentIntent.toJSON(),
        sessions: result.sessions || [],
      });
    }

    res.json({
      status: paymentIntent.status,
      intent: paymentIntent.toJSON(),
      message: "To'lov hali tasdiqlanmagan. Bir necha soniyadan keyin qayta tekshiring.",
    });
  } catch (error) {
    next(error);
  }
});

router.post("/webhook/payme", async (req, res, next) => {
  try {
    const verify = getWebhookVerifier("payme");
    const parsed = await verify(req.body);

    if (!parsed.ok) {
      return res.status(400).json({ error: { message: parsed.message } });
    }

    if (parsed.shouldComplete) {
      await completePaymentIntent(parsed.intentId, {
        externalTransactionId: parsed.externalTransactionId,
        metadata: { webhook: "payme" },
      });
    }

    res.json({ result: { allow: true } });
  } catch (error) {
    next(error);
  }
});

router.post("/webhook/click", async (req, res, next) => {
  try {
    const verify = getWebhookVerifier("click");
    const parsed = verify(req.body);

    if (!parsed.ok) {
      return res.status(400).json({ error_note: parsed.message });
    }

    if (parsed.shouldComplete) {
      await completePaymentIntent(parsed.intentId, {
        externalTransactionId: parsed.externalTransactionId,
        metadata: { webhook: "click" },
      });
    }

    res.json({ error_code: 0, error_note: "Success" });
  } catch (error) {
    next(error);
  }
});

router.post("/webhook/uzum", async (req, res, next) => {
  try {
    const verify = getWebhookVerifier("uzum");
    const parsed = verify(req.body, req.header("X-Signature"));

    if (!parsed.ok) {
      return res.status(400).json({ success: false, message: parsed.message });
    }

    if (parsed.shouldComplete) {
      await completePaymentIntent(parsed.intentId, {
        externalTransactionId: parsed.externalTransactionId,
        metadata: { webhook: "uzum" },
      });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
