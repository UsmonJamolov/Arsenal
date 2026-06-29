"use client";

import { Minus, Plus, ShoppingBag, ShoppingCart, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { ClubProduct } from "@/lib/game-club-data";
import { cn } from "@/lib/utils";

function formatSom(value: number) {
  return `${Math.round(value).toLocaleString("uz-UZ")} so'm`;
}

function resolveProductImage(image: string) {
  const trimmed = image.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed;
}

type ExtrasOrderModalProps = {
  open: boolean;
  products: ClubProduct[];
  loading?: boolean;
  skipAsk?: boolean;
  selections: Record<string, number>;
  onChange: (productId: string, quantity: number) => void;
  onClose: () => void;
  onSkip: () => void;
  onConfirm: () => void;
  confirming?: boolean;
};

export function ExtrasOrderModal({
  open,
  products,
  loading = false,
  skipAsk = false,
  selections,
  onChange,
  onClose,
  onSkip,
  onConfirm,
  confirming = false,
}: ExtrasOrderModalProps) {
  const [step, setStep] = useState<"ask" | "list">("ask");

  useEffect(() => {
    if (open) {
      setStep(skipAsk ? "list" : "ask");
    }
  }, [open, skipAsk]);

  const subtotal = useMemo(
    () =>
      products.reduce((sum, product) => {
        const count = selections[product.id] ?? 0;
        return sum + product.price * count;
      }, 0),
    [products, selections],
  );

  const selectedCount = useMemo(
    () => Object.values(selections).reduce((sum, value) => sum + (value > 0 ? value : 0), 0),
    [selections],
  );

  const total = subtotal;

  if (!open) {
    return null;
  }

  return (
    <div className="extras-modal" role="dialog" aria-modal="true" aria-labelledby="extras-modal-title">
      <button type="button" className="extras-modal__backdrop" aria-label="Yopish" onClick={onClose} />

      <div className="extras-modal__sheet">
        <div className="extras-modal__handle" aria-hidden />

        {step === "ask" ? (
          <>
            <header className="extras-modal__hero">
              <div className="extras-modal__hero-glow" aria-hidden />
              <div className="extras-modal__hero-row">
                <div className="extras-modal__header-icon" aria-hidden>
                  <ShoppingBag className="size-6" />
                </div>
                <div className="extras-modal__header-copy">
                  <h2 id="extras-modal-title" className="extras-modal__title">
                    Qo&apos;shimcha buyurtma
                  </h2>
                  <p className="extras-modal__subtitle">Semichka, qurt, pista, ichimlik va boshqalar</p>
                </div>
                <button type="button" className="extras-modal__close" onClick={onClose} aria-label="Yopish">
                  <X className="size-5" />
                </button>
              </div>
            </header>

            <div className="extras-modal__ask">
              <div className="extras-modal__ask-icon" aria-hidden>
                <ShoppingBag className="size-7" />
              </div>
              <p className="extras-modal__ask-title">Qo&apos;shimcha mahsulot buyurtma berasizmi?</p>
              <p className="extras-modal__ask-text">
                Semichka, qurt, pista, yaxna ichimliklar va boshqa qo&apos;shimchalarni buyurtmangizga
                qo&apos;shishingiz mumkin.
              </p>
              <div className="extras-modal__ask-actions">
                <button type="button" className="extras-modal__skip" onClick={onSkip} disabled={confirming}>
                  Yo&apos;q, rahmat
                </button>
                <button
                  type="button"
                  className="extras-modal__confirm"
                  onClick={() => setStep("list")}
                  disabled={confirming}
                >
                  Ha, ko&apos;rsatish
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="extras-modal__hero extras-modal__hero--list">
              <img src="/extras-hero.png" alt="" className="extras-modal__hero-image" aria-hidden />
              <div className="extras-modal__hero-glow" aria-hidden />
              <div className="extras-modal__hero-scrim" aria-hidden />

              <div className="extras-modal__hero-row">
                <div className="extras-modal__header-icon" aria-hidden>
                  <ShoppingBag className="size-6" />
                </div>
                <div className="extras-modal__header-copy">
                  <h2 id="extras-modal-title" className="extras-modal__title">
                    Qo&apos;shimcha buyurtma
                  </h2>
                  <p className="extras-modal__subtitle">Semichka, qurt, pista, ichimlik va boshqalar</p>
                </div>
                <button type="button" className="extras-modal__close" onClick={onClose} aria-label="Yopish">
                  <X className="size-5" />
                </button>
              </div>

              <div className="extras-modal__promo">
                <span className="extras-modal__promo-icon" aria-hidden>
                  <Sparkles className="size-4" />
                </span>
                <div className="extras-modal__promo-copy">
                  <p className="extras-modal__promo-title">Qo&apos;shimcha tanlang!</p>
                  <p className="extras-modal__promo-text">
                    Eng mazali gazaklar va sovuq ichimliklar shu yerda.
                  </p>
                </div>
              </div>
            </div>

            <div className="extras-modal__body">
              <div className="extras-modal__section-title">
                <ShoppingBag className="size-4" aria-hidden />
                <span>Nimalarni qo&apos;shmoqchisiz?</span>
              </div>

              {loading ? (
                <p className="extras-modal__empty">Mahsulotlar yuklanmoqda...</p>
              ) : !products.length ? (
                <p className="extras-modal__empty">Hozircha qo&apos;shimcha mahsulotlar mavjud emas.</p>
              ) : (
                <ul className="extras-modal__list">
                  {products.map((product) => {
                    const count = selections[product.id] ?? 0;
                    const image = resolveProductImage(product.image);
                    const maxedOut = count >= product.quantity;

                    return (
                      <li key={product.id} className={cn("extras-modal__item", count > 0 && "extras-modal__item--active")}>
                        <div className="extras-modal__item-media">
                          {image ? (
                            <img src={image} alt="" className="extras-modal__item-image" />
                          ) : (
                            <span className="extras-modal__item-placeholder">{product.title.slice(0, 1)}</span>
                          )}
                        </div>

                        <div className="extras-modal__item-body">
                          <p className="extras-modal__item-title">{product.title}</p>
                          {product.description ? (
                            <p className="extras-modal__item-desc">{product.description}</p>
                          ) : null}
                          <p className="extras-modal__item-price">{formatSom(product.price)}</p>
                        </div>

                        {count > 0 ? (
                          <div className="extras-modal__stepper">
                            <button
                              type="button"
                              className="extras-modal__stepper-btn"
                              onClick={() => onChange(product.id, Math.max(0, count - 1))}
                              aria-label={`${product.title} kamaytirish`}
                            >
                              <Minus className="size-4" />
                            </button>
                            <span className="extras-modal__stepper-value">{count}</span>
                            <button
                              type="button"
                              className="extras-modal__stepper-btn"
                              disabled={maxedOut}
                              onClick={() => onChange(product.id, count + 1)}
                              aria-label={`${product.title} oshirish`}
                            >
                              <Plus className="size-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="extras-modal__add"
                            disabled={maxedOut}
                            onClick={() => onChange(product.id, 1)}
                            aria-label={`${product.title} qo'shish`}
                          >
                            <Plus className="size-5" />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <footer className="extras-modal__footer">
              <div className="extras-modal__total">
                <span className="extras-modal__total-label">Jami:</span>
                <strong className="extras-modal__total-price">{formatSom(total)}</strong>
              </div>

              {selectedCount > 0 ? (
                <button type="button" className="extras-modal__confirm extras-modal__confirm--wide" onClick={onConfirm} disabled={confirming}>
                  {confirming ? "Qo'shilmoqda..." : "Savatchaga qo'shish"}
                  <ShoppingCart className="size-5" />
                </button>
              ) : (
                <button type="button" className="extras-modal__skip extras-modal__skip--wide" onClick={onSkip} disabled={confirming}>
                  O&apos;tkazib yuborish
                </button>
              )}
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
