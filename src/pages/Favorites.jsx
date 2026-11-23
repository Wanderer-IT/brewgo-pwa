import { Link } from "react-router-dom";
import { favoritesApi } from "../api/endpoints";
import EmptyState from "../components/EmptyState";
import ErrorAlert from "../components/ErrorAlert";
import PageHeader from "../components/PageHeader";
import ProductCard from "../components/ProductCard";
import SkeletonLoader from "../components/SkeletonLoader";
import { useFavorites } from "../context/FavoritesContext";
import { useNetwork } from "../context/NetworkStatusContext";
import { useFetch } from "../hooks/useFetch";

export default function Favorites() {
  const { online } = useNetwork();
  const favorites = useFavorites();
  const { data, loading, error, reload } = useFetch((s) => favoritesApi.list(s), [], { enabled: online });
  // The heart in the card updates `favorites.ids` instantly; hide cards that were just un-hearted.
  const shown = (data || []).filter((p) => favorites.isFavorite(p.id));

  return (
    <main className="page">
      <PageHeader title="Favorites" subtitle="Your go-to drinks" back />
      {!online && <div className="alert alert--warn" role="status"><p>Reconnect to see your favorites.</p></div>}
      {loading && <SkeletonLoader variant="grid" count={4} />}
      {error && <ErrorAlert error={error} onRetry={reload} />}
      {!loading && !error && online && shown.length === 0 && <EmptyState icon="heart" title="No favorites yet" text="Tap the heart on any drink to save it here." action={<Link to="/products" className="btn btn--primary">Browse the menu</Link>} />}
      {shown.length > 0 && <div className="product-grid">{shown.map((p) => <ProductCard key={p.id} product={p} />)}</div>}
    </main>
  );
}
