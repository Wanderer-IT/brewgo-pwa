import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { cartApi } from "../api/endpoints";
import { useAuth } from "./AuthContext";
import { useNetwork } from "./NetworkStatusContext";
import { useToast } from "./ToastContext";
import { getErrorMessage } from "../utils/errors";
import { defaultOptions, priceFor } from "../utils/pricing";

const CartContext = createContext(null);
const CACHE_KEY = "brewgo.cart.v1";
const EMPTY = { items: [], itemCount: 0, coupon: null, couponWarning: null, pricing: { subtotal: 0, discount: 0, deliveryFee: 0, total: 0 }, hasIssues: false };

// The cart copy in localStorage is ONLY for viewing offline. Totals are never trusted from it.
function readCache(userId) {
  try {
    const saved = JSON.parse(localStorage.getItem(CACHE_KEY));
    return saved && saved.userId === userId ? saved.cart : null;
  } catch { return null; }
}
function writeCache(userId, cart) {
  try { userId ? localStorage.setItem(CACHE_KEY, JSON.stringify({ userId, cart, savedAt: Date.now() })) : localStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
}

function recalc(cart) {
  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cart.items.reduce((s, i) => s + i.lineTotal, 0);
  return { ...cart, itemCount, pricing: { ...cart.pricing, subtotal, total: Math.max(0, subtotal - cart.pricing.discount + cart.pricing.deliveryFee) } };
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const { online } = useNetwork();
  const { toast } = useToast();
  const [cart, setCart] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [stale, setStale] = useState(false); // true = showing the saved copy, not the server's
  const opSeq = useRef(0);
  const userId = user?.id; // depend on the id, not the user object: a profile refresh must NOT reset the cart on screen

  const refresh = useCallback(async (fulfillment = "pickup", signal) => {
    if (!userId) return null;
    const seq = ++opSeq.current;
    setLoading(true);
    try {
      const { data } = await cartApi.get(fulfillment, signal);
      if (seq === opSeq.current) { setCart(data); setStale(false); }
      return data;
    } catch (error) {
      if (error.name === "AbortError") return null;
      const cached = readCache(userId);
      if (cached && seq === opSeq.current) { setCart(cached); setStale(true); }
      throw error;
    } finally {
      if (seq === opSeq.current) setLoading(false);
    }
  }, [userId]);

  // Load the cart when someone logs in; clear it when they log out. (useEffect + cleanup)
  useEffect(() => {
    if (!userId) { opSeq.current += 1; setCart(EMPTY); setStale(false); writeCache(null); return undefined; } // bumping opSeq drops any answer still on its way
    const cached = readCache(userId);
    if (cached) setCart(cached);
    const controller = new AbortController();
    refresh("pickup", controller.signal).catch(() => {});
    return () => controller.abort();
  }, [userId, refresh]);

  useEffect(() => { if (userId && !stale) writeCache(userId, cart); }, [cart, userId, stale]);
  useEffect(() => { if (online && userId && stale) refresh().catch(() => {}); }, [online]); // eslint-disable-line react-hooks/exhaustive-deps

  // Optimistic updates: change the screen first, then let the server's answer replace it.
  // On any error we re-sync from the server instead of guessing how to roll back.
  const run = useCallback(async (optimistic, call, successMessage, { quiet = false } = {}) => {
    const seq = ++opSeq.current;
    if (optimistic) setCart((c) => recalc(optimistic(c)));
    try {
      const { data } = await call();
      if (seq === opSeq.current) { setCart(data); setStale(false); }
      if (successMessage) toast(successMessage);
      return data;
    } catch (error) {
      refresh().catch(() => {});
      if (!quiet) toast(getErrorMessage(error), "bad"); // quiet = the page shows this error inline instead
      throw error;
    }
  }, [refresh, toast]);

  const addItem = useCallback((product, { options, quantity = 1, note } = {}) => {
    const chosen = options || defaultOptions(product);
    const unitPrice = priceFor(product, chosen);
    return run(
      (c) => ({ ...c, items: [...c.items, { itemId: `tmp-${Date.now()}`, productId: product.id, name: product.name, imageUrl: product.imageUrl, quantity, unitPrice, lineTotal: unitPrice * quantity, options: chosen, optionLabels: [], issues: [] }] }),
      () => cartApi.addItem({ productId: product.id, quantity, options: chosen, ...(note ? { note } : {}) }),
      `${product.name} added to cart`
    );
  }, [run]);

  const setQuantity = useCallback((itemId, quantity) =>
    run((c) => ({ ...c, items: c.items.map((i) => (i.itemId === itemId ? { ...i, quantity, lineTotal: i.unitPrice * quantity } : i)) }), () => cartApi.updateItem(itemId, { quantity })), [run]);

  const removeItem = useCallback((itemId) =>
    run((c) => ({ ...c, items: c.items.filter((i) => i.itemId !== itemId) }), () => cartApi.removeItem(itemId)), [run]);

  const applyCoupon = useCallback((code) => run(null, () => cartApi.applyCoupon(code), "Coupon applied", { quiet: true }), [run]);
  const removeCoupon = useCallback(() => run(null, () => cartApi.removeCoupon()), [run]);

  const value = useMemo(
    () => ({ cart, itemCount: cart.itemCount, loading, stale, refresh, addItem, setQuantity, removeItem, applyCoupon, removeCoupon }),
    [cart, loading, stale, refresh, addItem, setQuantity, removeItem, applyCoupon, removeCoupon]
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
