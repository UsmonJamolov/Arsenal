const Booking = require("../models/Booking");
const Device = require("../models/Device");
const Session = require("../models/Session");

async function resolveDeviceSlug(deviceId, deviceName) {
  const trimmedId = String(deviceId || "").trim();

  if (trimmedId) {
    const bySlug = await Device.findOne({ slug: trimmedId });
    if (bySlug) {
      return bySlug.slug;
    }
  }

  if (deviceName) {
    const byName = await Device.findOne({ name: String(deviceName).trim() });
    if (byName) {
      return byName.slug;
    }
  }

  return trimmedId || null;
}

async function releaseDeviceIfIdle(deviceId, deviceName, excludeBookingId) {
  const slug = await resolveDeviceSlug(deviceId, deviceName);

  if (!slug) {
    return null;
  }

  const activeBookingQuery = {
    deviceId: slug,
    status: "active",
  };

  if (excludeBookingId) {
    activeBookingQuery._id = { $ne: excludeBookingId };
  }

  const activeBooking = await Booking.findOne(activeBookingQuery);
  if (activeBooking) {
    return null;
  }

  const activeSession = await Session.findOne({
    deviceId: slug,
    status: { $in: ["pending_unlock", "active"] },
  });

  if (activeSession) {
    return null;
  }

  return Device.findOneAndUpdate({ slug }, { status: "available" }, { new: true });
}

module.exports = { resolveDeviceSlug, releaseDeviceIfIdle };
