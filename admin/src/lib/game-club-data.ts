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
  image?: string;
  brand?: string;
  category?: string;
};

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
  { id: "table-01", title: "Stol 01", status: "available" },
  { id: "table-02", title: "Stol 02", status: "available" },
  { id: "table-03", title: "Stol 03", status: "available" },
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
