import { Link, useLocation, useNavigate } from "react-router-dom";
import { assetUrl } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import { useNetwork } from "../context/NetworkStatusContext";
import { useToast } from "../context/ToastContext";
import { formatPeso } from "../utils/format";
import Icon from "./Icon";

// Reusable UI primitive: data comes in through props, actions go out through context.
export default function ProductCard({ product }) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const favorites = useFavorites();
  const { online } = useNetwork();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const soldOut = !product.isAvailable;
  const needsLogin = () => { navigate("/login", { state: { from: location } }); toast("Log in to order", "warn"); };

  const quickAdd = () => {
    if (!user) return needsLogin();
    addItem(product).catch(() => {});
  };

  return (
    <article className={`card product-card${soldOut ? " is-soldout" : ""}`}>
      <Link to={`/products/${product.id}`} className="product-card__media" aria-label={`${product.name}, ${formatPeso(product.price)}`}>
        <img src={assetUrl(product.imageUrl)} alt={product.name} width="600" height="450" loading="lazy" decoding="async" crossOrigin="anonymous" />
        {soldOut && <span className="badge badge--bad product-card__flag">Sold out</span>}
        {!soldOut && product.lowStock && <span className="badge badge--warn product-card__flag">Few left</span>}
      </Link>
      {user && (
        <button
          type="button"
          className={`icon-btn icon-btn--round product-card__fav${favorites.isFavorite(product.id) ? " is-on" : ""}`}
          aria-label={favorites.isFavorite(product.id) ? `Remove ${product.name} from favorites` : `Add ${product.name} to favorites`}
          aria-pressed={favorites.isFavorite(product.id)}
          disabled={!online}
          onClick={() => favorites.toggle(product.id)}
        >
          <Icon name="heart" size={18} filled={favorites.isFavorite(product.id)} />
        </button>
      )}
      <div className="product-card__body">
        <div className="product-card__text">
          <h3><Link to={`/products/${product.id}`}>{product.name}</Link></h3>
          <p className="price">{formatPeso(product.price)}</p>
        </div>
        <button
          type="button"
          className="icon-btn icon-btn--add"
          aria-label={`Add ${product.name} to cart`}
          title={online ? undefined : "Reconnect to add items"}
          disabled={soldOut || !online}
          onClick={quickAdd}
        >
          <Icon name="plus" size={22} />
        </button>
      </div>
    </article>
  );
}
