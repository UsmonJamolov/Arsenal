const AgentCommand = require("../../../models/AgentCommand");

async function queueCommand({ stationId, sessionId, command, payload }) {
  return AgentCommand.create({
    stationId,
    sessionId,
    command,
    payload,
    status: "pending",
    expiresAt: payload?.endsAt ? new Date(payload.endsAt) : null,
  });
}

async function startSession({ device, session }) {
  await queueCommand({
    stationId: device.stationId || device.slug,
    sessionId: session._id,
    command: "start_session",
    payload: {
      sessionId: session._id.toString(),
      unlockPin: session.unlockPin,
      deviceName: session.deviceName,
      durationMinutes: session.durationMinutes,
      endsAt: session.endsAt.toISOString(),
    },
  });

  return { billingRef: `custom:${session._id}`, provider: "custom" };
}

async function unlockSession({ device, session }) {
  await queueCommand({
    stationId: device.stationId || device.slug,
    sessionId: session._id,
    command: "unlock",
    payload: {
      sessionId: session._id.toString(),
      unlockPin: session.unlockPin,
    },
  });

  return { billingRef: `custom:unlock:${session._id}`, provider: "custom" };
}

async function stopSession({ device, session }) {
  await queueCommand({
    stationId: device.stationId || device.slug,
    sessionId: session._id,
    command: "stop_session",
    payload: {
      sessionId: session._id.toString(),
      reason: session.status,
    },
  });

  return { billingRef: `custom:stop:${session._id}`, provider: "custom" };
}

module.exports = { startSession, unlockSession, stopSession };
