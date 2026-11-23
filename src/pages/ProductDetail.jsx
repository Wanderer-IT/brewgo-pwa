import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { assetUrl } from "../api/client";
import { menuApi } from "../api/endpoints";
import EmptyState from "../components/EmptyState";
import ErrorAlert from "../components/ErrorAlert";
import Icon from "../components/Icon";
import PageHeader from "../components/PageHeader";
import QuantityStepper from "../components/QuantityStepper";
import SkeletonLoader from "../components/SkeletonLoader";
import { TextField } from "../components/Field";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import { useNetwork } from "../context/NetworkStatusContext";
import { useFetch } from "../hooks/useFetch";
import { formatPeso } from "../utils/format";
import { defaultOptions, priceFor } from "../utils/pricing";

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addItem, itemCount } = useCart();
  const favorites = useFavorites();
  const { online } = useNetwork();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: product, loading, error, reload } = useFetch((signal) => menuApi.product(id, signal), [id]);
  const [options, setOptions] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => { if (product) { setOptions(defaultOptions(product)); setQuantity(1); setNote(""); } }, [product]);
  const unitPrice = useMemo(() => (product ? priceFor(product, options) : 0), [product, options]);

  if (loading) return <main className="page"><PageHeader title="" back /><SkeletonLoader variant="detail" /></main>;
  if (error?.status === 404) {
    return <main className="page"><PageHeader title="Not found" back /><EmptyState icon="search" title="We couldn't find that item" action={<Link to="/products" className="btn btn--primary">Back to menu</Link>} /></main>;
  }
  if (error) return <main className="page"><PageHeader title="" back /><ErrorAlert error={error} message={!online ? "You're offline and this item isn't saved on your phone yet." : undefined} onRetry={reload} /></main>;
  if (!product) return null;

  const soldOut = !product.isAvailable;
  const fav = favorites.isFavorite(product.id);

  const handleAdd = async () => {
    if (!user) { navigate("/login", { state: { from: location } }); return; }
    setAdding(true);
    try { await addItem(product, { options, quantity, note: note.trim() }); } catch { /* toast already shown */ } finally { setAdding(false); }
  };

  return (
    <main className="page page--with-bar">
      <PageHeader
        title=""
        back
        right={user && (
          <button type="button" className={`icon-btn icon-btn--round${fav ? " is-on" : ""}`} aria-label={fav ? "Remove from favorites" : "Add to favorites"} aria-pressed={fav} disabled={!online} onClick={() => favorites.toggle(product.id)}>
            <Icon name="heart" filled={fav} />
          </button>
        )}
      />
      <img className="detail-hero" src={assetUrl(product.imageUrl)} alt={product.name} width="600" height="450" decoding="async" crossOrigin="anonymous" />
      <article>
        <div className="detail-title">
          <h1>{product.name}</h1>
          <p className="price price--lg">{formatPeso(unitPrice)}</p>
        </div>
        {product.description && <p className="muted">{product.description}</p>}
        {product.isBestSeller && <span className="badge badge--info">Best seller</span>}
        {product.lowStock && !soldOut && <span className="badge badge--warn">Few left</span>}
        {soldOut && <div className="alert alert--bad" role="alert"><p>This item is sold out right now.</p></div>}

        {product.optionGroups.map((group) => (
          <fieldset key={group.key} className="option-group">
            <legend>{group.label}</legend>
            <div className="option-group__choices">
              {group.choices.map((choice) => {
                const inputId = `opt-${group.key}-${choice.value}`;
                return (
                  <div key={choice.value} className="option">
                    <input id={inputId} type="radio" name={group.key} value={choice.value} checked={options[group.key] === choice.value} onChange={() => setOptions({ ...options, [group.key]: choice.value })} disabled={soldOut} />
                    <label htmlFor={inputId}>
                      {choice.label}
                      {choice.priceDelta > 0 && <small> +{formatPeso(choice.priceDelta)}</small>}
                    </label>
                  </div>
                );
              })}
            </div>
          </fieldset>
        ))}

        <TextField label="Note for the barista (optional)" value={note} maxLength={140} onChange={(e) => setNote(e.target.value)} placeholder="e.g. extra hot" hint={`${note.length}/140`} disabled={soldOut} />
      </article>

      <div className="action-bar">
        <QuantityStepper value={quantity} onChange={setQuantity} label="Quantity" disabled={soldOut} />
        <button type="button" className="btn btn--primary btn--grow" disabled={soldOut || adding || !online} onClick={handleAdd} title={online ? undefined : "Reconnect to add items"}>
          {!online ? "Offline" : adding ? "Adding..." : `Add to cart · ${formatPeso(unitPrice * quantity)}`}
        </button>
        {itemCount > 0 && <Link to="/cart" className="icon-btn icon-btn--round icon-btn--bordered" aria-label={`View cart, ${itemCount} items`}><Icon name="bag" /></Link>}
      </div>
    </main>
  );
}
