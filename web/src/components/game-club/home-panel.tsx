"use client";

import { motion } from "framer-motion";
import {
  ChevronRight,
  Gamepad2,
  ShieldCheck,
  Wifi,
} from "lucide-react";

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
import { cn, touchPress } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

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
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="home-hero__bg"
          style={{ backgroundImage: `url(${HOME_IMAGES.heroGamer})` }}
          aria-hidden
        />
        <div className="home-hero__glow home-hero__glow--red" aria-hidden />
        <div className="home-hero__glow home-hero__glow--white" aria-hidden />
        <div className="home-hero__scrim" aria-hidden />

        <div className="home-hero__inner">
          <header className="home-hero__top">
            <div className="flex items-center gap-2">
              <span className="home-top__dot" aria-hidden />
              <span className="home-top__brand">Arsenal Union</span>
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

      <motion.section
        className="home-glass-card home-welcome"
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="show"
      >
        <div
          className="home-welcome__bg"
          style={{ backgroundImage: `url(${HOME_IMAGES.welcomePortal})` }}
          aria-hidden
        />
        <div className="home-welcome__scrim" aria-hidden />
        <div className="home-welcome__glow" aria-hidden />
        <div className="home-welcome__portal" aria-hidden />
        <div className="home-welcome__portal home-welcome__portal--inner" aria-hidden />
        <div className="home-welcome__content">
          <p className="home-welcome__eyebrow">O&apos;yinlar olamiga xush kelibsiz</p>
          <h2 className="home-welcome__title">Game Club</h2>
          <p className="home-welcome__desc">
            PS va PC qurilmalarini bron qiling, kalyan buyurtma bering va onlayn to&apos;lang.
          </p>
          <button type="button" className={cn("home-cta", touchPress)} onClick={onOpenDevices}>
            <Gamepad2 className="size-4" strokeWidth={2.25} />
            Qurilmalarni ko&apos;rish
          </button>
        </div>
      </motion.section>

      <motion.section custom={2} variants={fadeUp} initial="hidden" animate="show">
        <h2 className="home-section-title">Nima mavjud?</h2>
        <div className="home-categories">
          <CategoryCard
            image={HOME_IMAGES.catDevices}
            accent="red"
            label="Qurilmalar"
            count={`${psCount || 5} ta`}
            desc="PS5, Aksessuarlar va boshqalar"
            onClick={onOpenDevices}
          />
          <CategoryCard
            image={HOME_IMAGES.catPc}
            accent="red"
            label="PC Qurilmalar"
            count={`${pcCount || 15} ta`}
            desc="Gaming PC, RTX, Monitor va Aksessuarlar"
            onClick={onOpenDevices}
          />
          <CategoryCard
            image={HOME_IMAGES.catHookah}
            accent="red-dark"
            label="Kalyan Ta'mlari"
            count={`${hookahCount ? `${hookahCount}+` : "25+"} ta`}
            desc="Love66, Ice Mint, Blueberry va boshqalar"
            onClick={onOpenHookah}
          />
        </div>
      </motion.section>

      <motion.section
        className="home-glass-card home-trust"
        custom={3}
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
  accent: "red" | "red-dark";
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
