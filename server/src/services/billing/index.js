const customAgent = require("./providers/customAgent");
const ggleap = require("./providers/ggleap");
const ccboot = require("./providers/ccboot");

const providers = {
  custom: customAgent,
  ggleap,
  ccboot,
};

function getBillingProvider(name) {
  return providers[name] || providers.custom;
}

function resolveDeviceProvider(device) {
  return getBillingProvider(device.billingProvider || "custom");
}

module.exports = { getBillingProvider, resolveDeviceProvider, providers };
