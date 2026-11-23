import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ordersApi } from "../api/endpoints";
import BottomSheet from "../components/BottomSheet";
import EmptyState from "../components/EmptyState";
import ErrorAlert from "../components/ErrorAlert";
import PageHeader from "../components/PageHeader";
import SkeletonLoader from "../components/SkeletonLoader";
import StatusBadge from "../components/StatusBadge";
import { useCart } from "../context/CartContext";
import { useNetwork } from "../context/NetworkStatusContext";
import { useToast } from "../context/ToastContext";
import { usePagedList } from "../hooks/usePagedList";
import { getErrorMessage } from "../utils/errors";
import { formatPeso, relativeDay } from "../utils/format";

export default function Orders() {
  const [tab, setTab] = useState("active");
  const { online } = useNetwork();
  const { refresh } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ active: 0, past: 0 });
  const [summary, setSummary] = useState(null);
  const [codeOrder, setCodeOrder] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const list = usePagedList((page, signal) => ordersApi.list({ status: tab, page, limit: 5 }, signal), tab, { enabled: online });

  useEffect(() => { if (list.meta?.counts) setCounts(list.meta.counts); if (list.meta?.summary) setSummary(list.meta.summary); }, [list.meta]);

  // Live orders change: look again every 15 seconds while this tab is open (cleanup stops the timer).
  useEffect(() => {
    if (tab !== "active" || !online) return undefined;
    const timer = setInterval(() => list.reload(), 15000);
    return () => clearInterval(timer);
  }, [tab, online]); // eslint-disable-line react-hooks/exhaustive-deps

  const reorder = async (order) => {
    setBusyId(order.id);
    try {
      const { data } = await ordersApi.reorder(order.id);
      await refresh().catch(() => {});
      if (data.skipped.length) toast(`Added to cart. ${data.skipped.length} item(s) are unavailable right now.`, "warn");
      navigate("/cart");
    } catch (e) { toast(getErrorMessage(e), "bad"); } finally { setBusyId(null); }
  };

  return (
    <main className="page">
      <PageHeader title="Orders" subtitle="Track and reorder" />

      <div className="seg" role="tablist" aria-label="Order list">
        {[{ key: "active", label: `Active (${counts.active})` }, { key: "past", label: `Past orders (${counts.past})` }].map((t) => (
          <div key={t.key} className="seg__item">
            <button type="button" role="tab" aria-selected={tab === t.key} className={`seg__btn${tab === t.key ? " is-active" : ""}`} onClick={() => setTab(t.key)}>{t.label}</button>
          </div>
        ))}
      </div>

      {!online && <div className="alert alert--warn" role="status"><p>Your orders need an internet connection. Reconnect to see the latest.</p></div>}
      {summary && online && (
        <div className="card summary-banner">
          <strong>{summary.ordersThisYear} orders this year</strong>
          <span className="muted">{formatPeso(summary.totalSpent)} spent · +{summary.pointsCollected} pts collected</span>
          <span className="badge badge--info">{summary.tier}</span>
        </div>
      )}

      {list.status === "loading" && <SkeletonLoader variant="list" count={3} />}
      {list.status === "error" && <ErrorAlert error={list.error} onRetry={list.reload} />}
      {list.status === "ready" && list.items.length === 0 && (
        <EmptyState icon="bag" title={tab === "active" ? "No active orders" : "No past orders yet"} text="Your orders will show up here." action={<Link to="/products" className="btn btn--primary">Order something</Link>} />
      )}

      <ul className="order-list">
        {list.items.map((o) => (
          <li key={o.id} className={`card order-card${o.isActive ? " order-card--live" : ""}`}>
            <Link to={`/orders/${o.id}`} className="order-card__link">
              <div className="row row--between">
                <span className="muted">{o.isActive ? `Live order ${o.orderNumber}` : `${relativeDay(o.createdAt)} · ${o.status === "completed" ? "Completed" : "Cancelled"}`}</span>
                {o.isActive ? (o.etaMinutes !== null ? <span className="badge badge--info">Est. {o.etaMinutes} min</span> : <StatusBadge status={o.status} />) : <span className="badge">{o.orderNumber}</span>}
              </div>
              {o.isActive && <p className="order-card__status"><StatusBadge status={o.status} /></p>}
              <p className="order-card__items">{o.items.map((i) => `${i.name}${i.quantity > 1 ? ` x${i.quantity}` : ""}`).join(", ")}</p>
              <p className="muted">{o.branchName} · {o.itemCount} items</p>
              <div className="row row--between">
                <strong className="price">{formatPeso(o.pricing.total)}</strong>
                {o.pointsEarned > 0 && <span className="badge badge--ok">+{o.pointsEarned} pts</span>}
              </div>
            </Link>
            <div className="row order-card__actions">
              {!o.isActive && o.status === "completed" && (
                <button type="button" className="btn btn--primary btn--grow" disabled={busyId === o.id || !online} onClick={() => reorder(o)}>{busyId === o.id ? "Adding..." : "Reorder in 1-Tap"}</button>
              )}
              {o.isActive && o.status !== "pending_payment" && <button type="button" className="btn btn--ghost btn--grow" onClick={() => setCodeOrder(o)}>Show pickup code</button>}
              {o.status === "pending_payment" && <Link to={`/orders/${o.id}`} className="btn btn--primary btn--grow">Finish payment</Link>}
            </div>
          </li>
        ))}
      </ul>
      {list.hasMore && <button type="button" className="btn btn--ghost btn--block" onClick={list.loadMore} disabled={list.status === "more"}>{list.status === "more" ? "Loading..." : "Load more"}</button>}

      <p className="muted help-line">Need help with an order? <Link to="/contact" className="link">Contact us</Link></p>

      <BottomSheet open={Boolean(codeOrder)} onClose={() => setCodeOrder(null)} title="Pickup code">
        {codeOrder && (
          <div className="code-box">
            <p className="muted">Show this code to the barista at {codeOrder.branchName}.</p>
            <p className="code-box__code" aria-label={`Pickup code ${codeOrder.pickupCode}`}>{codeOrder.pickupCode}</p>
          </div>
        )}
      </BottomSheet>
    </main>
  );
}
