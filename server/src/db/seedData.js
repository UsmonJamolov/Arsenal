const bcrypt = require("bcryptjs");

const { adminEmail, adminFirstName, adminLastName, adminPassword, adminPhone } = require("../config");
const Device = require("../models/Device");
const Table = require("../models/Table");
const HookahFlavor = require("../models/HookahFlavor");
const HookahBrand = require("../models/HookahBrand");
const Product = require("../models/Product");
const AppSettings = require("../models/AppSettings");
const User = require("../models/User");
const { HOOKAH_FLAVORS } = require("../data/hookahFlavors");
const { HOOKAH_BRANDS } = require("../data/hookahBrands");

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
  { slug: "table-01", title: "Stol 01", status: "available", seats: 4, zone: "Kafe zonasi", image: "/hookah/table-01.png" },
  { slug: "table-02", title: "Stol 02", status: "available", seats: 4, zone: "Kafe zonasi", image: "/hookah/table-02.png" },
  { slug: "table-03", title: "Stol 03", status: "available", seats: 4, zone: "Kafe zonasi", image: "/hookah/table-03.png" },
];

const EXTRAS_PRODUCTS = [
  { title: "Semichka", description: "Qovurilgan tuzli", price: 10000, quantity: 100, image: "" },
  { title: "Qurt", description: "Mevali miksi", price: 15000, quantity: 100, image: "" },
  { title: "Pista", description: "Tuzlangan pista", price: 20000, quantity: 100, image: "" },
  { title: "Ichimlik", description: "Coca-Cola 330ml", price: 10000, quantity: 100, image: "" },
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
      loyaltyPoints: 999,
    },
    { upsert: true, new: true },
  );

  console.log(`Admin tayyor: ${phone} / ${adminPassword}`);
}

async function ensureDevices() {
  for (const device of DEVICE_BASE) {
    await Device.findOneAndUpdate(
      { slug: device.slug },
      {
        $set: {
          name: device.name,
          type: device.type,
          pricePerHour: device.pricePerHour,
          stationId: device.stationId,
          agentHost: device.agentHost ?? null,
          billingProvider: device.billingProvider,
          billingStationId: device.billingStationId,
        },
        $setOnInsert: {
          slug: device.slug,
          status: device.status,
        },
      },
      { upsert: true, new: true },
    );
  }
}

async function ensureHookahFlavors() {
  for (const flavor of HOOKAH_FLAVORS) {
    await HookahFlavor.findOneAndUpdate(
      { slug: flavor.slug },
      { $set: flavor },
      { upsert: true, new: true },
    );
  }

  const slugs = HOOKAH_FLAVORS.map((flavor) => flavor.slug);
  await HookahFlavor.deleteMany({ slug: { $nin: slugs } });
}

async function ensureHookahBrands() {
  for (const brand of HOOKAH_BRANDS) {
    await HookahBrand.findOneAndUpdate(
      { slug: brand.slug },
      { $set: brand },
      { upsert: true, new: true },
    );
  }
}

async function ensureTables() {
  for (const table of TABLES) {
    const { status, slug, ...meta } = table;
    await Table.findOneAndUpdate(
      { slug },
      {
        $set: meta,
        $setOnInsert: { slug, status: status ?? "available" },
      },
      { upsert: true, new: true },
    );
  }
}

async function ensureExtrasProducts() {
  const count = await Product.countDocuments();
  if (count > 0) {
    return;
  }

  await Product.insertMany(EXTRAS_PRODUCTS);
  console.log("Qo'shimcha mahsulotlar yuklandi.");
}

async function seedDatabase() {
  const deviceCount = await Device.countDocuments();

  if (deviceCount === 0) {
    await Device.insertMany(DEVICE_BASE);
    await Table.insertMany(TABLES);
    await AppSettings.create({ key: "main" });
    console.log("Boshlang'ich ma'lumotlar yuklandi (devices, tables).");
  } else {
    await ensureDevices();
  }

  await ensureHookahFlavors();
  await ensureHookahBrands();
  await ensureTables();
  await ensureExtrasProducts();
  await ensureAdminUser();

  const { syncAllTableStatuses } = require("../services/tableSync");
  const { backfillHookahOrdersFromPayments } = require("../services/hookahOrderService");
  await syncAllTableStatuses({ broadcast: false });
  await backfillHookahOrdersFromPayments();
}

module.exports = { seedDatabase, ensureAdminUser };
