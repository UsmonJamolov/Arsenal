"use client";

import { KeyRound, Monitor } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { apiRequest } from "@/lib/api";

export type ClubSession = {
  id: string;
  deviceId: string;
  deviceName: string;
  stationId: string;
  unlockPin: string;
  endsAt: string;
  durationMinutes: number;
  status: string;
};

type Props = {
  sessions: ClubSession[];
  onUnlocked?: () => void;
  onCancelSession?: (sessionId: string, deviceId?: string) => Promise<void>;
};

export function StationUnlockPanel({ sessions, onUnlocked, onCancelSession }: Props) {
  const [pin, setPin] = useState("");
  const [deviceId, setDeviceId] = useState(sessions[0]?.deviceId ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!sessions.length) {
    return null;
  }

  const unlock = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const result = await apiRequest<{ message: string }>("/api/sessions/unlock", {
        method: "POST",
        body: JSON.stringify({ pin: pin.trim(), deviceId: deviceId || undefined }),
      });
      setMessage(result.message);
      setPin("");
      onUnlocked?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "PIN noto'g'ri");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-brand-cyan/25 bg-brand-cyan-dim">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="size-5 text-brand-cyan" />
          Qurilmani ochish
        </CardTitle>
        <CardDescription>
          Klubga kelgach, kompyuter yonida ushbu PIN ni kiriting — qurilma avtomatik ochiladi.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {sessions.map((s) => (
            <div key={s.id} className="rounded-xl border border-border-default bg-arena-overlay/60 p-4">
              <p className="font-semibold text-text-primary">{s.deviceName}</p>
              <p className="mt-1 text-sm text-text-muted">
                Qurilma: {s.stationId} • {s.durationMinutes} daqiqa
              </p>
              <p className="tabular-data mt-3 text-3xl font-bold tracking-[0.2em] text-brand-cyan">{s.unlockPin}</p>
              <Badge variant="booked" className="mt-2">
                {s.status === "pending_unlock" ? "PIN kutilmoqda" : s.status}
              </Badge>
              {onCancelSession && (s.status === "pending_unlock" || s.status === "active") ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="mt-3"
                  onClick={() => onCancelSession(s.id, s.deviceId)}
                >
                  Bekor qilish
                </Button>
              ) : null}
            </div>
          ))}
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-text-secondary">Qurilma</span>
          <Select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
            {sessions.map((s) => (
              <option key={s.deviceId} value={s.deviceId}>
                {s.deviceName}
              </option>
            ))}
          </Select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-text-secondary">PIN kod</span>
          <Input
            inputMode="numeric"
            maxLength={6}
            placeholder="6 xonali PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="font-mono text-lg tracking-widest"
          />
        </label>

        <Button className="w-full" onClick={unlock} disabled={loading || pin.length < 4}>
          <KeyRound className="size-4" />
          {loading ? "Tekshirilmoqda..." : "Qurilmani ochish"}
        </Button>

        {message ? <p className="text-sm font-semibold text-status-available">{message}</p> : null}
        {error ? <p className="text-sm font-semibold text-status-busy">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
