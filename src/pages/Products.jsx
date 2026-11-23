import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { menuApi } from "../api/endpoints";
import BottomSheet from "../components/BottomSheet";
import EmptyState from "../components/EmptyState";
import ErrorAlert from "../components/ErrorAlert";
import Icon from "../components/Icon";
import PageHeader from "../components/PageHeader";
import ProductCard from "../components/ProductCard";
import SkeletonLoader from "../components/SkeletonLoader";
import { TextField } from "../components/Field";
import { useCart } from "../context/CartContext";
import { useNetwork } from "../context/NetworkStatusContext";
import { useDebounce } from "../hooks/useDebounce";
import { usePagedList } from "../hooks/usePagedList";

const TABS = [{ key: "", label: "All" }, { key: "hot", label: "Hot" }, { key: "iced", label: "Iced" }, { key: "pastries", label: "Pastries" }];

export default function Products() {
  // The URL is the single source of truth for filters (so links like /products?category=iced work, and Back works).
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "";
  const search = params.get("search") || "";
  const sort = params.get("sort") || "name";
  const availableOnly = params.get("available") === "true";

  const { itemCount } = useCart();
  const { online } = useNetwork();
  const [text, setText] = useState(search);
  const debounced = useDebounce(text, 350);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState({ sort, availableOnly });

  const setParam = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };

  // Typing waits 350ms (debounce) before it touches the URL / API.
  useEffect(() => {
    if (debounced.trim() !== search) setParam({ search: debounced.trim() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const key = `${category}|${search}|${sort}|${availableOnly}`;
  const list = usePagedList(
    (page, signal) => menuApi.products({ category, search, sort: sort === "name" ? undefined : sort, available: availableOnly ? "true" : undefined, page, limit: 8 }, signal),
    key
  );

  const openSheet = () => { setDraft({ sort, availableOnly }); setSheetOpen(true); };
  const applySheet = (e) => {
    e.preventDefault();
    setParam({ sort: draft.sort === "name" ? "" : draft.sort, available: draft.availableOnly ? "true" : "" });
    setSheetOpen(false);
  };
  const clearAll = () => { setText(""); setParams({}, { replace: true }); };
  const filtered = Boolean(category || search || availableOnly || sort !== "name");

  return (
    <main className="page">
      <PageHeader
        title="Menu"
        subtitle="Fresh drinks and pastries"
        right={<Link to="/cart" className="icon-btn cart-btn" aria-label={`Cart, ${itemCount} items`}><Icon name="bag" />{itemCount > 0 && <span className="cart-btn__count">{itemCount}</span>}</Link>}
      />

      <div className="toolbar">
        <form className="search" role="search" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="menu-search" className="sr-only">Search the menu</label>
          <Icon name="search" size={20} />
          <input id="menu-search" type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder="Search drinks..." autoComplete="off" />
        </form>
        <button type="button" className="icon-btn icon-btn--round icon-btn--bordered" aria-label="Sort and filter" onClick={openSheet}><Icon name="sliders" /></button>
      </div>

      <div className="chips chips--scroll" role="group" aria-label="Category">
        {TABS.map((t) => (
          <button key={t.key || "all"} type="button" className={`chip${category === t.key ? " is-active" : ""}`} aria-pressed={category === t.key} onClick={() => setParam({ category: t.key })}>{t.label}</button>
        ))}
      </div>

      {list.status === "loading" && <SkeletonLoader variant="grid" count={6} />}
      {list.status === "error" && (
        <ErrorAlert error={list.error} message={!online && list.items.length === 0 ? "You're offline and this part of the menu isn't saved on your phone yet." : undefined} onRetry={list.reload} />
      )}
      {list.status !== "loading" && list.status !== "error" && list.items.length === 0 && (
        <EmptyState icon="search" title="Nothing matches" text="Try a different word or clear your filters." action={filtered ? <button type="button" className="btn btn--ghost" onClick={clearAll}>Clear filters</button> : null} />
      )}
      {list.items.length > 0 && (
        <>
          <p className="muted result-count" aria-live="polite">{list.meta?.total ?? list.items.length} items</p>
          <div className="product-grid">{list.items.map((p) => <ProductCard key={p.id} product={p} />)}</div>
          {list.hasMore && (
            <button type="button" className="btn btn--ghost btn--block" onClick={list.loadMore} disabled={list.status === "more"}>{list.status === "more" ? "Loading..." : "Load more"}</button>
          )}
        </>
      )}

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Sort and filter">
        <form onSubmit={applySheet} className="stack">
          <TextField as="select" label="Sort by" value={draft.sort} onChange={(e) => setDraft({ ...draft, sort: e.target.value })}>
            <option value="name">Name (A to Z)</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </TextField>
          <div className="field field--check">
            <input id="avail" type="checkbox" checked={draft.availableOnly} onChange={(e) => setDraft({ ...draft, availableOnly: e.target.checked })} />
            <label htmlFor="avail">Hide sold-out items</label>
          </div>
          <button type="submit" className="btn btn--primary btn--block">Show results</button>
        </form>
      </BottomSheet>
    </main>
  );
}
