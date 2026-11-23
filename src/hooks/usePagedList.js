import { useCallback, useEffect, useState } from "react";

// "Load more" lists. `key` describes the filters: when it changes the list starts again at page 1.
// The AbortController cleanup cancels the previous request, so results can't arrive out of order.
export function usePagedList(fetchPage, key, { enabled = true } = {}) {
  const [pager, setPager] = useState({ key, page: 1 });
  const page = pager.key === key ? pager.page : 1; // derived: a filter change instantly means page 1
  const [state, setState] = useState({ items: [], meta: null, status: enabled ? "loading" : "idle", error: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    const controller = new AbortController();
    setState((s) => ({ ...s, status: page === 1 ? "loading" : "more", error: null, items: page === 1 ? [] : s.items }));
    fetchPage(page, controller.signal)
      .then(({ data, meta }) => setState((s) => ({ items: page === 1 ? data : [...s.items, ...data], meta, status: "ready", error: null })))
      .catch((error) => {
        if (error.name === "AbortError") return;
        setState((s) => ({ ...s, status: "error", error }));
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, page, tick, enabled]);

  const loadMore = useCallback(() => setPager({ key, page: page + 1 }), [key, page]);
  const reload = useCallback(() => { setPager({ key, page: 1 }); setTick((t) => t + 1); }, [key]);
  return { ...state, loadMore, reload, hasMore: Boolean(state.meta?.hasNext) };
}
