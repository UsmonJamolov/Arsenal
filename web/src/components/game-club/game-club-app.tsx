"use client";

import { ArrowLeft, ChevronRight, CreditCard, Gamepad2, History, ShoppingCart } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { MobileBottomNav } from "@/components/game-club/mobile-bottom-nav";
import { HookahZonePanel } from "@/components/game-club/hookah-zone-panel";
import { DevicesZonePanel } from "@/components/game-club/devices-zone-panel";
import { HomePanel } from "@/components/game-club/home-panel";
import { PcZonePanel } from "@/components/game-club/pc-zone-panel";
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
    <main
      className={cn(
        "text-text-primary",
        activeTab === "home" && "min-h-screen home-screen-bg",
        activeTab === "devices" && !deviceZone && "min-h-screen devices-screen-bg",
        activeTab === "devices" && deviceZone && "min-h-screen arena-bg",
        activeTab === "hookah" && "min-h-screen hookah-screen-bg",
        activeTab !== "home" && activeTab !== "devices" && activeTab !== "hookah" && "min-h-screen arena-bg",
      )}
    >
      <div
        className={cn(
          "relative mx-auto flex w-full flex-col",
          activeTab === "devices" && !deviceZone
            ? "devices-screen-layout min-h-screen max-w-[430px] px-6 py-5"
            : "app-mobile-nav-padding min-h-screen max-w-7xl px-4 py-6 sm:px-6 md:pb-6 lg:px-8",
          activeTab === "home" && "min-h-0",
        )}
      >
        <TabsList className={cn("hidden md:grid", activeTab !== "home" && "mt-2", activeTab === "home" && "!hidden")}>
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
            "grid min-h-0",
            activeTab === "home" && "gap-5 pt-6 pb-0",
            activeTab === "devices" && !deviceZone && "gap-0 pt-0 pb-0",
            activeTab !== "home" && !(activeTab === "devices" && !deviceZone) && "gap-5 py-2",
          )}
        >
          <div
            className={cn(
              activeTab === "devices" && !deviceZone ? "w-full max-w-[430px]" : "space-y-5",
              (activeTab === "home" || (activeTab === "devices" && deviceZone) || activeTab === "hookah") &&
                "mx-auto w-full max-w-lg",
            )}
          >
            {activeTab === "home" && (
              <HomePanel
                devices={devices}
                bookingsCount={bookings.length}
                hookahCount={hookahFlavors.length}
                liveStatus={liveStatus}
                session={session}
                profileAvatarUrl={profileAvatarUrl}
                onOpenDevices={() => setActiveTab("devices")}
                onOpenHookah={() => setActiveTab("hookah")}
                onOpenProfile={() => setActiveTab("profile")}
              />
            )}
            {activeTab === "devices" &&
              (!deviceZone ? (
                <DevicesZonePanel
                  loading={devicesLoading}
                  psCount={filterDevicesByZone(devices, "ps").length}
                  pcCount={filterDevicesByZone(devices, "pc").length}
                  onBack={() => setActiveTab("home")}
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
              <HookahZonePanel
                flavors={hookahFlavors}
                tables={tables}
                loading={hookahLoading}
                selectedFlavorId={selectedFlavorId}
                selectedTableId={selectedTableId}
                startHour={hookahStartHour}
                onBack={() => setActiveTab("home")}
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
