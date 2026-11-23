import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { menuApi, ordersApi } from "../api/endpoints";
import EmptyState from "../components/EmptyState";
import ErrorAlert from "../components/ErrorAlert";
import Icon from "../components/Icon";
import ProductCard from "../components/ProductCard";
import SkeletonLoader from "../components/SkeletonLoader";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useNetwork } from "../context/NetworkStatusContext";
import { useFetch } from "../hooks/useFetch";
import { CATEGORY_LABELS, formatPeso } from "../utils/format";

export default function Home() {
  const { user } = useAuth();
  const { itemCount } = useCart();
  const { online } = useNetwork();
  const navigate = useNavigate();
  const [query, setQuery] = useState(""); // controlled search input

  // Public data (cacheable by the service worker, so Home still shows offline)
  const featured = useFetch((signal) => menuApi.products({ bestSeller: "true", limit: 8 }, signal), []);
  const categories = useFetch((signal) => menuApi.categories(signal), []);
  // Private data (never cached)
  const active = useFetch((signal) => ordersApi.list({ status: "active", limit: 1 }, signal), [user?.id], { enabled: Boolean(user) && online });
  const liveOrder = active.data?.[0];

  const onSearch = (e) => {
    e.preventDefault();
    navigate(query.trim() ? `/products?search=${encodeURIComponent(query.trim())}` : "/products");
  };

  return (
    <main className="page">
      <header className="home-header">
        <div className="home-header__who">
          <span className="avatar" aria-hidden="true">{user ? user.fullName[0] : "B"}</span>
          <h1>{user ? `Hi, ${user.fullName.split(" ")[0]}` : "Hi there"}</h1>
        </div>
        <div className="home-header__actions">
          {user ? (
            <Link to="/rewards" className="points-chip" aria-label={`${user.pointsBalance} points. Open rewards`}>{user.pointsBalance} pts</Link>
          ) : (
            <Link to="/login" className="btn btn--small btn--primary">Log in</Link>
          )}
          {user && <Link to="/notifications" className="icon-btn" aria-label="Notifications"><Icon name="bell" /></Link>}
          <Link to="/cart" className="icon-btn cart-btn" aria-label={`Cart, ${itemCount} items`}>
            <Icon name="bag" />
            {itemCount > 0 && <span className="cart-btn__count">{itemCount}</span>}
          </Link>
        </div>
      </header>

      <form className="search" role="search" onSubmit={onSearch}>
        <label htmlFor="home-search" className="sr-only">Search drinks</label>
        <Icon name="search" size={20} />
        <input id="home-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search drinks and pastries" autoComplete="off" />
      </form>

      {liveOrder && (
        <Link to={`/orders/${liveOrder.id}`} className="card live-card">
          <div className="live-card__top">
            <span className="live-card__dot" aria-hidden="true" />
            <span className="live-card__label">Live order {liveOrder.orderNumber}</span>
            {liveOrder.etaMinutes !== null && <span className="badge badge--info">Est. {liveOrder.etaMinutes} min</span>}
          </div>
          <p className="live-card__title"><StatusBadge status={liveOrder.status} /></p>
          <p className="muted">{liveOrder.items.map((i) => i.name).join(", ")} · {formatPeso(liveOrder.pricing.total)}</p>
        </Link>
      )}

      <section aria-labelledby="cat-title" className="section">
        <h2 id="cat-title" className="section__title">Pick a category</h2>
        <ul className="chips">
          {(categories.data || Object.keys(CATEGORY_LABELS).map((key) => ({ key, label: CATEGORY_LABELS[key] }))).map((c) => (
            <li key={c.key}><Link className="chip" to={`/products?category=${c.key}`}>{c.label}</Link></li>
          ))}
        </ul>
      </section>

      <Link to="/ai-assistant" className="card ai-banner">
        <Icon name="sparkle" size={26} />
        <div>
          <strong>Not sure what to order?</strong>
          <p className="muted">Tell our AI assistant what you're craving.</p>
        </div>
        <Icon name="chevron" size={20} />
      </Link>

      <section aria-labelledby="best-title" className="section">
        <div className="section__head">
          <h2 id="best-title" className="section__title">Best sellers</h2>
          <Link to="/products" className="link">See full menu</Link>
        </div>
        {featured.loading && <SkeletonLoader variant="grid" count={4} />}
        {featured.error && !featured.loading && (
          <ErrorAlert error={featured.error} message={!online ? "You're offline and the menu hasn't been saved on this device yet." : undefined} onRetry={featured.reload} />
        )}
        {!featured.loading && !featured.error && featured.data?.length === 0 && <EmptyState title="No best sellers yet" text="Check the full menu." />}
        {featured.data && featured.data.length > 0 && (
          <div className="product-grid">
            {featured.data.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </main>
  );
}
