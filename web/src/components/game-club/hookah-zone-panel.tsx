"use client";

import { motion } from "framer-motion";
import {
  Armchair,
  ArrowLeft,
  Check,
  ChevronRight,
  Circle,
  Clock,
  Minus,
  Plus,
  Users,
} from "lucide-react";

import { HookahIcon } from "@/components/icons/hookah-icon";
import {
  areHookahMixesValid,
  getHookahFlavorImage,
  getHookahMixSliderMax,
  getHookahMixTotal,
  getHookahOrderTotal,
  getHookahTableImage,
  getHookahTableMeta,
  getHookahUnitPrice,
  HOOKAH_HERO,
  HOOKAH_FLAVOR_PERCENT_STEP,
  HOOKAH_MIN_FLAVOR_PERCENT,
  TABLE_STATUS_LABEL,
  type ClubTable,
  type HookahFlavor,
  type HookahFlavorMix,
  type TableStatus,
} from "@/lib/game-club-data";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type HookahZonePanelProps = {
  flavors: HookahFlavor[];
  tables: ClubTable[];
  loading: boolean;
  selectedFlavorIds: string[];
  selectedTableIds: string[];
  startHour: string;
  onBack?: () => void;
  onToggleFlavor: (id: string) => void;
  onToggleTable: (id: string) => void;
  setStartHour: (value: string) => void;
  hookahQuantity: number;
  setHookahQuantity: (value: number) => void;
  hookahMixes: HookahFlavorMix[];
  onMixPercentChange: (hookahIndex: number, flavorId: string, value: number) => void;
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
  selectedFlavorIds,
  selectedTableIds,
  startHour,
  onBack,
  onToggleFlavor,
  onToggleTable,
  setStartHour,
  hookahQuantity,
  setHookahQuantity,
  hookahMixes,
  onMixPercentChange,
}: HookahZonePanelProps) {
  const unitPrice = getHookahUnitPrice(flavors, selectedFlavorIds);
  const totalPrice = getHookahOrderTotal(flavors, selectedFlavorIds, hookahQuantity);
  const selectedFlavorNames = flavors
    .filter((flavor) => selectedFlavorIds.includes(flavor.id))
    .map((flavor) => flavor.title);
  const mixesValid = areHookahMixesValid(hookahMixes, selectedFlavorIds);
  const canOrder = Boolean(
    selectedFlavorIds.length &&
      selectedTableIds.length &&
      startHour.trim() &&
      hookahQuantity >= 1 &&
      mixesValid,
  );

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
                  Ta&apos;mlarni tanlang, kalyan sonini kiriting
                  <br />
                  va buyurtmani savatga qo&apos;shing.
                </p>
              </div>
              <motion.div
                className="hookah-zone__title-icon"
                animate={{
                  boxShadow: [
                    "0 0 16px rgba(200, 16, 46, 0.2)",
                    "0 0 32px rgba(200, 16, 46, 0.4)",
                    "0 0 16px rgba(200, 16, 46, 0.2)",
                  ],
                }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <HookahIcon className="size-8 text-white" strokeWidth={1.5} />
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
          <p className="hookah-zone__section-hint">Katta guruhlar uchun bir nechta stol tanlashingiz mumkin</p>
          <div className="hookah-zone__legend">
            <LegendDot color="free" label="BO'SH" />
            <LegendDot color="busy" label="BAND" />
            <LegendDot color="booked" label="BRON" />
          </div>
          <div className="hookah-zone__tables">
            {tables.map((table, index) => {
              const active = selectedTableIds.includes(table.id);
              const meta = getHookahTableMeta(index);
              const image = getHookahTableImage(index);

              return (
                <motion.button
                  key={table.id}
                  type="button"
                  onClick={() => onToggleTable(table.id)}
                  aria-pressed={active}
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
                      <span className="hookah-zone__check hookah-zone__check--red">
                        <Check className="size-4" strokeWidth={3} />
                      </span>
                    ) : (
                      <Circle className="size-6 text-[var(--au-muted)]/35" strokeWidth={1.5} />
                    )}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        <motion.section className="hookah-zone__section" {...sectionMotion(0.18)}>
          <h2 className="hookah-zone__section-title">Ta&apos;mlarni tanlang</h2>
          <p className="hookah-zone__section-hint">Bir nechta ta&apos;mni tanlab aralashtirishingiz mumkin</p>
          <div className="hookah-zone__flavors">
            {flavors.map((flavor, index) => {
              const active = selectedFlavorIds.includes(flavor.id);
              const image = getHookahFlavorImage(flavor, index);

              return (
                <motion.button
                  key={flavor.id}
                  type="button"
                  onClick={() => onToggleFlavor(flavor.id)}
                  aria-pressed={active}
                  className={cn("hookah-zone__flavor", active && "hookah-zone__flavor--active")}
                  whileTap={{ scale: 0.97 }}
                  animate={active ? { scale: 1.02 } : { scale: 1 }}
                  transition={springSelect}
                  layout
                >
                  <span className="hookah-zone__flavor-check" aria-hidden>
                    {active ? (
                      <span className="hookah-zone__check hookah-zone__check--red-dark">
                        <Check className="size-3.5" strokeWidth={3} />
                      </span>
                    ) : (
                      <Circle className="size-5 text-[var(--au-muted)]/40" strokeWidth={1.5} />
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

        <motion.section className="hookah-zone__order" {...sectionMotion(0.24)}>
          <div className="hookah-zone__order-glow" aria-hidden />

          <div className="hookah-zone__order-header">
            <div>
              <h2 className="hookah-zone__order-title">Buyurtma</h2>
              <p className="hookah-zone__order-sub">
                {unitPrice > 0
                  ? `${formatCurrency(unitPrice)} / kalyan`
                  : "Avval kamida bitta ta'm tanlang"}
              </p>
            </div>
            {unitPrice > 0 ? (
              <span className="hookah-zone__order-badge">{hookahQuantity} ta</span>
            ) : null}
          </div>

          <div className="hookah-zone__order-flavors" aria-label="Tanlangan ta'mlar">
            {selectedFlavorNames.length ? (
              selectedFlavorNames.map((name) => (
                <span key={name} className="hookah-zone__flavor-chip">
                  {name}
                </span>
              ))
            ) : (
              <span className="hookah-zone__flavor-chip hookah-zone__flavor-chip--empty">Ta'm tanlanmagan</span>
            )}
          </div>

          <div className="hookah-zone__order-qty-row">
            <span className="hookah-zone__order-qty-label">Kalyan soni</span>
            <div className="hookah-zone__order-stepper">
              <button
                type="button"
                className="hookah-zone__order-stepper-btn"
                onClick={() => setHookahQuantity(Math.max(1, hookahQuantity - 1))}
                disabled={hookahQuantity <= 1}
                aria-label="Kalyan sonini kamaytirish"
              >
                <Minus className="size-4" strokeWidth={2.5} />
              </button>
              <span className="hookah-zone__order-stepper-value" aria-live="polite">
                {hookahQuantity}
              </span>
              <button
                type="button"
                className="hookah-zone__order-stepper-btn"
                onClick={() => setHookahQuantity(Math.min(99, hookahQuantity + 1))}
                disabled={hookahQuantity >= 99}
                aria-label="Kalyan sonini oshirish"
              >
                <Plus className="size-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {selectedFlavorIds.length > 1 ? (
            <div className="hookah-zone__mix-section">
              <p className="hookah-zone__mix-title">Ta&apos;m foizi</p>
              <p className="hookah-zone__mix-hint">
                Har bir kalyan uchun ta&apos;mlar foizi alohida. Jami 100% bo&apos;lishi va har biri{" "}
                {HOOKAH_MIN_FLAVOR_PERCENT}% dan ({HOOKAH_FLAVOR_PERCENT_STEP}% qadamda).
              </p>
              {hookahMixes.map((mix, hookahIndex) => {
                const mixTotal = getHookahMixTotal(mix, selectedFlavorIds);
                const mixOk = mixTotal === 100 && selectedFlavorIds.every((id) => (mix[id] ?? 0) >= HOOKAH_MIN_FLAVOR_PERCENT);

                return (
                  <div key={hookahIndex} className="hookah-zone__mix-card">
                    {hookahQuantity > 1 ? (
                      <p className="hookah-zone__mix-card-title">Kalyan {hookahIndex + 1}</p>
                    ) : null}
                    {selectedFlavorIds.map((flavorId) => {
                      const flavor = flavors.find((item) => item.id === flavorId);
                      if (!flavor) {
                        return null;
                      }

                      const percent = mix[flavorId] ?? HOOKAH_MIN_FLAVOR_PERCENT;
                      const sliderMax = getHookahMixSliderMax(selectedFlavorIds.length);
                      const fillPercent =
                        sliderMax > HOOKAH_MIN_FLAVOR_PERCENT
                          ? ((percent - HOOKAH_MIN_FLAVOR_PERCENT) / (sliderMax - HOOKAH_MIN_FLAVOR_PERCENT)) *
                            100
                          : 100;

                      return (
                        <label key={flavorId} className="hookah-zone__mix-row">
                          <div className="hookah-zone__mix-row-head">
                            <span className="hookah-zone__mix-flavor">{flavor.title}</span>
                            <span className="hookah-zone__mix-value">{percent}%</span>
                          </div>
                          <input
                            type="range"
                            min={HOOKAH_MIN_FLAVOR_PERCENT}
                            max={sliderMax}
                            step={HOOKAH_FLAVOR_PERCENT_STEP}
                            value={percent}
                            onChange={(event) =>
                              onMixPercentChange(hookahIndex, flavorId, Number(event.target.value))
                            }
                            className="hookah-zone__mix-range"
                            style={{ "--mix-fill": `${fillPercent}%` }}
                            aria-label={`${flavor.title} foizi`}
                            aria-valuemin={HOOKAH_MIN_FLAVOR_PERCENT}
                            aria-valuemax={sliderMax}
                            aria-valuenow={percent}
                          />
                        </label>
                      );
                    })}
                    <p
                      className={cn(
                        "hookah-zone__mix-sum",
                        !mixOk && "hookah-zone__mix-sum--invalid",
                      )}
                    >
                      Jami: {mixTotal}%
                      {!mixOk ? " — 100% bo'lishi kerak" : null}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : null}

          <div className="hookah-zone__order-divider" aria-hidden />

          <div className="hookah-zone__order-total-row">
            <div>
              <p className="hookah-zone__order-total-label">Jami</p>
              {unitPrice > 0 && hookahQuantity > 1 ? (
                <p className="hookah-zone__order-total-meta">
                  {hookahQuantity} × {formatCurrency(unitPrice)}
                </p>
              ) : null}
            </div>
            <p className="hookah-zone__order-total-price">{formatCurrency(totalPrice)}</p>
          </div>

          <button
            type="button"
            className="hookah-zone__submit"
            onClick={onAddHookah}
            disabled={loading || !canOrder}
          >
            {loading ? "Qo'shilmoqda..." : "Buyurtma berish"}
            <ChevronRight className="size-5" />
          </button>
        </motion.section>
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
