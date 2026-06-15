const config = require("../../config");

function isConfigured() {
  return Boolean(config.paymeMerchantId && config.paymeKey);
}

function buildAuthHeader() {
  const token = Buffer.from(`Paycom:${config.paymeKey}`).toString("base64");
  return {
    Authorization: `Basic ${token}`,
    "X-Auth": `${config.paymeMerchantId}:${config.paymeKey}`,
    "Content-Type": "application/json",
  };
}

async function paymeRequest(method, params) {
  const response = await fetch(config.paymeApiUrl, {
    method: "POST",
    headers: buildAuthHeader(),
    body: JSON.stringify({
      id: Date.now(),
      method,
      params,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.error) {
    const message = data.error?.message || data.error?.data || "Payme API xatosi";
    throw new Error(message);
  }

  return data.result;
}

async function createCheckout({ intentId, amount, description, returnUrl }) {
  const amountTiyin = Math.round(amount * 100);

  const result = await paymeRequest("receipts.create", {
    amount: amountTiyin,
    description: description || "Arsenal Union to'lovi",
    detail: {
      receipt_type: 0,
      items: [],
    },
    account: {
      order_id: intentId,
    },
  });

  const receiptId = result._id || result.id;

  if (!receiptId) {
    throw new Error("Payme chek ID qaytmadi");
  }

  const checkoutUrl = `${config.paymeCheckoutBase}/${receiptId}`;

  return {
    provider: "payme",
    mode: "live",
    externalTransactionId: String(receiptId),
    checkoutUrl,
    returnUrl,
    metadata: { receiptId },
  };
}

async function verifyWebhook(body) {
  const params = body?.params;
  const method = body?.method;

  if (!params || !method) {
    return { ok: false, message: "Payme webhook formati noto'g'ri" };
  }

  const orderId = params.account?.order_id || params.order_id;

  if (!orderId) {
    return { ok: false, message: "order_id topilmadi" };
  }

  if (method === "CheckPerformTransaction" || method === "CreateTransaction") {
    return {
      ok: true,
      intentId: orderId,
      externalTransactionId: String(params.id || params.transaction || ""),
      shouldComplete: method === "CreateTransaction",
    };
  }

  return { ok: false, message: `Payme method qo'llab-quvvatlanmaydi: ${method}` };
}

module.exports = { isConfigured, createCheckout, verifyWebhook };
