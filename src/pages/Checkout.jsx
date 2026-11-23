import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { checkoutApi, menuApi, rewardsApi } from "../api/endpoints";
import ErrorAlert from "../components/ErrorAlert";
import Icon from "../components/Icon";
import PageHeader from "../components/PageHeader";
import { TextField } from "../components/Field";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useNetwork } from "../context/NetworkStatusContext";
import { useFetch } from "../hooks/useFetch";
import { fieldErrorsFrom, getErrorMessage } from "../utils/errors";
import { formatPeso } from "../utils/format";
import { newIdempotencyKey } from "../utils/idempotency";
import { validateAddress } from "../utils/validators";

const PAYMENTS = [
  { key: "ewallet", label: "Maya / E-wallet", hint: "Pay with your Maya wallet", icon: "wallet" },
  { key: "card", label: "Credit or debit card", hint: "Visa or Mastercard, processed by Maya", icon: "card" },
  { key: "cash", label: "Cash", hint: "Pay at the counter when you pick up", icon: "cash", pickupOnly: true },
];

export default function Checkout() {
  const { user } = useAuth();
  const { cart, refresh, applyCoupon, removeCoupon } = useCart();
  const { online } = useNetwork();
  const navigate = useNavigate();

  const [fulfillment, setFulfillment] = useState("pickup");
  const [paymentMethod, setPaymentMethod] = useState("ewallet");
  const [branchId, setBranchId] = useState(1);
  const [pickupMode, setPickupMode] = useState("ASAP");
  const [pickupTime, setPickupTime] = useState("");
  const [address, setAddress] = useState(user?.address || "");
  const [note, setNote] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [stockProblems, setStockProblems] = useState([]);
  const keyRef = useRef(null); // the Idempotency-Key of the current attempt

  const branches = useFetch((signal) => menuApi.branches(signal), []);
  const coupons = useFetch((signal) => rewardsApi.coupons({ status: "active" }, signal), [], { enabled: online });

  // Ask the server for the price with the chosen fulfillment (delivery adds a fee). The server is the only calculator.
  useEffect(() => {
    if (!online) return undefined;
    const controller = new AbortController();
    refresh(fulfillment, controller.signal).catch(() => {});
    return () => controller.abort();
  }, [fulfillment, online, refresh]);

  // Cash only works for pickup.
  useEffect(() => { if (fulfillment === "delivery" && paymentMethod === "cash") setPaymentMethod("ewallet"); }, [fulfillment, paymentMethod]);

  // Any change to the order means a NEW attempt, so it gets a NEW key. Retrying the SAME order reuses the key.
  useEffect(() => { keyRef.current = null; }, [fulfillment, paymentMethod, branchId, pickupMode, pickupTime, address, note, cart.coupon?.code]);

  const empty = cart.items.length === 0;

  const applyCode = async (code) => {
    setCouponError("");
    try { await applyCoupon(code); await refresh(fulfillment); setCouponCode(""); } catch (err) { setCouponError(getErrorMessage(err)); }
  };
  const dropCoupon = async () => { try { await removeCoupon(); await refresh(fulfillment); } catch { /* toast shown */ } };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || !online) return; // the button is disabled while in flight, and we guard here as well
    const errors = {};
    if (fulfillment === "delivery") { const msg = validateAddress(address); if (msg) errors.deliveryAddress = msg; }
    if (fulfillment === "pickup" && pickupMode === "SCHEDULED" && !pickupTime) errors.pickupTime = "Choose a pickup time";
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setSubmitting(true);
    setError(null);
    setStockProblems([]);
    keyRef.current = keyRef.current || newIdempotencyKey();
    const body = {
      fulfillment, paymentMethod, branchId: Number(branchId),
      ...(fulfillment === "pickup" ? { pickupTime: pickupMode === "ASAP" ? "ASAP" : pickupTime } : { deliveryAddress: address.trim() }),
      ...(cart.coupon ? { couponCode: cart.coupon.code } : {}), // the server re-validates it; the client never decides the discount
      ...(note.trim() ? { note: note.trim() } : {}),
    };
    try {
      const { data } = await checkoutApi.submit(body, keyRef.current);
      if (data.payment.checkoutUrl) {
        window.location.href = data.payment.checkoutUrl; // hand over to Maya's hosted payment page (stay "submitting" while leaving)
        return;
      }
      await refresh().catch(() => {});
      navigate(`/orders/${data.order.id}`, { replace: true, state: { justPlaced: true } });
    } catch (err) {
      if (err.code && err.code.startsWith("COUPON_")) {
        setCouponError(getErrorMessage(err)); // shown inline in the coupon box; the coupon is dropped and the customer can pay without it
        setError(null);
      } else setError(err);
      setFieldErrors(fieldErrorsFrom(err));
      if (err.code === "INSUFFICIENT_STOCK" && Array.isArray(err.details)) setStockProblems(err.details);
      if (err.code === "CART_EMPTY") navigate("/cart", { replace: true });
      if (err.status === 409 || err.status === 422) refresh(fulfillment).catch(() => {});
      setSubmitting(false);
    }
  };

  if (empty && !submitting) {
    return (
      <main className="page">
        <PageHeader title="Checkout" back />
        <div className="alert alert--warn" role="status"><p>Your cart is empty. <Link to="/products" className="link">Browse the menu</Link></p></div>
      </main>
    );
  }

  const total = cart.pricing.total;
  const cashDisabled = fulfillment === "delivery";

  return (
    <main className="page page--with-bar">
      <PageHeader title="Checkout" subtitle="Cart summary & payment" back />
      <form onSubmit={handleSubmit} noValidate className="stack">
        <div className="seg" role="radiogroup" aria-label="How do you want your order?">
          {[{ key: "pickup", label: "Pickup (10-15m)", icon: "store" }, { key: "delivery", label: "Delivery (30-40m)", icon: "pin" }].map((o) => (
            <div key={o.key} className="seg__item">
              <input id={`ful-${o.key}`} type="radio" name="fulfillment" value={o.key} checked={fulfillment === o.key} onChange={() => setFulfillment(o.key)} />
              <label htmlFor={`ful-${o.key}`}><Icon name={o.icon} size={18} />{o.label}</label>
            </div>
          ))}
        </div>

        <section className="card" aria-labelledby="sum-title">
          <div className="section__head"><h2 id="sum-title" className="section__title">Order summary <span className="muted">({cart.itemCount} items)</span></h2><Link to="/cart" className="link">Edit</Link></div>
          <ul className="plain-list">
            {cart.items.map((item) => (
              <li key={item.itemId} className="list-row">
                <div><strong>{item.name}</strong> <span className="badge">x{item.quantity}</span>{item.optionLabels?.length > 0 && <p className="muted">{item.optionLabels.join(" · ")}</p>}</div>
                <span className="price">{formatPeso(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
        </section>

        {fulfillment === "pickup" ? (
          <section className="card stack" aria-labelledby="pick-title">
            <h2 id="pick-title" className="section__title">Pickup</h2>
            <TextField as="select" label="Branch" value={branchId} onChange={(e) => setBranchId(e.target.value)} error={fieldErrors.branchId}>
              {(branches.data || [{ id: 1, name: "BGC High Street" }]).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </TextField>
            <div className="seg seg--light" role="radiogroup" aria-label="Pickup time">
              <div className="seg__item"><input id="pt-asap" type="radio" name="pt" checked={pickupMode === "ASAP"} onChange={() => setPickupMode("ASAP")} /><label htmlFor="pt-asap">ASAP (10 min)</label></div>
              <div className="seg__item"><input id="pt-sched" type="radio" name="pt" checked={pickupMode === "SCHEDULED"} onChange={() => setPickupMode("SCHEDULED")} /><label htmlFor="pt-sched">Pick a time</label></div>
            </div>
            {pickupMode === "SCHEDULED" && <TextField label="Pickup time" type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} error={fieldErrors.pickupTime} />}
          </section>
        ) : (
          <section className="card stack" aria-labelledby="del-title">
            <h2 id="del-title" className="section__title">Delivery address</h2>
            <TextField as="textarea" rows={3} label="Where should we bring it?" value={address} onChange={(e) => setAddress(e.target.value)} error={fieldErrors.deliveryAddress} maxLength={200} />
          </section>
        )}

        <fieldset className="card pay-methods">
          <legend className="section__title">Payment method <span className="badge badge--ok">Secure</span></legend>
          {PAYMENTS.map((p) => {
            const disabled = p.pickupOnly && cashDisabled;
            return (
              <div key={p.key} className={`radio-card${disabled ? " is-disabled" : ""}`}>
                <input id={`pay-${p.key}`} type="radio" name="payment" value={p.key} checked={paymentMethod === p.key} disabled={disabled} onChange={() => setPaymentMethod(p.key)} />
                <label htmlFor={`pay-${p.key}`}>
                  <Icon name={p.icon} size={22} />
                  <span><strong>{p.label}</strong><small>{disabled ? "Pickup orders only" : p.hint}</small></span>
                </label>
              </div>
            );
          })}
        </fieldset>

        <section className="card stack" aria-labelledby="cp-title">
          <h2 id="cp-title" className="section__title">Coupon</h2>
          {cart.coupon ? (
            <div className="row row--between"><p><strong>{cart.coupon.code}</strong> <span className="muted">saves {formatPeso(cart.coupon.discount)}</span></p><button type="button" className="btn btn--small btn--ghost" onClick={dropCoupon}>Remove</button></div>
          ) : (
            <>
              <div className="coupon-form">
                <div className={`field ${couponError ? "field--error" : ""}`}>
                  <label htmlFor="co-code" className="sr-only">Coupon code</label>
                  <input id="co-code" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Coupon code" maxLength={32} />
                </div>
                <button type="button" className="btn btn--ghost" onClick={() => (couponCode.trim() ? applyCode(couponCode.trim()) : setCouponError("Enter a coupon code"))}>Apply</button>
              </div>
              {couponError && <small className="field__error" role="alert">{couponError}</small>}
              {cart.couponWarning && <small className="field__error" role="alert">{cart.couponWarning.message}</small>}
              {coupons.data?.length > 0 && (
                <ul className="chips chips--scroll" aria-label="Your coupons">
                  {coupons.data.map((c) => <li key={c.id}><button type="button" className="chip" onClick={() => applyCode(c.code)}>{c.title}</button></li>)}
                </ul>
              )}
            </>
          )}
        </section>

        <TextField label="Note for the barista (optional)" value={note} maxLength={140} onChange={(e) => setNote(e.target.value)} />

        <section className="card summary" aria-label="Price breakdown">
          <div className="summary__row"><span>Subtotal</span><span>{formatPeso(cart.pricing.subtotal)}</span></div>
          {cart.pricing.discount > 0 && <div className="summary__row summary__row--good"><span>Discount</span><span>-{formatPeso(cart.pricing.discount)}</span></div>}
          <div className="summary__row"><span>{fulfillment === "delivery" ? "Delivery fee" : "Pickup"}</span><span>{cart.pricing.deliveryFee > 0 ? formatPeso(cart.pricing.deliveryFee) : "Free"}</span></div>
          <div className="summary__row summary__row--total"><span>Total</span><span>{formatPeso(total)}</span></div>
          <small className="muted">The final amount is confirmed by our server when you place the order.</small>
        </section>

        {error && <ErrorAlert error={error} />}
        {stockProblems.length > 0 && (
          <ul className="alert alert--bad plain-list" role="alert">
            {stockProblems.map((p) => <li key={p.productId}>{p.name}: you asked for {p.requested}, only {p.available} left.</li>)}
            <li><Link to="/cart" className="link">Review your cart</Link> (we've refreshed it with the latest stock)</li>
          </ul>
        )}

        <div className="action-bar action-bar--column">
          {!online && <small className="muted">Checkout needs an internet connection.</small>}
          <button type="submit" className="btn btn--primary btn--block" disabled={submitting || !online} title={online ? undefined : "Reconnect to place your order"}>
            {submitting ? "Please wait..." : paymentMethod === "cash" ? `Place order · ${formatPeso(total)}` : `Pay ${formatPeso(total)}`}
          </button>
        </div>
      </form>
    </main>
  );
}
