"use client";

import {
  Calendar,
  ChevronRight,
  Copy,
  Crown,
  Headset,
  LogOut,
  Mail,
  Phone,
  Send,
  ShoppingBag,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { apiRequest, setApiUserId } from "@/lib/api";
import { clearSession, getInitials, type UserSession } from "@/lib/auth";
import {
  BOOKING_STATUS_LABEL,
  type Booking,
  type BookingStatus,
  type OrderRecord,
} from "@/lib/game-club-data";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { loadProfileExtras, saveProfileExtras } from "@/lib/user-storage";
import { cn } from "@/lib/utils";

type ProfilePanelProps = {
  session: UserSession;
  phone: string;
  bookings: Booking[];
  paidOrders: OrderRecord[];
  onPhoneChange: (value: string) => void;
  onAvatarChange?: (avatarUrl: string | null) => void;
  onCancelBooking: (bookingId: string, deviceId?: string) => Promise<void>;
};

type EditField = "firstName" | "lastName" | "phone" | null;

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

function formatDisplayId(id: string) {
  const digits = id.replace(/\D/g, "");
  const source =
    digits.length >= 8 ? digits.slice(-8) : id.replace(/[^a-zA-Z0-9]/g, "").slice(-8).padStart(8, "0");
  return `${source.slice(0, 4)} ${source.slice(4)}`.toUpperCase();
}

async function readAvatarPreview(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Rasm yuklanmadi"));
      img.src = objectUrl;
    });

    const maxSize = 320;
    const scale = Math.min(maxSize / image.width, maxSize / image.height, 1);
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Rasm qayta ishlanmadi");
    }

    ctx.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.88);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

const cardClass =
  "rounded-[1.25rem] border border-[var(--au-border)] bg-[var(--au-surface-raised)]";

const DEFAULT_SUPPORT_TELEGRAM_URL = "https://t.me/arsenal_union_bot";
const DEFAULT_SUPPORT_PHONE = "+998 90 123 45 67";

export function ProfilePanel({
  session,
  phone,
  bookings,
  paidOrders,
  onPhoneChange,
  onAvatarChange,
  onCancelBooking,
}: ProfilePanelProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fieldsRef = useRef<HTMLElement>(null);
  const defaults = useMemo(() => splitName(session.name), [session.name]);

  const [firstName, setFirstName] = useState(defaults.firstName);
  const [lastName, setLastName] = useState(defaults.lastName);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [editingField, setEditingField] = useState<EditField>(null);
  const [historyVisible, setHistoryVisible] = useState(3);
  const [copiedId, setCopiedId] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportPhone, setSupportPhone] = useState(DEFAULT_SUPPORT_PHONE);
  const [supportTelegramUrl, setSupportTelegramUrl] = useState(DEFAULT_SUPPORT_TELEGRAM_URL);
  const supportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    apiRequest<{ phone?: string; telegramUrl?: string }>("/api/catalog/support")
      .then((data) => {
        if (!active) {
          return;
        }
        if (data.phone) {
          setSupportPhone(data.phone);
        }
        if (data.telegramUrl) {
          setSupportTelegramUrl(data.telegramUrl);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const profileRef = useRef({
    firstName: defaults.firstName,
    lastName: defaults.lastName,
    avatarUrl: null as string | null,
  });

  useEffect(() => {
    const saved = loadProfileExtras(session.id, {
      firstName: defaults.firstName,
      lastName: defaults.lastName,
      avatarUrl: null,
    });
    setFirstName(saved.firstName);
    setLastName(saved.lastName);
    setAvatarUrl(saved.avatarUrl);
    profileRef.current = saved;
    onAvatarChange?.(saved.avatarUrl);
  }, [session.id, defaults.firstName, defaults.lastName, onAvatarChange]);

  useEffect(() => {
    profileRef.current = { firstName, lastName, avatarUrl };
  }, [firstName, lastName, avatarUrl]);

  const persistProfile = useCallback(
    (next: { firstName?: string; lastName?: string; avatarUrl?: string | null }) => {
      const updated = {
        firstName: next.firstName ?? profileRef.current.firstName,
        lastName: next.lastName ?? profileRef.current.lastName,
        avatarUrl: next.avatarUrl !== undefined ? next.avatarUrl : profileRef.current.avatarUrl,
      };
      profileRef.current = updated;
      saveProfileExtras(session.id, updated);
      if (next.firstName !== undefined) setFirstName(next.firstName);
      if (next.lastName !== undefined) setLastName(next.lastName);
      if (next.avatarUrl !== undefined) setAvatarUrl(next.avatarUrl);
      if (next.avatarUrl !== undefined) onAvatarChange?.(next.avatarUrl);
    },
    [session.id, onAvatarChange],
  );

  const displayName = `${firstName} ${lastName}`.trim() || session.name;
  const displayId = formatDisplayId(session.id);
  const isPremium = session.loyaltyPoints >= 100;

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

  const totalSpent = useMemo(() => paidOrders.reduce((sum, order) => sum + order.price, 0), [paidOrders]);
  const totalOrders = historyEntries.length;

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setAvatarLoading(true);
    try {
      const url = await readAvatarPreview(file);
      persistProfile({ avatarUrl: url });
    } catch {
      /* rasm yuklanmadi */
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    setApiUserId(null);
    router.replace("/auth");
  };

  const copyUserId = async () => {
    try {
      await navigator.clipboard.writeText(displayId.replace(/\s/g, ""));
      setCopiedId(true);
      window.setTimeout(() => setCopiedId(false), 1600);
    } catch {
      /* clipboard */
    }
  };

  const toggleField = (field: EditField) => {
    setEditingField((current) => (current === field ? null : field));
  };

  const scrollToFields = () => {
    fieldsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    if (!supportOpen) {
      return;
    }

    const handlePointer = (event: MouseEvent) => {
      if (supportRef.current && !supportRef.current.contains(event.target as Node)) {
        setSupportOpen(false);
      }
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSupportOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [supportOpen]);

  return (
    <div className="flex w-full max-w-[430px] flex-col gap-5 pb-2 text-[var(--au-text)]">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-[1.75rem] font-bold leading-tight tracking-tight text-[var(--au-text)]">Profil</h1>
          <p className="mt-1.5 text-sm text-[var(--au-muted)]">Shaxsiy ma&apos;lumotlaringiz</p>
        </div>
        <div className="relative shrink-0" ref={supportRef}>
          <button
            type="button"
            className={cn(
              "flex size-11 items-center justify-center rounded-[0.875rem]",
              cardClass,
              "text-[var(--au-text-secondary)] transition hover:border-[rgb(227_24_55/0.28)] hover:bg-[var(--au-red-soft)] hover:text-[var(--au-red-bright)]",
              supportOpen && "border-[rgb(227_24_55/0.28)] bg-[var(--au-red-soft)] text-[var(--au-red-bright)]",
            )}
            aria-label="Qo'llab-quvvatlash"
            aria-haspopup="menu"
            aria-expanded={supportOpen}
            onClick={() => setSupportOpen((open) => !open)}
          >
            <Headset className="size-5" />
          </button>

          {supportOpen ? (
            <div
              role="menu"
              className={cn(
                "absolute right-0 top-[calc(100%+0.5rem)] z-20 w-60 overflow-hidden p-1.5",
                cardClass,
              )}
            >
              <p className="px-3 py-2 text-[0.6875rem] font-extrabold uppercase tracking-wider text-[var(--au-muted)]">
                Qo&apos;llab-quvvatlash
              </p>
              <a
                href={supportTelegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--au-text)] transition hover:bg-[var(--au-red-soft)] hover:text-[var(--au-red-bright)]"
                onClick={() => setSupportOpen(false)}
              >
                <Send className="size-4 shrink-0" />
                Telegram orqali yozish
              </a>
              <a
                href={`tel:${supportPhone.replace(/\s/g, "")}`}
                role="menuitem"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--au-text)] transition hover:bg-[var(--au-red-soft)] hover:text-[var(--au-red-bright)]"
                onClick={() => setSupportOpen(false)}
              >
                <Phone className="size-4 shrink-0" />
                {supportPhone}
              </a>
            </div>
          ) : null}
        </div>
      </header>

      <div
        role="button"
        tabIndex={0}
        className={cn(
          "flex w-full cursor-pointer items-center gap-3.5 p-4 text-left transition hover:border-[rgb(227_24_55/0.22)]",
          cardClass,
        )}
        onClick={scrollToFields}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            scrollToFields();
          }
        }}
      >
        <div className="relative shrink-0">
          <div
            className="profile-avatar-ring flex size-[4.5rem] items-center justify-center rounded-full p-[3px]"
          >
            <div className="relative flex size-full items-center justify-center overflow-hidden rounded-full border-2 border-[var(--au-bg)] bg-[var(--au-surface)] text-2xl font-bold text-[var(--au-red-bright)]">
              {avatarLoading ? (
                <span className="text-xs font-semibold">...</span>
              ) : avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={avatarUrl} src={avatarUrl} alt="Profil rasmi" className="absolute inset-0 size-full object-cover" />
              ) : (
                getInitials(displayName)
              )}
            </div>
          </div>
          <button
            type="button"
            className="absolute -bottom-0.5 -right-0.5 flex size-7 items-center justify-center rounded-full border-2 border-[var(--au-bg)] bg-[var(--au-red)] text-white shadow-[0_4px_12px_var(--au-red-glow)]"
            aria-label="Rasm yuklash"
            onClick={(event) => {
              event.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="m-0 truncate text-[1.0625rem] font-bold">{displayName}</p>
          {isPremium ? (
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-[rgb(227_24_55/0.35)] bg-[var(--au-red-soft)] px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wide text-[var(--au-red-bright)]">
              <Crown className="size-3" />
              Premium
            </span>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[0.8125rem] text-[var(--au-muted)] tabular-nums">
            <span>ID: {displayId}</span>
            <button
              type="button"
              className="inline-flex rounded-md p-0.5 text-[var(--au-muted)] transition hover:bg-[var(--au-red-soft)] hover:text-[var(--au-red-bright)]"
              aria-label="ID nusxalash"
              onClick={(event) => {
                event.stopPropagation();
                void copyUserId();
              }}
            >
              <Copy className="size-3.5" />
            </button>
            {copiedId ? <span className="text-[0.65rem] text-[var(--au-red-bright)]">Nusxalandi</span> : null}
          </div>
        </div>

        <ChevronRight className="size-5 shrink-0 text-[var(--au-muted)]" />
      </div>

      <section ref={fieldsRef} className={cn("overflow-hidden", cardClass)}>
        <FieldRow
          icon={<User className="size-4" />}
          label="Ism"
          value={firstName}
          editing={editingField === "firstName"}
          onToggle={() => toggleField("firstName")}
          onChange={(value) => {
            setFirstName(value);
            persistProfile({ firstName: value });
          }}
        />
        <FieldRow
          icon={<Users className="size-4" />}
          label="Familiya"
          value={lastName}
          editing={editingField === "lastName"}
          onToggle={() => toggleField("lastName")}
          onChange={(value) => {
            setLastName(value);
            persistProfile({ lastName: value });
          }}
        />
        <FieldRow
          icon={<Phone className="size-4" />}
          label="Telefon"
          value={phone}
          editing={editingField === "phone"}
          onToggle={() => toggleField("phone")}
          onChange={onPhoneChange}
        />
        <div className="flex w-full items-center gap-3 px-4 py-3.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[0.65rem] bg-[var(--au-red-soft)] text-[var(--au-red)]">
            <Mail className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <span className="block text-xs text-[var(--au-muted)]">Email</span>
            <span className="mt-0.5 block truncate text-[0.9375rem] font-semibold">{session.email || "—"}</span>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="m-0 text-lg font-bold text-[var(--au-text)]">Bronlar tarixi</h2>
            <p className="mt-1 text-[0.8125rem] text-[var(--au-muted)]">Barcha buyurtmalaringiz tarixi</p>
          </div>
          {historyEntries.length > 3 ? (
            <button
              type="button"
              className="shrink-0 border-none bg-transparent text-[0.8125rem] font-semibold text-[var(--au-red-bright)]"
              onClick={() =>
                setHistoryVisible((count) => (count >= historyEntries.length ? 3 : historyEntries.length))
              }
            >
              {historyVisible >= historyEntries.length ? "Kamroq" : "Hammasini ko'rish >"}
            </button>
          ) : null}
        </div>

        <div className="mt-3.5 flex flex-col gap-2.5">
          {!historyEntries.length ? (
            <p className="py-5 text-center text-sm text-[var(--au-muted)]">Hozircha tarix yo&apos;q.</p>
          ) : (
            historyEntries.slice(0, historyVisible).map((entry) =>
              entry.kind === "booking" ? (
                <BookingHistoryCard key={entry.key} booking={entry.booking} onCancelBooking={onCancelBooking} />
              ) : (
                <PaidHistoryCard key={entry.key} order={entry.order} />
              ),
            )
          )}
        </div>
      </section>

      <section className={cn("grid grid-cols-2 gap-2 px-2 py-3.5 max-[380px]:gap-3", cardClass)} aria-label="Statistika">
        <StatItem icon={<Wallet className="size-4" />} value={formatCurrency(totalSpent).replace(" UZS", "")} label="Jami sarflangan" />
        <StatItem icon={<ShoppingBag className="size-4" />} value={String(totalOrders)} label="Jami buyurtma" />
      </section>

      <button
        type="button"
        className="profile-logout-btn flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-2xl border-none text-base font-bold text-white transition active:scale-[0.985] hover:brightness-105"
        onClick={handleLogout}
      >
        <LogOut className="size-5" />
        Chiqish
      </button>
    </div>
  );
}

function FieldRow({
  icon,
  label,
  value,
  editing,
  onToggle,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  editing: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 border-b border-[var(--au-border)] px-4 py-3.5 text-left transition last:border-b-0 hover:bg-[var(--au-red-soft)]"
      onClick={onToggle}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-[0.65rem] bg-[var(--au-red-soft)] text-[var(--au-red)]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <span className="block text-xs text-[var(--au-muted)]">{label}</span>
        {editing ? (
          <input
            className="mt-1 block w-full rounded-lg border border-[rgb(227_24_55/0.35)] bg-[var(--au-surface)] px-2 py-1.5 text-[0.9375rem] font-semibold text-[var(--au-text)] outline-none focus:border-[var(--au-red)] focus:ring-2 focus:ring-[var(--au-red-soft)]"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            autoFocus
          />
        ) : (
          <span className="mt-0.5 block truncate text-[0.9375rem] font-semibold">{value || "—"}</span>
        )}
      </div>
      <ChevronRight className="size-4 shrink-0 text-[var(--au-muted)]" />
    </button>
  );
}

function BookingHistoryCard({
  booking,
  onCancelBooking,
}: {
  booking: Booking;
  onCancelBooking: (bookingId: string, deviceId?: string) => Promise<void>;
}) {
  const status = (booking.status || "active") as BookingStatus;
  const statusLabel = BOOKING_STATUS_LABEL[status] ?? booking.status;

  return (
    <article className={cn("flex items-start gap-3 p-4", cardClass)}>
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--au-red-soft)] text-[var(--au-red)]">
        <Calendar className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="m-0 text-[0.9375rem] font-bold text-[var(--au-text)]">{booking.deviceName}</p>
        <p className="mt-0.5 text-[0.8125rem] text-[var(--au-muted)] tabular-nums">
          {booking.createdAt ? formatDateTime(booking.createdAt) : "—"} • {booking.durationHours} soat
        </p>
        {status === "active" ? (
          <button
            type="button"
            className="mt-1.5 rounded-lg border border-[var(--au-border)] px-2 py-1 text-[0.6875rem] font-semibold text-[var(--au-text-secondary)] hover:border-[rgb(227_24_55/0.35)] hover:text-[var(--au-red-bright)]"
            onClick={() => onCancelBooking(booking.id, booking.deviceId)}
          >
            Bekor qilish
          </button>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <p className="m-0 whitespace-nowrap text-sm font-bold tabular-nums text-[var(--au-red-bright)]">{formatCurrency(booking.price)}</p>
        <p
          className={cn(
            "m-0 text-[0.625rem] font-extrabold uppercase tracking-wider",
            status === "active" && "text-[var(--au-red-bright)]",
            status === "paid" && "text-emerald-400",
            status === "completed" && "text-[var(--au-muted)]",
            status === "cancelled" && "text-[var(--au-red-dark)]",
          )}
        >
          {statusLabel.toUpperCase()}
        </p>
      </div>
    </article>
  );
}

function PaidHistoryCard({ order }: { order: OrderRecord }) {
  return (
    <article className={cn("flex items-start gap-3 p-4", cardClass)}>
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--au-red-soft)] text-[var(--au-red)]">
        <Calendar className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="m-0 text-[0.9375rem] font-bold text-[var(--au-text)]">{order.title}</p>
        <p className="mt-0.5 text-[0.8125rem] text-[var(--au-muted)] tabular-nums">{formatDateTime(order.paidAt)}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <p className="m-0 whitespace-nowrap text-sm font-bold tabular-nums text-[var(--au-red-bright)]">{formatCurrency(order.price)}</p>
        <p className="m-0 text-[0.625rem] font-extrabold uppercase tracking-wider text-[var(--au-muted)]">TO&apos;LANGAN</p>
      </div>
    </article>
  );
}

function StatItem({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-1 py-1 text-center">
      <span className="text-[var(--au-red)]/55">{icon}</span>
      <p className="m-0 text-[0.8125rem] font-extrabold leading-tight tabular-nums text-[var(--au-text)] max-[380px]:text-[0.9375rem]">{value}</p>
      <p className="m-0 text-[0.5625rem] leading-tight text-[var(--au-muted)] max-[380px]:text-[0.625rem]">{label}</p>
    </div>
  );
}
