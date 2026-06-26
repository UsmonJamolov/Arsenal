"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, CalendarCheck, CheckCircle2, CreditCard, PartyPopper, X, XCircle } from "lucide-react";

import {
  buildBookingNotifications,
  type Booking,
  type BookingNotificationKind,
  type OrderRecord,
} from "@/lib/game-club-data";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type HomeNotificationsProps = {
  bookings: Booking[];
  paidOrders: OrderRecord[];
};

const DISMISSED_STORAGE_KEY = "au-booking-notifications-dismissed";

const kindIcon: Record<BookingNotificationKind, typeof CalendarCheck> = {
  booked: CalendarCheck,
  accepted: CheckCircle2,
  ready: PartyPopper,
  paid: CreditCard,
  cancelled: XCircle,
};

function loadDismissedIds(): Set<string> {
  if (typeof window === "undefined") {
    return new Set();
  }

  try {
    const raw = window.localStorage.getItem(DISMISSED_STORAGE_KEY);
    if (!raw) {
      return new Set();
    }

    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveDismissedIds(ids: Set<string>) {
  window.localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify([...ids]));
}

export function HomeNotifications({ bookings, paidOrders }: HomeNotificationsProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const notifications = useMemo(
    () => buildBookingNotifications(bookings, paidOrders),
    [bookings, paidOrders],
  );

  const visibleNotifications = useMemo(
    () => notifications.filter((item) => !dismissedIds.has(item.id)),
    [notifications, dismissedIds],
  );

  useEffect(() => {
    setMounted(true);
    setDismissedIds(loadDismissedIds());
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const dismissNotification = (id: string) => {
    setDismissedIds((current) => {
      const next = new Set(current);
      next.add(id);
      saveDismissedIds(next);
      return next;
    });
  };

  const panel =
    open && mounted
      ? createPortal(
          <>
            <button
              type="button"
              className="home-notifications__backdrop"
              aria-label="Bildirishnomalarni yopish"
              onClick={() => setOpen(false)}
            />
            <div
              ref={panelRef}
              className="home-notifications__panel"
              role="dialog"
              aria-label="Bron bildirishnomalari"
              aria-modal="true"
            >
              <div className="home-notifications__panel-head">
                <div className="home-notifications__panel-copy">
                  <p className="home-notifications__panel-title">Bildirishnomalar</p>
                  <p className="home-notifications__panel-sub">Bron va to&apos;lov holatlari</p>
                </div>
                <button
                  type="button"
                  className="home-notifications__panel-close"
                  aria-label="Yopish"
                  onClick={() => setOpen(false)}
                >
                  <X className="size-4" strokeWidth={2.25} />
                </button>
              </div>

              {visibleNotifications.length ? (
                <ul className="home-notifications__list">
                  {visibleNotifications.map((item) => {
                    const Icon = kindIcon[item.kind];

                    return (
                      <li
                        key={item.id}
                        className={cn("home-notifications__item", `home-notifications__item--${item.kind}`)}
                      >
                        <span className="home-notifications__icon" aria-hidden>
                          <Icon className="size-4" strokeWidth={2} />
                        </span>
                        <span className="home-notifications__body">
                          <span className="home-notifications__title">{item.title}</span>
                          <span className="home-notifications__subtitle">{item.subtitle}</span>
                          <span className="home-notifications__time">{formatDateTime(new Date(item.sortAt))}</span>
                        </span>
                        <button
                          type="button"
                          className="home-notifications__dismiss"
                          aria-label="Xabarni o'chirish"
                          onClick={() => dismissNotification(item.id)}
                        >
                          <X className="size-3.5" strokeWidth={2.25} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="home-notifications__empty">Hozircha bildirishnomalar yo&apos;q.</p>
              )}
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className="home-notifications">
      <button
        type="button"
        className={cn("home-glass-btn home-notifications__btn", open && "home-notifications__btn--open")}
        aria-label="Bildirishnomalar"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="size-[18px]" />
        {visibleNotifications.length > 0 ? (
          <span className="home-notifications__badge" aria-hidden>
            {visibleNotifications.length > 9 ? "9+" : visibleNotifications.length}
          </span>
        ) : null}
      </button>

      {panel}
    </div>
  );
}
