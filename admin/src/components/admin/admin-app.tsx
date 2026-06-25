"use client";

import {
  Armchair,
  ArrowLeft,
  CalendarCheck,
  Cigarette,
  Gamepad2,
  Inbox,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Monitor,
  RefreshCw,
  Save,
  Settings,
  Trash2,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from "react";

import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/brand-logo";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { adminRequest } from "@/lib/admin-api";
import { clearAdminSession, getAdminSession, type AdminSession } from "@/lib/admin-auth";
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  type DeviceZone,
  type DeviceStatus,
  filterDevicesByZone,
  STATUS_LABEL,
  TABLE_STATUS_LABEL,
} from "@/lib/game-club-data";
import { subscribeClubUpdates } from "@/lib/socket";
import { cn } from "@/lib/utils";

/** Admin kartochkalari — asosiy qora fonda ajralib turishi uchun */
function AdminCard({ className, ...props }: ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn(
        "border-brand-gold/35 bg-arena-surface shadow-none",
        className,
      )}
      {...props}
    />
  );
}

const DEVICE_STATUS_OPTIONS = [
  { value: "available", label: STATUS_LABEL.available },
  { value: "busy", label: STATUS_LABEL.busy },
  { value: "booked", label: STATUS_LABEL.booked },
] as const;

const DEVICE_ZONE_OPTIONS = [
  { value: "PS Zona", label: "PS Zona" },
  { value: "PC Zona", label: "PC Zona" },
] as const;

const TABLE_ZONE_OPTIONS = [
  { value: "Kafe zonasi", label: "Kafe zonasi" },
  { value: "VIP zona", label: "VIP zona" },
  { value: "Terrasa", label: "Terrasa" },
] as const;

const TABLE_STATUS_OPTIONS = [
  { value: "available", label: TABLE_STATUS_LABEL.available },
  { value: "busy", label: TABLE_STATUS_LABEL.busy },
  { value: "booked", label: TABLE_STATUS_LABEL.booked },
] as const;

function slugifyLabel(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function statusSelectClass(status: string) {
  if (status === "available") {
    return "border-emerald-400/55 bg-emerald-500/20";
  }
  if (status === "busy") {
    return "border-rose-400/55 bg-rose-500/20";
  }
  if (status === "booked") {
    return "border-amber-400/55 bg-amber-500/20";
  }
  if (status === "active") {
    return "border-cyan-400/55 bg-cyan-500/20";
  }
  if (status === "completed") {
    return "border-emerald-400/55 bg-emerald-500/20";
  }
  if (status === "cancelled") {
    return "border-rose-400/55 bg-rose-500/20";
  }
  return "border-violet-400/40 bg-violet-500/15";
}

function ColoredStatusSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <Select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={cn("h-9 min-w-[150px] font-bold text-white scheme-dark", statusSelectClass(value))}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value} className="bg-[#181425] text-white">
          {option.label}
        </option>
      ))}
    </Select>
  );
}

type Tab = "dashboard" | "users" | "devices" | "tables" | "hookah" | "bookings" | "settings";

type DashboardStats = {
  users: number;
  devices: number;
  availableDevices: number;
  bookings: number;
  activeBookings: number;
  tables: number;
  flavors: number;
  totalRevenue: number;
};

type UserRow = { id: string; name: string; phone: string; email: string; loyaltyPoints: number; role: string };
type DeviceRow = { id: string; name: string; type: string; pricePerHour: number; status: DeviceStatus };
type TableRow = {
  id: string;
  title: string;
  status: string;
  seats?: number;
  zone?: string;
  image?: string;
};
type FlavorRow = {
  id: string;
  title: string;
  price: number;
  image?: string;
  brand?: string;
  category?: string;
};
type HookahBrandRow = {
  id: string;
  title: string;
  isPremium?: boolean;
  sortOrder?: number;
};
type BookingRow = {
  id: string;
  kind?: "device" | "hookah";
  deviceName: string;
  startHour: string;
  durationHours: number;
  price: number;
  status: string;
  createdAt: string;
};

function mergeRowDrafts<T extends { id: string }>(
  prev: Record<string, T>,
  rows: T[],
  toDraft: (row: T) => T,
): Record<string, T> {
  const next = { ...prev };
  const rowIds = new Set(rows.map((row) => row.id));

  for (const row of rows) {
    if (!next[row.id]) {
      next[row.id] = toDraft(row);
    }
  }

  for (const id of Object.keys(next)) {
    if (!rowIds.has(id)) {
      delete next[id];
    }
  }

  return next;
}

type IncomingOrderRow = {
  id: string;
  type: "booking" | "hookah";
  title: string;
  price: number;
  status: string;
  deviceName: string;
  startHour: string;
  durationHours: number;
  createdAt: string;
  customerName: string;
  customerPhone: string;
};

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="size-4" /> },
  { key: "users", label: "Foydalanuvchilar", icon: <Users className="size-4" /> },
  { key: "devices", label: "Qurilmalar", icon: <Gamepad2 className="size-4" /> },
  { key: "tables", label: "Stollar", icon: <Armchair className="size-4" /> },
  { key: "hookah", label: "Kalyan", icon: <Cigarette className="size-4" /> },
  { key: "bookings", label: "Bronlar", icon: <CalendarCheck className="size-4" /> },
  { key: "settings", label: "Sozlamalar", icon: <Settings className="size-4" /> },
];

export function AdminApp() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [admin, setAdmin] = useState<AdminSession | null>(null);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [incomingOrders, setIncomingOrders] = useState<IncomingOrderRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [tables, setTables] = useState<TableRow[]>([]);
  const [flavors, setFlavors] = useState<FlavorRow[]>([]);
  const [hookahBrands, setHookahBrands] = useState<HookahBrandRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [newNotification, setNewNotification] = useState("");
  const loadSeqRef = useRef(0);

  const loadData = useCallback(async (silent = false) => {
    const seq = ++loadSeqRef.current;

    if (!silent) {
      setLoading(true);
    }
    setError("");

    try {
      const [
        dashResult,
        usersResult,
        devicesResult,
        tablesResult,
        hookahResult,
        brandsResult,
        bookingsResult,
        settingsResult,
      ] = await Promise.allSettled([
        adminRequest<{ stats: DashboardStats; incomingOrders: IncomingOrderRow[] }>("/api/admin/dashboard"),
        adminRequest<{ users: UserRow[] }>("/api/admin/users"),
        adminRequest<{ devices: DeviceRow[] }>("/api/admin/devices"),
        adminRequest<{ tables: TableRow[] }>("/api/admin/tables"),
        adminRequest<{ flavors: FlavorRow[] }>("/api/admin/hookah"),
        adminRequest<{ brands: HookahBrandRow[] }>("/api/admin/hookah-brands"),
        adminRequest<{ bookings: BookingRow[] }>("/api/admin/bookings"),
        adminRequest<{ paymentMethods: string[]; notifications: string[] }>("/api/admin/settings"),
      ]);

      if (seq !== loadSeqRef.current) {
        return;
      }

      const failures: string[] = [];

      if (dashResult.status === "fulfilled") {
        setStats(dashResult.value.stats);
        setIncomingOrders(dashResult.value.incomingOrders ?? []);
      } else {
        failures.push(dashResult.reason instanceof Error ? dashResult.reason.message : "Dashboard");
      }

      if (usersResult.status === "fulfilled") {
        setUsers(usersResult.value.users);
      } else {
        failures.push(usersResult.reason instanceof Error ? usersResult.reason.message : "Foydalanuvchilar");
      }

      if (devicesResult.status === "fulfilled") {
        setDevices(devicesResult.value.devices);
      } else {
        failures.push(devicesResult.reason instanceof Error ? devicesResult.reason.message : "Qurilmalar");
      }

      if (tablesResult.status === "fulfilled") {
        setTables(tablesResult.value.tables);
      } else {
        failures.push(tablesResult.reason instanceof Error ? tablesResult.reason.message : "Stollar");
      }

      if (hookahResult.status === "fulfilled") {
        setFlavors(hookahResult.value.flavors);
      } else {
        failures.push(hookahResult.reason instanceof Error ? hookahResult.reason.message : "Kalyan");
      }

      if (brandsResult.status === "fulfilled") {
        setHookahBrands(brandsResult.value.brands);
      } else {
        setHookahBrands([]);
        failures.push(brandsResult.reason instanceof Error ? brandsResult.reason.message : "Tabaklar");
      }

      if (bookingsResult.status === "fulfilled") {
        setBookings(bookingsResult.value.bookings);
      } else {
        failures.push(bookingsResult.reason instanceof Error ? bookingsResult.reason.message : "Bronlar");
      }

      if (settingsResult.status === "fulfilled") {
        setPaymentMethods(settingsResult.value.paymentMethods);
        setNotifications(settingsResult.value.notifications);
      } else {
        failures.push(settingsResult.reason instanceof Error ? settingsResult.reason.message : "Sozlamalar");
      }

      if (failures.length) {
        setError(failures[0]);
      }
    } finally {
      if (seq === loadSeqRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const session = getAdminSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    setAdmin(session);
    setReady(true);
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    loadData();
  }, [ready, loadData]);

  useEffect(() => {
    if (!ready) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = subscribeClubUpdates((event) => {
      if (event.message) {
        const message = event.message;
        setNotifications((prev) => [message, ...prev.slice(0, 9)]);
      }

      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        void loadData(true);
      }, 500);
    });

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      unsubscribe();
    };
  }, [ready, loadData]);

  const handleLogout = () => {
    clearAdminSession();
    router.replace("/login");
  };

  if (!ready || !admin) {
    return (
      <main className="flex h-dvh items-center justify-center bg-admin-base text-text-primary">
        <div className="flex flex-col items-center gap-4">
          <BrandLogo size="lg" />
          <p className="animate-pulse text-sm font-semibold text-brand-gold">Admin yuklanmoqda...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-shell bg-admin-base text-text-primary">
      <div className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden lg:flex-row">
        <aside className="flex w-full shrink-0 flex-col border-b border-brand-gold/25 bg-admin-sidebar p-4 lg:hidden">
          <div className="flex items-center gap-2.5">
            <BrandLogo size="sm" />
            <p className="label-caps text-brand-gold">Admin — {admin.name}</p>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {TABS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-2 text-xs font-semibold",
                  tab === item.key ? "bg-brand-gold-dim text-brand-gold" : "bg-arena-overlay/50 text-text-muted",
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-brand-gold/25 bg-admin-sidebar p-5 lg:flex">
          <div className="flex items-center gap-3">
            <BrandLogo size="md" />
            <div className="min-w-0">
              <p className="label-caps text-brand-gold">Admin</p>
              <h1 className="mt-1 text-xl font-bold text-text-primary">Arsenal Union</h1>
            </div>
          </div>
          <p className="mt-3 truncate text-sm text-text-muted">{admin.name}</p>

          <nav className="mt-8 space-y-1">
            {TABS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition",
                  tab === item.key
                    ? "bg-amber-500/20 text-amber-100"
                    : "text-violet-200/70 hover:bg-white/5 hover:text-white",
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto space-y-2 pt-6">
            <Button type="button" variant="secondary" className="w-full" onClick={handleLogout}>
              <LogOut className="size-4" />
              Chiqish
            </Button>
          </div>
        </aside>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-6">
          <header className="mb-6 flex shrink-0 flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-amber-300/80">{TABS.find((t) => t.key === tab)?.label}</p>
              <h2 className="text-3xl font-black">Boshqaruv paneli</h2>
            </div>
            <Button type="button" variant="secondary" onClick={() => void loadData()}>
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
              Yangilash
            </Button>
          </header>

          {error ? (
            <div className="mb-4 shrink-0 rounded-xl border border-rose-500/50 bg-rose-500/15 px-4 py-3 text-sm text-rose-100">
              <p className="font-semibold">API ulanmadi</p>
              <p className="mt-1">{error}</p>
              <p className="mt-2 text-xs text-rose-200/80">
                Server ishga tushiring: <code className="text-amber-200">cd server && npm run dev</code>
              </p>
            </div>
          ) : null}

          {loading ? (
            <p className="mb-4 shrink-0 text-sm text-amber-200/80">Ma&apos;lumotlar yangilanmoqda...</p>
          ) : null}

          <div className="admin-panel-scroll">
          {tab === "dashboard" && stats ? (
            <DashboardPanel stats={stats} incomingOrders={incomingOrders} />
          ) : null}
          {tab === "dashboard" && !stats && !loading ? (
            <p className="rounded-xl border border-amber-500/30 bg-[#221c42] px-4 py-6 text-violet-100/80">
              Statistika yuklanmadi. Server va web qayta ishga tushirilganini tekshiring.
            </p>
          ) : null}
          {tab === "users" ? <UsersPanel users={users} onRefresh={loadData} /> : null}
          {tab === "devices" ? <DevicesPanel devices={devices} onRefresh={loadData} /> : null}
          {tab === "tables" ? <TablesPanel tables={tables} onRefresh={loadData} /> : null}
          {tab === "hookah" ? (
            <HookahPanel
              flavors={flavors}
              brands={hookahBrands}
              onRefresh={loadData}
              onBrandUpsert={(brand) => {
                setHookahBrands((prev) => {
                  const next = prev.filter((item) => item.id !== brand.id);
                  return [...next, brand].sort(
                    (left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0) || left.title.localeCompare(right.title),
                  );
                });
              }}
              onBrandRemove={(brandId) => {
                setHookahBrands((prev) => prev.filter((item) => item.id !== brandId));
              }}
            />
          ) : null}
          {tab === "bookings" ? <BookingsPanel bookings={bookings} onRefresh={loadData} /> : null}
          {tab === "settings" ? (
            <SettingsPanel
              paymentMethods={paymentMethods}
              notifications={notifications}
              newNotification={newNotification}
              setNewNotification={setNewNotification}
              onRefresh={loadData}
            />
          ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function DashboardPanel({
  stats,
  incomingOrders,
}: {
  stats: DashboardStats;
  incomingOrders: IncomingOrderRow[];
}) {
  const cards = [
    { label: "Foydalanuvchilar", value: stats.users },
    { label: "Qurilmalar", value: `${stats.availableDevices}/${stats.devices}` },
    { label: "Bronlar", value: stats.bookings },
    { label: "Faol bronlar", value: stats.activeBookings },
    { label: "Stollar", value: stats.tables },
    { label: "Kalyan ta'mlari", value: stats.flavors },
    { label: "Jami daromad", value: formatCurrency(stats.totalRevenue) },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <AdminCard key={card.label}>
            <CardHeader>
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="text-3xl text-amber-50">{card.value}</CardTitle>
            </CardHeader>
          </AdminCard>
        ))}
      </div>

      <AdminCard>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl text-amber-50">
              <Inbox className="size-5 text-brand-gold" />
              Kelgan buyurtmalar
            </CardTitle>
            <CardDescription>Faol bronlar — to&apos;lov kutilmoqda yoki jarayonda</CardDescription>
          </div>
          <Badge className="shrink-0 border-brand-gold/30 bg-brand-gold-dim text-brand-gold">
            {incomingOrders.length} ta
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {!incomingOrders.length ? (
            <p className="rounded-xl border border-dashed border-brand-gold/20 bg-arena-overlay/40 px-4 py-8 text-center text-sm text-text-muted">
              Hozircha yangi buyurtma yo&apos;q.
            </p>
          ) : (
            incomingOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-brand-gold/20 bg-arena-overlay/50 p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge
                      className={
                        order.type === "hookah"
                          ? "border-pink-400/40 bg-pink-500/15 text-pink-200"
                          : "border-cyan-400/40 bg-cyan-500/15 text-cyan-200"
                      }
                    >
                      {order.type === "hookah" ? "Kalyan" : "Bron"}
                    </Badge>
                    <Badge className="border-amber-400/40 bg-amber-500/15 text-amber-200">Faol</Badge>
                  </div>
                  <p className="font-semibold text-text-primary">{order.title}</p>
                  <p className="mt-1 text-sm text-text-muted">
                    {order.customerName} · {order.customerPhone}
                  </p>
                  <p className="mt-1 text-xs text-text-faint">
                    Boshlanish: {order.startHour}
                    {order.type === "hookah"
                      ? ` · ${order.durationHours} kalyan`
                      : ` · ${order.durationHours} soat`}{" "}
                    · Qabul qilindi: {formatDateTime(order.createdAt)}
                  </p>
                </div>
                <p className="shrink-0 text-lg font-bold tabular-nums text-brand-gold">{formatCurrency(order.price)}</p>
              </div>
            ))
          )}
        </CardContent>
      </AdminCard>
    </div>
  );
}

function UsersPanel({ users, onRefresh }: { users: UserRow[]; onRefresh: () => void }) {
  const deleteUser = async (id: string) => {
    if (!confirm("Foydalanuvchini o'chirasizmi?")) return;
    await adminRequest(`/api/admin/users/${id}`, { method: "DELETE" });
    onRefresh();
  };

  return (
    <AdminTable
      title="Foydalanuvchilar"
      headers={["Ism", "Telefon", "Email", "Rol", ""]}
      rows={users.map((user) => [
        user.name,
        user.phone,
        user.email,
        user.role,
        <Button key={user.id} type="button" size="sm" variant="secondary" onClick={() => deleteUser(user.id)}>
          <Trash2 className="size-3" />
        </Button>,
      ])}
    />
  );
}

function DevicesPanel({ devices, onRefresh }: { devices: DeviceRow[]; onRefresh: () => void }) {
  const [zone, setZone] = useState<DeviceZone | null>(null);
  const [form, setForm] = useState({ slug: "", name: "", type: "PS Zona", pricePerHour: "45000", status: "available" });

  const psDevices = useMemo(() => filterDevicesByZone(devices, "ps"), [devices]);
  const pcDevices = useMemo(() => filterDevicesByZone(devices, "pc"), [devices]);
  const zoneDevices = zone === "ps" ? psDevices : zone === "pc" ? pcDevices : [];

  const openZone = (nextZone: DeviceZone) => {
    setZone(nextZone);
    setForm((prev) => ({
      ...prev,
      type: nextZone === "ps" ? "PS Zona" : "PC Zona",
    }));
  };

  const createDevice = async () => {
    await adminRequest("/api/admin/devices", { method: "POST", body: JSON.stringify({ ...form, pricePerHour: Number(form.pricePerHour) }) });
    setForm({
      slug: "",
      name: "",
      type: zone === "pc" ? "PC Zona" : "PS Zona",
      pricePerHour: "45000",
      status: "available",
    });
    onRefresh();
  };

  const updateStatus = async (id: string, status: string) => {
    await adminRequest(`/api/admin/devices/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    onRefresh();
  };

  const deleteDevice = async (id: string) => {
    if (!confirm("Qurilmani o'chirasizmi?")) return;
    await adminRequest(`/api/admin/devices/${id}`, { method: "DELETE" });
    onRefresh();
  };

  const renderDeviceTable = (title: string, list: DeviceRow[]) => (
    <AdminTable
      title={title}
      headers={["ID", "Nomi", "Turi", "Narx", "Holat", ""]}
      rows={list.map((device) => [
        device.id,
        device.name,
        device.type,
        formatCurrency(device.pricePerHour),
        <ColoredStatusSelect
          key={`${device.id}-status`}
          value={device.status}
          onChange={(status) => updateStatus(device.id, status)}
          options={DEVICE_STATUS_OPTIONS}
        />,
        <Button key={`${device.id}-del`} type="button" size="sm" variant="secondary" onClick={() => deleteDevice(device.id)}>
          <Trash2 className="size-3" />
        </Button>,
      ])}
    />
  );

  return (
    <div className="space-y-5">
      <AdminCard>
        <CardHeader>
          <CardTitle>Yangi qurilma</CardTitle>
          <CardDescription>
            {zone ? `${zone === "ps" ? "PlayStation" : "Kompyuter"} zonasiga qo'shish` : "Avval zonani tanlang"}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Input placeholder="slug (ixtiyoriy)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <Input placeholder="Nomi" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="h-9 font-bold text-white scheme-dark"
            aria-label="Zona"
          >
            {DEVICE_ZONE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-[#181425] text-white">
                {option.label}
              </option>
            ))}
          </Select>
          <Input placeholder="Narx/soat" value={form.pricePerHour} onChange={(e) => setForm({ ...form, pricePerHour: e.target.value })} />
          <ColoredStatusSelect value={form.status} onChange={(status) => setForm({ ...form, status })} options={DEVICE_STATUS_OPTIONS} />
          <Button type="button" onClick={createDevice} disabled={!zone}>
            Qo&apos;shish
          </Button>
        </CardContent>
      </AdminCard>

      {!zone ? (
        <AdminCard>
          <CardHeader>
            <CardTitle>Qurilmalar zonasi</CardTitle>
            <CardDescription>PS va PC alohida boshqariladi</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => openZone("ps")}
              className="rounded-3xl border border-cyan-400/35 bg-gradient-to-br from-cyan-500/20 to-violet-900/30 p-6 text-left transition hover:border-cyan-300/60"
            >
              <Gamepad2 className="size-9 text-cyan-200" />
              <p className="mt-4 text-xl font-black text-white">PlayStation</p>
              <p className="mt-1 text-sm text-cyan-100/70">{psDevices.length} ta qurilma</p>
            </button>
            <button
              type="button"
              onClick={() => openZone("pc")}
              className="rounded-3xl border border-fuchsia-400/35 bg-gradient-to-br from-fuchsia-500/20 to-violet-900/30 p-6 text-left transition hover:border-fuchsia-300/60"
            >
              <Monitor className="size-9 text-fuchsia-200" />
              <p className="mt-4 text-xl font-black text-white">Kompyuter</p>
              <p className="mt-1 text-sm text-fuchsia-100/70">{pcDevices.length} ta qurilma</p>
            </button>
          </CardContent>
        </AdminCard>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="ghost" size="sm" onClick={() => setZone(null)}>
              <ArrowLeft className="size-4" />
              Orqaga
            </Button>
            <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-1 text-emerald-300">
                <span className="size-2 rounded-full bg-emerald-400" /> Bo&apos;sh
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/40 bg-rose-500/10 px-2 py-1 text-rose-300">
                <span className="size-2 rounded-full bg-rose-400" /> Band
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-1 text-amber-300">
                <span className="size-2 rounded-full bg-amber-400" /> Bron
              </span>
            </div>
          </div>
          {renderDeviceTable(zone === "ps" ? "PS qurilmalari" : "PC qurilmalari", zoneDevices)}
        </div>
      )}
    </div>
  );
}

function TablesPanel({ tables, onRefresh }: { tables: TableRow[]; onRefresh: () => void }) {
  const [form, setForm] = useState({
    slug: "",
    title: "",
    status: "available",
    seats: "4",
    zone: "Kafe zonasi",
    image: "/hookah/table-01.png",
  });
  const [drafts, setDrafts] = useState<Record<string, TableRow>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    setDrafts((prev) =>
      mergeRowDrafts(prev, tables, (table) => ({
        id: table.id,
        title: table.title,
        status: table.status,
        seats: table.seats ?? 4,
        zone: table.zone ?? "Kafe zonasi",
        image: table.image ?? "",
      })),
    );
  }, [tables]);

  const addTable = async () => {
    if (!form.title.trim()) {
      alert("Stol nomini kiriting");
      return;
    }

    await adminRequest("/api/admin/tables", {
      method: "POST",
      body: JSON.stringify({
        slug: form.slug.trim() || undefined,
        title: form.title.trim(),
        status: form.status,
        seats: Number(form.seats) || 4,
        zone: form.zone.trim() || "Kafe zonasi",
        image: form.image.trim(),
      }),
    });

    setForm({
      slug: "",
      title: "",
      status: "available",
      seats: "4",
      zone: "Kafe zonasi",
      image: "/hookah/table-01.png",
    });
    onRefresh();
  };

  const saveTable = async (id: string) => {
    const draft = drafts[id];
    if (!draft?.title.trim()) {
      alert("Stol nomi bo'sh bo'lmasligi kerak");
      return;
    }

    setSavingId(id);
    try {
      const { table } = await adminRequest<{ table: TableRow }>(`/api/admin/tables/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: draft.title.trim(),
          status: draft.status,
          seats: Number(draft.seats) || 4,
          zone: draft.zone?.trim() || "Kafe zonasi",
          image: draft.image?.trim() ?? "",
        }),
      });
      setDrafts((prev) => ({
        ...prev,
        [id]: {
          id: table.id,
          title: table.title,
          status: table.status,
          seats: table.seats ?? 4,
          zone: table.zone ?? "Kafe zonasi",
          image: table.image ?? "",
        },
      }));
      onRefresh();
    } finally {
      setSavingId(null);
    }
  };

  const deleteTable = async (id: string) => {
    if (!confirm("Stolni o'chirasizmi?")) return;
    await adminRequest(`/api/admin/tables/${id}`, { method: "DELETE" });
    onRefresh();
  };

  const patchDraft = (id: string, patch: Partial<TableRow>) => {
    setDrafts((prev) => {
      const base = prev[id] ?? tables.find((table) => table.id === id);
      if (!base) {
        return prev;
      }

      return {
        ...prev,
        [id]: { ...base, ...patch },
      };
    });
  };

  return (
    <div className="space-y-5">
      <AdminCard>
        <CardHeader>
          <CardTitle>Yangi stol</CardTitle>
          <CardDescription>Kalyan zonasiga yangi stol qo&apos;shish</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Input placeholder="Slug (ixtiyoriy)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <Input placeholder="Stol nomi *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input placeholder="O'rindiqlar soni" value={form.seats} onChange={(e) => setForm({ ...form, seats: e.target.value })} />
          <Select
            value={form.zone}
            onChange={(e) => setForm({ ...form, zone: e.target.value })}
            className="h-9 font-bold text-white scheme-dark"
            aria-label="Zona"
          >
            {TABLE_ZONE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-[#181425] text-white">
                {option.label}
              </option>
            ))}
          </Select>
          <div className="sm:col-span-2 lg:col-span-3">
            <ImageUploadField
              value={form.image}
              fileBaseName={form.slug.trim() || slugifyLabel(form.title)}
              uploadPath="/api/admin/media/table-image"
              onChange={(image) => setForm({ ...form, image })}
            />
          </div>
          <ColoredStatusSelect value={form.status} onChange={(status) => setForm({ ...form, status })} options={TABLE_STATUS_OPTIONS} />
          <Button type="button" onClick={addTable}>
            Stol qo&apos;shish
          </Button>
        </CardContent>
      </AdminCard>

      <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-1 text-emerald-300">
          <span className="size-2 rounded-full bg-emerald-400" /> Bo&apos;sh
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/40 bg-rose-500/10 px-2 py-1 text-rose-300">
          <span className="size-2 rounded-full bg-rose-400" /> Band
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-1 text-amber-300">
          <span className="size-2 rounded-full bg-amber-400" /> Bron
        </span>
      </div>

      <AdminTable
        title="Stollar"
        headers={["ID", "Nomi", "O'rindiq", "Zona", "Rasm", "Holat", ""]}
        rows={tables.map((table) => {
          const draft = drafts[table.id] ?? table;

          return [
            table.id,
            <Input
              key={`${table.id}-title`}
              value={draft.title}
              onChange={(e) => patchDraft(table.id, { title: e.target.value })}
              className="min-w-[120px]"
            />,
            <Input
              key={`${table.id}-seats`}
              value={String(draft.seats ?? 4)}
              onChange={(e) => patchDraft(table.id, { seats: Number(e.target.value) || 4 })}
              className="max-w-[72px]"
            />,
            <Select
              key={`${table.id}-zone`}
              value={draft.zone ?? "Kafe zonasi"}
              onChange={(e) => patchDraft(table.id, { zone: e.target.value })}
              className="h-9 min-w-[130px] font-bold text-white scheme-dark"
            >
              {TABLE_ZONE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-[#181425] text-white">
                  {option.label}
                </option>
              ))}
            </Select>,
            <ImageUploadField
              key={`${table.id}-image`}
              value={draft.image ?? ""}
              fileBaseName={table.id}
              uploadPath="/api/admin/media/table-image"
              onChange={(image) => patchDraft(table.id, { image })}
            />,
            <ColoredStatusSelect
              key={`${table.id}-status`}
              value={draft.status}
              onChange={(status) => patchDraft(table.id, { status })}
              options={TABLE_STATUS_OPTIONS}
            />,
            <div key={`${table.id}-actions`} className="flex gap-1">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={savingId === table.id}
                onClick={() => saveTable(table.id)}
              >
                <Save className="size-3" />
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => deleteTable(table.id)}>
                <Trash2 className="size-3" />
              </Button>
            </div>,
          ];
        })}
      />
    </div>
  );
}

function HookahBrandsPanel({
  brands,
  onRefresh,
  onBrandUpsert,
  onBrandRemove,
}: {
  brands: HookahBrandRow[];
  onRefresh: () => void;
  onBrandUpsert: (brand: HookahBrandRow) => void;
  onBrandRemove: (brandId: string) => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, HookahBrandRow>>({});
  const [newTitle, setNewTitle] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    setDrafts((prev) =>
      mergeRowDrafts(prev, brands, (brand) => ({
        id: brand.id,
        title: brand.title,
        isPremium: brand.isPremium ?? false,
        sortOrder: brand.sortOrder ?? 0,
      })),
    );
  }, [brands]);

  const defaultBrandId = brands[0]?.id ?? "serbetli";

  const addBrand = async () => {
    if (!newTitle.trim()) {
      alert("Tabak nomini kiriting");
      return;
    }

    const { brand } = await adminRequest<{ brand: HookahBrandRow }>("/api/admin/hookah-brands", {
      method: "POST",
      body: JSON.stringify({ title: newTitle.trim() }),
    });
    onBrandUpsert(brand);
    setNewTitle("");
    onRefresh();
  };

  const saveBrand = async (id: string) => {
    const draft = drafts[id];
    if (!draft?.title.trim()) {
      alert("Tabak nomi bo'sh bo'lmasligi kerak");
      return;
    }

    setSavingId(id);
    try {
      const { brand } = await adminRequest<{ brand: HookahBrandRow }>(`/api/admin/hookah-brands/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: draft.title.trim(),
          isPremium: Boolean(draft.isPremium),
        }),
      });
      setDrafts((prev) => ({
        ...prev,
        [id]: {
          id: brand.id,
          title: brand.title,
          isPremium: brand.isPremium ?? false,
          sortOrder: brand.sortOrder ?? 0,
        },
      }));
      onBrandUpsert(brand);
      onRefresh();
    } finally {
      setSavingId(null);
    }
  };

  const deleteBrand = async (id: string) => {
    if (!confirm("Tabakni o'chirasizmi?")) return;

    try {
      await adminRequest(`/api/admin/hookah-brands/${id}`, { method: "DELETE" });
      onBrandRemove(id);
      onRefresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Tabakni o'chirib bo'lmadi");
    }
  };

  const patchDraft = (id: string, patch: Partial<HookahBrandRow>) => {
    setDrafts((prev) => {
      const base = prev[id] ?? brands.find((brand) => brand.id === id);
      if (!base) {
        return prev;
      }

      return {
        ...prev,
        [id]: { ...base, ...patch },
      };
    });
  };

  return (
    <AdminCard>
      <CardHeader>
        <CardTitle>Tabaklar</CardTitle>
        <CardDescription>Serbetli, LIARA va boshqa tabak nomlarini boshqarish</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-violet-200/60">
              Yangi tabak
            </label>
            <Input
              placeholder="Masalan: Darkside"
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
            />
          </div>
          <Button type="button" onClick={addBrand}>
            Qo&apos;shish
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-violet-500/25 text-violet-200/60">
                {["Slug", "Nomi", "Premium", ""].map((header) => (
                  <th key={header} className="px-3 py-2 font-semibold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {brands.map((brand) => {
                const draft = drafts[brand.id] ?? brand;

                return (
                  <tr key={brand.id} className="border-b border-violet-500/10">
                    <td className="px-3 py-3 font-mono text-xs text-violet-100/70">{brand.id}</td>
                    <td className="px-3 py-3">
                      <Input
                        value={draft.title}
                        onChange={(event) => patchDraft(brand.id, { title: event.target.value })}
                        className="min-w-[160px]"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <label className="inline-flex items-center gap-2 text-sm text-violet-100/80">
                        <input
                          type="checkbox"
                          checked={Boolean(draft.isPremium)}
                          onChange={(event) => patchDraft(brand.id, { isPremium: event.target.checked })}
                          className="size-4 rounded border-violet-400/40 bg-[#181425]"
                        />
                        Premium
                      </label>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={savingId === brand.id}
                          onClick={() => saveBrand(brand.id)}
                        >
                          <Save className="size-3" />
                        </Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => deleteBrand(brand.id)}>
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!brands.length ? (
          <p className="text-sm text-violet-100/60">Tabaklar yuklanmoqda yoki hali qo&apos;shilmagan.</p>
        ) : null}
        <p className="text-[11px] text-violet-200/50">
          O&apos;chirish uchun tabakda ta&apos;m bo&apos;lmasligi kerak. Standart tabak: {defaultBrandId}
        </p>
      </CardContent>
    </AdminCard>
  );
}

function HookahPanel({
  flavors,
  brands,
  onRefresh,
  onBrandUpsert,
  onBrandRemove,
}: {
  flavors: FlavorRow[];
  brands: HookahBrandRow[];
  onRefresh: () => void;
  onBrandUpsert: (brand: HookahBrandRow) => void;
  onBrandRemove: (brandId: string) => void;
}) {
  const defaultBrandId = brands[0]?.id ?? "serbetli";
  const [form, setForm] = useState({
    slug: "",
    title: "",
    price: "75000",
    brand: defaultBrandId,
    image: "",
  });
  const [drafts, setDrafts] = useState<Record<string, FlavorRow>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!brands.some((brand) => brand.id === form.brand)) {
      setForm((prev) => ({ ...prev, brand: defaultBrandId }));
    }
  }, [brands, defaultBrandId, form.brand]);

  useEffect(() => {
    setDrafts((prev) =>
      mergeRowDrafts(prev, flavors, (flavor) => ({
        id: flavor.id,
        title: flavor.title,
        price: flavor.price,
        brand: flavor.brand ?? defaultBrandId,
        image: flavor.image ?? "",
      })),
    );
  }, [flavors]);

  const addFlavor = async () => {
    if (!form.title.trim()) {
      alert("Ta'm nomini kiriting");
      return;
    }

    await adminRequest("/api/admin/hookah", {
      method: "POST",
      body: JSON.stringify({
        slug: form.slug.trim() || undefined,
        title: form.title.trim(),
        price: Number(form.price) || 0,
        brand: form.brand,
        image: form.image.trim(),
      }),
    });

    setForm({
      slug: "",
      title: "",
      price: "75000",
      brand: defaultBrandId,
      image: "",
    });
    onRefresh();
  };

  const saveFlavor = async (id: string) => {
    const draft = drafts[id];
    if (!draft?.title.trim()) {
      alert("Ta'm nomi bo'sh bo'lmasligi kerak");
      return;
    }

    setSavingId(id);
    try {
      const { flavor } = await adminRequest<{ flavor: FlavorRow }>(`/api/admin/hookah/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: draft.title.trim(),
          price: Number(draft.price) || 0,
          brand: draft.brand ?? defaultBrandId,
          image: draft.image?.trim() ?? "",
        }),
      });
      setDrafts((prev) => ({
        ...prev,
        [id]: {
          id: flavor.id,
          title: flavor.title,
          price: flavor.price,
          brand: flavor.brand ?? defaultBrandId,
          image: flavor.image ?? "",
        },
      }));
      onRefresh();
    } finally {
      setSavingId(null);
    }
  };

  const deleteFlavor = async (id: string) => {
    if (!confirm("Ta'mni o'chirasizmi?")) return;
    await adminRequest(`/api/admin/hookah/${id}`, { method: "DELETE" });
    onRefresh();
  };

  const patchDraft = (id: string, patch: Partial<FlavorRow>) => {
    setDrafts((prev) => {
      const base = prev[id] ?? flavors.find((flavor) => flavor.id === id);
      if (!base) {
        return prev;
      }

      return {
        ...prev,
        [id]: { ...base, ...patch },
      };
    });
  };

  return (
    <div className="space-y-5">
      <HookahBrandsPanel
        brands={brands}
        onRefresh={onRefresh}
        onBrandUpsert={onBrandUpsert}
        onBrandRemove={onBrandRemove}
      />

      <AdminCard>
        <CardHeader>
          <CardTitle>Yangi ta&apos;m</CardTitle>
          <CardDescription>Tabak tanlab yangi ta&apos;m qo&apos;shish</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Input placeholder="Slug (ixtiyoriy)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <Input placeholder="Ta'm nomi *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input placeholder="Narx (UZS)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <Select
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
            className="h-9 font-bold text-white scheme-dark"
          >
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id} className="bg-[#181425] text-white">
                {brand.title}
              </option>
            ))}
          </Select>
          <div className="sm:col-span-2 lg:col-span-3">
            <ImageUploadField
              value={form.image}
              fileBaseName={form.slug.trim() || slugifyLabel(form.title)}
              uploadPath="/api/admin/media/hookah-flavor"
              onChange={(image) => setForm({ ...form, image })}
            />
          </div>
          <Button type="button" onClick={addFlavor}>
            Qo&apos;shish
          </Button>
        </CardContent>
      </AdminCard>

      <AdminTable
        title="Kalyan ta'mlari"
        headers={["ID", "Nomi", "Narx", "Brend", "Rasm", ""]}
        rows={flavors.map((flavor) => {
          const draft = drafts[flavor.id] ?? flavor;

          return [
            flavor.id,
            <Input
              key={`${flavor.id}-title`}
              value={draft.title}
              onChange={(e) => patchDraft(flavor.id, { title: e.target.value })}
              className="min-w-[120px]"
            />,
            <Input
              key={`${flavor.id}-price`}
              value={String(draft.price)}
              onChange={(e) => patchDraft(flavor.id, { price: Number(e.target.value) || 0 })}
              className="max-w-[100px]"
            />,
            <Select
              key={`${flavor.id}-brand`}
              value={draft.brand ?? defaultBrandId}
              onChange={(e) => patchDraft(flavor.id, { brand: e.target.value })}
              className="h-9 min-w-[110px] font-bold text-white scheme-dark"
            >
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id} className="bg-[#181425] text-white">
                  {brand.title}
                </option>
              ))}
            </Select>,
            <ImageUploadField
              key={`${flavor.id}-image`}
              value={draft.image ?? ""}
              fileBaseName={flavor.id}
              uploadPath="/api/admin/media/hookah-flavor"
              onChange={(image) => patchDraft(flavor.id, { image })}
            />,
            <div key={`${flavor.id}-actions`} className="flex gap-1">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={savingId === flavor.id}
                onClick={() => saveFlavor(flavor.id)}
              >
                <Save className="size-3" />
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => deleteFlavor(flavor.id)}>
                <Trash2 className="size-3" />
              </Button>
            </div>,
          ];
        })}
      />
    </div>
  );
}

function BookingsPanel({ bookings, onRefresh }: { bookings: BookingRow[]; onRefresh: () => void }) {
  const updateStatus = async (id: string, status: string) => {
    await adminRequest(`/api/admin/bookings/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    onRefresh();
  };

  const deleteBooking = async (id: string) => {
    if (!confirm("Bronni o'chirasizmi?")) return;
    await adminRequest(`/api/admin/bookings/${id}`, { method: "DELETE" });
    onRefresh();
  };

  return (
    <div className="admin-table-panel">
      <AdminTable
        scrollable
        title="Bronlar"
        headers={["Turi", "Buyurtma", "Vaqt", "Miqdor", "Narx", "Holat", "Sana", ""]}
        rows={bookings.map((booking) => [
          booking.kind === "hookah" ? "Kalyan" : "Qurilma",
          booking.deviceName,
          booking.startHour,
          booking.kind === "hookah" ? `${booking.durationHours} kalyan` : `${booking.durationHours} soat`,
          formatCurrency(booking.price),
          <Select key={`${booking.id}-s`} value={booking.status} onChange={(e) => updateStatus(booking.id, e.target.value)} className="h-9">
            <option value="active">Faol</option>
            <option value="completed">Yakunlangan</option>
            <option value="cancelled">Bekor</option>
          </Select>,
          new Date(booking.createdAt).toLocaleString("uz-UZ"),
          <Button key={booking.id} type="button" size="sm" variant="secondary" onClick={() => deleteBooking(booking.id)}>
            <Trash2 className="size-3" />
          </Button>,
        ])}
      />
    </div>
  );
}

function SettingsPanel({
  paymentMethods,
  notifications,
  newNotification,
  setNewNotification,
  onRefresh,
}: {
  paymentMethods: string[];
  notifications: string[];
  newNotification: string;
  setNewNotification: (value: string) => void;
  onRefresh: () => void;
}) {
  const [methodsText, setMethodsText] = useState(paymentMethods.join(", "));

  useEffect(() => {
    setMethodsText(paymentMethods.join(", "));
  }, [paymentMethods]);

  const saveSettings = async () => {
    await adminRequest("/api/admin/settings", {
      method: "PATCH",
      body: JSON.stringify({
        paymentMethods: methodsText.split(",").map((m) => m.trim()).filter(Boolean),
      }),
    });
    onRefresh();
  };

  const addNotification = async () => {
    await adminRequest("/api/admin/settings/notifications", {
      method: "POST",
      body: JSON.stringify({ message: newNotification }),
    });
    setNewNotification("");
    onRefresh();
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <AdminCard>
        <CardHeader>
          <CardTitle>To&apos;lov usullari</CardTitle>
          <CardDescription>Vergul bilan ajrating: Payme, Click, Uzum Bank</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input value={methodsText} onChange={(e) => setMethodsText(e.target.value)} />
          <Button type="button" onClick={saveSettings}>
            Saqlash
          </Button>
        </CardContent>
      </AdminCard>

      <AdminCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="size-4" />
            Bildirishnomalar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Yangi xabar..."
              value={newNotification}
              onChange={(e) => setNewNotification(e.target.value)}
            />
            <Button type="button" onClick={addNotification}>
              Yuborish
            </Button>
          </div>
          <ul className="space-y-2 text-sm text-violet-100/80">
            {notifications.map((note) => (
              <li key={note} className="rounded-lg border border-violet-500/25 bg-white/5 px-3 py-2">
                {note}
              </li>
            ))}
          </ul>
        </CardContent>
      </AdminCard>
    </div>
  );
}

function AdminTable({
  title,
  headers,
  rows,
  scrollable = false,
}: {
  title: string;
  headers: string[];
  rows: React.ReactNode[][];
  scrollable?: boolean;
}) {
  return (
    <AdminCard
      className={cn(
        scrollable && "admin-table-card !p-0",
      )}
    >
      <CardHeader className={cn(scrollable && "shrink-0 px-5 pt-5")}>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent
        className={cn(
          scrollable ? "admin-table-scroll !mt-0 min-h-0 flex-1 space-y-0 px-5 pb-5" : "overflow-x-auto",
        )}
      >
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-violet-500/25 text-violet-200/60">
              {headers.map((header) => (
                <th key={header} className="px-3 py-2 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-b border-violet-500/10">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-3 py-3">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </AdminCard>
  );
}
