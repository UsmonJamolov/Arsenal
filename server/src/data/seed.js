const STATUS_CYCLE = {
  available: "busy",
  busy: "booked",
  booked: "available",
};

const DEVICE_BASE = [
  { id: "ps5-01", name: "PS5 01", type: "PS Zona", pricePerHour: 45000, status: "available" },
  { id: "ps5-02", name: "PS5 02", type: "PS Zona", pricePerHour: 45000, status: "busy" },
  { id: "ps5-03", name: "PS5 03", type: "PS Zona", pricePerHour: 35000, status: "booked" },
  { id: "pc-01", name: "PC 01", type: "PC Zona", pricePerHour: 30000, status: "available" },
  { id: "pc-02", name: "PC 02", type: "PC Zona", pricePerHour: 30000, status: "busy" },
];

const TABLES = [
  { id: "table-01", title: "Stol 01", status: "busy" },
  { id: "table-02", title: "Stol 02", status: "available" },
  { id: "table-03", title: "Stol 03", status: "available" },
];

const { HOOKAH_FLAVORS: HOOKAH_FLAVOR_SEED } = require("./hookahFlavors");

const HOOKAH_FLAVORS = HOOKAH_FLAVOR_SEED.map(({ slug, ...rest }) => ({ id: slug, ...rest }));

const PAYMENT_METHODS = ["Payme", "Click", "Uzum Bank"];

const STATUS_LABEL = {
  available: "Bo'sh",
  busy: "Band",
  booked: "Bron qilingan",
};

function createInitialState() {
  return {
    devices: DEVICE_BASE.map((device) => ({ ...device })),
    tables: TABLES.map((table) => ({ ...table })),
    hookahFlavors: HOOKAH_FLAVORS.map((flavor) => ({ ...flavor })),
    paymentMethods: [...PAYMENT_METHODS],
    bookings: [],
    cart: [],
    paymentStatus: "pending",
    notifications: ["Xush kelibsiz! Bugun maxsus bonuslar mavjud."],
    profile: {
      phone: "+998 90 123 45 67",
      name: "Mehmon",
      loyaltyPoints: 120,
    },
  };
}

module.exports = {
  STATUS_CYCLE,
  STATUS_LABEL,
  createInitialState,
};
