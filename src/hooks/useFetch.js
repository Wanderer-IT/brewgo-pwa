import { useCallback, useEffect, useState } from "react";

// Runs `fetcher(signal)` whenever `deps` change. The AbortController cancels the old request
// on cleanup, so a slow response can never overwrite a newer one (or update an unmounted page).
export function useFetch(fetcher, deps = [], { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, meta: null, error: null, loading: enabled });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    fetcher(controller.signal)
      .then(({ data, meta }) => setState({ data, meta, error: null, loading: false }))
      .catch((error) => {
        if (error.name === "AbortError") return;
        setState((s) => ({ ...s, error, loading: false }));
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick, enabled]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const setData = useCallback((updater) => setState((s) => ({ ...s, data: typeof updater === "function" ? updater(s.data) : updater })), []);
  return { ...state, reload, setData };
}
