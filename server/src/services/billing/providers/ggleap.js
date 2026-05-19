const { ggleapApiKey, ggleapApiUrl } = require("../../../config");
const customAgent = require("./customAgent");

/**
 * GGLeap billing API — hozircha stub.
 * Haqiqiy integratsiya: GGLeap dokumentatsiyasidagi POST /sessions yoki shunga o'xshash endpoint.
 * Env: GGLEAP_API_URL, GGLEAP_API_KEY
 */
async function callGgleap(path, body) {
  if (!ggleapApiUrl || !ggleapApiKey) {
    return null;
  }

  const response = await fetch(`${ggleapApiUrl.replace(/\/$/, "")}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ggleapApiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GGLeap xato: ${response.status} ${text}`);
  }

  return response.json();
}

async function startSession(ctx) {
  const station = ctx.device.billingStationId || ctx.device.stationId || ctx.device.slug;

  try {
    const remote = await callGgleap("/sessions/start", {
      stationId: station,
      minutes: ctx.session.durationMinutes,
      externalRef: ctx.session._id.toString(),
    });

    if (remote?.sessionId) {
      await customAgent.startSession(ctx);
      return { billingRef: `ggleap:${remote.sessionId}`, provider: "ggleap" };
    }
  } catch (error) {
    console.warn("[ggleap] startSession:", error.message);
  }

  return customAgent.startSession(ctx);
}

async function unlockSession(ctx) {
  const station = ctx.device.billingStationId || ctx.device.stationId || ctx.device.slug;

  try {
    await callGgleap("/sessions/unlock", {
      stationId: station,
      pin: ctx.session.unlockPin,
    });
  } catch (error) {
    console.warn("[ggleap] unlockSession:", error.message);
  }

  return customAgent.unlockSession(ctx);
}

async function stopSession(ctx) {
  const station = ctx.device.billingStationId || ctx.device.stationId || ctx.device.slug;

  try {
    await callGgleap("/sessions/stop", {
      stationId: station,
      externalRef: ctx.session._id.toString(),
    });
  } catch (error) {
    console.warn("[ggleap] stopSession:", error.message);
  }

  return customAgent.stopSession(ctx);
}

module.exports = { startSession, unlockSession, stopSession };
