"use client";

import {
  Activity,
  ArrowLeft,
  ChevronRight,
  Clock,
  Cpu,
  CreditCard,
  Gamepad2,
  HardDrive,
  Headphones,
  History,
  Keyboard,
  Monitor,
  ShoppingCart,
  Wifi,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { MobileBottomNav } from "@/components/game-club/mobile-bottom-nav";
import { PsZonePanel } from "@/components/game-club/ps-zone-panel";
import { StationUnlockPanel, type ClubSession } from "@/components/game-club/station-unlock-panel";
import { ProfileBox } from "@/components/profile/profile-box";
import { getSession, type UserSession } from "@/lib/auth";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PressButton } from "@/components/ui/press-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BOOKING_STATUS_LABEL,
  type Booking,
  type BookingStatus,
  type CartItem,
  type ClubTable,
  type Device,
  type DeviceStatus,
  type DeviceZone,
  filterDevicesByZone,
  getPcThumbImage,
  type HookahFlavor,
  type OrderRecord,
  ORDER_TYPE_LABEL,
  PC_PROMO_IMAGE,
  PC_HERO_IMAGE,
  PC_SPEC_ITEMS,
  type PaymentMethod,
  PAYMENT_METHODS,
  STATUS_LABEL,
  TABLE_STATUS_LABEL,
  type TableStatus,
  type TabKey,
  TABS,
} from "@/lib/game-club-data";
import { apiRequest, setApiUserId } from "@/lib/api";
import { clearPendingSessions, loadPendingSessions, loadProfileExtras, savePendingSessions } from "@/lib/user-storage";
import { formatCurrency } from "@/lib/format";
import {
  subscribeClubUpdates,
  trackSocketConnection,
  type LiveStatus,
  type RealtimeEntity,
} from "@/lib/socket";
import { cn, touchPress } from "@/lib/utils";

const durationOptions = [1, 2, 3, 4];
function sumPrice(items: CartItem[]) {
  return items.reduce((acc, item) => acc + item.price, 0);
}

export function GameClubApp() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [phone, setPhone] = useState("+998 90 123 45 67");
  const [devices, setDevices] = useState<Device[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [deviceZone, setDeviceZone] = useState<DeviceZone | null>(null);
  const [paidOrders, setPaidOrders] = useState<OrderRecord[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [startHour, setStartHour] = useState("13:00");
  const [durationHours, setDurationHours] = useState(2);
  const [tables, setTables] = useState<ClubTable[]>([]);
  const [hookahFlavors, setHookahFlavors] = useState<HookahFlavor[]>([]);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [selectedFlavorId, setSelectedFlavorId] = useState("");
  const [hookahLoading, setHookahLoading] = useState(false);
  const [hookahStartHour, setHookahStartHour] = useState("13:00");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Payme");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "paid">("pending");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<LiveStatus>("connecting");
  const [pendingSessions, setPendingSessions] = useState<ClubSession[]>([]);
  const [lastPaymentTotal, setLastPaymentTotal] = useState<number | null>(null);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const stored = getSession();
    if (stored) {
      setSession(stored);
      setPhone(stored.phone);
      setApiUserId(stored.id);
      setPendingSessions(loadPendingSessions(stored.id));
    }
  }, []);

  useEffect(() => {
    if (activeTab !== "devices") {
      setDeviceZone(null);
    }
  }, [activeTab]);

  const refreshCart = async () => {
    const data = await apiRequest<{ items: CartItem[]; total: number; paymentStatus: "pending" | "paid" }>("/api/cart");
    setCart(data.items);
    setPaymentStatus(data.paymentStatus);
  };

  const loadDevices = useCallback(async () => {
    const list = await apiRequest<Device[]>("/api/devices");
    setDevices(list);
    if (list.length) {
      setSelectedDeviceId((prev) => (prev && list.some((d) => d.id === prev) ? prev : list[0].id));
    }
  }, []);

  const loadHookahCatalog = useCallback(async () => {
    const [tablesRes, flavorsRes] = await Promise.all([
      apiRequest<ClubTable[]>("/api/tables"),
      apiRequest<HookahFlavor[]>("/api/hookah/flavors"),
    ]);
    setTables(tablesRes);
    setHookahFlavors(flavorsRes);
    if (tablesRes.length) setSelectedTableId((prev) => prev || tablesRes[0].id);
    if (flavorsRes.length) setSelectedFlavorId((prev) => prev || flavorsRes[0].id);
  }, []);

  const loadBookings = useCallback(async () => {
    if (!session?.id) {
      setBookings([]);
      return;
    }
    const list = await apiRequest<Booking[]>(`/api/bookings?userId=${encodeURIComponent(session.id)}`);
    setBookings(list);
  }, [session?.id]);

  const loadPaymentHistory = useCallback(async () => {
    if (!session?.id) {
      setPaidOrders([]);
      setLastPaymentTotal(null);
      return;
    }

    const data = await apiRequest<{
      orders: OrderRecord[];
      payments: { total: number; paidAt: string }[];
    }>(`/api/payments/history?userId=${encodeURIComponent(session.id)}`);

    setPaidOrders(data.orders);
    setLastPaymentTotal(data.payments[0]?.total ?? null);
  }, [session?.id]);

  const syncUserContext = useCallback(async () => {
    setApiUserId(session?.id ?? null);

    if (!session?.id) {
      setPaidOrders([]);
      setLastPaymentTotal(null);
      setPendingSessions([]);
      setBookings([]);
      setCart([]);
      setPaymentStatus("pending");
      setProfileAvatarUrl(null);
      return;
    }

    setPendingSessions(loadPendingSessions<ClubSession>(session.id));
    const profileExtras = loadProfileExtras(session.id, {
      firstName: session.name.split(" ")[0] ?? "",
      lastName: session.name.split(" ").slice(1).join(" "),
      avatarUrl: null,
    });
    setProfileAvatarUrl(profileExtras.avatarUrl);
    await Promise.all([loadPaymentHistory(), loadBookings(), refreshCart()]);
  }, [session?.id, loadPaymentHistory, loadBookings]);

  useEffect(() => {
    async function loadInitialData() {
      setDevicesLoading(true);
      try {
        await Promise.all([loadDevices(), loadHookahCatalog()]);
        await syncUserContext();
      } catch {
        /* ma'lumotlar yuklanmadi */
      } finally {
        setDevicesLoading(false);
      }
    }

    loadInitialData();
  }, [loadDevices, loadHookahCatalog, syncUserContext]);

  useEffect(() => trackSocketConnection(setLiveStatus), []);

  // Live (socket) ulanmasa ham bronlar ishlashi uchun — har 20s yangilash
  useEffect(() => {
    if (liveStatus === "connected") return;

    const timer = setInterval(() => {
      loadDevices().catch(() => undefined);
      loadHookahCatalog().catch(() => undefined);
      if (session?.id) {
        loadBookings().catch(() => undefined);
        refreshCart().catch(() => undefined);
      }
    }, 20000);

    return () => clearInterval(timer);
  }, [liveStatus, session?.id, loadDevices, loadHookahCatalog, loadBookings]);

  useEffect(() => {
    const shouldRefresh = (entity: RealtimeEntity, targets: RealtimeEntity[]) =>
      entity === "all" || targets.includes(entity);

    const unsubscribe = subscribeClubUpdates(async (event) => {
      try {
        if (shouldRefresh(event.entity, ["devices", "bookings"])) {
          await loadDevices();
        }
        if (shouldRefresh(event.entity, ["tables", "hookah"])) {
          await loadHookahCatalog();
        }
        if (shouldRefresh(event.entity, ["bookings"])) {
          await loadBookings();
        }
        if (shouldRefresh(event.entity, ["cart", "bookings", "hookah"])) {
          await refreshCart();
        }
      } catch {
        /* sync xatosi — keyingi yangilanishda tuzaladi */
      }
    });

    return unsubscribe;
  }, [loadDevices, loadHookahCatalog, loadBookings]);

  useEffect(() => {
    if (deviceZone !== "pc") {
      return;
    }

    const pcs = filterDevicesByZone(devices, "pc");
    if (!pcs.length) {
      return;
    }

    if (!pcs.some((device) => device.id === selectedDeviceId)) {
      setSelectedDeviceId(pcs[0].id);
    }
  }, [deviceZone, devices, selectedDeviceId]);

  const zoneDevices = deviceZone ? filterDevicesByZone(devices, deviceZone) : [];
  const selectedZoneDevice =
    zoneDevices.find((device) => device.id === selectedDeviceId) ?? zoneDevices[0];
  const selectedDevice = selectedZoneDevice ?? devices.find((device) => device.id === selectedDeviceId);
  const bookingPrice = selectedZoneDevice
    ? selectedZoneDevice.pricePerHour * durationHours
    : selectedDevice
      ? selectedDevice.pricePerHour * durationHours
      : 0;
  const grandTotal = useMemo(() => sumPrice(cart), [cart]);

  const createBooking = async () => {
    if (!session?.id || !selectedDeviceId) {
      return;
    }

    try {
      const result = await apiRequest<{ booking: Booking; cartItem: CartItem }>("/api/bookings", {
        method: "POST",
        body: JSON.stringify({
          deviceId: selectedDeviceId,
          startHour,
          durationHours,
          userId: session?.id,
        }),
      });

      await Promise.all([loadBookings(), loadDevices(), refreshCart()]);
      setActiveTab("cart");
    } catch {
      /* bron qo'shilmadi */
    }
  };

  const addHookahToCart = async () => {
    if (!selectedFlavorId || !selectedTableId || !hookahStartHour.trim()) {
      return;
    }

    setHookahLoading(true);
    try {
      await apiRequest("/api/hookah/orders", {
        method: "POST",
        body: JSON.stringify({
          flavorId: selectedFlavorId,
          tableId: selectedTableId,
          startHour: hookahStartHour.trim(),
        }),
      });
      await refreshCart();
      setActiveTab("cart");
    } catch {
      /* buyurtma qo'shilmadi */
    } finally {
      setHookahLoading(false);
    }
  };

  const payNow = async () => {
    if (!session?.id || !cart.length) {
      return;
    }

    setPaymentLoading(true);
    setPaymentError(null);

    try {
      const result = await apiRequest<{
        intentId: string;
        status: string;
        total: number;
        checkoutUrl: string;
        mode: "sandbox" | "live";
        provider: string;
      }>("/api/payments/checkout", {
        method: "POST",
        body: JSON.stringify({ method: paymentMethod, userId: session.id }),
      });

      if (!result.checkoutUrl) {
        setPaymentError("To'lov havolasi qaytmadi");
        return;
      }

      const checkoutUrl = result.checkoutUrl.startsWith("/")
        ? `${window.location.origin}${result.checkoutUrl}`
        : result.checkoutUrl;

      window.location.href = checkoutUrl;
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "To'lov boshlanmadi");
    } finally {
      setPaymentLoading(false);
    }
  };

  const cancelBookingById = async (bookingId: string, deviceId?: string) => {
    if (!confirm("Bronni bekor qilasizmi? Qurilma yana bo'sh bo'ladi.")) {
      return;
    }

    try {
      await apiRequest(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        body: JSON.stringify({ userId: session?.id }),
      });
      setPendingSessions((prev) => {
        const next = prev.filter((s) => s.deviceId !== deviceId);
        if (session?.id) {
          savePendingSessions(session.id, next);
        }
        return next;
      });
      await Promise.all([loadBookings(), loadDevices(), refreshCart()]);
    } catch {
      /* bron bekor qilinmadi */
    }
  };

  const cancelSessionById = async (sessionId: string, deviceId?: string) => {
    if (!confirm("Sessiyani/vaqtni bekor qilasizmi? Qurilma qulflanadi.")) {
      return;
    }

    try {
      await apiRequest(`/api/sessions/${sessionId}/cancel`, {
        method: "POST",
        body: JSON.stringify({ userId: session?.id }),
      });
      setPendingSessions((prev) => {
        const next = prev.filter((s) => s.id !== sessionId && s.deviceId !== deviceId);
        if (session?.id) {
          savePendingSessions(session.id, next);
        }
        return next;
      });
      await Promise.all([loadBookings(), loadDevices(), refreshCart()]);
    } catch {
      /* sessiya bekor qilinmadi */
    }
  };

  const clearCart = async () => {
    try {
      await apiRequest("/api/cart", { method: "DELETE" });
      setCart([]);
      setPaymentStatus("pending");
    } catch {
      /* savat tozalanmadi */
    }
  };

  return (
    <main className="arena-bg min-h-screen overflow-hidden text-text-primary">
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 pb-24 sm:px-6 md:pb-6 lg:px-8">
        <Header
          cartCount={cart.length}
          liveStatus={liveStatus}
          paymentStatus={paymentStatus}
        />
        <TabsList className="mt-6 hidden md:grid">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.key}
              data-state={activeTab === tab.key ? "active" : "inactive"}
              onClick={() => setActiveTab(tab.key)}
              type="button"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <section
          className={cn(
            "grid flex-1 gap-5 py-6",
            activeTab === "home" && "lg:grid-cols-[minmax(0,1fr)_360px]",
          )}
        >
          <div className="space-y-5">
            {activeTab === "home" && (
              <HomePanel
                devices={devices}
                onOpenDevices={() => setActiveTab("devices")}
              />
            )}
            {activeTab === "devices" &&
              (!deviceZone ? (
                <DeviceZonePicker
                  loading={devicesLoading}
                  psCount={filterDevicesByZone(devices, "ps").length}
                  pcCount={filterDevicesByZone(devices, "pc").length}
                  onSelect={setDeviceZone}
                />
              ) : deviceZone === "pc" ? (
                <PcZonePanel
                  devices={filterDevicesByZone(devices, "pc")}
                  loading={devicesLoading}
                  selectedDeviceId={selectedDeviceId}
                  bookingPrice={bookingPrice}
                  durationHours={durationHours}
                  startHour={startHour}
                  onBack={() => setDeviceZone(null)}
                  onSelect={setSelectedDeviceId}
                  setDurationHours={setDurationHours}
                  setStartHour={setStartHour}
                  onCreateBooking={createBooking}
                />
              ) : (
                <PsZonePanel
                  devices={filterDevicesByZone(devices, "ps")}
                  loading={devicesLoading}
                  selectedDeviceId={selectedDeviceId}
                  bookingPrice={bookingPrice}
                  durationHours={durationHours}
                  startHour={startHour}
                  onBack={() => setDeviceZone(null)}
                  onSelect={setSelectedDeviceId}
                  setDurationHours={setDurationHours}
                  setStartHour={setStartHour}
                  onCreateBooking={createBooking}
                />
              ))}
            {activeTab === "hookah" && (
              <HookahPanel
                flavors={hookahFlavors}
                tables={tables}
                loading={hookahLoading}
                selectedFlavorId={selectedFlavorId}
                selectedTableId={selectedTableId}
                startHour={hookahStartHour}
                setSelectedFlavorId={setSelectedFlavorId}
                setSelectedTableId={setSelectedTableId}
                setStartHour={setHookahStartHour}
                onAddHookah={addHookahToCart}
              />
            )}
            {activeTab === "cart" && (
              <CartPanel
                cart={cart}
                grandTotal={grandTotal}
                onClearCart={clearCart}
                onOpenPayment={() => setActiveTab("payment")}
                onRemoveCartItem={async (item) => {
                  if (item.type === "booking") {
                    await cancelBookingById(item.id);
                    return;
                  }
                  try {
                    await apiRequest(`/api/cart/${item.id}`, { method: "DELETE" });
                    await refreshCart();
                  } catch {
                    /* o'chirib bo'lmadi */
                  }
                }}
              />
            )}
            {activeTab === "payment" && (
              <PaymentPanel
                cart={cart}
                grandTotal={grandTotal}
                paymentMethod={paymentMethod}
                paymentLoading={paymentLoading}
                paymentError={paymentError}
                setPaymentMethod={setPaymentMethod}
                onPayNow={payNow}
                pendingSessions={pendingSessions}
                onSessionUnlocked={() => {
                  setPendingSessions([]);
                  if (session?.id) {
                    clearPendingSessions(session.id);
                  }
                  loadDevices();
                }}
                onCancelSession={cancelSessionById}
              />
            )}
            {activeTab === "profile" && session && (
              <ProfilePanel
                bookings={bookings}
                paidOrders={paidOrders}
                phone={phone}
                session={session}
                setPhone={setPhone}
                onAvatarChange={setProfileAvatarUrl}
                onCancelBooking={cancelBookingById}
              />
            )}
          </div>

          {activeTab === "home" ? (
            <AsidePanel
              bookings={bookings}
              cart={cart}
              devices={devices}
              lastPaymentTotal={lastPaymentTotal}
              grandTotal={grandTotal}
              onOpenCart={() => setActiveTab("cart")}
            />
          ) : null}
        </section>

        <MobileBottomNav
          activeTab={activeTab}
          cartCount={cart.length}
          profileAvatarUrl={profileAvatarUrl}
          onChange={setActiveTab}
        />
      </div>
    </main>
  );
}

function Header({
  cartCount,
  liveStatus,
  paymentStatus,
}: {
  cartCount: number;
  liveStatus: LiveStatus;
  paymentStatus: "pending" | "paid";
}) {
  return (
    <header className="flex flex-col gap-4 rounded-2xl border border-border-strong/50 bg-arena-surface p-5 shadow-[0_10px_32px_oklch(0_0_0_/_0.24)] md:flex-row md:items-center md:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-flex size-2 rounded-full bg-brand-gold" aria-hidden />
          <p className="label-caps text-brand-gold">Arsenal Union</p>
        </div>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-text-primary sm:text-4xl">
          Game Club
        </h1>
        <p className="mt-2 max-w-xl text-sm text-text-secondary">
          Bron qiling, to&apos;lang va qurilmangizni oching — hammasi bir joyda.
        </p>
        <p
          className={cn(
            "mt-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
            liveStatus === "connected"
              ? "border-status-available/40 bg-status-available/10 text-status-available"
              : liveStatus === "connecting"
                ? "border-status-booked/40 bg-status-booked/10 text-status-booked"
                : "border-border-default bg-arena-overlay/50 text-text-muted",
          )}
        >
          <Wifi className="size-3" />
          {liveStatus === "connected"
            ? "Live ulangan"
            : liveStatus === "connecting"
              ? "Live ulanmoqda..."
              : "Live o'chiq (sahifa ishlaydi)"}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:min-w-64">
        <MiniStat label="Savat" value={`${cartCount} ta`} icon={<ShoppingCart className="size-4" />} />
        <MiniStat
          label="To'lov"
          value={paymentStatus === "paid" ? "To'langan" : "Kutilmoqda"}
          icon={<CreditCard className="size-4" />}
        />
      </div>
    </header>
  );
}

function HomePanel({
  devices,
  onOpenDevices,
}: {
  devices: Device[];
  onOpenDevices: () => void;
}) {
  const freeDevices = devices.filter((device) => device.status === "available").length;

  return (
    <>
      <Card className="overflow-hidden border-brand-gold/35 bg-gradient-to-br from-brand-gold-dim via-arena-surface to-arena-overlay p-8 text-center shadow-[0_12px_36px_oklch(0_0_0_/_0.28)]">
        <p className="label-caps text-brand-gold">O&apos;yinlar olamiga xush kelibsiz</p>
        <h2 className="mt-4 text-4xl font-black tracking-tight text-text-primary sm:text-5xl">
          Game Club
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-text-secondary">
          PS va PC qurilmalarini bron qiling, kalyan buyurtma bering va onlayn to&apos;lang.
        </p>
        <div className="mt-6 flex justify-center">
          <Button variant="accent" size="lg" onClick={onOpenDevices}>
            <Gamepad2 className="size-4" />
            Qurilmalarni ko&apos;rish
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <MiniStat label="Bo'sh qurilmalar" value={`${freeDevices}/${devices.length}`} icon={<Activity className="size-4" />} />
        <MiniStat label="To'lov usullari" value="3 ta" icon={<CreditCard className="size-4" />} />
      </div>
    </>
  );
}

function DeviceZonePicker({
  loading,
  psCount,
  pcCount,
  onSelect,
}: {
  loading: boolean;
  psCount: number;
  pcCount: number;
  onSelect: (zone: DeviceZone) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Qurilmalar zonasi</CardTitle>
        <CardDescription>PS yoki PC zonasini tanlang — holat alohida sahifada ko&apos;rinadi.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-text-muted">Yuklanmoqda...</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onSelect("ps")}
              className={cn(
                touchPress,
                "group relative overflow-hidden rounded-2xl border border-brand-cyan/30 bg-brand-cyan-dim p-6 text-left hover:border-brand-cyan/50 active:bg-brand-cyan/20",
              )}
            >
              <div className="flex items-center justify-between">
                <Gamepad2 className="size-10 text-brand-cyan" />
                <ChevronRight className="size-5 text-brand-cyan/50 transition group-hover:translate-x-0.5" />
              </div>
              <p className="mt-4 text-xl font-bold text-text-primary">PlayStation</p>
              <p className="mt-1 text-sm text-text-muted">PS qurilmalari holati</p>
              <p className="mt-3 label-caps text-brand-cyan">{psCount} ta qurilma</p>
            </button>

            <button
              type="button"
              onClick={() => onSelect("pc")}
              className={cn(
                touchPress,
                "group relative overflow-hidden rounded-2xl border border-brand-magenta/30 bg-brand-magenta-dim p-6 text-left hover:border-brand-magenta/50 active:bg-brand-magenta/20",
              )}
            >
              <div className="flex items-center justify-between">
                <Monitor className="size-10 text-brand-magenta" />
                <ChevronRight className="size-5 text-brand-magenta/50 transition group-hover:translate-x-0.5" />
              </div>
              <p className="mt-4 text-xl font-bold text-text-primary">Kompyuter</p>
              <p className="mt-1 text-sm text-text-muted">PC qurilmalari holati</p>
              <p className="mt-3 label-caps text-brand-magenta">{pcCount} ta qurilma</p>
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PcZonePanel({
  devices,
  loading,
  selectedDeviceId,
  bookingPrice,
  durationHours,
  startHour,
  onBack,
  onSelect,
  setDurationHours,
  setStartHour,
  onCreateBooking,
}: {
  devices: Device[];
  loading: boolean;
  selectedDeviceId: string;
  bookingPrice: number;
  durationHours: number;
  startHour: string;
  onBack: () => void;
  onSelect: (id: string) => void;
  setDurationHours: (value: number) => void;
  setStartHour: (value: string) => void;
  onCreateBooking: () => void;
}) {
  const activePc =
    devices.find((device) => device.id === selectedDeviceId) ?? devices[0];

  if (loading) {
    return (
      <div className="pc-zone">
        <p className="text-sm text-text-muted">PC qurilmalar yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="pc-zone">
      <div className="pc-zone__layout">
        <aside className="pc-zone__sidebar">
          <div className="pc-zone__sidebar-head">
            <Button type="button" variant="ghost" size="sm" className="mb-4 w-fit px-0" onClick={onBack}>
              <ArrowLeft className="size-4" />
              Orqaga
            </Button>
            <div className="flex items-start gap-3">
              <div className="pc-zone__icon-box">
                <Monitor className="size-5 text-brand-cyan" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary">PC lar holati</h2>
                <p className="mt-1 text-sm text-text-muted">
                  Qurilmani tanlang, bo&apos;sh bo&apos;lsa bron qilish mumkin
                </p>
              </div>
            </div>
          </div>

          <div className="pc-zone__device-list">
            {devices.map((device, index) => {
              const active = selectedDeviceId === device.id;
              const busy = device.status !== "available";

              return (
                <button
                  key={device.id}
                  type="button"
                  onClick={() => onSelect(device.id)}
                  className={cn(
                    "pc-zone__device-card",
                    active && "pc-zone__device-card--active",
                    busy && "pc-zone__device-card--busy",
                  )}
                >
                  <div className="min-w-0 flex-1 text-left">
                    <p className="font-bold text-text-primary">{device.name}</p>
                    <p className="mt-0.5 text-xs text-text-muted">{device.type}</p>
                    <p className="mt-1 tabular-data text-sm font-semibold text-brand-cyan">
                      {formatCurrency(device.pricePerHour)}/soat
                    </p>
                    <PcStatusPill status={device.status} className="mt-2" />
                  </div>
                  <div
                    className="pc-zone__device-thumb"
                    style={{ backgroundImage: `url(${getPcThumbImage()})` }}
                    aria-hidden
                  />
                </button>
              );
            })}
          </div>

          <div className="pc-zone__promo" style={{ backgroundImage: `url(${PC_PROMO_IMAGE})` }}>
            <div className="pc-zone__promo-overlay">
              <p className="text-sm font-semibold leading-snug text-text-primary">
                Do&apos;stlaringiz bilan o&apos;ynang va g&apos;alaba qozoning!
              </p>
              <span className="pc-zone__promo-tag">Arsenal Union</span>
            </div>
          </div>
        </aside>

        <section className="pc-zone__booking">
          {!activePc ? (
            <div className="pc-zone__booking-empty">
              <p className="text-lg font-semibold text-text-primary">Qurilma bron qilish</p>
              <p className="mt-2 text-sm text-text-muted">Chapdan PC tanlang.</p>
            </div>
          ) : (
            <>
              <div className="pc-zone__booking-head">
                <div>
                  <h2 className="text-xl font-bold text-text-primary">Qurilma bron qilish</h2>
                  <p className="mt-1 text-sm text-text-muted">Tanlangan qurilma: {activePc.name}</p>
                </div>
              </div>

              <div className="pc-zone__hero" style={{ backgroundImage: `url(${PC_HERO_IMAGE})` }} aria-hidden />

              <div className="pc-zone__form">
                <label className="pc-zone__field">
                  <span className="pc-zone__label">Boshlanish vaqti</span>
                  <div className="relative">
                    <Clock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-faint" />
                    <Input
                      value={startHour}
                      onChange={(event) => setStartHour(event.target.value)}
                      placeholder="13:00"
                      className="pc-zone__input h-12 pl-11"
                    />
                  </div>
                </label>

                <div className="pc-zone__field">
                  <span className="pc-zone__label">Davomiyligi (soat)</span>
                  <div className="grid grid-cols-4 gap-2">
                    {durationOptions.map((hour) => (
                      <button
                        key={hour}
                        type="button"
                        onClick={() => setDurationHours(hour)}
                        className={cn(
                          "pc-zone__duration",
                          durationHours === hour && "pc-zone__duration--active",
                        )}
                      >
                        {hour}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pc-zone__total">
                  <div>
                    <p className="text-sm text-text-muted">Jami</p>
                    <p className="tabular-data text-2xl font-bold text-brand-cyan">{formatCurrency(bookingPrice)}</p>
                  </div>
                  <p className="text-sm font-medium text-text-secondary">{durationHours} soat</p>
                </div>

                <button
                  type="button"
                  className="pc-zone__submit"
                  onClick={onCreateBooking}
                  disabled={activePc.status !== "available"}
                >
                  Bron qilish
                  <ChevronRight className="size-5" />
                </button>
              </div>

              <div className="pc-zone__specs">
                {PC_SPEC_ITEMS.map((spec, index) => (
                  <div key={spec.title} className="pc-zone__spec">
                    <PcSpecIcon index={index} />
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{spec.title}</p>
                      <p className="text-xs text-text-muted">{spec.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function PcStatusPill({ status, className }: { status: DeviceStatus; className?: string }) {
  return (
    <span
      className={cn(
        "pc-zone__status",
        status === "available" && "pc-zone__status--free",
        status === "busy" && "pc-zone__status--busy",
        status === "booked" && "pc-zone__status--booked",
        className,
      )}
    >
      {STATUS_LABEL[status].toUpperCase()}
    </span>
  );
}

function PcSpecIcon({ index }: { index: number }) {
  const icons = [Cpu, HardDrive, Monitor, Monitor, Keyboard, Headphones];
  const Icon = icons[index] ?? Cpu;

  return (
    <div className="pc-zone__spec-icon">
      <Icon className="size-4 text-brand-cyan" />
    </div>
  );
}

function DeviceZoneListPanel({
  zone,
  devices,
  loading,
  selectedDeviceId,
  onBack,
  onSelect,
}: {
  zone: DeviceZone;
  devices: Device[];
  loading: boolean;
  selectedDeviceId: string;
  onBack: () => void;
  onSelect: (id: string) => void;
}) {
  const title = zone === "ps" ? "PS lar holati" : "PC lar holati";

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-text-muted">Qurilmalar yuklanmoqda...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-4">
        <Button type="button" variant="ghost" size="sm" className="w-fit px-0" onClick={onBack}>
          <ArrowLeft className="size-4" />
          Orqaga
        </Button>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Qurilmani tanlang, bo&apos;sh bo&apos;lsa bron qilish mumkin.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {!devices.length ? (
          <p className="text-sm text-text-muted">Bu zonada qurilmalar yo&apos;q.</p>
        ) : (
          <div className="grid gap-3">
            {devices.map((device) => (
              <SelectableRow key={device.id} active={selectedDeviceId === device.id} onClick={() => onSelect(device.id)}>
                <div>
                  <p className="font-semibold text-text-primary">{device.name}</p>
                  <p className="tabular-data text-sm text-text-muted">
                    {device.type} • {formatCurrency(device.pricePerHour)}/soat
                  </p>
                </div>
                <StatusBadge status={device.status} />
              </SelectableRow>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BookingPanel({
  bookingPrice,
  durationHours,
  onCreateBooking,
  selectedDevice,
  setDurationHours,
  setStartHour,
  startHour,
}: {
  bookingPrice: number;
  durationHours: number;
  onCreateBooking: () => void;
  selectedDevice?: Device;
  setDurationHours: (value: number) => void;
  setStartHour: (value: string) => void;
  startHour: string;
}) {
  if (!selectedDevice) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Qurilma bron qilish</CardTitle>
          <CardDescription>Yuqoridan qurilmani tanlang.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Qurilma bron qilish</CardTitle>
        <CardDescription>Tanlangan qurilma: {selectedDevice.name}</CardDescription>
      </CardHeader>
      <CardContent>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-text-secondary">Boshlanish vaqti</span>
          <Input value={startHour} onChange={(event) => setStartHour(event.target.value)} placeholder="13:00" />
        </label>

        <div className="space-y-2">
          <span className="text-sm font-semibold text-text-secondary">Davomiyligi (soat)</span>
          <div className="flex flex-wrap gap-2">
            {durationOptions.map((hour) => (
              <Button
                key={hour}
                variant={durationHours === hour ? "default" : "secondary"}
                size="sm"
                onClick={() => setDurationHours(hour)}
              >
                {hour}
              </Button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-brand-cyan/25 bg-brand-cyan-dim p-4">
          <p className="text-sm text-text-muted">Jami</p>
          <p className="tabular-data text-2xl font-bold text-brand-cyan">{formatCurrency(bookingPrice)}</p>
        </div>

        <PressButton variant="primary" onClick={onCreateBooking}>
          Bron qilish
        </PressButton>
      </CardContent>
    </Card>
  );
}

function HookahPanel({
  flavors,
  tables,
  loading,
  onAddHookah,
  selectedFlavorId,
  selectedTableId,
  startHour,
  setSelectedFlavorId,
  setSelectedTableId,
  setStartHour,
}: {
  flavors: HookahFlavor[];
  tables: ClubTable[];
  loading: boolean;
  onAddHookah: () => void;
  selectedFlavorId: string;
  selectedTableId: string;
  startHour: string;
  setSelectedFlavorId: (id: string) => void;
  setSelectedTableId: (id: string) => void;
  setStartHour: (value: string) => void;
}) {
  if (!flavors.length || !tables.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kalyan buyurtmasi</CardTitle>
          <CardDescription>Stol va ta&apos;mlar hozircha mavjud emas.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-muted">Hozircha kalyan ta&apos;mlari yoki stollar mavjud emas.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kalyan buyurtmasi</CardTitle>
        <CardDescription>Stol va ta&apos;mni tanlab, buyurtmani savatga qo&apos;shing.</CardDescription>
      </CardHeader>
      <CardContent>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-text-secondary">Bron boshlanish vaqti</span>
          <Input
            value={startHour}
            onChange={(event) => setStartHour(event.target.value)}
            placeholder="13:00"
            inputMode="numeric"
          />
        </label>

        <div className="space-y-3">
          <span className="text-sm font-semibold text-text-secondary">Stol tanlang</span>
          <div className="flex flex-wrap gap-2 label-caps">
            <span className="inline-flex items-center gap-1.5 text-status-available">
              <span className="size-2 rounded-full bg-status-available" /> Bo&apos;sh
            </span>
            <span className="inline-flex items-center gap-1.5 text-status-busy">
              <span className="size-2 rounded-full bg-status-busy" /> Band
            </span>
            <span className="inline-flex items-center gap-1.5 text-status-booked">
              <span className="size-2 rounded-full bg-status-booked" /> Bron
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {tables.map((table) => (
              <button
                key={table.id}
                type="button"
                onClick={() => setSelectedTableId(table.id)}
                className={cn(
                  touchPress,
                  "rounded-xl border-2 p-4 text-left active:ring-2 active:ring-brand-cyan/40",
                  table.status === "available" && "border-status-available/40 bg-status-available/8",
                  table.status === "busy" && "border-status-busy/40 bg-status-busy/8",
                  table.status === "booked" && "border-status-booked/40 bg-status-booked/8",
                  selectedTableId === table.id && "ring-2 ring-brand-magenta ring-offset-2 ring-offset-arena-base",
                )}
              >
                <p className="font-semibold text-text-primary">{table.title}</p>
                <TableStatusBadge status={table.status} className="mt-2" />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {flavors.map((flavor) => (
            <SelectableRow
              key={flavor.id}
              active={selectedFlavorId === flavor.id}
              onClick={() => setSelectedFlavorId(flavor.id)}
            >
              <div>
                <p className="font-semibold text-text-primary">{flavor.title}</p>
                <p className="tabular-data text-sm text-text-muted">{formatCurrency(flavor.price)}</p>
              </div>
            </SelectableRow>
          ))}
        </div>

        <Button
          className="w-full"
          variant="accent"
          onClick={onAddHookah}
          disabled={loading || !selectedFlavorId || !selectedTableId || !startHour.trim()}
        >
          {loading ? "Qo'shilmoqda..." : "Buyurtma berish"}
        </Button>
      </CardContent>
    </Card>
  );
}

function CartPanel({
  cart,
  grandTotal,
  onClearCart,
  onOpenPayment,
  onRemoveCartItem,
}: {
  cart: CartItem[];
  grandTotal: number;
  onClearCart: () => void;
  onOpenPayment: () => void;
  onRemoveCartItem: (item: CartItem) => Promise<void>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Savatcha</CardTitle>
        <CardDescription>{cart.length ? "Buyurtmalar to'lovga tayyor." : "Savat hozircha bo'sh."}</CardDescription>
      </CardHeader>
      <CardContent>
        <CartList cart={cart} onRemove={onRemoveCartItem} />
        <TotalBox total={grandTotal} />
        <div className="grid gap-3 sm:grid-cols-2">
          <PressButton variant="payment" onClick={onOpenPayment}>
            To&apos;lovga o&apos;tish
          </PressButton>
          <PressButton variant="clear" onClick={onClearCart}>
            Tozalash
          </PressButton>
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentPanel({
  cart,
  grandTotal,
  onPayNow,
  paymentMethod,
  paymentLoading,
  paymentError,
  setPaymentMethod,
  pendingSessions,
  onSessionUnlocked,
  onCancelSession,
}: {
  cart: CartItem[];
  grandTotal: number;
  onPayNow: () => void;
  paymentMethod: PaymentMethod;
  paymentLoading: boolean;
  paymentError: string | null;
  setPaymentMethod: (method: PaymentMethod) => void;
  pendingSessions: ClubSession[];
  onSessionUnlocked: () => void;
  onCancelSession: (sessionId: string, deviceId?: string) => Promise<void>;
}) {
  return (
    <div className="space-y-5">
      {pendingSessions.length > 0 ? (
        <StationUnlockPanel
          sessions={pendingSessions}
          onUnlocked={onSessionUnlocked}
          onCancelSession={onCancelSession}
        />
      ) : null}
    <Card className="pb-4">
      <CardHeader className="mb-3">
        <CardTitle>To&apos;lov</CardTitle>
        <CardDescription>
          {cart.length ? `To'lanishi kerak: ${cart.length} ta buyurtma` : "Savat bo'sh — to'lov uchun buyurtma qo'shing."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {cart.length > 0 ? (
          <section className="space-y-3">
            <p className="label-caps">To&apos;lov qilinadigan</p>
            <OrderLinesList items={cart} />
            <TotalBox total={grandTotal} />
          </section>
        ) : null}

        <section className="space-y-3">
          <p className="text-sm font-semibold text-text-secondary">To&apos;lov usuli</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {PAYMENT_METHODS.map((method) => (
              <SelectableRow key={method} active={paymentMethod === method} onClick={() => setPaymentMethod(method)}>
                <p className="font-semibold text-text-primary">{method}</p>
                <span className="text-xs text-text-muted">{paymentMethod === method ? "Tanlandi" : "Tanlash"}</span>
              </SelectableRow>
            ))}
          </div>
        </section>

        <Button className="w-full" onClick={onPayNow} disabled={!cart.length || paymentLoading}>
          {paymentLoading ? "To'lov ochilmoqda..." : "To'lash"}
        </Button>
        {paymentError ? <p className="text-sm text-red-400">{paymentError}</p> : null}
      </CardContent>
    </Card>
    </div>
  );
}

function ProfilePanel({
  bookings,
  paidOrders,
  phone,
  session,
  setPhone,
  onAvatarChange,
  onCancelBooking,
}: {
  bookings: Booking[];
  paidOrders: OrderRecord[];
  phone: string;
  session: UserSession;
  setPhone: (value: string) => void;
  onAvatarChange: (avatarUrl: string | null) => void;
  onCancelBooking: (bookingId: string, deviceId?: string) => Promise<void>;
}) {
  return (
    <div className="space-y-5">
      <ProfileBox
        session={session}
        phone={phone}
        onPhoneChange={setPhone}
        onAvatarChange={onAvatarChange}
      />
      <HistoryCard bookings={bookings} paidOrders={paidOrders} onCancelBooking={onCancelBooking} />
    </div>
  );
}

function AsidePanel({
  bookings,
  cart,
  devices,
  lastPaymentTotal,
  grandTotal,
  onOpenCart,
}: {
  bookings: Booking[];
  cart: CartItem[];
  devices: Device[];
  lastPaymentTotal: number | null;
  grandTotal: number;
  onOpenCart: () => void;
}) {
  return (
    <aside className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Tezkor holat</CardTitle>
          <CardDescription>Har bir buyurtma alohida ko&apos;rsatiladi.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <MiniStat label="Qurilmalar" value={`${devices.length} ta`} icon={<Gamepad2 className="size-4" />} />
          <MiniStat label="Bronlar" value={`${bookings.length} ta`} icon={<History className="size-4" />} />
          {cart.length > 0 ? (
            <div className="space-y-2">
              <p className="label-caps text-text-muted">Savatdagi buyurtmalar</p>
              <OrderLinesList items={cart} compact />
              <p className="tabular-data text-sm font-bold text-brand-cyan">Jami: {formatCurrency(grandTotal)}</p>
            </div>
          ) : lastPaymentTotal != null ? (
            <MiniStat
              label="Oxirgi to'lov"
              value={formatCurrency(lastPaymentTotal)}
              icon={<CreditCard className="size-4" />}
            />
          ) : (
            <MiniStat label="Savat" value="Bo'sh" icon={<ShoppingCart className="size-4" />} />
          )}
          <Button variant="accent" className="w-full" onClick={onOpenCart}>
            Savatni ochish
          </Button>
        </CardContent>
      </Card>
    </aside>
  );
}

function HistoryCard({
  bookings,
  paidOrders,
  onCancelBooking,
}: {
  bookings: Booking[];
  paidOrders: OrderRecord[];
  onCancelBooking: (bookingId: string, deviceId?: string) => Promise<void>;
}) {
  const [visibleCount, setVisibleCount] = useState(3);

  const historyEntries = useMemo(() => {
    const bookingIds = new Set(bookings.map((booking) => booking.id));
    const dedupedPaidOrders = paidOrders.filter(
      (order) => order.type !== "booking" || !bookingIds.has(order.id),
    );

    return [
      ...bookings.map((booking) => ({
        key: `booking-${booking.id}`,
        sortAt: booking.createdAt ? new Date(booking.createdAt).getTime() : 0,
        kind: "booking" as const,
        booking,
      })),
      ...dedupedPaidOrders.map((order) => ({
        key: `paid-${order.id}-${order.paidAt}`,
        sortAt: new Date(order.paidAt).getTime(),
        kind: "paid" as const,
        order,
      })),
    ].sort((a, b) => b.sortAt - a.sortAt);
  }, [bookings, paidOrders]);

  const visibleEntries = historyEntries.slice(0, visibleCount);
  const hasMore = historyEntries.length > visibleCount;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bronlar tarixi</CardTitle>
        <CardDescription>Bronlar va to&apos;langan buyurtmalar.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!historyEntries.length && <p className="text-sm text-text-muted">Hozircha tarix yo&apos;q.</p>}
        {visibleEntries.map((entry) =>
          entry.kind === "booking" ? (
            <SelectableRow key={entry.key} className="flex-wrap gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-text-primary">{entry.booking.deviceName}</p>
                <p className="tabular-data text-sm text-text-muted">
                  {entry.booking.startHour}, {entry.booking.durationHours} soat
                </p>
                <Badge
                  variant={
                    entry.booking.status === "active"
                      ? "booked"
                      : entry.booking.status === "cancelled"
                        ? "busy"
                        : "available"
                  }
                  className="mt-2"
                >
                  {BOOKING_STATUS_LABEL[(entry.booking.status || "active") as BookingStatus] ?? entry.booking.status}
                </Badge>
              </div>
              <div className="flex flex-col items-end gap-2">
                <p className="tabular-data text-sm font-bold text-brand-cyan">{formatCurrency(entry.booking.price)}</p>
                {entry.booking.status === "active" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => onCancelBooking(entry.booking.id, entry.booking.deviceId)}
                  >
                    Bekor qilish
                  </Button>
                ) : null}
              </div>
            </SelectableRow>
          ) : (
            <PaidOrderRow key={entry.key} order={entry.order} />
          ),
        )}
        {hasMore ? (
          <Button type="button" variant="secondary" className="w-full" onClick={() => setVisibleCount((count) => count + 4)}>
            Yana ko&apos;rish
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function OrderLinesList({
  items,
  compact = false,
  onRemove,
}: {
  items: CartItem[];
  compact?: boolean;
  onRemove?: (item: CartItem) => void;
}) {
  if (!items.length) {
    return <p className="text-sm text-text-muted">Buyurtmalar yo&apos;q.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <SelectableRow key={item.id} className={cn(compact ? "p-3" : undefined, "flex-wrap gap-3")}>
          <div className="min-w-0 flex-1">
            <p className="label-caps text-brand-magenta">
              Buyurtma #{index + 1}
            </p>
            <p className="font-semibold text-text-primary">{item.title}</p>
            <p className="text-xs text-text-faint">{ORDER_TYPE_LABEL[item.type]}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <p className="tabular-data text-sm font-bold text-brand-cyan">{formatCurrency(item.price)}</p>
            {onRemove ? (
              <Button type="button" size="sm" variant="secondary" onClick={() => onRemove(item)}>
                O&apos;chirish
              </Button>
            ) : null}
          </div>
        </SelectableRow>
      ))}
    </div>
  );
}

function CartList({
  cart,
  compact = false,
  onRemove,
}: {
  cart: CartItem[];
  compact?: boolean;
  onRemove?: (item: CartItem) => void;
}) {
  return <OrderLinesList items={cart} compact={compact} onRemove={onRemove} />;
}

function PaidOrderRow({ order, highlight = false }: { order: OrderRecord; highlight?: boolean }) {
  const time = new Date(order.paidAt).toLocaleString("uz-UZ", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        highlight ? "border-brand-cyan/35 bg-brand-cyan-dim" : "border-border-subtle bg-arena-overlay/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge variant="available" className="mb-2">
            To&apos;langan
          </Badge>
          <p className="font-semibold text-text-primary">{order.title}</p>
          <p className="mt-1 text-xs text-text-faint">
            {ORDER_TYPE_LABEL[order.type]} • {order.paymentMethod} • {time}
          </p>
        </div>
        <p className="tabular-data shrink-0 text-sm font-bold text-brand-cyan">{formatCurrency(order.price)}</p>
      </div>
    </div>
  );
}

function TotalBox({ total }: { total: number }) {
  return (
    <div className="rounded-xl border border-brand-magenta/25 bg-brand-magenta-dim p-4">
      <p className="text-sm text-text-muted">Jami</p>
      <p className="tabular-data text-2xl font-bold text-text-primary">{formatCurrency(total)}</p>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-default bg-arena-overlay p-4 shadow-[0_4px_16px_oklch(0_0_0_/_0.18)]">
      <div className="flex items-center gap-2 text-brand-cyan">
        {icon}
        <span className="label-caps text-brand-cyan/90">{label}</span>
      </div>
      <p className="mt-2 text-lg font-bold text-text-primary">{value}</p>
    </div>
  );
}

function SelectableRow({
  active,
  children,
  className,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const Comp = onClick ? "button" : "div";

  return (
    <Comp
      className={cn(
        "flex w-full items-center justify-between gap-4 rounded-xl border border-border-subtle bg-arena-raised p-4 text-left",
        onClick && cn(touchPress, "hover:border-border-accent hover:bg-arena-overlay/60 active:bg-arena-surface"),
        active && "border-brand-magenta/50 bg-brand-magenta-dim",
        className,
      )}
      onClick={onClick}
      type={onClick ? "button" : undefined}
    >
      {children}
    </Comp>
  );
}

function StatusBadge({ status }: { status: DeviceStatus }) {
  return <Badge variant={status}>{STATUS_LABEL[status]}</Badge>;
}

function TableStatusBadge({ status, className }: { status: TableStatus; className?: string }) {
  const variant = status === "available" ? "available" : status === "busy" ? "busy" : "booked";
  return (
    <Badge variant={variant} className={className}>
      {TABLE_STATUS_LABEL[status]}
    </Badge>
  );
}
