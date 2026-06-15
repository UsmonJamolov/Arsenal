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

export const TABS: { key: TabKey; label: string }[] = [
  { key: "home", label: "Bosh sahifa" },
  { key: "devices", label: "Qurilmalar" },
  { key: "hookah", label: "Kalyan" },
  { key: "cart", label: "Savat" },
  { key: "payment", label: "To'lov" },
  { key: "profile", label: "Profil" },
];
