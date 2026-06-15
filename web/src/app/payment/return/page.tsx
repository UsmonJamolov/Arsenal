"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { apiRequest, setApiUserId } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { savePendingSessions } from "@/lib/user-storage";
import type { ClubSession } from "@/components/game-club/station-unlock-panel";

type PaymentIntent = {
  id: string;
  total: number;
  method: string;
  status: string;
};

function PaymentReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const intentId = searchParams.get("intent");
  const [status, setStatus] = useState<"loading" | "paid" | "pending" | "cancelled" | "error">("loading");
  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();
    if (session?.id) {
      setApiUserId(session.id);
    }
  }, []);

  useEffect(() => {
    if (!intentId) {
      setStatus("error");
      setMessage("To'lov ID topilmadi");
      return;
    }

    let attempts = 0;
    let cancelled = false;

    const poll = async () => {
      try {
        const data = await apiRequest<{
          status: string;
          intent: PaymentIntent;
          sessions?: ClubSession[];
          message?: string;
        }>(`/api/payments/status/${intentId}`);

        if (cancelled) {
          return;
        }

        setIntent(data.intent);

        if (data.status === "paid") {
          setStatus("paid");
          const session = getSession();
          if (data.sessions?.length && session?.id) {
            savePendingSessions(session.id, data.sessions);
          }
          return;
        }

        if (data.status === "cancelled") {
          setStatus("cancelled");
          return;
        }

        attempts += 1;
        if (attempts < 8) {
          setStatus("pending");
          setMessage(data.message || "To'lov tasdiqlanishi kutilmoqda...");
          window.setTimeout(poll, 2000);
          return;
        }

        setStatus("pending");
        setMessage("To'lov hali tasdiqlanmadi. Keyinroq qayta tekshiring.");
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setMessage(err instanceof Error ? err.message : "Holatni tekshirib bo'lmadi");
        }
      }
    };

    poll();

    return () => {
      cancelled = true;
    };
  }, [intentId]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>
            {status === "paid"
              ? "To'lov muvaffaqiyatli"
              : status === "cancelled"
                ? "To'lov bekor qilindi"
                : status === "pending"
                  ? "To'lov kutilmoqda"
                  : status === "error"
                    ? "Xatolik"
                    : "Tekshirilmoqda"}
          </CardTitle>
          <CardDescription>
            {intent ? `${intent.method} — ${formatCurrency(intent.total)}` : "To'lov natijasi"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "loading" ? <p className="text-sm text-text-muted">Holat tekshirilmoqda...</p> : null}
          {message ? <p className="text-sm text-text-secondary">{message}</p> : null}
          {status === "paid" ? (
            <Button className="w-full" onClick={() => router.push("/")}>
              Asosiy sahifaga qaytish
            </Button>
          ) : (
            <Button className="w-full" variant="secondary" asChild>
              <Link href="/">Ilovaga qaytish</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={<main className="p-10 text-sm text-text-muted">Yuklanmoqda...</main>}>
      <PaymentReturnContent />
    </Suspense>
  );
}
