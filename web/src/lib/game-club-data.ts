export type DeviceStatus = "available" | "busy" | "booked";

export type Device = {
  id: string;
  name: string;
  type: string;
  pricePerHour: number;
  status: DeviceStatus;
};

export type TableStatus = "available" | "busy" | "booked";

export type ClubTable = {
  id: string;
  title: string;
  status: TableStatus;
};

export type HookahFlavor = {
  id: string;
  title: string;
  price: number;
};

/** Aralash ta'mlar uchun bitta kalyan narxi — tanlangan ta'mlar ichidagi eng yuqori narx */
export function getHookahUnitPrice(flavors: HookahFlavor[], selectedFlavorIds: string[]): number {
  const selected = flavors.filter((flavor) => selectedFlavorIds.includes(flavor.id));
  if (!selected.length) {
    return 0;
  }

  return Math.max(...selected.map((flavor) => flavor.price));
}

export function getHookahOrderTotal(
  flavors: HookahFlavor[],
  selectedFlavorIds: string[],
  quantity: number,
): number {
  const unitPrice = getHookahUnitPrice(flavors, selectedFlavorIds);
  const safeQuantity = Math.max(1, Math.floor(quantity) || 1);
  return unitPrice * safeQuantity;
}

export function getDevicesBookingTotal(
  devices: Device[],
  selectedDeviceIds: string[],
  durationHours: number,
): number {
  const safeDuration = Math.max(1, Math.floor(durationHours) || 1);

  return devices
    .filter((device) => selectedDeviceIds.includes(device.id))
    .reduce((sum, device) => sum + device.pricePerHour * safeDuration, 0);
}

export type BookingStatus = "active" | "completed" | "cancelled";

export type Booking = {
  id: string;
  deviceId: string;
  deviceName: string;
  startHour: string;
  durationHours: number;
  price: number;
  status: BookingStatus;
  createdAt?: string;
};

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  active: "Faol",
  completed: "Tugallangan",
  cancelled: "Bekor qilingan",
};

export type CartItem = {
  id: string;
  type: "booking" | "hookah";
  title: string;
  price: number;
};

export type OrderRecord = {
  id: string;
  title: string;
  price: number;
  type: CartItem["type"];
  paymentMethod: string;
  paidAt: string;
};

export type DeviceZone = "ps" | "pc";

export type TabKey = "home" | "devices" | "hookah" | "cart" | "payment" | "profile";

export const DEVICE_BASE: Device[] = [
  { id: "ps5-01", name: "PS5 01", type: "PS Zona", pricePerHour: 45000, status: "available" },
  { id: "ps5-02", name: "PS5 02", type: "PS Zona", pricePerHour: 45000, status: "busy" },
  { id: "ps5-03", name: "PS5 03", type: "PS Zona", pricePerHour: 35000, status: "booked" },
  { id: "pc-01", name: "PC 01", type: "PC Zona", pricePerHour: 30000, status: "available" },
  { id: "pc-02", name: "PC 02", type: "PC Zona", pricePerHour: 30000, status: "busy" },
];

export const TABLES: ClubTable[] = [
  { id: "table-01", title: "Stol 01", status: "busy" },
  { id: "table-02", title: "Stol 02", status: "available" },
  { id: "table-03", title: "Stol 03", status: "available" },
];

export const HOOKAH_FLAVORS: HookahFlavor[] = [
  { id: "apple", title: "Olma", price: 75000 },
  { id: "grape", title: "Uzum", price: 75000 },
  { id: "mint", title: "Mint", price: 70000 },
  { id: "mix", title: "Mix", price: 85000 },
];

export const PAYMENT_METHODS = ["Payme", "Click", "Uzum Bank"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const STATUS_LABEL: Record<DeviceStatus, string> = {
  available: "Bo'sh",
  busy: "Band",
  booked: "Bron qilingan",
};

export const TABLE_STATUS_LABEL: Record<TableStatus, string> = {
  available: "Bo'sh",
  busy: "Band",
  booked: "Bron qilingan",
};

export const ORDER_TYPE_LABEL: Record<CartItem["type"], string> = {
  booking: "Bron",
  hookah: "Kalyan",
};

export function isPsDevice(device: Device) {
  const haystack = `${device.type} ${device.name}`.toLowerCase();
  return haystack.includes("ps");
}

export function isPcDevice(device: Device) {
  const haystack = `${device.type} ${device.name}`.toLowerCase();
  return haystack.includes("pc");
}

export function filterDevicesByZone(devices: Device[], zone: DeviceZone) {
  return devices.filter((device) => (zone === "ps" ? isPsDevice(device) : isPcDevice(device)));
}

export const PC_DEVICE_IMAGES = [
  "/devices/pc-setup-1.png",
  "/devices/pc-setup-2.png",
  "/devices/pc-setup-1.png",
  "/devices/pc-setup-2.png",
] as const;

export const PC_THUMB_IMAGE = "/devices/pc-setup-2.png";

export const PC_HERO_IMAGE = "/devices/pc-setup-2.png";

export const PC_BOOKING_HERO = PC_HERO_IMAGE;

export const PC_PROMO_IMAGE = "/devices/pc-promo.png";

export const PC_STATION_META = [
  { gpu: "RTX 3060", display: "144Hz" },
  { gpu: "RTX 3060", display: "144Hz" },
  { gpu: "RTX 3060", display: "144Hz" },
  { gpu: "RTX 3060", display: "144Hz" },
] as const;

export function getPcStationMeta(index: number) {
  return PC_STATION_META[index % PC_STATION_META.length];
}

export const PC_SPEC_ITEMS = [
  { title: "RTX 3060", detail: "8GB GDDR6" },
  { title: "Intel i5-12400F", detail: "6 Core / 12 Threads" },
  { title: "16GB RAM", detail: "DDR4 3200MHz" },
  { title: "144Hz Monitor", detail: "1ms Response Time" },
  { title: "Mechanical KB", detail: "RGB Backlight" },
  { title: "Premium Headset", detail: "7.1 Surround Sound" },
] as const;

export function getPcDeviceImage(index: number) {
  return PC_DEVICE_IMAGES[index % PC_DEVICE_IMAGES.length];
}

export function getPcThumbImage() {
  return PC_THUMB_IMAGE;
}

export const PS_DEVICE_IMAGES = [
  "/devices/ps-01.png",
  "/devices/ps-02.png",
  "/devices/ps-03.png",
] as const;

export const PS_BOOKING_HERO = "/devices/ps-booking-hero.png";

export const DEVICE_ZONE_IMAGES = {
  ps: "/devices/zone-ps-card.png?v=4",
  pc: "/devices/zone-pc-card.png",
} as const;

export const PS_STATION_META = [
  { seats: 4, display: "4K HDR" },
  { seats: 3, display: "4K HDR" },
  { seats: 4, display: "4K HDR" },
] as const;

export function getPsDeviceImage(index: number) {
  return PS_DEVICE_IMAGES[index % PS_DEVICE_IMAGES.length];
}

export function getPsStationMeta(index: number) {
  return PS_STATION_META[index % PS_STATION_META.length];
}

export const HOME_IMAGES = {
  heroGamer: "/home/hero-gamer.png",
  welcomePortal: "/home/welcome-portal.png",
  catDevices: "/home/cat-devices.png",
  catHookah: "/home/cat-hookah.png",
  catPc: "/devices/pc-setup-2.png",
} as const;

export const HOOKAH_HERO = "/hookah/hero-lounge.png";

export const HOOKAH_TABLE_IMAGES = [
  "/hookah/table-01.png",
  "/hookah/table-02.png",
  "/hookah/table-03.png",
] as const;

export const HOOKAH_TABLE_META = [
  { seats: 4, zone: "Kafe zonasi" },
  { seats: 4, zone: "Kafe zonasi" },
  { seats: 4, zone: "Kafe zonasi" },
] as const;

export const HOOKAH_FLAVOR_IMAGES = [
  "/hookah/apple.png",
  "/hookah/grape.png",
  "/hookah/mint.png",
  "/hookah/mix.png",
] as const;

const HOOKAH_FLAVOR_IMAGE_BY_KEY: Record<string, string> = {
  apple: "/hookah/apple.png",
  olma: "/hookah/apple.png",
  grape: "/hookah/grape.png",
  uzum: "/hookah/grape.png",
  mint: "/hookah/mint.png",
  mix: "/hookah/mix.png",
};

export function getHookahTableImage(index: number) {
  return HOOKAH_TABLE_IMAGES[index % HOOKAH_TABLE_IMAGES.length];
}

export function getHookahTableMeta(index: number) {
  return HOOKAH_TABLE_META[index % HOOKAH_TABLE_META.length];
}

export function getHookahFlavorImage(flavor: HookahFlavor, index: number) {
  const id = flavor.id.toLowerCase().trim();
  const title = flavor.title.toLowerCase().trim();

  const byId = HOOKAH_FLAVOR_IMAGE_BY_KEY[id];
  if (byId) return byId;

  const byTitle = HOOKAH_FLAVOR_IMAGE_BY_KEY[title];
  if (byTitle) return byTitle;

  for (const [key, path] of Object.entries(HOOKAH_FLAVOR_IMAGE_BY_KEY)) {
    if (id.includes(key) || title.includes(key)) {
      return path;
    }
  }

  return HOOKAH_FLAVOR_IMAGES[index % HOOKAH_FLAVOR_IMAGES.length];
}

export const TABS: { key: TabKey; label: string }[] = [
  { key: "home", label: "Bosh sahifa" },
  { key: "devices", label: "Qurilmalar" },
  { key: "hookah", label: "Kalyan" },
  { key: "cart", label: "Savat" },
  { key: "payment", label: "To'lov" },
  { key: "profile", label: "Profil" },
];
