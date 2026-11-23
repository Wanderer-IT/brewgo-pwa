import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ordersApi } from "../api/endpoints";
import ErrorAlert from "../components/ErrorAlert";
import Icon from "../components/Icon";
import SkeletonLoader from "../components/SkeletonLoader";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useNetwork } from "../context/NetworkStatusContext";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../utils/errors";
import { formatPeso } from "../utils/format";

// /payment/success and /payment/cancelled are INFORMATIONAL ONLY.
// They never decide that an order is paid. They ask the server what the payment provider says,
// then show the order's real status.
export default function PaymentResult({ variant }) {
  const [params] = useSearchParams();
  const orderId = params.get("orderId");
  const { refreshProfile } = useAuth();
  const { refresh } = useCart();
  const { online } = useNetwork();
  const { toast } = useToast();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(Boolean(orderId));
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!orderId || !online) { setChecking(false); return undefined; }
    const controller = new AbortController();
    let timer;
    let tries = 0;

    async function check() {
      setChecking(true);
      try {
        // 1) Ask the server to verify with Maya (the webhook may be late or missed). Failures here are not fatal.
        try { await ordersApi.reconcile(orderId); } catch (e) { if (e.status === 404) throw e; }
        // 2) Read the authoritative order.
        const { data } = await ordersApi.get(orderId, controller.signal);
        setOrder(data);
        setError(null);
        if (data.status === "pending_payment" && variant === "success" && tries < 6) {
          tries += 1;
          timer = setTimeout(check, 2500); // still confirming: look again shortly
        } else {
          setChecking(false);
        }
      } catch (e) {
        if (e.name === "AbortError") return;
        setError(e);
        setChecking(false);
      }
    }
    check();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [orderId, variant, attempt, online]);

  const status = order?.status;
  const paidish = ["paid", "preparing", "ready", "completed"].includes(status);
  useEffect(() => { if (paidish) { refreshProfile().catch(() => {}); refresh().catch(() => {}); } }, [paidish]); // eslint-disable-line react-hooks/exhaustive-deps

  const cancelOrder = async () => {
    setBusy(true);
    try { const { data } = await ordersApi.cancel(orderId); setOrder(data); refresh().catch(() => {}); toast("Order cancelled"); }
    catch (e) {
      if (e.status === 409) { setAttempt((a) => a + 1); toast(`${getErrorMessage(e)} Checking the latest status...`, "warn"); }
      else toast(getErrorMessage(e), "bad");
    } finally { setBusy(false); }
  };

  let heading = "Checking your payment";
  let tone = "info";
  let icon = "clock";
  let text = "One moment while we confirm with the payment provider.";
  if (paidish) { heading = "Payment received"; tone = "ok"; icon = "check"; text = "Thank you! Your order is in the queue."; }
  else if (status === "cancelled") { heading = "Order cancelled"; tone = "bad"; icon = "close"; text = "This order was cancelled and you were not charged."; }
  else if (status === "pending_payment" && variant === "cancelled") { heading = "Payment not completed"; tone = "warn"; icon = "alert"; text = "We haven't received a payment for this order yet. You can try again or cancel the order."; }
  else if (status === "pending_payment") { heading = "Confirming your payment"; tone = "info"; icon = "clock"; text = "We haven't received confirmation yet. This can take a few seconds."; }

  return (
    <main className="page page--center">
      {!orderId && <ErrorAlert message="This page needs an order number. Open it from your order history." />}
      {orderId && !online && <div className="alert alert--warn" role="status"><Icon name="cloudOff" size={18} /><p>You're offline. Reconnect to confirm your payment.</p></div>}
      {error && <ErrorAlert error={error} onRetry={() => setAttempt((a) => a + 1)} />}
      {checking && !order && <SkeletonLoader variant="detail" />}

      {order && (
        <section className="card result" aria-live="polite">
          <div className={`result__icon result__icon--${tone}`}><Icon name={icon} size={34} /></div>
          <h1>{heading}</h1>
          <p className="muted">{text}</p>
          <dl className="facts">
            <div><dt>Order</dt><dd>{order.orderNumber}</dd></div>
            <div><dt>Status</dt><dd><StatusBadge status={order.status} /></dd></div>
            <div><dt>Total</dt><dd>{formatPeso(order.pricing.total)}</dd></div>
            {paidish && order.pointsEarned > 0 && <div><dt>Points earned</dt><dd>+{order.pointsEarned} pts</dd></div>}
          </dl>
          {checking && status === "pending_payment" && <p className="muted" role="status">Still checking...</p>}

          <div className="stack">
            {paidish && <Link to={`/orders/${order.id}`} className="btn btn--primary btn--block">Track my order</Link>}
            {status === "pending_payment" && (
              <>
                {order.payment.checkoutUrl && <a href={order.payment.checkoutUrl} className="btn btn--primary btn--block">Pay now</a>}
                <button type="button" className="btn btn--ghost btn--block" onClick={() => setAttempt((a) => a + 1)} disabled={checking}>Check again</button>
                {variant === "cancelled" && <button type="button" className="btn btn--ghost btn--block" onClick={cancelOrder} disabled={busy}>{busy ? "Cancelling..." : "Cancel this order"}</button>}
              </>
            )}
            {status === "cancelled" && <Link to="/cart" className="btn btn--primary btn--block">Back to cart</Link>}
            <Link to="/products" className="btn btn--ghost btn--block">Back to menu</Link>
          </div>
          <small className="muted">This page shows what our server confirmed, not what the address bar says.</small>
        </section>
      )}
    </main>
  );
}
