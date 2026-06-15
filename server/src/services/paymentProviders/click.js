const crypto = require("crypto");
const config = require("../../config");

function isConfigured() {
  return Boolean(
    config.clickMerchantId &&
      config.clickServiceId &&
      config.clickMerchantUserId &&
      config.clickSecretKey,
  );
}

function buildAuthHeader() {
  const timestamp = Math.floor(Date.now() / 1000);
  const digest = crypto
    .createHash("sha1")
    .update(String(timestamp) + config.clickSecretKey)
    .digest("hex");

  return {
    Auth: `${config.clickMerchantUserId}:${digest}:${timestamp}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function createCheckout({ intentId, amount, description, returnUrl, phoneNumber }) {
  const response = await fetch(`${config.clickApiUrl}/merchant/invoice/create`, {
    method: "POST",
    headers: buildAuthHeader(),
    body: JSON.stringify({
      service_id: Number(config.clickServiceId),
      merchant_id: Number(config.clickMerchantId),
      amount: amount,
      phone_number: phoneNumber || config.clickDefaultPhone || "",
      merchant_trans_id: intentId,
      return_url: returnUrl,
      description: description || "Arsenal Union to'lovi",
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.error_code !== 0) {
    const message = data.error_note || data.message || "Click API xatosi";
    throw new Error(message);
  }

  const checkoutUrl =
    data.payment_url || `https://my.click.uz/services/pay/?service_id=${config.clickServiceId}&merchant_id=${config.clickMerchantId}&amount=${amount}&transaction_param=${intentId}`;

  return {
    provider: "click",
    mode: "live",
    externalTransactionId: String(data.invoice_id || intentId),
    checkoutUrl,
    returnUrl,
    metadata: { invoiceId: data.invoice_id },
  };
}

function verifyWebhook(body) {
  const merchantTransId = body.merchant_trans_id || body.merchant_prepare_id;
  const clickTransId = body.click_trans_id || body.click_paydoc_id;

  if (!merchantTransId) {
    return { ok: false, message: "merchant_trans_id topilmadi" };
  }

  const status = Number(body.status ?? body.action ?? 0);
  const shouldComplete = status === 1 || status === 2;

  return {
    ok: true,
    intentId: String(merchantTransId),
    externalTransactionId: clickTransId ? String(clickTransId) : "",
    shouldComplete,
  };
}

module.exports = { isConfigured, createCheckout, verifyWebhook };
