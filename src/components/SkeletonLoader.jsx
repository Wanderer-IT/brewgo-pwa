// Gray placeholder shapes while data loads (variant: "grid" | "list" | "detail").
export default function SkeletonLoader({ variant = "grid", count = 4 }) {
  if (variant === "detail") {
    return (
      <div className="skeleton-detail" aria-busy="true" aria-label="Loading">
        <div className="skeleton skeleton--hero" />
        <div className="skeleton skeleton--line" style={{ width: "60%" }} />
        <div className="skeleton skeleton--line" style={{ width: "90%" }} />
        <div className="skeleton skeleton--line" style={{ width: "40%" }} />
      </div>
    );
  }
  const items = Array.from({ length: count }, (_, i) => i);
  if (variant === "list") {
    return (
      <div className="skeleton-list" aria-busy="true" aria-label="Loading">
        {items.map((i) => <div key={i} className="skeleton skeleton--row" />)}
      </div>
    );
  }
  return (
    <div className="product-grid" aria-busy="true" aria-label="Loading">
      {items.map((i) => <div key={i} className="skeleton skeleton--card" />)}
    </div>
  );
}
