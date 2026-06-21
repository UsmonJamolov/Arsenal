"use client";

import { ArrowLeft, Check, ChevronRight, Circle, Clock, Gamepad2, Tv, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getPsDeviceImage,
  getPsDeviceImagePosition,
  getPsStationMeta,
  PS_BOOKING_HERO,
  STATUS_LABEL,
  type Device,
  type DeviceStatus,
} from "@/lib/game-club-data";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const durationOptions = [1, 2, 3, 4];

type PsZonePanelProps = {
  devices: Device[];
  loading: boolean;
  selectedDeviceIds: string[];
  bookingPrice: number;
  durationHours: number;
  startHour: string;
  onBack: () => void;
  onToggleDevice: (id: string) => void;
  setDurationHours: (value: number) => void;
  setStartHour: (value: string) => void;
  onCreateBooking: () => void;
};

export function PsZonePanel({
  devices,
  loading,
  selectedDeviceIds,
  bookingPrice,
  durationHours,
  startHour,
  onBack,
  onToggleDevice,
  setDurationHours,
  setStartHour,
  onCreateBooking,
}: PsZonePanelProps) {
  const selectedDevices = devices.filter((device) => selectedDeviceIds.includes(device.id));
  const canBook =
    selectedDevices.length > 0 && selectedDevices.every((device) => device.status === "available");

  if (loading) {
    return (
      <div className="ps-zone">
        <p className="text-sm text-[var(--au-muted)]">PS qurilmalar yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="ps-zone">
      <header className="ps-zone__header">
        <Button type="button" variant="ghost" size="sm" className="zone-panel-back mb-3 w-fit px-0" onClick={onBack}>
          <ArrowLeft className="size-4" />
          Orqaga
        </Button>
        <h2 className="text-2xl font-bold tracking-tight text-[var(--au-text)]">PS lar holati</h2>
        <p className="mt-1 text-sm text-[var(--au-muted)]">
          Bir yoki bir nechta PS tanlang, bo&apos;sh bo&apos;lsa bron qilish mumkin.
        </p>
      </header>

      <div className="ps-zone__stations">
        {!devices.length ? (
          <p className="text-sm text-[var(--au-muted)]">Bu zonada PS qurilmalar yo&apos;q.</p>
        ) : (
          devices.map((device, index) => {
            const active = selectedDeviceIds.includes(device.id);
            const meta = getPsStationMeta(index);
            const image = getPsDeviceImage(index);

            return (
              <button
                key={device.id}
                type="button"
                onClick={() => onToggleDevice(device.id)}
                aria-pressed={active}
                className={cn(
                  "ps-zone__station",
                  active && "ps-zone__station--active",
                  device.status !== "available" && "ps-zone__station--dim",
                )}
              >
                <img
                  src={image}
                  alt=""
                  className="ps-zone__station-bg"
                  style={{ objectPosition: getPsDeviceImagePosition(index) }}
                  loading="lazy"
                  draggable={false}
                />
                <span className="ps-zone__station-shade" aria-hidden />

                <span className="ps-zone__station-check" aria-hidden>
                  {active ? (
                    <span className="ps-zone__station-mark ps-zone__station-mark--active">
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                  ) : (
                    <Circle className="size-5 text-white/45" strokeWidth={1.5} />
                  )}
                </span>

                <div className="ps-zone__station-content">
                  <p className="ps-zone__station-name">{device.name}</p>
                  <p className="ps-zone__station-meta tabular-data">
                    {device.type} • {formatCurrency(device.pricePerHour)}/soat
                  </p>
                  <div className="ps-zone__station-specs">
                    <span className="ps-zone__station-spec">
                      <Users className="size-3.5" strokeWidth={2} />
                      {meta.seats} o&apos;rin
                    </span>
                    <span className="ps-zone__station-spec">
                      <Tv className="size-3.5" strokeWidth={2} />
                      {meta.display}
                    </span>
                  </div>
                  <PsStatusPill status={device.status} className="mt-3" />
                </div>
              </button>
            );
          })
        )}
      </div>

      <section className="ps-zone__booking">
        {!selectedDevices.length ? (
          <div className="ps-zone__booking-empty">
            <Gamepad2 className="size-8 text-[var(--au-red)]/60" />
            <p className="mt-3 text-lg font-semibold text-[var(--au-text)]">Qurilma bron qilish</p>
            <p className="mt-1 text-sm text-[var(--au-muted)]">Yuqoridan kamida bitta PS tanlang.</p>
          </div>
        ) : (
          <>
            <div>
              <h3 className="text-xl font-bold text-[var(--au-text)]">Qurilma bron qilish</h3>
              <p className="mt-1 text-sm text-[var(--au-muted)]">
                Tanlangan: {selectedDevices.map((device) => device.name).join(", ")}
              </p>
            </div>

            <label className="ps-zone__field">
              <span className="ps-zone__label">Boshlanish vaqti</span>
              <div className="relative">
                <Clock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--au-muted)]" />
                <Input
                  value={startHour}
                  onChange={(event) => setStartHour(event.target.value)}
                  placeholder="13:00"
                  className="ps-zone__input h-12 pl-11"
                />
              </div>
            </label>

            <div className="ps-zone__field">
              <span className="ps-zone__label">Davomiyligi (soat)</span>
              <div className="grid grid-cols-4 gap-2">
                {durationOptions.map((hour) => (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => setDurationHours(hour)}
                    className={cn(
                      "ps-zone__duration",
                      durationHours === hour && "ps-zone__duration--active",
                    )}
                  >
                    {hour}
                  </button>
                ))}
              </div>
            </div>

            <div className="ps-zone__total">
              <div>
                <p className="text-sm text-[var(--au-muted)]">Jami</p>
                <p className="tabular-data text-2xl font-bold text-[var(--au-red)]">{formatCurrency(bookingPrice)}</p>
              </div>
              <div
                className="ps-zone__total-art"
                style={{ backgroundImage: `url(${PS_BOOKING_HERO})` }}
                aria-hidden
              />
            </div>

            <button
              type="button"
              className="ps-zone__submit"
              onClick={onCreateBooking}
              disabled={!canBook}
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

function PsStatusPill({ status, className }: { status: DeviceStatus; className?: string }) {
  return (
    <span
      className={cn(
        "ps-zone__status",
        status === "available" && "ps-zone__status--free",
        status === "busy" && "ps-zone__status--busy",
        status === "booked" && "ps-zone__status--booked",
        className,
      )}
    >
      {STATUS_LABEL[status].toUpperCase()}
    </span>
  );
}
