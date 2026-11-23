import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { assetUrl } from "../api/client";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";
import PageHeader from "../components/PageHeader";
import QuantityStepper from "../components/QuantityStepper";
import SkeletonLoader from "../components/SkeletonLoader";
import { useCart } from "../context/CartContext";
import { useNetwork } from "../context/NetworkStatusContext";
import { formatPeso } from "../utils/format";
import { getErrorMessage } from "../utils/errors";

export default function Cart() {
  const { cart, loading, stale, refresh, setQuantity, removeItem, applyCoupon, removeCoupon } = useCart();
  const { online } = useNetwork();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [applying, setApplying] = useState(false);

  // Always show fresh server data when the page opens (the saved copy is only a fallback).
  useEffect(() => {
    const controller = new AbortController();
    refresh("pickup", controller.signal).catch(() => {});
    return () => controller.abort();
  }, [refresh]);

  const submitCoupon = async (e) => {
    e.preventDefault();
    if (!code.trim()) { setCouponError("Enter a coupon code"); return; }
    setApplying(true);
    setCouponError("");
    try { await applyCoupon(code.trim()); setCode(""); } catch (error) { setCouponError(getErrorMessage(error)); } finally { setApplying(false); }
  };

  const empty = cart.items.length === 0;
  const isTemp = (item) => String(item.itemId).startsWith("tmp-");

  return (
    <main className="page page--with-bar">
      <PageHeader title="Your cart" subtitle={empty ? "Nothing here yet" : `${cart.itemCount} item${cart.itemCount === 1 ? "" : "s"}`} back />

      {stale && <div className="alert alert--warn" role="status"><Icon name="cloudOff" size={18} /><p>Showing your saved cart. Prices update when you're back online.</p></div>}
      {loading && empty && <SkeletonLoader variant="list" count={3} />}

      {!loading && empty && (
        <EmptyState icon="bag" title="Your cart is empty" text="Add a drink or a pastry to get started." action={<Link to="/products" className="btn btn--primary">Browse the menu</Link>} />
      )}

      {!empty && (
        <>
          <ul className="cart-list">
            {cart.items.map((item) => (
              <li key={item.itemId} className="card cart-line">
                <img src={assetUrl(item.imageUrl)} alt="" width="600" height="450" loading="lazy" decoding="async" crossOrigin="anonymous" className="cart-line__img" />
                <div className="cart-line__body">
                  <h2>{item.name}</h2>
                  {item.optionLabels?.length > 0 && <p className="muted">{item.optionLabels.join(" · ")}</p>}
                  {item.note && <p className="muted">Note: {item.note}</p>}
                  {item.issues?.map((issue) => <p key={issue.code} className="field__error" role="alert">{issue.message}</p>)}
                  <div className="cart-line__foot">
                    <QuantityStepper value={item.quantity} label={`${item.name} quantity`} disabled={isTemp(item) || !online} onChange={(q) => setQuantity(item.itemId, q).catch(() => {})} />
                    <strong className="price">{formatPeso(item.lineTotal)}</strong>
                  </div>
                </div>
                <button type="button" className="icon-btn cart-line__remove" aria-label={`Remove ${item.name}`} disabled={isTemp(item) || !online} onClick={() => removeItem(item.itemId).catch(() => {})}><Icon name="trash" size={20} /></button>
              </li>
            ))}
          </ul>

          <section className="card" aria-labelledby="coupon-title">
            <h2 id="coupon-title" className="section__title">Coupon</h2>
            {cart.coupon ? (
              <div className="row row--between">
                <p><strong>{cart.coupon.code}</strong> <span className="muted">· {cart.coupon.title}</span></p>
                <button type="button" className="btn btn--small btn--ghost" disabled={!online} onClick={() => removeCoupon().catch(() => {})}>Remove</button>
              </div>
            ) : (
              <form onSubmit={submitCoupon} className="coupon-form" noValidate>
                <div className={`field ${couponError ? "field--error" : ""}`}>
                  <label htmlFor="coupon-code" className="sr-only">Coupon code</label>
                  <input id="coupon-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Enter coupon code" maxLength={32} autoCapitalize="characters" aria-invalid={couponError ? "true" : undefined} aria-describedby={couponError ? "coupon-err" : undefined} />
                </div>
                <button type="submit" className="btn btn--ghost" disabled={applying || !online}>{applying ? "Checking..." : "Apply"}</button>
              </form>
            )}
            {couponError && <small id="coupon-err" className="field__error" role="alert">{couponError}</small>}
            {cart.couponWarning && <small className="field__error" role="alert">{cart.couponWarning.message}</small>}
          </section>

          <section className="card summary" aria-label="Order summary">
            <div className="summary__row"><span>Subtotal</span><span>{formatPeso(cart.pricing.subtotal)}</span></div>
            {cart.pricing.discount > 0 && <div className="summary__row summary__row--good"><span>Discount</span><span>-{formatPeso(cart.pricing.discount)}</span></div>}
            <div className="summary__row muted"><span>Delivery</span><span>Chosen at checkout</span></div>
            <div className="summary__row summary__row--total"><span>Total</span><span>{formatPeso(cart.pricing.total)}</span></div>
          </section>

          <div className="action-bar action-bar--column">
            {!online && <small className="muted">Reconnect to check out.</small>}
            <button type="button" className="btn btn--primary btn--block" disabled={!online || cart.hasIssues || stale} onClick={() => navigate("/checkout")} title={online ? undefined : "Checkout needs an internet connection"}>
              Checkout · {formatPeso(cart.pricing.total)}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
