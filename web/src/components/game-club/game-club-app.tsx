"use client";

import {
  Activity,
  ArrowLeft,
  Bell,
  ChevronRight,
  CreditCard,
  Gamepad2,
  History,
  Monitor,
  ShoppingCart,
  Wifi,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { MobileBottomNav } from "@/components/game-club/mobile-bottom-nav";
import { StationUnlockPanel, type ClubSession } from "@/components/game-club/station-unlock-panel";
import { ProfileBox } from "@/components/profile/profile-box";
import { getInitials, getSession, type UserSession } from "@/lib/auth";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PressButton } from "@/components/ui/press-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
  type HookahFlavor,
  type OrderRecord,
  ORDER_TYPE_LABEL,
  type PaymentMethod,
  PAYMENT_METHODS,
  STATUS_LABEL,
  TABLE_STATUS_LABEL,
  type TableStatus,
  type TabKey,
  TABS,
} from "@/lib/game-club-data";
import { apiRequest, setApiUserId } from "@/lib/api";
import { clearPendingSessions, loadPendingSessions, savePendingSessions } from "@/lib/user-storage";
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Payme");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "paid">("pending");
  const [notifications, setNotifications] = useState(["Xush kelibsiz! Bugun maxsus bonuslar mavjud."]);
  const [liveStatus, setLiveStatus] = useState<LiveStatus>("connecting");
  const [pendingSessions, setPendingSessions] = useState<ClubSession[]>([]);
  const [lastPaymentTotal, setLastPaymentTotal] = useState<number | null>(null);

  useEffect(() => {
    const stored = getSession();
    if (stored) {
      setSession(stored);
      setPhone(stored.phone);
      setApiUserId(stored.id);
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
      return;
    }

    setPendingSessions(loadPendingSessions<ClubSession>(session.id));
    await Promise.all([loadPaymentHistory(), loadBookings(), refreshCart()]);
  }, [session?.id, loadPaymentHistory, loadBookings]);

  useEffect(() => {
    async function loadInitialData() {
      setDevicesLoading(true);
      try {
        await Promise.all([loadDevices(), loadHookahCatalog()]);
        await syncUserContext();
      } catch {
        setNotifications((prev) => ["Ma'lumotlar yuklanmadi. Server ishlayotganini tekshiring.", ...prev.slice(0, 3)]);
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
      if (event.message) {
        setNotifications((prev) => [event.message, ...prev.slice(0, 3)]);
      }

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

  const selectedDevice = devices.find((device) => device.id === selectedDeviceId);
  const bookingPrice = selectedDevice ? selectedDevice.pricePerHour * durationHours : 0;
  const grandTotal = useMemo(() => sumPrice(cart), [cart]);

  const pushNotification = (message: string) => {
    setNotifications((prev) => [message, ...prev.slice(0, 3)]);
  };

  const createBooking = async () => {
    if (!session?.id) {
      pushNotification("Bron uchun avval tizimga kiring.");
      return;
    }

    if (!selectedDeviceId) {
      pushNotification("Qurilma tanlanmagan.");
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
    } catch (error) {
      pushNotification(error instanceof Error ? error.message : "Bron qo'shilmadi.");
    }
  };

  const addHookahToCart = async () => {
    if (!selectedFlavorId || !selectedTableId) {
      pushNotification("Stol va ta'mni tanlang.");
      return;
    }

    setHookahLoading(true);
    try {
      await apiRequest("/api/hookah/orders", {
        method: "POST",
        body: JSON.stringify({ flavorId: selectedFlavorId, tableId: selectedTableId }),
      });
      await refreshCart();
      setActiveTab("cart");
    } catch (error) {
      pushNotification(error instanceof Error ? error.message : "Buyurtma qo'shilmadi.");
    } finally {
      setHookahLoading(false);
    }
  };

  const payNow = async () => {
    if (!session?.id) {
      pushNotification("To'lov uchun avval tizimga kiring.");
      return;
    }

    if (!cart.length) {
      pushNotification("Savat bo'sh: avval mahsulot yoki bron qo'shing.");
      return;
    }

    try {
      const result = await apiRequest<{
        status: string;
        total: number;
        sessions: ClubSession[];
      }>("/api/payments", {
        method: "POST",
        body: JSON.stringify({ method: paymentMethod, userId: session?.id }),
      });

      if (result.sessions?.length && session?.id) {
        setPendingSessions(result.sessions);
        savePendingSessions(session.id, result.sessions);
        const pins = result.sessions.map((s) => `${s.deviceName}: ${s.unlockPin}`).join(" | ");
        pushNotification(`To'lov OK! Stansiya PIN: ${pins}`);
      } else {
        pushNotification(`To'lov muvaffaqiyatli! Jami: ${formatCurrency(result.total)} (${paymentMethod})`);
      }

      setPaymentStatus("paid");
      await Promise.all([loadDevices(), loadPaymentHistory(), refreshCart()]);
    } catch (error) {
      pushNotification(error instanceof Error ? error.message : "To'lov amalga oshmadi.");
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
      pushNotification("Bron bekor qilindi.");
    } catch (error) {
      pushNotification(error instanceof Error ? error.message : "Bron bekor qilinmadi.");
    }
  };

  const cancelSessionById = async (sessionId: string, deviceId?: string) => {
    if (!confirm("Sessiyani/vaqtni bekor qilasizmi? Stansiya qulflanadi.")) {
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
      pushNotification("Sessiya bekor qilindi.");
    } catch (error) {
      pushNotification(error instanceof Error ? error.message : "Sessiya bekor qilinmadi.");
    }
  };

  const clearCart = async () => {
    try {
      await apiRequest("/api/cart", { method: "DELETE" });
      setCart([]);
      setPaymentStatus("pending");
      pushNotification("Savat tozalandi.");
    } catch (error) {
      pushNotification(error instanceof Error ? error.message : "Savat tozalanmadi.");
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#07050f] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_34%),radial-gradient(circle_at_80%_0%,rgba(192,38,211,0.2),transparent_34%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 pb-24 sm:px-6 md:pb-6 lg:px-8">
        <Header
          cartCount={cart.length}
          liveStatus={liveStatus}
          paymentStatus={paymentStatus}
          session={session}
          onOpenProfile={() => setActiveTab("profile")}
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

        <section className="grid flex-1 gap-5 py-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            {activeTab === "home" && (
              <HomePanel
                devices={devices}
                notifications={notifications}
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
              ) : (
                <DeviceZoneListPanel
                  zone={deviceZone}
                  devices={filterDevicesByZone(devices, deviceZone)}
                  loading={devicesLoading}
                  selectedDeviceId={selectedDeviceId}
                  onBack={() => setDeviceZone(null)}
                  onSelect={setSelectedDeviceId}
                />
              ))}
            {activeTab === "booking" && (
              <BookingPanel
                bookingPrice={bookingPrice}
                durationHours={durationHours}
                selectedDevice={selectedDevice}
                setDurationHours={setDurationHours}
                setStartHour={setStartHour}
                startHour={startHour}
                onCreateBooking={createBooking}
              />
            )}
            {activeTab === "hookah" && (
              <HookahPanel
                flavors={hookahFlavors}
                tables={tables}
                loading={hookahLoading}
                selectedFlavorId={selectedFlavorId}
                selectedTableId={selectedTableId}
                setSelectedFlavorId={setSelectedFlavorId}
                setSelectedTableId={setSelectedTableId}
                onAddHookah={addHookahToCart}
              />
            )}
            {activeTab === "cart" && (
              <CartPanel
                cart={cart}
                grandTotal={grandTotal}
                onClearCart={clearCart}
                onOpenPayment={() => setActiveTab("payment")}
                onCancelBooking={cancelBookingById}
                onRemoveCartItem={async (item) => {
                  if (item.type === "booking") {
                    await cancelBookingById(item.id);
                    return;
                  }
                  try {
                    await apiRequest(`/api/cart/${item.id}`, { method: "DELETE" });
                    await refreshCart();
                    pushNotification("Savatdan olib tashlandi.");
                  } catch (error) {
                    pushNotification(error instanceof Error ? error.message : "O'chirib bo'lmadi.");
                  }
                }}
              />
            )}
            {activeTab === "payment" && (
              <PaymentPanel
                cart={cart}
                paidOrders={paidOrders}
                grandTotal={grandTotal}
                paymentMethod={paymentMethod}
                paymentStatus={paymentStatus}
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
                phone={phone}
                session={session}
                setPhone={setPhone}
                onCancelBooking={cancelBookingById}
              />
            )}
          </div>

          <AsidePanel
            bookings={bookings}
            cart={cart}
            devices={devices}
            paidOrders={paidOrders}
            lastPaymentTotal={lastPaymentTotal}
            grandTotal={grandTotal}
            notifications={notifications}
            onOpenCart={() => setActiveTab("cart")}
          />
        </section>

        <MobileBottomNav activeTab={activeTab} cartCount={cart.length} onChange={setActiveTab} />
      </div>
    </main>
  );
}

function Header({
  cartCount,
  liveStatus,
  paymentStatus,
  session,
  onOpenProfile,
}: {
  cartCount: number;
  liveStatus: LiveStatus;
  paymentStatus: "pending" | "paid";
  session: UserSession | null;
  onOpenProfile: () => void;
}) {
  return (
    <header className="flex flex-col gap-4 rounded-3xl border border-violet-500/30 bg-black/25 p-5 backdrop-blur md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.45em] text-cyan-200/80">Arsenal Union</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-cyan-200 sm:text-5xl">GAME CLUB</h1>
        <p className="mt-2 max-w-2xl text-sm text-violet-100/70">
          Socket.IO orqali admin va mijoz bir vaqtda yangilanadi.
        </p>
        <p
          className={cn(
            "mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
            liveStatus === "connected"
              ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
              : liveStatus === "connecting"
                ? "border-amber-400/40 bg-amber-500/10 text-amber-200"
                : "border-violet-400/30 bg-violet-500/10 text-violet-200/80",
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {session ? (
          <button
            type="button"
            onClick={onOpenProfile}
            className={cn(
              touchPress,
              "flex items-center gap-3 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2.5 text-left hover:border-cyan-300/50 hover:bg-cyan-500/15 active:border-cyan-200 active:bg-cyan-500/25",
            )}
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/30 to-fuchsia-600/30 text-sm font-black">
              {getInitials(session.name)}
            </span>
            <span>
              <span className="block text-xs uppercase tracking-wider text-violet-200/60">Profil</span>
              <span className="block text-sm font-bold text-white">{session.name}</span>
            </span>
          </button>
        ) : null}
        <div className="grid grid-cols-2 gap-3 sm:min-w-72">
          <MiniStat label="Savat" value={`${cartCount} ta`} icon={<ShoppingCart className="size-4" />} />
          <MiniStat label="To'lov" value={paymentStatus === "paid" ? "Paid" : "Pending"} icon={<CreditCard className="size-4" />} />
        </div>
      </div>
    </header>
  );
}

function HomePanel({
  devices,
  notifications,
  onOpenDevices,
}: {
  devices: Device[];
  notifications: string[];
  onOpenDevices: () => void;
}) {
  const freeDevices = devices.filter((device) => device.status === "available").length;

  return (
    <>
      <Card className="bg-gradient-to-br from-cyan-500/15 via-violet-500/10 to-fuchsia-500/15 p-8 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.35em] text-cyan-200">O&apos;yinlar olamiga xush kelibsiz</p>
        <h2 className="mt-4 text-5xl font-black tracking-tight text-white sm:text-7xl">GAME CLUB</h2>
        <p className="mx-auto mt-4 max-w-2xl text-violet-100/75">
          Bron, kalyan buyurtma va admin o&apos;zgarishlari avtomatik yangilanadi — qo&apos;lda yangilash shart emas.
        </p>
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" onClick={onOpenDevices}>
            <Gamepad2 className="size-4" />
            Qurilmalarni ko&apos;rish
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <MiniStat label="Bo'sh qurilmalar" value={`${freeDevices}/${devices.length}`} icon={<Activity className="size-4" />} />
        <MiniStat label="To'lov usullari" value="3 ta" icon={<CreditCard className="size-4" />} />
        <MiniStat label="Real-time" value="Socket.IO" icon={<Wifi className="size-4" />} />
      </div>

      <NotificationsCard notifications={notifications} />
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
          <p className="text-sm text-violet-200/70">Yuklanmoqda...</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onSelect("ps")}
              className="group relative overflow-hidden rounded-3xl border border-cyan-400/35 bg-gradient-to-br from-cyan-500/20 via-violet-900/40 to-[#0a0618] p-6 text-left transition hover:border-cyan-300/60 hover:shadow-[0_0_40px_rgba(34,211,238,0.25)]"
            >
              <div className="flex items-center justify-between">
                <Gamepad2 className="size-10 text-cyan-200" />
                <ChevronRight className="size-5 text-cyan-200/60 transition group-hover:translate-x-1" />
              </div>
              <p className="mt-4 text-2xl font-black text-white">PlayStation</p>
              <p className="mt-1 text-sm text-cyan-100/70">PS lar holati</p>
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-cyan-200/80">{psCount} ta qurilma</p>
            </button>

            <button
              type="button"
              onClick={() => onSelect("pc")}
              className={cn(
                touchPress,
                "group relative overflow-hidden rounded-3xl border border-fuchsia-400/35 bg-gradient-to-br from-fuchsia-500/20 via-violet-900/40 to-[#0a0618] p-6 text-left hover:border-fuchsia-300/60 hover:shadow-[0_0_40px_rgba(217,70,239,0.25)] active:border-fuchsia-200 active:bg-fuchsia-500/30 active:shadow-[0_0_32px_rgba(217,70,239,0.4)]",
              )}
            >
              <div className="flex items-center justify-between">
                <Monitor className="size-10 text-fuchsia-200" />
                <ChevronRight className="size-5 text-fuchsia-200/60 transition group-hover:translate-x-1" />
              </div>
              <p className="mt-4 text-2xl font-black text-white">Kompyuter</p>
              <p className="mt-1 text-sm text-fuchsia-100/70">PC lar holati</p>
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-fuchsia-200/80">{pcCount} ta qurilma</p>
            </button>
          </div>
        )}
      </CardContent>
    </Card>
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
          <p className="text-sm text-violet-200/70">Qurilmalar yuklanmoqda...</p>
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
          <p className="text-sm text-violet-200/70">Bu zonada qurilmalar yo&apos;q. Admin paneldan qo&apos;shing.</p>
        ) : (
          <div className="grid gap-3">
            {devices.map((device) => (
              <SelectableRow key={device.id} active={selectedDeviceId === device.id} onClick={() => onSelect(device.id)}>
                <div>
                  <p className="font-bold text-violet-50">{device.name}</p>
                  <p className="text-sm text-violet-200/70">
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
          <CardDescription>Avval Qurilmalar bo&apos;limidan qurilma tanlang.</CardDescription>
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
          <span className="text-sm font-semibold text-violet-200/80">Boshlanish vaqti</span>
          <Input value={startHour} onChange={(event) => setStartHour(event.target.value)} placeholder="13:00" />
        </label>

        <div className="space-y-2">
          <span className="text-sm font-semibold text-violet-200/80">Davomiyligi (soat)</span>
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

        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
          <p className="text-sm text-cyan-100/75">Jami</p>
          <p className="text-2xl font-black text-cyan-100">{formatCurrency(bookingPrice)}</p>
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
  setSelectedFlavorId,
  setSelectedTableId,
}: {
  flavors: HookahFlavor[];
  tables: ClubTable[];
  loading: boolean;
  onAddHookah: () => void;
  selectedFlavorId: string;
  selectedTableId: string;
  setSelectedFlavorId: (id: string) => void;
  setSelectedTableId: (id: string) => void;
}) {
  if (!flavors.length || !tables.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kalyan buyurtmasi</CardTitle>
          <CardDescription>Admin paneldan stol va ta&apos;mlarni qo&apos;shing.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-violet-200/70">Hozircha kalyan ta&apos;mlari yoki stollar mavjud emas.</p>
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
        <div className="space-y-3">
          <span className="text-sm font-semibold text-violet-200/80">Stol tanlang</span>
          <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider text-violet-300/60">
            <span className="inline-flex items-center gap-1">
              <span className="size-2 rounded-full bg-emerald-400" /> Bo&apos;sh
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="size-2 rounded-full bg-rose-400" /> Band
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="size-2 rounded-full bg-amber-400" /> Bron
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
                  "rounded-2xl border-2 p-4 text-left active:ring-2 active:ring-cyan-300/80",
                  table.status === "available" && "border-emerald-400/50 bg-emerald-500/10 active:bg-emerald-500/25",
                  table.status === "busy" && "border-rose-400/50 bg-rose-500/10 active:bg-rose-500/25",
                  table.status === "booked" && "border-amber-400/50 bg-amber-500/10 active:bg-amber-500/25",
                  selectedTableId === table.id && "ring-2 ring-fuchsia-400 ring-offset-2 ring-offset-[#07050f]",
                )}
              >
                <p className="font-bold text-violet-50">{table.title}</p>
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
                <p className="font-bold text-violet-50">{flavor.title}</p>
                <p className="text-sm text-violet-200/70">{formatCurrency(flavor.price)}</p>
              </div>
            </SelectableRow>
          ))}
        </div>

        <Button className="w-full" onClick={onAddHookah} disabled={loading || !selectedFlavorId || !selectedTableId}>
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
  paidOrders,
  grandTotal,
  onPayNow,
  paymentMethod,
  paymentStatus,
  setPaymentMethod,
  pendingSessions,
  onSessionUnlocked,
  onCancelSession,
}: {
  cart: CartItem[];
  paidOrders: OrderRecord[];
  grandTotal: number;
  onPayNow: () => void;
  paymentMethod: PaymentMethod;
  paymentStatus: "pending" | "paid";
  setPaymentMethod: (method: PaymentMethod) => void;
  pendingSessions: ClubSession[];
  onSessionUnlocked: () => void;
  onCancelSession: (sessionId: string, deviceId?: string) => Promise<void>;
}) {
  const lastPaid = paidOrders[0];

  return (
    <div className="space-y-5">
      {pendingSessions.length > 0 ? (
        <StationUnlockPanel
          sessions={pendingSessions}
          onUnlocked={onSessionUnlocked}
          onCancelSession={onCancelSession}
        />
      ) : null}
    <Card>
      <CardHeader>
        <CardTitle>To&apos;lov</CardTitle>
        <CardDescription>
          {cart.length
            ? `To'lanishi kerak: ${cart.length} ta buyurtma`
            : lastPaid
              ? `Oxirgi to'lov: ${formatCurrency(lastPaid.price)}`
              : "Buyurtmalar ro'yxati"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {cart.length > 0 ? (
          <section className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-300/70">To&apos;lov qilinadigan</p>
            <OrderLinesList items={cart} />
            <TotalBox total={grandTotal} />
          </section>
        ) : null}

        {paidOrders.length > 0 ? (
          <section className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-300/70">To&apos;langan buyurtmalar</p>
            {paidOrders.slice(0, 8).map((order, index) => (
              <PaidOrderRow key={`${order.id}-${order.paidAt}`} order={order} highlight={index === 0} />
            ))}
          </section>
        ) : null}

        <label className="space-y-2">
          <span className="text-sm font-semibold text-violet-200/80">To&apos;lov usuli</span>
          <Select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </Select>
        </label>

        <div className="grid gap-3 sm:grid-cols-3">
          {PAYMENT_METHODS.map((method) => (
            <SelectableRow key={method} active={paymentMethod === method} onClick={() => setPaymentMethod(method)}>
              <p className="font-bold text-violet-50">{method}</p>
              <span className="text-xs text-violet-200/70">{paymentMethod === method ? "Tanlandi" : "Tanlash"}</span>
            </SelectableRow>
          ))}
        </div>

        <Button className="w-full" onClick={onPayNow} disabled={!cart.length}>
          To&apos;lash
        </Button>
        <Badge variant={paymentStatus === "paid" ? "available" : "booked"}>Status: {paymentStatus}</Badge>
      </CardContent>
    </Card>
    </div>
  );
}

function ProfilePanel({
  bookings,
  phone,
  session,
  setPhone,
  onCancelBooking,
}: {
  bookings: Booking[];
  phone: string;
  session: UserSession;
  setPhone: (value: string) => void;
  onCancelBooking: (bookingId: string, deviceId?: string) => Promise<void>;
}) {
  return (
    <div className="space-y-5">
      <ProfileBox session={session} phone={phone} onPhoneChange={setPhone} />
      <HistoryCard bookings={bookings} onCancelBooking={onCancelBooking} />
    </div>
  );
}

function AsidePanel({
  bookings,
  cart,
  devices,
  paidOrders,
  lastPaymentTotal,
  grandTotal,
  notifications,
  onOpenCart,
}: {
  bookings: Booking[];
  cart: CartItem[];
  devices: Device[];
  paidOrders: OrderRecord[];
  lastPaymentTotal: number | null;
  grandTotal: number;
  notifications: string[];
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
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-300/70">Savatdagi buyurtmalar</p>
              <OrderLinesList items={cart} compact />
              <p className="text-sm font-bold text-cyan-100">Jami: {formatCurrency(grandTotal)}</p>
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
          <Button variant="secondary" className="w-full" onClick={onOpenCart}>
            Savatni ochish
          </Button>
        </CardContent>
      </Card>

      <NotificationsCard notifications={notifications} compact />
    </aside>
  );
}

function NotificationsCard({ compact = false, notifications }: { compact?: boolean; notifications: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="size-5 text-cyan-200" />
          Bildirishnomalar
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notifications.slice(0, compact ? 3 : notifications.length).map((notification, index) => (
          <div key={`${notification}-${index}`} className="rounded-2xl border border-violet-500/20 bg-white/[0.03] p-3 text-sm text-violet-100/80">
            {notification}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function HistoryCard({
  bookings,
  onCancelBooking,
}: {
  bookings: Booking[];
  onCancelBooking: (bookingId: string, deviceId?: string) => Promise<void>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bronlar tarixi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!bookings.length && <p className="text-sm text-violet-200/70">Hozircha bronlar yo&apos;q.</p>}
        {bookings.map((booking) => (
          <SelectableRow key={booking.id} className="flex-wrap gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-bold text-violet-50">{booking.deviceName}</p>
              <p className="text-sm text-violet-200/70">
                {booking.startHour}, {booking.durationHours} soat
              </p>
              <Badge
                variant={booking.status === "active" ? "booked" : booking.status === "cancelled" ? "busy" : "available"}
                className="mt-2"
              >
                {BOOKING_STATUS_LABEL[(booking.status || "active") as BookingStatus] ?? booking.status}
              </Badge>
            </div>
            <div className="flex flex-col items-end gap-2">
              <p className="text-sm font-bold text-cyan-100">{formatCurrency(booking.price)}</p>
              {booking.status === "active" ? (
                <Button type="button" size="sm" variant="secondary" onClick={() => onCancelBooking(booking.id, booking.deviceId)}>
                  Bekor qilish
                </Button>
              ) : null}
            </div>
          </SelectableRow>
        ))}
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
    return <p className="text-sm text-violet-200/70">Buyurtmalar yo&apos;q.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <SelectableRow key={item.id} className={cn(compact ? "p-3" : undefined, "flex-wrap gap-3")}>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-fuchsia-300/80">
              Buyurtma #{index + 1}
            </p>
            <p className="font-bold text-violet-50">{item.title}</p>
            <p className="text-xs text-violet-300/60">{ORDER_TYPE_LABEL[item.type]}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <p className="text-sm font-bold text-cyan-100">{formatCurrency(item.price)}</p>
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

function PaidOrderRow({ order, highlight }: { order: OrderRecord; highlight?: boolean }) {
  const time = new Date(order.paidAt).toLocaleString("uz-UZ", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        highlight ? "border-cyan-400/40 bg-cyan-500/10" : "border-violet-500/20 bg-white/[0.03]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          {highlight ? (
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-300/90">Oxirgi to&apos;lov</p>
          ) : null}
          <p className="font-bold text-violet-50">{order.title}</p>
          <p className="mt-1 text-xs text-violet-300/60">
            {ORDER_TYPE_LABEL[order.type]} • {order.paymentMethod} • {time}
          </p>
        </div>
        <p className="shrink-0 text-sm font-black text-cyan-100">{formatCurrency(order.price)}</p>
      </div>
    </div>
  );
}

function TotalBox({ total }: { total: number }) {
  return (
    <div className="rounded-2xl border border-fuchsia-300/25 bg-fuchsia-400/10 p-4">
      <p className="text-sm text-fuchsia-100/70">Jami</p>
      <p className="text-2xl font-black text-white">{formatCurrency(total)}</p>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-violet-500/25 bg-white/[0.04] p-4">
      <div className="flex items-center gap-2 text-cyan-200">
        {icon}
        <span className="text-xs font-bold uppercase tracking-[0.25em]">{label}</span>
      </div>
      <p className="mt-2 text-xl font-black text-white">{value}</p>
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
        "flex w-full items-center justify-between gap-4 rounded-2xl border border-violet-500/20 bg-[#161323] p-4 text-left",
        onClick && cn(touchPress, "hover:border-cyan-300/45 hover:bg-white/[0.06] active:border-cyan-300/60 active:bg-white/10"),
        active && "border-fuchsia-300/70 shadow-[0_0_22px_rgba(217,70,239,0.22)] active:shadow-[0_0_28px_rgba(217,70,239,0.35)]",
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
