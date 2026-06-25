"use client";

import { ChevronRight, CreditCard, Lock, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import type { ClubSession } from "@/lib/club-session";
import { Input } from "@/components/ui/input";
import { getSession } from "@/lib/auth";
import { apiRequest, setApiUserId } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { savePendingSessions } from "@/lib/user-storage";

type PaymentIntent = {
  id: string;
  total: number;
  method: string;
  provider: string;
  status: string;
  mode: "sandbox" | "live";
  checkoutUrl: string;
};

const PROVIDER_LABEL: Record<string, string> = {
  payme: "Payme",
  click: "Click",
  uzum: "Uzum Bank",
  sandbox: "Demo",
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const intentId = searchParams.get("intent");
  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  useEffect(() => {
    const session = getSession();
    if (session?.id) {
      setApiUserId(session.id);
    }
  }, []);

  useEffect(() => {
    if (!intentId) {
      setError("To'lov ID topilmadi");
      setLoading(false);
      return;
    }

    apiRequest<{ intent: PaymentIntent; status: string }>(`/api/payments/status/${intentId}`)
      .then((data) => {
        setIntent(data.intent);

        if (data.status === "paid") {
          router.replace(`/payment/return?intent=${intentId}`);
          return;
        }

        const externalUrl = data.intent.checkoutUrl;
        if (data.intent.mode === "live" && externalUrl?.startsWith("http")) {
          window.location.href = externalUrl;
        }
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [intentId, router]);

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) {
      return digits;
    }
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  const payWithCard = async () => {
    if (!intentId) {
      return;
    }

    const digits = cardNumber.replace(/\D/g, "");
    if (digits.length < 16) {
      setError("Karta raqamini to'liq kiriting");
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      setError("Amal qilish muddatini MM/YY formatida kiriting");
      return;
    }
    if (cardCvv.length < 3) {
      setError("CVV kodini kiriting");
      return;
    }

    setPaying(true);
    setError(null);

    try {
      const result = await apiRequest<{
        status: string;
        total: number;
        sessions?: ClubSession[];
      }>(`/api/payments/sandbox/${intentId}/complete`, { method: "POST" });

      const session = getSession();
      if (result.sessions?.length && session?.id) {
        savePendingSessions(session.id, result.sessions);
      }

      router.replace(`/payment/return?intent=${intentId}&status=paid`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "To'lov amalga oshmadi");
    } finally {
      setPaying(false);
    }
  };

  const providerLabel = intent ? PROVIDER_LABEL[intent.provider] || intent.method : "";

  return (
    <main className="card-checkout">
      <div className="card-checkout__shell">
        <div className="card-checkout__glow" aria-hidden />

        <header className="card-checkout__header">
          <div className="card-checkout__provider">
            <span className="card-checkout__provider-icon" aria-hidden>
              <CreditCard className="size-4" strokeWidth={2} />
            </span>
            <span className="card-checkout__provider-label">
              {providerLabel || "Demo"} — karta to&apos;lovi
            </span>
          </div>
          <h1 className="card-checkout__title">To&apos;lovni tasdiqlang</h1>
          <p className="card-checkout__notice">
            <ShieldCheck className="size-3.5 shrink-0" strokeWidth={2.25} />
            {intent?.mode === "live"
              ? "Siz provayder to'lov sahifasiga yo'naltirilasiz"
              : "Demo rejim: haqiqiy pul yechilmaydi"}
          </p>
        </header>

        {loading ? <p className="card-checkout__loading">Yuklanmoqda...</p> : null}
        {error ? <p className="card-checkout__error">{error}</p> : null}

        {intent && intent.mode !== "live" ? (
          <>
            <div className="card-checkout__amount">
              <p className="card-checkout__amount-label">To&apos;lanadigan summa</p>
              <p className="card-checkout__amount-value">{formatCurrency(intent.total)}</p>
            </div>

            <div className="card-checkout__form">
              <label className="card-checkout__field">
                <span className="card-checkout__label">Karta raqami</span>
                <Input
                  inputMode="numeric"
                  placeholder="8600 0000 0000 0000"
                  value={cardNumber}
                  onChange={(event) => setCardNumber(formatCardNumber(event.target.value))}
                  className="card-checkout__input h-12"
                />
              </label>

              <div className="card-checkout__field-row">
                <label className="card-checkout__field">
                  <span className="card-checkout__label">Amal qilish muddati</span>
                  <Input
                    inputMode="numeric"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(event) => setCardExpiry(formatExpiry(event.target.value))}
                    className="card-checkout__input h-12"
                  />
                </label>
                <label className="card-checkout__field">
                  <span className="card-checkout__label">CVV</span>
                  <Input
                    inputMode="numeric"
                    placeholder="000"
                    maxLength={3}
                    value={cardCvv}
                    onChange={(event) => setCardCvv(event.target.value.replace(/\D/g, "").slice(0, 3))}
                    className="card-checkout__input h-12"
                  />
                </label>
              </div>
            </div>

            <div className="card-checkout__actions">
              <button
                type="button"
                className="card-checkout__pay"
                onClick={payWithCard}
                disabled={paying}
              >
                <Lock className="size-4" strokeWidth={2.25} />
                {paying ? "To'lanmoqda..." : `${formatCurrency(intent.total)} to'lash`}
                <ChevronRight className="size-5" />
              </button>

              <button
                type="button"
                className="card-checkout__cancel"
                onClick={() => router.push("/")}
              >
                Bekor qilish
              </button>
            </div>
          </>
        ) : null}

        {intent?.mode === "live" ? (
          <p className="card-checkout__loading">Payme/Click/Uzum sahifasiga yo&apos;naltirilmoqda...</p>
        ) : null}
      </div>
    </main>
  );
}

export default function PaymentCheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="card-checkout">
          <p className="card-checkout__loading">Yuklanmoqda...</p>
        </main>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
