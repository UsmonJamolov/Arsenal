"use client";

import { Check, ChevronRight, CreditCard, ShoppingBag } from "lucide-react";

import {
  ORDER_TYPE_LABEL,
  PAYMENT_METHODS,
  type CartItem,
  type PaymentMethod,
} from "@/lib/game-club-data";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const PAYMENT_METHOD_META: Record<PaymentMethod, { initial: string; hint: string }> = {
  Payme: { initial: "P", hint: "Tez to'lov" },
  Click: { initial: "C", hint: "Bank kartasi" },
  "Uzum Bank": { initial: "U", hint: "Mobil bank" },
};

type PaymentZonePanelProps = {
  cart: CartItem[];
  grandTotal: number;
  paymentMethod: PaymentMethod;
  paymentLoading: boolean;
  paymentError: string | null;
  onPayNow: () => void;
  setPaymentMethod: (method: PaymentMethod) => void;
};

export function PaymentZonePanel({
  cart,
  grandTotal,
  paymentMethod,
  paymentLoading,
  paymentError,
  onPayNow,
  setPaymentMethod,
}: PaymentZonePanelProps) {
  const hasItems = cart.length > 0;

  return (
    <div className="payment-zone">
      <header className="payment-zone__header">
        <div className="payment-zone__header-icon" aria-hidden>
          <CreditCard className="size-5" strokeWidth={2} />
        </div>
        <div>
          <h2 className="payment-zone__title">To&apos;lov</h2>
          <p className="payment-zone__subtitle">
            {hasItems
              ? `To'lanishi kerak: ${cart.length} ta buyurtma`
              : "Savat bo'sh — to'lov uchun buyurtma qo'shing."}
          </p>
        </div>
      </header>

      {hasItems ? (
        <section className="payment-zone__orders" aria-label="To'lov qilinadigan buyurtmalar">
          <p className="payment-zone__eyebrow">To&apos;lov qilinadigan</p>
          <div className="payment-zone__order-list">
            {cart.map((item, index) => (
              <article key={item.id} className="payment-zone__order">
                <span className="payment-zone__order-index">#{index + 1}</span>
                <div className="payment-zone__order-body">
                  <span
                    className={cn(
                      "payment-zone__order-type",
                      item.type === "hookah" && "payment-zone__order-type--hookah",
                      item.type === "booking" && "payment-zone__order-type--booking",
                    )}
                  >
                    {ORDER_TYPE_LABEL[item.type]}
                  </span>
                  <p className="payment-zone__order-title">{item.title}</p>
                </div>
                <p className="payment-zone__order-price">{formatCurrency(item.price)}</p>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <div className="payment-zone__empty">
          <ShoppingBag className="size-8 text-[var(--au-muted)]" strokeWidth={1.75} />
          <p className="payment-zone__empty-title">Buyurtmalar yo&apos;q</p>
          <p className="payment-zone__empty-text">Avval savatga bron yoki kalyan qo&apos;shing.</p>
        </div>
      )}

      {hasItems ? (
        <div className="payment-zone__total">
          <div>
            <p className="payment-zone__total-label">Jami</p>
            <p className="payment-zone__total-price">{formatCurrency(grandTotal)}</p>
          </div>
          <span className="payment-zone__total-badge">{cart.length} ta</span>
        </div>
      ) : null}

      <section className="payment-zone__methods" aria-label="To'lov usuli">
        <h3 className="payment-zone__methods-title">To&apos;lov usuli</h3>
        <div className="payment-zone__method-list">
          {PAYMENT_METHODS.map((method) => {
            const active = paymentMethod === method;
            const meta = PAYMENT_METHOD_META[method];

            return (
              <button
                key={method}
                type="button"
                className={cn("payment-zone__method", active && "payment-zone__method--active")}
                onClick={() => setPaymentMethod(method)}
                aria-pressed={active}
              >
                <span className="payment-zone__method-mark">{meta.initial}</span>
                <span className="payment-zone__method-copy">
                  <span className="payment-zone__method-name">{method}</span>
                  <span className="payment-zone__method-hint">{meta.hint}</span>
                </span>
                <span className="payment-zone__method-status">
                  {active ? (
                    <>
                      <Check className="size-3.5" strokeWidth={3} />
                      Tanlandi
                    </>
                  ) : (
                    "Tanlash"
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <button
        type="button"
        className="payment-zone__pay"
        onClick={onPayNow}
        disabled={!hasItems || paymentLoading}
      >
        {paymentLoading ? "To'lov ochilmoqda..." : "To'lash"}
        <ChevronRight className="size-5" />
      </button>

      {paymentError ? <p className="payment-zone__error">{paymentError}</p> : null}
    </div>
  );
}
