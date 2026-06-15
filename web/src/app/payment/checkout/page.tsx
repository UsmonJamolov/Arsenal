"use client";

import { CreditCard, Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSession } from "@/lib/auth";
import { apiRequest, setApiUserId } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { savePendingSessions } from "@/lib/user-storage";
import type { ClubSession } from "@/components/game-club/station-unlock-panel";

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
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <div className="mb-2 flex items-center gap-2 text-brand-cyan">
            <CreditCard className="h-5 w-5" />
            <span className="text-sm font-semibold">{providerLabel} — karta to&apos;lovi</span>
          </div>
          <CardTitle>To&apos;lovni tasdiqlang</CardTitle>
          <CardDescription>
            {intent?.mode === "live"
              ? "Siz provayder to'lov sahifasiga yo'naltirilasiz"
              : "Demo rejim: haqiqiy pul yechilmaydi"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? <p className="text-sm text-text-muted">Yuklanmoqda...</p> : null}
          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          {intent && intent.mode !== "live" ? (
            <>
              <div className="rounded-xl border border-border-subtle bg-surface-elevated p-4">
                <p className="text-sm text-text-muted">To&apos;lanadigan summa</p>
                <p className="text-2xl font-bold text-text-primary">{formatCurrency(intent.total)}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-text-muted">Karta raqami</label>
                  <Input
                    inputMode="numeric"
                    placeholder="8600 0000 0000 0000"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-text-muted">Amal qilish muddati</label>
                    <Input
                      inputMode="numeric"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-text-muted">CVV</label>
                    <Input
                      inputMode="numeric"
                      placeholder="000"
                      maxLength={3}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    />
                  </div>
                </div>
              </div>

              <Button className="w-full" onClick={payWithCard} disabled={paying}>
                <Lock className="mr-2 h-4 w-4" />
                {paying ? "To'lanmoqda..." : `${formatCurrency(intent.total)} to'lash`}
              </Button>

              <Button className="w-full" variant="secondary" onClick={() => router.push("/")}>
                Bekor qilish
              </Button>
            </>
          ) : null}

          {intent?.mode === "live" ? (
            <p className="text-sm text-text-muted">Payme/Click/Uzum sahifasiga yo&apos;naltirilmoqda...</p>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}

export default function PaymentCheckoutPage() {
  return (
    <Suspense fallback={<main className="p-10 text-sm text-text-muted">Yuklanmoqda...</main>}>
      <CheckoutContent />
    </Suspense>
  );
}
