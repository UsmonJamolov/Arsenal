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
  seats?: number;
  zone?: string;
  image?: string;
};

export type HookahFlavorBrand = "serbetli" | "liara";

export type HookahFlavorCategoryId = "fruit" | "reshalt" | "cold" | "sweet" | "drink";

export type HookahFlavorFilterId = "all" | HookahFlavorCategoryId;

export type HookahFlavor = {
  id: string;
  title: string;
  price: number;
  image?: string;
  brand?: HookahFlavorBrand;
  category?: HookahFlavorCategoryId;
};

export const HOOKAH_FLAVOR_CATEGORIES: { id: HookahFlavorFilterId; label: string }[] = [
  { id: "all", label: "BARCHA" },
  { id: "fruit", label: "MEVALI" },
  { id: "reshalt", label: "RESHALT" },
  { id: "cold", label: "SOVUQ" },
  { id: "sweet", label: "SHIRIN" },
  { id: "drink", label: "ICHIMLIK" },
];

export type HookahFlavorMix = Record<string, number>;

export const HOOKAH_MIN_FLAVOR_PERCENT = 5;
export const HOOKAH_FLAVOR_PERCENT_STEP = 5;

export function snapHookahPercent(value: number): number {
  const safe = Number.isFinite(value) ? value : HOOKAH_MIN_FLAVOR_PERCENT;
  const snapped = Math.round(safe / HOOKAH_FLAVOR_PERCENT_STEP) * HOOKAH_FLAVOR_PERCENT_STEP;
  return Math.max(HOOKAH_MIN_FLAVOR_PERCENT, Math.min(100, snapped));
}

function isHookahPercentOnStep(value: number): boolean {
  return value % HOOKAH_FLAVOR_PERCENT_STEP === 0;
}

function distributeHookahRemaining(
  others: string[],
  remaining: number,
  mix: HookahFlavorMix,
): HookahFlavorMix {
  const result: HookahFlavorMix = {};
  const minEach = HOOKAH_MIN_FLAVOR_PERCENT;
  const minTotal = minEach * others.length;
  const extraRemaining = remaining - minTotal;
  const extraSteps = extraRemaining / HOOKAH_FLAVOR_PERCENT_STEP;

  const weights = others.map((id) => mix[id] ?? minEach);
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0) || others.length;

  let usedSteps = 0;
  others.forEach((id, index) => {
    if (index === others.length - 1) {
      const steps = extraSteps - usedSteps;
      result[id] = minEach + steps * HOOKAH_FLAVOR_PERCENT_STEP;
      return;
    }

    const steps = Math.round((extraSteps * weights[index]) / weightSum);
    result[id] = minEach + steps * HOOKAH_FLAVOR_PERCENT_STEP;
    usedSteps += steps;
  });

  return result;
}

/** Tanlangan ta'mlar uchun teng taqsimlangan foiz (5% qadamda) */
export function createEqualHookahMix(flavorIds: string[]): HookahFlavorMix {
  if (!flavorIds.length) {
    return {};
  }

  if (flavorIds.length === 1) {
    return { [flavorIds[0]]: 100 };
  }

  const count = flavorIds.length;
  const totalSteps = 100 / HOOKAH_FLAVOR_PERCENT_STEP;
  const minStepsEach = HOOKAH_MIN_FLAVOR_PERCENT / HOOKAH_FLAVOR_PERCENT_STEP;
  const extraSteps = totalSteps - minStepsEach * count;
  const baseExtra = Math.floor(extraSteps / count);
  const extraRemainder = extraSteps - baseExtra * count;

  return Object.fromEntries(
    flavorIds.map((id, index) => [
      id,
      HOOKAH_MIN_FLAVOR_PERCENT +
        (baseExtra + (index < extraRemainder ? 1 : 0)) * HOOKAH_FLAVOR_PERCENT_STEP,
    ]),
  );
}

export function syncHookahMixes(
  current: HookahFlavorMix[],
  quantity: number,
  flavorIds: string[],
): HookahFlavorMix[] {
  const safeQuantity = Math.max(1, Math.floor(quantity) || 1);
  const next: HookahFlavorMix[] = [];

  for (let index = 0; index < safeQuantity; index += 1) {
    const previous = current[index];
    if (previous && isHookahMixValid(previous, flavorIds)) {
      const mix: HookahFlavorMix = {};
      flavorIds.forEach((id) => {
        mix[id] = previous[id] ?? HOOKAH_MIN_FLAVOR_PERCENT;
      });
      next.push(isHookahMixValid(mix, flavorIds) ? mix : createEqualHookahMix(flavorIds));
    } else {
      next.push(createEqualHookahMix(flavorIds));
    }
  }

  return next;
}

export function getHookahMixSliderMax(flavorCount: number): number {
  if (flavorCount <= 1) {
    return 100;
  }

  return 100 - HOOKAH_MIN_FLAVOR_PERCENT * (flavorCount - 1);
}

/** Bitta ta'm foizi o'zgarganda qolganlarini 100% ga moslashtiradi */
export function adjustHookahMix(
  mix: HookahFlavorMix,
  flavorIds: string[],
  changedId: string,
  rawValue: number,
): HookahFlavorMix {
  if (!flavorIds.length) {
    return {};
  }

  if (flavorIds.length === 1) {
    return { [flavorIds[0]]: 100 };
  }

  const others = flavorIds.filter((id) => id !== changedId);
  const maxChanged = getHookahMixSliderMax(flavorIds.length);
  const changedValue = snapHookahPercent(
    Math.min(maxChanged, Math.max(HOOKAH_MIN_FLAVOR_PERCENT, Number.isFinite(rawValue) ? rawValue : HOOKAH_MIN_FLAVOR_PERCENT)),
  );
  const remaining = 100 - changedValue;

  if (others.length === 1) {
    return { [changedId]: changedValue, [others[0]]: remaining };
  }

  return { [changedId]: changedValue, ...distributeHookahRemaining(others, remaining, mix) };
}

export function getHookahMixTotal(mix: HookahFlavorMix, flavorIds: string[]): number {
  return flavorIds.reduce((sum, id) => sum + (mix[id] ?? 0), 0);
}

export function isHookahMixValid(mix: HookahFlavorMix, flavorIds: string[]): boolean {
  if (!flavorIds.length) {
    return false;
  }

  if (flavorIds.length === 1) {
    return (mix[flavorIds[0]] ?? 0) === 100;
  }

  return (
    getHookahMixTotal(mix, flavorIds) === 100 &&
    flavorIds.every((id) => {
      const value = mix[id] ?? 0;
      return value >= HOOKAH_MIN_FLAVOR_PERCENT && isHookahPercentOnStep(value);
    })
  );
}

export function areHookahMixesValid(mixes: HookahFlavorMix[], flavorIds: string[]): boolean {
  if (!flavorIds.length || !mixes.length) {
    return false;
  }

  return mixes.every((mix) => isHookahMixValid(mix, flavorIds));
}

export function formatHookahMixLabel(flavors: HookahFlavor[], mix: HookahFlavorMix): string {
  return flavors
    .filter((flavor) => mix[flavor.id] != null)
    .map((flavor) => `${flavor.title} ${mix[flavor.id]}%`)
    .join(" + ");
}

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
  updatedAt?: string;
};

export type BookingNotificationKind = "booked" | "paid" | "cancelled";

export type BookingNotification = {
  id: string;
  kind: BookingNotificationKind;
  title: string;
  subtitle: string;
  sortAt: number;
};

export const BOOKING_NOTIFICATION_LABEL: Record<BookingNotificationKind, string> = {
  booked: "Bron qildingiz",
  paid: "To'lov qildingiz",
  cancelled: "Bronni rad qilding",
};

export function buildBookingNotifications(
  bookings: Booking[],
  paidOrders: OrderRecord[],
): BookingNotification[] {
  const paidByBookingId = new Map(
    paidOrders.filter((order) => order.type === "booking").map((order) => [order.id, order]),
  );
  const paidBookingIds = new Set(paidByBookingId.keys());
  const notifications: BookingNotification[] = [];

  for (const booking of bookings) {
    const createdAt = booking.createdAt ? new Date(booking.createdAt).getTime() : 0;
    const updatedAt = booking.updatedAt ? new Date(booking.updatedAt).getTime() : createdAt;

    notifications.push({
      id: `${booking.id}-booked`,
      kind: "booked",
      title: BOOKING_NOTIFICATION_LABEL.booked,
      subtitle: booking.deviceName,
      sortAt: createdAt,
    });

    if (booking.status === "completed") {
      const paidOrder = paidByBookingId.get(booking.id);
      notifications.push({
        id: `${booking.id}-paid`,
        kind: "paid",
        title: BOOKING_NOTIFICATION_LABEL.paid,
        subtitle: booking.deviceName,
        sortAt: paidOrder ? new Date(paidOrder.paidAt).getTime() : updatedAt,
      });
    }

    if (booking.status === "cancelled") {
      notifications.push({
        id: `${booking.id}-cancelled`,
        kind: "cancelled",
        title: BOOKING_NOTIFICATION_LABEL.cancelled,
        subtitle: booking.deviceName,
        sortAt: updatedAt || createdAt,
      });
    }
  }

  for (const order of paidOrders) {
    if (order.type === "booking" && paidBookingIds.has(order.id)) {
      continue;
    }

    notifications.push({
      id: `paid-${order.id}-${order.paidAt}`,
      kind: "paid",
      title: BOOKING_NOTIFICATION_LABEL.paid,
      subtitle: order.title,
      sortAt: new Date(order.paidAt).getTime(),
    });
  }

  return notifications
    .filter((item) => item.sortAt > 0)
    .sort((a, b) => b.sortAt - a.sortAt)
    .slice(0, 12);
}

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
  { id: "cotton-candy", title: "Cotton Candy", price: 75000, brand: "serbetli", category: "sweet", image: "/hookah/flavors/cotton-candy.png" },
  { id: "blackberry", title: "Blackberry", price: 75000, brand: "serbetli", category: "fruit", image: "/hookah/flavors/blackberry.png" },
  { id: "fig", title: "Fig", price: 75000, brand: "serbetli", category: "fruit", image: "/hookah/flavors/fig.png" },
  { id: "american-cake", title: "American Cake", price: 80000, brand: "serbetli", category: "sweet", image: "/hookah/flavors/american-cake.png" },
  { id: "watermelon", title: "Watermelon", price: 75000, brand: "serbetli", category: "fruit", image: "/hookah/flavors/watermelon.png" },
  { id: "melon", title: "Melon", price: 75000, brand: "serbetli", category: "fruit", image: "/hookah/flavors/melon.png" },
  { id: "lime-space-peach", title: "Lime Space Peach", price: 78000, brand: "serbetli", category: "fruit", image: "/hookah/flavors/lime-space-peach.png" },
  { id: "lemon-marmalade", title: "Lemon Marmalade", price: 75000, brand: "serbetli", category: "sweet", image: "/hookah/flavors/lemon-marmalade.png" },
  { id: "lemon", title: "Lemon", price: 70000, brand: "serbetli", category: "fruit", image: "/hookah/flavors/lemon.png" },
  { id: "mango", title: "Mango", price: 75000, brand: "serbetli", category: "fruit", image: "/hookah/flavors/mango.png" },
  { id: "raspberry-pistachio", title: "Raspberry Pistachio", price: 85000, brand: "serbetli", category: "sweet", image: "/hookah/flavors/raspberry-pistachio.png" },
  { id: "big-bubble", title: "Big Bubble", price: 75000, brand: "serbetli", category: "sweet", image: "/hookah/flavors/big-bubble.png" },
  { id: "strawberry", title: "Strawberry", price: 75000, brand: "serbetli", category: "fruit", image: "/hookah/flavors/strawberry.png" },
  { id: "acai", title: "Acai", price: 80000, brand: "serbetli", category: "fruit", image: "/hookah/flavors/acai.png" },
  { id: "liara-mix", title: "Mix", price: 80000, brand: "liara", category: "fruit", image: "/hookah/flavors/liara-mix.png" },
  { id: "liara-amore", title: "Amore", price: 82000, brand: "liara", category: "sweet", image: "/hookah/flavors/liara-amore.png" },
  { id: "liara-ice-summer", title: "Ice Summer", price: 78000, brand: "liara", category: "cold", image: "/hookah/flavors/liara-ice-summer.png" },
  { id: "liara-secret", title: "Secret", price: 85000, brand: "liara", category: "reshalt", image: "/hookah/flavors/liara-secret.png" },
  { id: "liara-jeen", title: "Jeen", price: 80000, brand: "liara", category: "drink", image: "/hookah/flavors/liara-jeen.png" },
  { id: "liara-61", title: "61", price: 90000, brand: "liara", category: "reshalt", image: "/hookah/flavors/liara-61.png" },
  { id: "liara-troya", title: "Troya", price: 88000, brand: "liara", category: "reshalt", image: "/hookah/flavors/liara-troya.png" },
  { id: "liara-alpha", title: "Alpha", price: 88000, brand: "liara", category: "reshalt", image: "/hookah/flavors/liara-alpha.png" },
  { id: "liara-white-rabbit", title: "White Rabbit", price: 85000, brand: "liara", category: "sweet", image: "/hookah/flavors/liara-white-rabbit.png" },
  { id: "liara-pacho", title: "Pacho", price: 92000, brand: "liara", category: "reshalt", image: "/hookah/flavors/liara-pacho.png" },
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
  "/devices/pc-setup-1.png?v=4",
  "/devices/pc-setup-2.png?v=4",
] as const;

export const PC_DEVICE_IMAGE_POSITIONS = ["center center", "center center"] as const;

export const PC_THUMB_IMAGE = "/devices/pc-setup-2.png?v=4";

export const PC_HERO_IMAGE = "/devices/pc-setup-2.png?v=4";

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

export function getPcDeviceImagePosition(index: number) {
  return PC_DEVICE_IMAGE_POSITIONS[index % PC_DEVICE_IMAGE_POSITIONS.length];
}

export function getPcThumbImage() {
  return PC_THUMB_IMAGE;
}

export const PS_DEVICE_IMAGES = [
  "/devices/ps-01.png?v=2",
  "/devices/ps-02.png?v=2",
  "/devices/ps-03.png?v=2",
] as const;

export const PS_DEVICE_IMAGE_POSITIONS = ["center center", "center center", "center center"] as const;

export const PS_BOOKING_HERO = "/devices/ps-booking-hero.png";

export const DEVICE_ZONE_IMAGES = {
  ps: "/devices/zone-ps-card.png?v=7",
  pc: "/devices/zone-pc-card.png?v=4",
} as const;

export const PS_STATION_META = [
  { seats: 4, display: "4K HDR" },
  { seats: 3, display: "4K HDR" },
  { seats: 4, display: "4K HDR" },
] as const;

export function getPsDeviceImage(index: number) {
  return PS_DEVICE_IMAGES[index % PS_DEVICE_IMAGES.length];
}

export function getPsDeviceImagePosition(index: number) {
  return PS_DEVICE_IMAGE_POSITIONS[index % PS_DEVICE_IMAGE_POSITIONS.length];
}

export function getPsStationMeta(index: number) {
  return PS_STATION_META[index % PS_STATION_META.length];
}

export const HOME_IMAGES = {
  heroGamer: "/home/hero-game-club.png",
  catDevices: "/home/cat-ps.png",
  catPc: "/home/cat-pc.png",
  catHookah: "/home/cat-hookah.png",
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

export const HOOKAH_FLAVOR_IMAGES = HOOKAH_FLAVORS.map((flavor) => flavor.image).filter(Boolean) as string[];

const HOOKAH_FLAVOR_IMAGE_BY_KEY: Record<string, string> = Object.fromEntries(
  HOOKAH_FLAVORS.filter((flavor) => flavor.image).map((flavor) => [flavor.id, flavor.image as string]),
);

export function getHookahTableImage(table: ClubTable, index: number) {
  if (table.image) {
    return table.image;
  }

  return HOOKAH_TABLE_IMAGES[index % HOOKAH_TABLE_IMAGES.length];
}

export function getHookahTableMeta(table: ClubTable, index: number) {
  const fallback = HOOKAH_TABLE_META[index % HOOKAH_TABLE_META.length];

  return {
    seats: table.seats ?? fallback.seats,
    zone: table.zone ?? fallback.zone,
  };
}

export function getHookahFlavorImage(flavor: HookahFlavor, index: number) {
  if (flavor.image) {
    return flavor.image;
  }

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
