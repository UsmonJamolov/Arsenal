"use client";

import { motion } from "framer-motion";
import {
  Armchair,
  ArrowLeft,
  Check,
  Circle,
  Clock,
  ShoppingCart,
  Users,
} from "lucide-react";

import { HookahIcon } from "@/components/icons/hookah-icon";
import {
  getHookahFlavorImage,
  getHookahTableImage,
  getHookahTableMeta,
  HOOKAH_HERO,
  TABLE_STATUS_LABEL,
  type ClubTable,
  type HookahFlavor,
  type TableStatus,
} from "@/lib/game-club-data";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type HookahZonePanelProps = {
  flavors: HookahFlavor[];
  tables: ClubTable[];
  loading: boolean;
  selectedFlavorId: string;
  selectedTableId: string;
  startHour: string;
  onBack?: () => void;
  setSelectedFlavorId: (id: string) => void;
  setSelectedTableId: (id: string) => void;
  setStartHour: (value: string) => void;
  onAddHookah: () => void;
};

const pageMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.4, ease: "easeOut" as const },
};

const sectionMotion = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: "easeOut" as const },
});

const springSelect = { type: "spring" as const, stiffness: 420, damping: 28 };

export function HookahZonePanel({
  flavors,
  tables,
  loading,
  onAddHookah,
  selectedFlavorId,
  selectedTableId,
  startHour,
  onBack,
  setSelectedFlavorId,
  setSelectedTableId,
  setStartHour,
}: HookahZonePanelProps) {
  const selectedFlavor = flavors.find((flavor) => flavor.id === selectedFlavorId) ?? flavors[0];
  const totalPrice = selectedFlavor?.price ?? 0;

  if (!flavors.length || !tables.length) {
    return (
      <div className="hookah-zone">
        <p className="hookah-zone__empty">Kalyan ta&apos;mlari yoki stollar hozircha mavjud emas.</p>
      </div>
    );
  }

  return (
    <motion.div className="hookah-zone" {...pageMotion}>
      <div className="hookah-zone__scroll">
        <motion.section className="hookah-zone__hero" {...sectionMotion(0)}>
          <img src={HOOKAH_HERO} alt="" className="hookah-zone__hero-bg" loading="eager" draggable={false} />
          <div className="hookah-zone__hero-overlay" aria-hidden />
          <div className="hookah-zone__hero-content">
            {onBack ? (
              <button type="button" className="hookah-zone__back" onClick={onBack} aria-label="Orqaga">
                <ArrowLeft className="size-5" strokeWidth={2} />
              </button>
            ) : null}
            <div className="hookah-zone__hero-row">
              <div className="hookah-zone__hero-copy">
                <h1 className="hookah-zone__title">Kalyanlar</h1>
                <p className="hookah-zone__subtitle">
                  Stol va ta&apos;mni tanlab,
                  <br />
                  buyurtmani savatga qo&apos;shing.
                </p>
              </div>
              <motion.div
                className="hookah-zone__title-icon"
                animate={{
                  boxShadow: [
                    "0 0 16px rgba(177, 77, 255, 0.25)",
                    "0 0 32px rgba(177, 77, 255, 0.55)",
                    "0 0 16px rgba(177, 77, 255, 0.25)",
                  ],
                }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <HookahIcon className="size-8 text-[#B14DFF]" strokeWidth={1.5} />
              </motion.div>
            </div>
          </div>
        </motion.section>

        <motion.div className="hookah-zone__time-block" {...sectionMotion(0.06)}>
          <span className="hookah-zone__label">Bron boshlanish vaqti</span>
          <label className="hookah-zone__time-card">
            <Clock className="hookah-zone__time-icon" strokeWidth={2} />
            <input
              type="text"
              value={startHour}
              onChange={(event) => setStartHour(event.target.value)}
              placeholder="13:00"
              inputMode="numeric"
              className="hookah-zone__time-input"
            />
          </label>
        </motion.div>

        <motion.section className="hookah-zone__section" {...sectionMotion(0.12)}>
          <h2 className="hookah-zone__section-title">Stol tanlang</h2>
          <div className="hookah-zone__legend">
            <LegendDot color="free" label="BO'SH" />
            <LegendDot color="busy" label="BAND" />
            <LegendDot color="booked" label="BRON" />
          </div>
          <div className="hookah-zone__tables">
            {tables.map((table, index) => {
              const active = selectedTableId === table.id;
              const meta = getHookahTableMeta(index);
              const image = getHookahTableImage(index);

              return (
                <motion.button
                  key={table.id}
                  type="button"
                  onClick={() => setSelectedTableId(table.id)}
                  className={cn(
                    "hookah-zone__table",
                    active && "hookah-zone__table--active",
                    table.status !== "available" && "hookah-zone__table--dim",
                  )}
                  whileTap={{ scale: 0.985 }}
                  animate={active ? { scale: 1.015 } : { scale: 1 }}
                  transition={springSelect}
                  layout
                >
                  <img
                    src={image}
                    alt=""
                    className="hookah-zone__table-thumb"
                    loading="lazy"
                    draggable={false}
                  />
                  <div className="hookah-zone__table-body">
                    <p className="hookah-zone__table-name">{table.title}</p>
                    <TableStatusPill status={table.status} className="mt-2" />
                    <div className="hookah-zone__table-meta">
                      <span className="hookah-zone__meta-item">
                        <Users className="size-4" strokeWidth={2} />
                        {meta.seats} o&apos;rin
                      </span>
                      <span className="hookah-zone__meta-item">
                        <Armchair className="size-4" strokeWidth={2} />
                        {meta.zone}
                      </span>
                    </div>
                  </div>
                  <span className="hookah-zone__table-check" aria-hidden>
                    {active ? (
                      <span className="hookah-zone__check hookah-zone__check--cyan">
                        <Check className="size-4" strokeWidth={3} />
                      </span>
                    ) : (
                      <Circle className="size-6 text-white/20" strokeWidth={1.5} />
                    )}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        <motion.section className="hookah-zone__section" {...sectionMotion(0.18)}>
          <h2 className="hookah-zone__section-title">Qo&apos;shimcha kalyanlar</h2>
          <div className="hookah-zone__flavors">
            {flavors.map((flavor, index) => {
              const active = selectedFlavorId === flavor.id;
              const image = getHookahFlavorImage(flavor, index);

              return (
                <motion.button
                  key={flavor.id}
                  type="button"
                  onClick={() => setSelectedFlavorId(flavor.id)}
                  className={cn("hookah-zone__flavor", active && "hookah-zone__flavor--active")}
                  whileTap={{ scale: 0.97 }}
                  animate={active ? { scale: 1.02 } : { scale: 1 }}
                  transition={springSelect}
                  layout
                >
                  <span className="hookah-zone__flavor-check" aria-hidden>
                    {active ? (
                      <span className="hookah-zone__check hookah-zone__check--purple">
                        <Check className="size-3.5" strokeWidth={3} />
                      </span>
                    ) : (
                      <Circle className="size-5 text-white/25" strokeWidth={1.5} />
                    )}
                  </span>
                  <img
                    src={image}
                    alt=""
                    className="hookah-zone__flavor-art"
                    loading="lazy"
                    draggable={false}
                  />
                  <div className="hookah-zone__flavor-body">
                    <p className="hookah-zone__flavor-name">{flavor.title}</p>
                    <p className="hookah-zone__flavor-price">{formatCurrency(flavor.price)}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.section>
      </div>

      <div className="hookah-zone__dock">
        <div className="hookah-zone__dock-panel">
          <div className="hookah-zone__summary">
            <div className="hookah-zone__summary-left">
              <span className="hookah-zone__cart-icon">
                <ShoppingCart className="size-5" strokeWidth={2} />
              </span>
              <span className="hookah-zone__summary-label">Jami summa</span>
            </div>
            <p className="hookah-zone__summary-price">{formatCurrency(totalPrice)}</p>
          </div>

          <motion.button
            type="button"
            className="hookah-zone__submit"
            onClick={onAddHookah}
            disabled={loading || !selectedFlavorId || !selectedTableId || !startHour.trim()}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            {loading ? "Qo'shilmoqda..." : "Buyurtma berish"}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function LegendDot({ color, label }: { color: "free" | "busy" | "booked"; label: string }) {
  return (
    <span className="hookah-zone__legend-item">
      <span className={cn("hookah-zone__legend-dot", `hookah-zone__legend-dot--${color}`)} />
      {label}
    </span>
  );
}

function TableStatusPill({ status, className }: { status: TableStatus; className?: string }) {
  return (
    <span
      className={cn(
        "hookah-zone__status",
        status === "available" && "hookah-zone__status--free",
        status === "busy" && "hookah-zone__status--busy",
        status === "booked" && "hookah-zone__status--booked",
        className,
      )}
    >
      {TABLE_STATUS_LABEL[status].toUpperCase()}
    </span>
  );
}
