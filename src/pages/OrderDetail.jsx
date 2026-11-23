import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ordersApi } from "../api/endpoints";
import BottomSheet from "../components/BottomSheet";
import EmptyState from "../components/EmptyState";
import ErrorAlert from "../components/ErrorAlert";
import PageHeader from "../components/PageHeader";
import SkeletonLoader from "../components/SkeletonLoader";
import StatusBadge from "../components/StatusBadge";
import { useNetwork } from "../context/NetworkStatusContext";
import { useToast } from "../context/ToastContext";
import { useFetch } from "../hooks/useFetch";
import { getErrorMessage } from "../utils/errors";
import { formatDateTime, formatPeso, statusLabel } from "../utils/format";

const STEPS = ["pending_payment", "paid", "preparing", "ready", "completed"];
const PAYMENT_LABELS = { pending: "Waiting for payment", paid: "Paid", pay_on_pickup: "Pay at the counter", cancelled: "Cancelled", refund_pending: "Refund pending" };
const METHOD_LABELS = { ewallet: "Maya / E-wallet", card: "Card", cash: "Cash" };

export default function OrderDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { online } = useNetwork();
  const { toast } = useToast();
  const { data: order, loading, error, reload, setData } = useFetch((signal) => ordersApi.get(id, signal), [id], { enabled: online });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // Poll while the order is still moving (cleanup clears the timer when leaving).
  useEffect(() => {
    if (!order?.isActive || !online) return undefined;
    const timer = setInterval(reload, 10000);
    return () => clearInterval(timer);
  }, [order?.isActive, online, reload]);

  const cancel = async () => {
    setBusy(true);
    try { const { data } = await ordersApi.cancel(id); setData(data); toast("Order cancelled"); setConfirmOpen(false); }
    catch (e) {
      if (e.status === 409) { setConfirmOpen(false); reload(); toast(`${getErrorMessage(e)} We refreshed the order for you.`, "warn"); } // illegal state: show the latest status
      else toast(getErrorMessage(e), "bad");
    } finally { setBusy(false); }
  };

  if (!online && !order) return <main className="page"><PageHeader title="Order" back /><div className="alert alert--warn" role="status"><p>Reconnect to see this order.</p></div></main>;
  if (loading && !order) return <main className="page"><PageHeader title="Order" back /><SkeletonLoader variant="detail" /></main>;
  if (error?.status === 404) return <main className="page"><PageHeader title="Order" back /><EmptyState icon="bag" title="Order not found" action={<Link to="/orders" className="btn btn--primary">My orders</Link>} /></main>;
  if (error && !order) return <main className="page"><PageHeader title="Order" back /><ErrorAlert error={error} onRetry={reload} /></main>;
  if (!order) return null;

  const stepIndex = STEPS.indexOf(order.status);
  const cancelled = order.status === "cancelled";

  return (
    <main className="page">
      <PageHeader title={order.orderNumber} subtitle={formatDateTime(order.createdAt)} back right={<StatusBadge status={order.status} />} />
      {location.state?.justPlaced && <div className="alert alert--ok" role="status"><p>Order placed! Pay at the counter when you pick it up.</p></div>}
      {order.isActive && order.etaMinutes !== null && order.status !== "pending_payment" && <div className="card eta-card"><strong>Est. {order.etaMinutes} min</strong><span className="muted">{statusLabel(order.status)}</span></div>}

      {!cancelled && (
        <ol className="steps" aria-label="Order progress">
          {STEPS.filter((s) => order.payment.method !== "cash" || s !== "pending_payment").map((s) => {
            const i = STEPS.indexOf(s);
            return <li key={s} className={i < stepIndex ? "is-done" : i === stepIndex ? "is-current" : ""} aria-current={i === stepIndex ? "step" : undefined}><span>{statusLabel(s)}</span></li>;
          })}
        </ol>
      )}

      {order.status === "pending_payment" && order.payment.checkoutUrl && (
        <div className="card stack">
          <p>Your order is waiting for payment. Stock is held for a limited time.</p>
          <a href={order.payment.checkoutUrl} className="btn btn--primary btn--block">Pay now</a>
        </div>
      )}

      <section className="card" aria-labelledby="items-title">
        <h2 id="items-title" className="section__title">Items</h2>
        <ul className="plain-list">
          {order.items.map((item, idx) => (
            <li key={`${item.productId}-${idx}`} className="list-row">
              <div><strong>{item.name}</strong> <span className="badge">x{item.quantity}</span>{item.optionLabels.length > 0 && <p className="muted">{item.optionLabels.join(" · ")}</p>}{item.note && <p className="muted">Note: {item.note}</p>}</div>
              <span className="price">{formatPeso(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card summary" aria-label="Price breakdown">
        <div className="summary__row"><span>Subtotal</span><span>{formatPeso(order.pricing.subtotal)}</span></div>
        {order.pricing.discount > 0 && <div className="summary__row summary__row--good"><span>Discount {order.coupon ? `(${order.coupon.code})` : ""}</span><span>-{formatPeso(order.pricing.discount)}</span></div>}
        {order.pricing.deliveryFee > 0 && <div className="summary__row"><span>Delivery fee</span><span>{formatPeso(order.pricing.deliveryFee)}</span></div>}
        <div className="summary__row summary__row--total"><span>Total</span><span>{formatPeso(order.pricing.total)}</span></div>
      </section>

      <section className="card" aria-labelledby="info-title">
        <h2 id="info-title" className="section__title">Details</h2>
        <dl className="facts">
          <div><dt>{order.fulfillment === "pickup" ? "Pickup at" : "Delivery from"}</dt><dd>{order.branchName}</dd></div>
          {order.fulfillment === "pickup" ? <div><dt>Pickup time</dt><dd>{order.pickupTime === "ASAP" ? "As soon as possible" : order.pickupTime}</dd></div> : <div><dt>Deliver to</dt><dd>{order.deliveryAddress}</dd></div>}
          <div><dt>Payment</dt><dd>{METHOD_LABELS[order.payment.method]} · {PAYMENT_LABELS[order.payment.status] || order.payment.status}</dd></div>
          {order.pointsEarned > 0 && <div><dt>Points earned</dt><dd>+{order.pointsEarned} pts</dd></div>}
          {order.isActive && order.status !== "pending_payment" && <div><dt>Pickup code</dt><dd><strong>{order.pickupCode}</strong></dd></div>}
        </dl>
      </section>

      <div className="stack">
        {order.canCancel && <button type="button" className="btn btn--ghost btn--block btn--danger" disabled={!online} onClick={() => setConfirmOpen(true)}>Cancel order</button>}
        <Link to={`/contact?orderId=${order.id}`} className="btn btn--ghost btn--block">Need help? Contact us</Link>
      </div>

      <BottomSheet open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Cancel this order?">
        <div className="stack">
          <p>{order.payment.status === "paid" ? "Your payment will be refunded by our team." : "You won't be charged."} Items go back on the shelf.</p>
          <button type="button" className="btn btn--danger btn--block" onClick={cancel} disabled={busy}>{busy ? "Cancelling..." : "Yes, cancel order"}</button>
          <button type="button" className="btn btn--ghost btn--block" onClick={() => setConfirmOpen(false)}>Keep order</button>
        </div>
      </BottomSheet>
    </main>
  );
}
