import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { favoritesApi } from "../api/endpoints";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import { getErrorMessage } from "../utils/errors";

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ids, setIds] = useState(() => new Set());

  useEffect(() => {
    if (!user) { setIds(new Set()); return undefined; }
    const controller = new AbortController();
    favoritesApi.list(controller.signal)
      .then(({ data }) => setIds(new Set(data.map((p) => p.id))))
      .catch(() => {});
    return () => controller.abort();
  }, [user]);

  // Optimistic: the heart flips right away; if the server says no, flip it back.
  const toggle = useCallback(async (productId) => {
    const wasFavorite = ids.has(productId);
    setIds((prev) => { const next = new Set(prev); wasFavorite ? next.delete(productId) : next.add(productId); return next; });
    try {
      wasFavorite ? await favoritesApi.remove(productId) : await favoritesApi.add(productId);
    } catch (error) {
      setIds((prev) => { const next = new Set(prev); wasFavorite ? next.add(productId) : next.delete(productId); return next; });
      toast(getErrorMessage(error), "bad");
    }
  }, [ids, toast]);

  const value = useMemo(() => ({ ids, isFavorite: (id) => ids.has(id), toggle }), [ids, toggle]);
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export const useFavorites = () => useContext(FavoritesContext);
