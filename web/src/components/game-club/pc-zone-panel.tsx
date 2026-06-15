"use client";

import { ArrowLeft, ChevronRight, Clock, Cpu, Monitor } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getPcDeviceImage,
  getPcStationMeta,
  PC_BOOKING_HERO,
  STATUS_LABEL,
  type Device,
  type DeviceStatus,
} from "@/lib/game-club-data";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const durationOptions = [1, 2, 3, 4];

type PcZonePanelProps = {
  devices: Device[];
  loading: boolean;
  selectedDeviceId: string;
  bookingPrice: number;
  durationHours: number;
  startHour: string;
  onBack: () => void;
  onSelect: (id: string) => void;
  setDurationHours: (value: number) => void;
  setStartHour: (value: string) => void;
  onCreateBooking: () => void;
};

export function PcZonePanel({
  devices,
  loading,
  selectedDeviceId,
  bookingPrice,
  durationHours,
  startHour,
  onBack,
  onSelect,
  setDurationHours,
  setStartHour,
  onCreateBooking,
}: PcZonePanelProps) {
  const activePc = devices.find((device) => device.id === selectedDeviceId) ?? devices[0];

  if (loading) {
    return (
      <div className="pc-zone">
        <p className="text-sm text-text-muted">PC qurilmalar yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="pc-zone">
      <header className="pc-zone__header">
        <Button type="button" variant="ghost" size="sm" className="mb-3 w-fit px-0" onClick={onBack}>
          <ArrowLeft className="size-4" />
          Orqaga
        </Button>
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">PC lar holati</h2>
        <p className="mt-1 text-sm text-text-muted">
          Qurilmani tanlang, bo&apos;sh bo&apos;lsa bron qilish mumkin.
        </p>
      </header>

      <div className="pc-zone__stations">
        {!devices.length ? (
          <p className="text-sm text-text-muted">Bu zonada PC qurilmalar yo&apos;q.</p>
        ) : (
          devices.map((device, index) => {
            const active = selectedDeviceId === device.id;
            const meta = getPcStationMeta(index);
            const image = getPcDeviceImage(index);

            return (
              <button
                key={device.id}
                type="button"
                onClick={() => onSelect(device.id)}
                className={cn(
                  "pc-zone__station",
                  active && "pc-zone__station--active",
                  device.status !== "available" && "pc-zone__station--dim",
                )}
              >
                <div className="pc-zone__station-content">
                  <p className="text-lg font-bold text-text-primary">{device.name}</p>
                  <p className="mt-0.5 tabular-data text-sm text-text-muted">
                    {device.type} • {formatCurrency(device.pricePerHour)}/soat
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-secondary">
                    <span className="inline-flex items-center gap-1">
                      <Cpu className="size-3.5 text-brand-cyan" />
                      {meta.gpu}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Monitor className="size-3.5 text-brand-cyan" />
                      {meta.display}
                    </span>
                  </div>
                  <PcStatusPill status={device.status} className="mt-3" />
                </div>
                <div
                  className="pc-zone__station-art"
                  style={{ backgroundImage: `url(${image})` }}
                  aria-hidden
                />
              </button>
            );
          })
        )}
      </div>

      <section className="pc-zone__booking">
        {!activePc ? (
          <div className="pc-zone__booking-empty">
            <Monitor className="size-8 text-brand-cyan/60" />
            <p className="mt-3 text-lg font-semibold text-text-primary">Qurilma bron qilish</p>
            <p className="mt-1 text-sm text-text-muted">Yuqoridan PC tanlang.</p>
          </div>
        ) : (
          <>
            <div>
              <h3 className="text-xl font-bold text-text-primary">Qurilma bron qilish</h3>
              <p className="mt-1 text-sm text-text-muted">Tanlangan qurilma: {activePc.name}</p>
            </div>

            <label className="pc-zone__field">
              <span className="pc-zone__label">Boshlanish vaqti</span>
              <div className="relative">
                <Clock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-faint" />
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
                <p className="text-sm text-text-muted">Jami</p>
                <p className="tabular-data text-2xl font-bold text-brand-cyan">{formatCurrency(bookingPrice)}</p>
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
              disabled={activePc.status !== "available"}
            >
              Bron qilish
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </section>
    </div>
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
