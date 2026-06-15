const crypto = require("crypto");
const config = require("../../config");

function isConfigured() {
  return Boolean(config.uzumMerchantId && config.uzumSecretKey && config.uzumTerminalId);
}

function buildSignature(payload) {
  const raw = JSON.stringify(payload) + config.uzumSecretKey;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

async function createCheckout({ intentId, amount, description, returnUrl }) {
  const payload = {
    terminal_id: config.uzumTerminalId,
    merchant_id: config.uzumMerchantId,
    order_id: intentId,
    amount: Math.round(amount * 100),
    currency: "UZS",
    description: description || "Arsenal Union to'lovi",
    return_url: returnUrl,
    callback_url: `${config.publicApiUrl}/api/payments/webhook/uzum`,
  };

  const response = await fetch(`${config.uzumApiUrl}/payments/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Merchant-Id": config.uzumMerchantId,
      "X-Signature": buildSignature(payload),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    const message = data.message || data.error || "Uzum API xatosi";
    throw new Error(message);
  }

  const checkoutUrl = data.payment_url || data.checkout_url || data.url;

  if (!checkoutUrl) {
    throw new Error("Uzum to'lov havolasi qaytmadi");
  }

  return {
    provider: "uzum",
    mode: "live",
    externalTransactionId: String(data.transaction_id || data.payment_id || intentId),
    checkoutUrl,
    returnUrl,
    metadata: { uzumOrderId: data.order_id || intentId },
  };
}

function verifyWebhook(body, signatureHeader) {
  const expected = buildSignature(body);

  if (signatureHeader && signatureHeader !== expected) {
    return { ok: false, message: "Uzum imzo noto'g'ri" };
  }

  const orderId = body.order_id || body.merchant_order_id;
  const status = String(body.status || body.payment_status || "").toLowerCase();
  const shouldComplete = ["paid", "success", "completed", "confirmed"].includes(status);

  if (!orderId) {
    return { ok: false, message: "order_id topilmadi" };
  }

  return {
    ok: true,
    intentId: String(orderId),
    externalTransactionId: String(body.transaction_id || body.payment_id || ""),
    shouldComplete,
  };
}

module.exports = { isConfigured, createCheckout, verifyWebhook };
