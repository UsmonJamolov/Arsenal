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
    <Card className="border-cyan-400/30 bg-cyan-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="size-5 text-cyan-300" />
          Stansiyani ochish
        </CardTitle>
        <CardDescription>
          Klubga kelgach, kompyuter yonida ushbu PIN ni kiriting — stansiya avtomatik ochiladi.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {sessions.map((s) => (
            <div key={s.id} className="rounded-2xl border border-violet-400/25 bg-violet-500/10 p-4">
              <p className="font-bold text-white">{s.deviceName}</p>
              <p className="mt-1 text-sm text-violet-200/70">
                Stansiya: {s.stationId} • {s.durationMinutes} daqiqa
              </p>
              <p className="mt-3 font-mono text-3xl font-black tracking-[0.35em] text-cyan-200">{s.unlockPin}</p>
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
          <span className="text-sm font-semibold text-violet-200/80">Qurilma</span>
          <Select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
            {sessions.map((s) => (
              <option key={s.deviceId} value={s.deviceId}>
                {s.deviceName}
              </option>
            ))}
          </Select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-violet-200/80">PIN kod</span>
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
          {loading ? "Tekshirilmoqda..." : "Stansiyani ochish"}
        </Button>

        {message ? <p className="text-sm font-semibold text-emerald-300">{message}</p> : null}
        {error ? <p className="text-sm font-semibold text-rose-300">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
