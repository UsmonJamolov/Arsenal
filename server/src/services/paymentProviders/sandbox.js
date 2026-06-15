function isConfigured() {
  return true;
}

async function createCheckout({ intentId }) {
  return {
    provider: "sandbox",
    mode: "sandbox",
    externalTransactionId: `demo_${intentId}`,
    checkoutUrl: `/payment/checkout?intent=${intentId}`,
    metadata: {},
  };
}

module.exports = { isConfigured, createCheckout };
