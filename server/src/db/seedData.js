const bcrypt = require("bcryptjs");

const { adminEmail, adminFirstName, adminLastName, adminPassword, adminPhone } = require("../config");
const Device = require("../models/Device");
const Table = require("../models/Table");
const HookahFlavor = require("../models/HookahFlavor");
const AppSettings = require("../models/AppSettings");
const User = require("../models/User");

const DEVICE_BASE = [
  {
    slug: "ps5-01",
    name: "PS5 01",
    type: "PS Zona",
    pricePerHour: 45000,
    status: "available",
    stationId: "ps5-01",
    billingProvider: "custom",
    billingStationId: "ps5-01",
  },
  {
    slug: "ps5-02",
    name: "PS5 02",
    type: "PS Zona",
    pricePerHour: 45000,
    status: "busy",
    stationId: "ps5-02",
    billingProvider: "custom",
    billingStationId: "ps5-02",
  },
  {
    slug: "ps5-03",
    name: "PS5 03",
    type: "PS Zona",
    pricePerHour: 35000,
    status: "booked",
    stationId: "ps5-03",
    billingProvider: "custom",
    billingStationId: "ps5-03",
  },
  {
    slug: "pc-01",
    name: "PC 01",
    type: "PC Zona",
    pricePerHour: 30000,
    status: "available",
    stationId: "pc-01",
    agentHost: "192.168.1.101",
    billingProvider: "custom",
    billingStationId: "pc-01",
  },
  {
    slug: "pc-02",
    name: "PC 02",
    type: "PC Zona",
    pricePerHour: 30000,
    status: "busy",
    stationId: "pc-02",
    agentHost: "192.168.1.102",
    billingProvider: "custom",
    billingStationId: "pc-02",
  },
];

const TABLES = [
  { slug: "table-01", title: "Stol 01", status: "busy" },
  { slug: "table-02", title: "Stol 02", status: "available" },
  { slug: "table-03", title: "Stol 03", status: "available" },
];

const HOOKAH_FLAVORS = [
  { slug: "apple", title: "Olma", price: 75000 },
  { slug: "grape", title: "Uzum", price: 75000 },
  { slug: "mint", title: "Mint", price: 70000 },
  { slug: "mix", title: "Mix", price: 85000 },
];

function normalizePhone(phone) {
  return String(phone).replace(/\s+/g, "").trim();
}

async function ensureAdminUser() {
  const phone = normalizePhone(adminPhone);
  const hashed = await bcrypt.hash(adminPassword, 10);

  await User.findOneAndUpdate(
    { phone },
    {
      name: `${adminFirstName} ${adminLastName}`.trim(),
      phone,
      email: adminEmail.toLowerCase(),
      password: hashed,
      role: "admin",
      tier: "Platinum",
      loyaltyPoints: 999,
    },
    { upsert: true, new: true },
  );

  console.log(`Admin tayyor: ${phone} / ${adminPassword}`);
}

async function ensureDeviceStations() {
  for (const device of DEVICE_BASE) {
    await Device.findOneAndUpdate(
      { slug: device.slug },
      {
        $set: {
          stationId: device.stationId,
          agentHost: device.agentHost ?? null,
          billingProvider: device.billingProvider,
          billingStationId: device.billingStationId,
        },
      },
    );
  }
}

async function seedDatabase() {
  const deviceCount = await Device.countDocuments();

  if (deviceCount === 0) {
    await Device.insertMany(DEVICE_BASE);
    await Table.insertMany(TABLES);
    await HookahFlavor.insertMany(HOOKAH_FLAVORS);
    await AppSettings.create({ key: "main" });
    console.log("Boshlang'ich ma'lumotlar yuklandi (devices, tables, hookah).");
  } else {
    await ensureDeviceStations();
  }

  await ensureAdminUser();
}

module.exports = { seedDatabase, ensureAdminUser };
