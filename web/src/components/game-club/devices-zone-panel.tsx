"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ChevronRight, Gamepad2, Monitor } from "lucide-react";

import { DEVICE_ZONE_IMAGES, type DeviceZone } from "@/lib/game-club-data";
import {
  zoneItemMotion,
  zonePageMotion,
  zoneSectionMotion,
  zoneTap,
} from "@/lib/zone-motion";
import { cn } from "@/lib/utils";

type DevicesZonePanelProps = {
  loading: boolean;
  psCount: number;
  pcCount: number;
  onSelect: (zone: DeviceZone) => void;
  onBack?: () => void;
};

export function DevicesZonePanel({
  loading,
  psCount,
  pcCount,
  onSelect,
  onBack,
}: DevicesZonePanelProps) {
  const reduced = useReducedMotion() ?? false;

  return (
    <motion.div className="devices-zone" {...zonePageMotion(reduced)}>
      <div className="devices-zone__glow devices-zone__glow--red" aria-hidden />
      <div className="devices-zone__glow devices-zone__glow--white" aria-hidden />

      <motion.header className="devices-zone__header" {...zoneSectionMotion(0, reduced)}>
        <button
          type="button"
          className="devices-zone__back"
          onClick={onBack}
          aria-label="Orqaga"
        >
          <ArrowLeft className="size-5" strokeWidth={2} />
        </button>

        <div className="devices-zone__header-top">
          <h1 className="devices-zone__title">Qurilmalar zonasi</h1>
          <motion.div
            className="devices-zone__header-icon"
            animate={{
              boxShadow: [
                "0 0 20px rgba(200, 16, 46, 0.25), 0 0 40px rgba(200, 16, 46, 0.1)",
                "0 0 32px rgba(200, 16, 46, 0.45), 0 0 64px rgba(200, 16, 46, 0.18)",
                "0 0 20px rgba(200, 16, 46, 0.25), 0 0 40px rgba(200, 16, 46, 0.1)",
              ],
            }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <Gamepad2 className="text-[var(--au-red)]" strokeWidth={1.5} />
          </motion.div>
        </div>
      </motion.header>

      {loading ? (
        <div className="devices-zone__loading-wrap">
          <div className="app-loader__spinner" aria-hidden />
          <p className="devices-zone__loading">Qurilmalar yuklanmoqda...</p>
        </div>
      ) : (
        <div className="devices-zone__cards">
          <ZoneCard
            image={DEVICE_ZONE_IMAGES.ps}
            imagePosition="ps"
            icon={Gamepad2}
            title="PlayStation"
            subtitle="PS qurilmalari holati"
            count={psCount}
            accent="red"
            delay={0.08}
            reduced={reduced}
            onSelect={() => onSelect("ps")}
          />
          <ZoneCard
            image={DEVICE_ZONE_IMAGES.pc}
            imagePosition="pc"
            icon={Monitor}
            title="Kompyuter"
            subtitle="PC qurilmalari holati"
            count={pcCount}
            accent="red-dark"
            delay={0.14}
            reduced={reduced}
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
  accent: "red" | "red-dark";
  delay: number;
  reduced: boolean;
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
  reduced,
  onSelect,
}: ZoneCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      className={cn("devices-zone__card", `devices-zone__card--${accent}`)}
      {...zoneItemMotion(0, delay, reduced)}
      whileTap={reduced ? undefined : zoneTap}
    >
      <img
        src={image}
        alt=""
        className={cn("devices-zone__card-bg", `devices-zone__card-bg--${imagePosition}`)}
        loading="lazy"
        draggable={false}
      />
      <span className="devices-zone__card-shade" aria-hidden />

      <span className="devices-zone__card-content">
        <span className="devices-zone__card-info">
          <span className={cn("devices-zone__card-icon", `devices-zone__card-icon--${accent}`)}>
            <Icon strokeWidth={2} />
          </span>
          <span className="devices-zone__card-title">{title}</span>
          <span className="devices-zone__card-subtitle">{subtitle}</span>
        </span>

        <span className="devices-zone__card-actions">
          <span className={cn("devices-zone__card-badge", `devices-zone__card-badge--${accent}`)}>
            {count} TA QURILMA
          </span>
          <span className={cn("devices-zone__card-arrow", `devices-zone__card-arrow--${accent}`)} aria-hidden>
            <ChevronRight strokeWidth={2.5} />
          </span>
        </span>
      </span>
    </motion.button>
  );
}
