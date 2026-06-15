const click = require("./click");
const payme = require("./payme");
const sandbox = require("./sandbox");
const uzum = require("./uzum");

const METHOD_TO_PROVIDER = {
  Payme: "payme",
  Click: "click",
  "Uzum Bank": "uzum",
};

const providers = {
  payme,
  click,
  uzum,
  sandbox,
};

function resolveProviderKey(method) {
  return METHOD_TO_PROVIDER[method] || null;
}

function shouldUseSandbox(providerKey) {
  const provider = providers[providerKey];
  return !provider || !provider.isConfigured();
}

async function createCheckout({
  method,
  intentId,
  amount,
  description,
  returnUrl,
  phoneNumber,
  siteOrigin,
}) {
  const providerKey = resolveProviderKey(method);

  if (!providerKey) {
    throw new Error(`To'lov usuli qo'llab-quvvatlanmaydi: ${method}`);
  }

  const useSandbox = shouldUseSandbox(providerKey);
  const provider = useSandbox ? sandbox : providers[providerKey];

  const result = await provider.createCheckout({
    intentId,
    amount,
    method,
    description,
    returnUrl,
    phoneNumber,
    siteOrigin,
  });

  return {
    ...result,
    provider: useSandbox ? "sandbox" : providerKey,
    mode: useSandbox ? "sandbox" : "live",
  };
}

function getWebhookVerifier(providerKey) {
  const provider = providers[providerKey];
  return provider?.verifyWebhook || null;
}

module.exports = {
  METHOD_TO_PROVIDER,
  createCheckout,
  getWebhookVerifier,
  resolveProviderKey,
  shouldUseSandbox,
};
