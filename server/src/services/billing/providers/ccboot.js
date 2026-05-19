const { ccbootApiKey, ccbootApiUrl } = require("../../../config");
const customAgent = require("./customAgent");

/**
 * CCBoot / diskless billing — stub.
 * Odatda mahalliy server HTTP yoki TCP API beradi.
 * Env: CCBOOT_API_URL, CCBOOT_API_KEY
 */
async function callCcboot(action, body) {
  if (!ccbootApiUrl || !ccbootApiKey) {
    return null;
  }

  const response = await fetch(`${ccbootApiUrl.replace(/\/$/, "")}/${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": ccbootApiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`CCBoot xato: ${response.status} ${text}`);
  }

  return response.json();
}

async function startSession(ctx) {
  const pcName = ctx.device.billingStationId || ctx.device.stationId || ctx.device.slug;

  try {
    const remote = await callCcboot("start", {
      pcName,
      minutes: ctx.session.durationMinutes,
      orderId: ctx.session._id.toString(),
    });

    if (remote?.ok) {
      await customAgent.startSession(ctx);
      return { billingRef: `ccboot:${pcName}:${ctx.session._id}`, provider: "ccboot" };
    }
  } catch (error) {
    console.warn("[ccboot] startSession:", error.message);
  }

  return customAgent.startSession(ctx);
}

async function unlockSession(ctx) {
  const pcName = ctx.device.billingStationId || ctx.device.stationId || ctx.device.slug;

  try {
    await callCcboot("unlock", { pcName, pin: ctx.session.unlockPin });
  } catch (error) {
    console.warn("[ccboot] unlockSession:", error.message);
  }

  return customAgent.unlockSession(ctx);
}

async function stopSession(ctx) {
  const pcName = ctx.device.billingStationId || ctx.device.stationId || ctx.device.slug;

  try {
    await callCcboot("stop", { pcName, orderId: ctx.session._id.toString() });
  } catch (error) {
    console.warn("[ccboot] stopSession:", error.message);
  }

  return customAgent.stopSession(ctx);
}

module.exports = { startSession, unlockSession, stopSession };
