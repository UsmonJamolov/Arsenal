"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Check, Clock, CreditCard, XCircle } from "lucide-react";

import { getSession } from "@/lib/auth";
import { apiRequest, setApiUserId } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { savePendingSessions } from "@/lib/user-storage";
import type { ClubSession } from "@/lib/club-session";
import { cn } from "@/lib/utils";

type PaymentIntent = {
  id: string;
  total: number;
  method: string;
  status: string;
};

function statusTitle(status: PaymentReturnContentProps["status"]) {
  if (status === "paid") return "To'lov muvaffaqiyatli";
  if (status === "cancelled") return "To'lov bekor qilindi";
  if (status === "pending") return "To'lov kutilmoqda";
  if (status === "error") return "Xatolik";
  return "Tekshirilmoqda";
}

type PaymentReturnContentProps = {
  status: "loading" | "paid" | "pending" | "cancelled" | "error";
};

function StatusBadge({ status }: PaymentReturnContentProps) {
  const iconClass = "size-6";

  if (status === "paid") {
    return (
      <div className={cn("payment-return__badge", "payment-return__badge--paid")}>
        <Check className={iconClass} strokeWidth={2.5} />
      </div>
    );
  }

  if (status === "cancelled" || status === "error") {
    return (
      <div className={cn("payment-return__badge", "payment-return__badge--cancelled")}>
        <XCircle className={iconClass} strokeWidth={2.25} />
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className={cn("payment-return__badge", "payment-return__badge--pending")}>
        <Clock className={iconClass} strokeWidth={2.25} />
      </div>
    );
  }

  return (
    <div className="payment-return__badge">
      <CreditCard className={iconClass} strokeWidth={2.25} />
    </div>
  );
}

function PaymentReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const intentId = searchParams.get("intent");
  const [status, setStatus] = useState<PaymentReturnContentProps["status"]>("loading");
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
    <main className="payment-return">
      <div className="payment-return__shell">
        <StatusBadge status={status} />
        <h1 className="payment-return__title">{statusTitle(status)}</h1>
        {intent ? (
          <>
            <p className="payment-return__meta">{intent.method}</p>
            <p className="payment-return__amount">{formatCurrency(intent.total)}</p>
          </>
        ) : (
          <p className="payment-return__meta">To&apos;lov natijasi</p>
        )}
        {status === "loading" ? <p className="payment-return__message">Holat tekshirilmoqda...</p> : null}
        {message ? <p className="payment-return__message">{message}</p> : null}
        <div className="payment-return__actions">
          {status === "paid" ? (
            <button type="button" className="payment-return__cta" onClick={() => router.push("/")}>
              Asosiy sahifaga qaytish
            </button>
          ) : (
            <Link href="/" className="payment-return__cta payment-return__cta--secondary">
              Ilovaga qaytish
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense
      fallback={
        <main className="payment-return">
          <p className="payment-return__loading">Yuklanmoqda...</p>
        </main>
      }
    >
      <PaymentReturnContent />
    </Suspense>
  );
}
