"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight, Gamepad2, Monitor } from "lucide-react";

import { DEVICE_ZONE_IMAGES, type DeviceZone } from "@/lib/game-club-data";
import { cn } from "@/lib/utils";

type DevicesZonePanelProps = {
  loading: boolean;
  psCount: number;
  pcCount: number;
  onSelect: (zone: DeviceZone) => void;
  onBack?: () => void;
};

const pageMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.4, ease: "easeOut" as const },
};

const sectionMotion = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: "easeOut" as const },
});

export function DevicesZonePanel({
  loading,
  psCount,
  pcCount,
  onSelect,
  onBack,
}: DevicesZonePanelProps) {
  return (
    <motion.div className="devices-zone" {...pageMotion}>
      <div className="devices-zone__glow devices-zone__glow--cyan" aria-hidden />
      <div className="devices-zone__glow devices-zone__glow--purple" aria-hidden />

      <motion.header className="devices-zone__header" {...sectionMotion(0)}>
        {onBack ? (
          <button type="button" className="devices-zone__back" onClick={onBack} aria-label="Orqaga">
            <ArrowLeft className="size-5" strokeWidth={2} />
          </button>
        ) : null}

        <div className="devices-zone__header-top">
          <h1 className="devices-zone__title">Qurilmalar zonasi</h1>
          <motion.div
            className="devices-zone__header-icon"
            animate={{
              boxShadow: [
                "0 0 20px rgba(200, 77, 255, 0.35), 0 0 40px rgba(200, 77, 255, 0.15)",
                "0 0 32px rgba(200, 77, 255, 0.6), 0 0 64px rgba(200, 77, 255, 0.25)",
                "0 0 20px rgba(200, 77, 255, 0.35), 0 0 40px rgba(200, 77, 255, 0.15)",
              ],
            }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <Gamepad2 className="text-[#C84DFF]" strokeWidth={1.5} />
          </motion.div>
        </div>

        <p className="devices-zone__subtitle">
          PS yoki PC zonasini tanlang — holat alohida sahifada ko&apos;rinadi.
        </p>
      </motion.header>

      {loading ? (
        <p className="devices-zone__loading">Qurilmalar yuklanmoqda...</p>
      ) : (
        <div className="devices-zone__cards">
          <ZoneCard
            image={DEVICE_ZONE_IMAGES.ps}
            imagePosition="ps"
            icon={Gamepad2}
            title="PlayStation"
            subtitle="PS qurilmalari holati"
            count={psCount}
            accent="cyan"
            delay={0.08}
            onSelect={() => onSelect("ps")}
          />
          <ZoneCard
            image={DEVICE_ZONE_IMAGES.pc}
            imagePosition="pc"
            icon={Monitor}
            title="Kompyuter"
            subtitle="PC qurilmalari holati"
            count={pcCount}
            accent="purple"
            delay={0.14}
            onSelect={() => onSelect("pc")}
          />
        </div>
      )}
    </motion.div>
  );
}

type ZoneCardProps = {
  image: string;
  imagePosition: "ps" | "pc";
  icon: typeof Gamepad2;
  title: string;
  subtitle: string;
  count: number;
  accent: "cyan" | "purple";
  delay: number;
  onSelect: () => void;
};

function ZoneCard({
  image,
  imagePosition,
  icon: Icon,
  title,
  subtitle,
  count,
  accent,
  delay,
  onSelect,
}: ZoneCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      className={cn("devices-zone__card", `devices-zone__card--${accent}`)}
      {...sectionMotion(delay)}
      whileTap={{ scale: 0.985 }}
    >
      <span className="devices-zone__card-inner">
        <div className="devices-zone__card-media">
          <img
            src={image}
            alt=""
            className={cn("devices-zone__card-image", `devices-zone__card-image--${imagePosition}`)}
            loading="lazy"
            draggable={false}
          />
        </div>

        <div className="devices-zone__card-content">
          <div className="devices-zone__card-body">
            <div className="devices-zone__card-info">
              <span className={cn("devices-zone__card-icon", `devices-zone__card-icon--${accent}`)}>
                <Icon strokeWidth={2} />
              </span>
              <p className="devices-zone__card-title">{title}</p>
              <p className="devices-zone__card-subtitle">{subtitle}</p>
            </div>

            <div className="devices-zone__card-actions">
              <span className={cn("devices-zone__card-badge", `devices-zone__card-badge--${accent}`)}>
                {count} TA QURILMA
              </span>
              <span className={cn("devices-zone__card-arrow", `devices-zone__card-arrow--${accent}`)} aria-hidden>
                <ChevronRight strokeWidth={2.5} />
              </span>
            </div>
          </div>
        </div>
      </span>
    </motion.button>
  );
}
