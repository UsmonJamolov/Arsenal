"use client";

import { motion } from "framer-motion";
import { ChevronRight, ShieldCheck, Wifi } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";

import { getInitials, type UserSession } from "@/lib/auth";
import { HomeNotifications } from "@/components/game-club/home-notifications";
import {
  HOME_IMAGES,
  isPcDevice,
  isPsDevice,
  type Booking,
  type Device,
  type OrderRecord,
} from "@/lib/game-club-data";
import { type LiveStatus } from "@/lib/socket";
import { fadeUp, zoneEase, zoneHeroDuration } from "@/lib/zone-motion";
import { cn, touchPress } from "@/lib/utils";

type HomePanelProps = {
  devices: Device[];
  bookings: Booking[];
  paidOrders: OrderRecord[];
  hookahCount: number;
  liveStatus: LiveStatus;
  session: UserSession | null;
  profileAvatarUrl?: string | null;
  onOpenDevices: () => void;
  onOpenHookah: () => void;
  onOpenProfile: () => void;
};

export function HomePanel({
  devices,
  bookings,
  paidOrders,
  hookahCount,
  liveStatus,
  session,
  profileAvatarUrl,
  onOpenDevices,
  onOpenHookah,
  onOpenProfile,
}: HomePanelProps) {
  const psCount = devices.filter(isPsDevice).length;
  const pcCount = devices.filter(isPcDevice).length;

  const liveLabel =
    liveStatus === "connected"
      ? "Live ulangan"
      : liveStatus === "connecting"
        ? "Live ulanmoqda..."
        : "Live o'chiq";

  return (
    <div className="home-page">
      <motion.section
        className="home-hero"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: zoneHeroDuration, ease: zoneEase }}
      >
        <div
          className="home-hero__bg"
          style={{ backgroundImage: `url(${HOME_IMAGES.heroGamer})` }}
          aria-hidden
        />
        <div className="home-hero__glow home-hero__glow--red" aria-hidden />
        <div className="home-hero__scrim" aria-hidden />
        <div className="home-hero__symbols" aria-hidden>
          <span className="home-hero__symbol">△</span>
          <span className="home-hero__symbol">○</span>
          <span className="home-hero__symbol">✕</span>
          <span className="home-hero__symbol">□</span>
        </div>

        <div className="home-hero__inner">
          <header className="home-hero__top">
            <div className="home-brand">
              <BrandLogo size="sm" className="home-brand__logo" />
              <span className="home-brand__text">
                Arsenal <span className="home-brand__accent">Union</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <HomeNotifications bookings={bookings} paidOrders={paidOrders} />
              <button
                type="button"
                className="home-glass-btn home-avatar-btn"
                onClick={onOpenProfile}
                aria-label="Profil"
              >
                {profileAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profileAvatarUrl} alt="" className="size-full rounded-full object-cover" />
                ) : (
                  <span>{session ? getInitials(session.name) : "?"}</span>
                )}
              </button>
            </div>
          </header>

          <motion.div
            className="home-hero__copy"
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="show"
          >
            <h1 className="home-hero__title">
              Game
              <br />
              <span className="home-hero__title-accent">Club</span>
            </h1>
            <p className="home-hero__subtitle">
              Bron qiling, to&apos;lang va qurilmangizni oching — hammasi bir joyda.
            </p>
            <span className={cn("home-live", liveStatus === "connected" && "home-live--on")}>
              <span className="home-live__dot" aria-hidden />
              <Wifi className="size-3" />
              {liveLabel}
            </span>
          </motion.div>
        </div>
      </motion.section>

      <motion.section custom={1} variants={fadeUp} initial="hidden" animate="show">
        <div className="home-section-head">
          <h2 className="home-section-title">Qurilmalar</h2>
          <button type="button" className="home-section-link" onClick={onOpenDevices}>
            Barchasini ko&apos;rish
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="home-categories">
          <CategoryCard
            image={HOME_IMAGES.catDevices}
            accent="red"
            label="PS Qurilmalar"
            count={`${psCount || 3} ta`}
            desc="PS5, Aksessuarlar va boshqalar"
            onClick={onOpenDevices}
          />
          <CategoryCard
            image={HOME_IMAGES.catPc}
            accent="red"
            label="PC Qurilmalar"
            count={`${pcCount || 2} ta`}
            desc="Gaming PC, RTX, Monitor va Aksessuarlar"
            onClick={onOpenDevices}
          />
          <CategoryCard
            image={HOME_IMAGES.catHookah}
            accent="purple"
            label="Kalyan Ta'mlari"
            count={`${hookahCount ? `${hookahCount}+` : "4+"} ta`}
            desc="Love66, Ice Mint, Blueberry va boshqalar"
            onClick={onOpenHookah}
          />
        </div>
      </motion.section>

      <motion.section
        className="home-glass-card home-trust"
        custom={2}
        variants={fadeUp}
        initial="hidden"
        animate="show"
      >
        <div className="home-trust__icon">
          <ShieldCheck className="size-5" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="home-trust__title">Xavfsiz va ishonchli</p>
          <p className="home-trust__desc">
            Barcha to&apos;lovlar himoyalangan. 24/7 qo&apos;llab-quvvatlash xizmati.
          </p>
        </div>
        <ChevronRight className="size-5 shrink-0 text-[var(--au-muted)]" strokeWidth={2} />
      </motion.section>
    </div>
  );
}

function CategoryCard({
  image,
  accent,
  label,
  count,
  desc,
  onClick,
}: {
  image: string;
  accent: "red" | "purple";
  label: string;
  count: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={cn("home-category", touchPress)}>
      <div className="home-category__art" style={{ backgroundImage: `url(${image})` }} aria-hidden />
      <div className="home-category__overlay" aria-hidden />
      <div
        className={cn("home-category__accent", `home-category__accent--${accent}`)}
        aria-hidden
      />
      <div className="home-category__body">
        <p className={cn("home-category__label", `home-category__label--${accent}`)}>{label}</p>
        <p className="home-category__count">{count}</p>
        <p className="home-category__desc">{desc}</p>
      </div>
      <span className="home-category__arrow" aria-hidden>
        <ChevronRight className="size-3.5" strokeWidth={2.5} />
      </span>
    </button>
  );
}
