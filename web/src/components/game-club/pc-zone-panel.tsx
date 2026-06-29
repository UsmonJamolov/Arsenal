"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Check, ChevronRight, Circle, Clock, Monitor } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getPcDeviceImage,
  getPcDeviceImagePosition,
  PC_BOOKING_HERO,
  STATUS_LABEL,
  type Device,
  type DeviceStatus,
} from "@/lib/game-club-data";
import { formatCurrency } from "@/lib/format";
import {
  zoneItemMotion,
  zonePageMotion,
  zoneSectionMotion,
  zoneTap,
} from "@/lib/zone-motion";
import { cn } from "@/lib/utils";

const durationOptions = [1, 2, 3, 4];

type PcZonePanelProps = {
  devices: Device[];
  loading: boolean;
  selectedDeviceIds: string[];
  bookingPrice: number;
  durationHours: number;
  startHour: string;
  bookingLoading?: boolean;
  bookingError?: string | null;
  onBack: () => void;
  onToggleDevice: (id: string) => void;
  setDurationHours: (value: number) => void;
  setStartHour: (value: string) => void;
  onCreateBooking: () => void;
  onOpenExtras?: () => void;
};

export function PcZonePanel({
  devices,
  loading,
  selectedDeviceIds,
  bookingPrice,
  durationHours,
  startHour,
  bookingLoading = false,
  bookingError = null,
  onBack,
  onToggleDevice,
  setDurationHours,
  setStartHour,
  onCreateBooking,
  onOpenExtras,
}: PcZonePanelProps) {
  const reduced = useReducedMotion() ?? false;
  const selectedDevices = devices.filter((device) => selectedDeviceIds.includes(device.id));
  const canBook =
    selectedDevices.length > 0 && selectedDevices.every((device) => device.status === "available");

  if (loading) {
    return (
      <div className="pc-zone">
        <p className="text-sm text-[var(--au-muted)]">PC qurilmalar yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <motion.div className="pc-zone" {...zonePageMotion(reduced)}>
      <motion.header className="pc-zone__header" {...zoneSectionMotion(0, reduced)}>
        <Button type="button" variant="ghost" size="sm" className="zone-panel-back mb-3 w-fit px-0" onClick={onBack}>
          <ArrowLeft className="size-4" />
          Orqaga
        </Button>
        <h2 className="text-2xl font-bold tracking-tight text-[var(--au-text)]">PC lar holati</h2>
        <p className="mt-1 text-sm text-[var(--au-muted)]">
          Bir yoki bir nechta PC tanlang, bo&apos;sh bo&apos;lsa bron qilish mumkin.
        </p>
      </motion.header>

      <div className="pc-zone__stations">
        {!devices.length ? (
          <p className="text-sm text-[var(--au-muted)]">Bu zonada PC qurilmalar yo&apos;q.</p>
        ) : (
          devices.map((device, index) => {
            const active = selectedDeviceIds.includes(device.id);
            const image = getPcDeviceImage(index);

            return (
              <motion.button
                key={device.id}
                type="button"
                onClick={() => onToggleDevice(device.id)}
                aria-pressed={active}
                className={cn(
                  "pc-zone__station",
                  active && "pc-zone__station--active",
                  device.status !== "available" && "pc-zone__station--dim",
                )}
                {...zoneItemMotion(index, 0.08, reduced)}
                whileTap={reduced ? undefined : zoneTap}
                layout={!reduced}
              >
                <img
                  src={image}
                  alt=""
                  className="pc-zone__station-bg"
                  style={{ objectPosition: getPcDeviceImagePosition(index) }}
                  loading="lazy"
                  draggable={false}
                />
                <span className="pc-zone__station-shade" aria-hidden />

                <span className="pc-zone__station-check" aria-hidden>
                  {active ? (
                    <span className="pc-zone__station-mark pc-zone__station-mark--active">
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                  ) : (
                    <Circle className="size-5 text-white/45" strokeWidth={1.5} />
                  )}
                </span>

                <div className="pc-zone__station-content">
                  <p className="pc-zone__station-name">{device.name}</p>
                  <p className="pc-zone__station-meta tabular-data">
                    {device.type} • {formatCurrency(device.pricePerHour)}/soat
                  </p>
                  <PcStatusPill status={device.status} className="mt-3" />
                </div>
              </motion.button>
            );
          })
        )}
      </div>

      <motion.section
        className="pc-zone__booking"
        {...zoneSectionMotion(0.16, reduced)}
        layout={!reduced}
      >
        {!selectedDevices.length ? (
          <motion.div
            className="pc-zone__booking-empty"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <Monitor className="size-8 text-[var(--au-red-dark)]/60" />
            <p className="mt-3 text-lg font-semibold text-[var(--au-text)]">Qurilma bron qilish</p>
            <p className="mt-1 text-sm text-[var(--au-muted)]">Yuqoridan kamida bitta PC tanlang.</p>
          </motion.div>
        ) : (
          <motion.div
            className="pc-zone__booking-body"
            initial={reduced ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div>
              <h3 className="text-xl font-bold text-[var(--au-text)]">Qurilma bron qilish</h3>
              <p className="mt-1 text-sm text-[var(--au-muted)]">
                Tanlangan: {selectedDevices.map((device) => device.name).join(", ")}
              </p>
            </div>

            <label className="pc-zone__field">
              <span className="pc-zone__label">Boshlanish vaqti</span>
              <div className="relative">
                <Clock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--au-muted)]" />
                <Input
                  value={startHour}
                  onChange={(event) => setStartHour(event.target.value)}
                  placeholder="13:00"
                  className="pc-zone__input h-12 pl-11"
                />
              </div>
            </label>

            <div className="pc-zone__field">
              <span className="pc-zone__label">Davomiyligi (soat)</span>
              <div className="grid grid-cols-4 gap-2">
                {durationOptions.map((hour) => (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => setDurationHours(hour)}
                    className={cn(
                      "pc-zone__duration",
                      durationHours === hour && "pc-zone__duration--active",
                    )}
                  >
                    {hour}
                  </button>
                ))}
              </div>
            </div>

            <div className="pc-zone__total">
              <div>
                <p className="pc-zone__total-label">Jami</p>
                <p className="pc-zone__total-price">{formatCurrency(bookingPrice)}</p>
              </div>
              <div
                className="pc-zone__total-art"
                style={{ backgroundImage: `url(${PC_BOOKING_HERO})` }}
                aria-hidden
              />
            </div>

            <button
              type="button"
              className="pc-zone__submit"
              onClick={onCreateBooking}
              disabled={!canBook || bookingLoading}
            >
              {bookingLoading ? "Bron qilinmoqda..." : "Bron qilish"}
              <ChevronRight className="size-5" />
            </button>
            {onOpenExtras ? (
              <button type="button" className="zone-extras-link" onClick={onOpenExtras}>
                Qo&apos;shimchalar buyurtma qilish
              </button>
            ) : null}
            {bookingError ? <p className="mt-2 text-center text-sm font-medium text-[#e9335f]">{bookingError}</p> : null}
          </motion.div>
        )}
      </motion.section>
    </motion.div>
  );
}

function PcStatusPill({ status, className }: { status: DeviceStatus; className?: string }) {
  return (
    <span
      className={cn(
        "pc-zone__status",
        status === "available" && "pc-zone__status--free",
        status === "busy" && "pc-zone__status--busy",
        status === "booked" && "pc-zone__status--booked",
        className,
      )}
    >
      {STATUS_LABEL[status].toUpperCase()}
    </span>
  );
}
