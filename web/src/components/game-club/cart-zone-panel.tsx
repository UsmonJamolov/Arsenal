"use client";

import { ChevronRight, Gamepad2, ShoppingBag, ShoppingCart, Trash2 } from "lucide-react";

import { HookahIcon } from "@/components/icons/hookah-icon";
import { ORDER_TYPE_LABEL, type CartItem } from "@/lib/game-club-data";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type CartZonePanelProps = {
  cart: CartItem[];
  grandTotal: number;
  onClearCart: () => void;
  onOpenPayment: () => void;
  onRemoveCartItem: (item: CartItem) => Promise<void>;
  onBrowseServices?: () => void;
};

export function CartZonePanel({
  cart,
  grandTotal,
  onClearCart,
  onOpenPayment,
  onRemoveCartItem,
  onBrowseServices,
}: CartZonePanelProps) {
  const hasItems = cart.length > 0;
  const bookingCount = cart.filter((item) => item.type === "booking").length;
  const hookahCount = cart.filter((item) => item.type === "hookah").length;

  return (
    <div className="cart-zone">
      <header className="cart-zone__header">
        <div className="cart-zone__header-icon" aria-hidden>
          <ShoppingCart className="size-5" strokeWidth={2} />
        </div>
        <div>
          <h2 className="cart-zone__title">Savatcha</h2>
          <p className="cart-zone__subtitle">
            {hasItems
              ? `${cart.length} ta buyurtma to'lovga tayyor`
              : "Hozircha buyurtmalar yo'q — xizmat tanlang."}
          </p>
        </div>
      </header>

      {hasItems ? (
        <>
          <div className="cart-zone__summary" aria-label="Savat xulosasi">
            {bookingCount > 0 ? (
              <span className="cart-zone__chip cart-zone__chip--booking">
                <Gamepad2 className="size-3.5" />
                {bookingCount} bron
              </span>
            ) : null}
            {hookahCount > 0 ? (
              <span className="cart-zone__chip cart-zone__chip--hookah">
                <HookahIcon className="size-3.5" strokeWidth={1.5} />
                {hookahCount} kalyan
              </span>
            ) : null}
          </div>

          <section className="cart-zone__orders" aria-label="Savatdagi buyurtmalar">
            <p className="cart-zone__eyebrow">Buyurtmalar</p>
            <div className="cart-zone__order-list">
              {cart.map((item, index) => (
                <article key={item.id} className="cart-zone__order">
                  <span className="cart-zone__order-index">#{index + 1}</span>

                  <div className="cart-zone__order-body">
                    <span
                      className={cn(
                        "cart-zone__order-type",
                        item.type === "hookah" && "cart-zone__order-type--hookah",
                        item.type === "booking" && "cart-zone__order-type--booking",
                      )}
                    >
                      {item.type === "booking" ? (
                        <Gamepad2 className="size-3" aria-hidden />
                      ) : (
                        <HookahIcon className="size-3" strokeWidth={1.5} aria-hidden />
                      )}
                      {ORDER_TYPE_LABEL[item.type]}
                    </span>
                    <p className="cart-zone__order-title">{item.title}</p>
                  </div>

                  <div className="cart-zone__order-actions">
                    <p className="cart-zone__order-price tabular-nums">{formatCurrency(item.price)}</p>
                    <button
                      type="button"
                      className="cart-zone__remove"
                      aria-label={`${item.title} ni o'chirish`}
                      onClick={() => onRemoveCartItem(item)}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="cart-zone__total" aria-label="Jami summa">
            <div>
              <p className="cart-zone__total-label">Jami to&apos;lov</p>
              <p className="cart-zone__total-price tabular-nums">{formatCurrency(grandTotal)}</p>
            </div>
            <span className="cart-zone__total-badge">{cart.length} ta</span>
          </section>

          <div className="cart-zone__actions">
            <button type="button" className="cart-zone__pay" onClick={onOpenPayment}>
              To&apos;lovga o&apos;tish
              <ChevronRight className="size-5" />
            </button>
            <button type="button" className="cart-zone__clear" onClick={onClearCart}>
              Savatni tozalash
            </button>
          </div>
        </>
      ) : (
        <div className="cart-zone__empty">
          <div className="cart-zone__empty-icon" aria-hidden>
            <ShoppingBag className="size-8" strokeWidth={1.5} />
          </div>
          <p className="cart-zone__empty-title">Savat bo&apos;sh</p>
          <p className="cart-zone__empty-text">
            PS, PC yoki kalyan buyurtmasini qo&apos;shing — u shu yerda ko&apos;rinadi.
          </p>
          {onBrowseServices ? (
            <button type="button" className="cart-zone__browse" onClick={onBrowseServices}>
              Xizmatlarni ko&apos;rish
              <ChevronRight className="size-4" />
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
