"use client";

import { useMemo, type CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Armchair,
  ArrowLeft,
  Check,
  ChevronRight,
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
  groupFlavorsByBrand,
  HOOKAH_HERO,
  HOOKAH_FLAVOR_PERCENT_STEP,
  HOOKAH_MIN_FLAVOR_PERCENT,
  TABLE_STATUS_LABEL,
  type ClubTable,
  type HookahBrand,
  type HookahFlavor,
  type HookahFlavorMix,
  type TableStatus,
} from "@/lib/game-club-data";
import { formatCurrency } from "@/lib/format";
import {
  zoneDockMotion,
  zoneHeroMotion,
  zoneItemMotion,
  zoneFlavorItemMotion,
  zonePageMotion,
  zoneSectionMotion,
  zoneTap,
} from "@/lib/zone-motion";
import { cn } from "@/lib/utils";

type HookahZonePanelProps = {
  flavors: HookahFlavor[];
  brands: HookahBrand[];
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

function normalizeHookahTime(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return trimmed;
  }
  const hours = Math.min(23, Math.max(0, Number(match[1])));
  const minutes = Math.min(59, Math.max(0, Number(match[2])));
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function FlavorBrandSection({
  title,
  flavors,
  selectedFlavorIds,
  reduced,
  onToggleFlavor,
}: {
  title: string;
  flavors: HookahFlavor[];
  selectedFlavorIds: string[];
  reduced: boolean;
  onToggleFlavor: (id: string) => void;
}) {
  return (
    <div className="hookah-zone__flavor-row">
      <h3 className="hookah-zone__flavor-row-title">{title}</h3>
      {flavors.length ? (
        <div className="hookah-zone__flavors-track hookah-zone__flavors-track--grid-2">
          {flavors.map((flavor, index) => (
            <FlavorCard
              key={flavor.id}
              flavor={flavor}
              index={index}
              rowIndex={0}
              active={selectedFlavorIds.includes(flavor.id)}
              reduced={reduced}
              onToggleFlavor={onToggleFlavor}
            />
          ))}
        </div>
      ) : (
        <p className="hookah-zone__flavor-row-empty">Hozircha ta&apos;m yo&apos;q</p>
      )}
    </div>
  );
}

function FlavorCard({
  flavor,
  index,
  rowIndex,
  active,
  reduced,
  onToggleFlavor,
}: {
  flavor: HookahFlavor;
  index: number;
  rowIndex: number;
  active: boolean;
  reduced: boolean;
  onToggleFlavor: (id: string) => void;
}) {
  const image = getHookahFlavorImage(flavor, index);

  return (
    <motion.button
      type="button"
      onClick={() => onToggleFlavor(flavor.id)}
      aria-pressed={active}
      className={cn("hookah-zone__flavor-card", active && "hookah-zone__flavor-card--active")}
      {...zoneFlavorItemMotion(index, rowIndex, reduced)}
      whileTap={reduced ? undefined : zoneTap}
    >
      <div className="hookah-zone__flavor-media">
        <img src={image} alt="" className="hookah-zone__flavor-art" loading="lazy" draggable={false} />
      </div>
      <div className="hookah-zone__flavor-body">
        <div className="hookah-zone__flavor-copy">
          <p className="hookah-zone__flavor-name">{flavor.title}</p>
        </div>
        <p className="hookah-zone__flavor-price">{formatCurrency(flavor.price)}</p>
      </div>
      <span className={cn("hookah-zone__flavor-check", active && "hookah-zone__flavor-check--active")} aria-hidden>
        {active ? <Check className="size-3.5" strokeWidth={3} /> : null}
      </span>
    </motion.button>
  );
}

export function HookahZonePanel({
  flavors,
  brands,
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
  const reduced = useReducedMotion() ?? false;
  const brandSections = useMemo(() => groupFlavorsByBrand(brands, flavors), [brands, flavors]);

  const unitPrice = getHookahUnitPrice(flavors, selectedFlavorIds);
  const totalPrice = getHookahOrderTotal(flavors, selectedFlavorIds, hookahQuantity);
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
    <motion.div className="hookah-zone" {...zonePageMotion(reduced)}>
      <div className="hookah-zone__scroll">
        <motion.div className="hookah-zone__header-stack" {...zoneSectionMotion(0, reduced)}>
          <motion.section className="hookah-zone__hero" {...zoneHeroMotion(reduced)}>
            <img src={HOOKAH_HERO} alt="" className="hookah-zone__hero-bg" loading="eager" draggable={false} />
            <div className="hookah-zone__hero-overlay" aria-hidden />
            <div className="hookah-zone__hero-content">
              <div className="hookah-zone__hero-top">
                {onBack ? (
                  <button type="button" className="hookah-zone__icon-btn" onClick={onBack} aria-label="Orqaga">
                    <ArrowLeft className="size-5" strokeWidth={2} />
                  </button>
                ) : (
                  <span />
                )}
                <span className="hookah-zone__icon-btn hookah-zone__icon-btn--static" aria-hidden>
                  <HookahIcon className="size-5" strokeWidth={1.75} />
                </span>
              </div>

              <div className="hookah-zone__hero-bottom">
                <div className="hookah-zone__hero-copy">
                  <h1 className="hookah-zone__title">Kalyanlar</h1>
                  <p className="hookah-zone__subtitle">
                    Ta&apos;mlarni tanlang, kalyan sonini kiriting
                    <br />
                    va buyurtmani savatga qo&apos;shing.
                  </p>
                </div>
                <span className="hookah-zone__zone-pill">
                  <HookahIcon className="size-3.5" strokeWidth={2} />
                  Kafe zonasi
                </span>
              </div>
            </div>
          </motion.section>

          <div className="hookah-zone__time-panel">
            <p className="hookah-zone__time-label">Bron boshlanish vaqti</p>
            <label className="hookah-zone__time-field">
              <Clock className="hookah-zone__time-icon" strokeWidth={2} />
              <span className="hookah-zone__time-prefix">Bugun,</span>
              <input
                type="text"
                inputMode="numeric"
                value={startHour}
                onChange={(event) => setStartHour(event.target.value)}
                onBlur={(event) => setStartHour(normalizeHookahTime(event.target.value))}
                placeholder="20:00"
                maxLength={5}
                className="hookah-zone__time-input"
                aria-label="Bron boshlanish vaqti"
              />
            </label>
          </div>
        </motion.div>

        <motion.section className="hookah-zone__section" {...zoneSectionMotion(0.08, reduced)}>
          <h2 className="hookah-zone__section-title">Stol tanlang</h2>
          <p className="hookah-zone__section-hint">Katta guruhlar uchun bir nechta stol tanlashingiz mumkin</p>
          <div className="hookah-zone__legend">
            <LegendDot color="free" label="BO'SH" />
            <LegendDot color="busy" label="BAND" />
            <LegendDot color="booked" label="BRON" />
          </div>
          <div className="hookah-zone__tables-track">
            {tables.map((table, index) => {
              const active = selectedTableIds.includes(table.id);
              const selectable = table.status === "available";
              const meta = getHookahTableMeta(table, index);
              const image = getHookahTableImage(table, index);

              return (
                <motion.button
                  key={table.id}
                  type="button"
                  disabled={!selectable}
                  onClick={() => {
                    if (selectable) {
                      onToggleTable(table.id);
                    }
                  }}
                  aria-pressed={active}
                  aria-disabled={!selectable}
                  className={cn(
                    "hookah-zone__table-card",
                    active && "hookah-zone__table-card--active",
                    !selectable && "hookah-zone__table-card--disabled",
                  )}
                  {...zoneItemMotion(index, 0.08, reduced)}
                  whileTap={reduced || !selectable ? undefined : zoneTap}
                >
                  <div className="hookah-zone__table-media">
                    <img
                      src={image}
                      alt=""
                      className="hookah-zone__table-thumb"
                      loading="lazy"
                      draggable={false}
                    />
                    {active ? (
                      <span className="hookah-zone__table-selected" aria-hidden>
                        <Check className="size-3.5" strokeWidth={3} />
                      </span>
                    ) : null}
                  </div>
                  <TableStatusPill status={table.status} />
                  <p className="hookah-zone__table-name">{table.title}</p>
                  <div className="hookah-zone__table-meta">
                    <span className="hookah-zone__meta-item">
                      <Users className="size-3.5" strokeWidth={2} />
                      {meta.seats} o&apos;rin
                    </span>
                    <span className="hookah-zone__meta-item">
                      <Armchair className="size-3.5" strokeWidth={2} />
                      {meta.zone}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        <motion.section className="hookah-zone__section" {...zoneSectionMotion(0.16, reduced)}>
          <h2 className="hookah-zone__section-title">Tabak ta&apos;mlari</h2>
          <p className="hookah-zone__section-hint">Bir nechta ta&apos;mni tanlab aralashtirishingiz mumkin</p>
          <div className="hookah-zone__flavor-rows">
            {brandSections.map((section) => (
              <FlavorBrandSection
                key={section.brand.id}
                title={section.brand.title}
                flavors={section.flavors}
                selectedFlavorIds={selectedFlavorIds}
                reduced={reduced}
                onToggleFlavor={onToggleFlavor}
              />
            ))}
          </div>
        </motion.section>

        {selectedFlavorIds.length > 1 ? (
          <motion.section className="hookah-zone__mix-section" {...zoneSectionMotion(0.24, reduced)}>
            <p className="hookah-zone__mix-title">Ta&apos;m foizi</p>
            <p className="hookah-zone__mix-hint">
              Har bir kalyan uchun ta&apos;mlar foizi alohida. Jami 100% bo&apos;lishi va har biri{" "}
              {HOOKAH_MIN_FLAVOR_PERCENT}% dan ({HOOKAH_FLAVOR_PERCENT_STEP}% qadamda).
            </p>
            {hookahMixes.map((mix, hookahIndex) => {
              const mixTotal = getHookahMixTotal(mix, selectedFlavorIds);
              const mixOk =
                mixTotal === 100 &&
                selectedFlavorIds.every((id) => (mix[id] ?? 0) >= HOOKAH_MIN_FLAVOR_PERCENT);

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
                        ? ((percent - HOOKAH_MIN_FLAVOR_PERCENT) / (sliderMax - HOOKAH_MIN_FLAVOR_PERCENT)) * 100
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
                          style={{ "--mix-fill": `${fillPercent}%` } as CSSProperties}
                          aria-label={`${flavor.title} foizi`}
                          aria-valuemin={HOOKAH_MIN_FLAVOR_PERCENT}
                          aria-valuemax={sliderMax}
                          aria-valuenow={percent}
                        />
                      </label>
                    );
                  })}
                  <p className={cn("hookah-zone__mix-sum", !mixOk && "hookah-zone__mix-sum--invalid")}>
                    Jami: {mixTotal}%
                    {!mixOk ? " — 100% bo'lishi kerak" : null}
                  </p>
                </div>
              );
            })}
          </motion.section>
        ) : null}
      </div>

      <motion.div className="hookah-zone__dock" aria-label="Buyurtma xulosasi" {...zoneDockMotion(reduced)}>
        <div className="hookah-zone__dock-total">
          <span className="hookah-zone__dock-label">Jami</span>
          <strong className="hookah-zone__dock-price">{formatCurrency(totalPrice)}</strong>
          {unitPrice > 0 && hookahQuantity > 1 ? (
            <span className="hookah-zone__dock-meta">
              {hookahQuantity} × {formatCurrency(unitPrice)}
            </span>
          ) : null}
        </div>

        <div className="hookah-zone__dock-qty">
          <HookahIcon className="hookah-zone__dock-qty-icon" strokeWidth={1.75} />
          <div className="hookah-zone__dock-stepper">
            <button
              type="button"
              className="hookah-zone__dock-stepper-btn"
              onClick={() => setHookahQuantity(Math.max(1, hookahQuantity - 1))}
              disabled={hookahQuantity <= 1}
              aria-label="Kalyan sonini kamaytirish"
            >
              <Minus className="size-3" strokeWidth={2.5} />
            </button>
            <span className="hookah-zone__dock-stepper-value">{hookahQuantity} kalyan</span>
            <button
              type="button"
              className="hookah-zone__dock-stepper-btn"
              onClick={() => setHookahQuantity(Math.min(99, hookahQuantity + 1))}
              disabled={hookahQuantity >= 99}
              aria-label="Kalyan sonini oshirish"
            >
              <Plus className="size-3" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <button
          type="button"
          className="hookah-zone__dock-submit"
          onClick={onAddHookah}
          disabled={loading || !canOrder}
        >
          <span>{loading ? "Qo'shilmoqda..." : "Buyurtma berish"}</span>
          <ChevronRight className="size-5" strokeWidth={2.5} />
        </button>
      </motion.div>
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
