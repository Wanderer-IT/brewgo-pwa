// One thin wrapper per API endpoint. Components never build URLs themselves.
import { request } from "./client";

const qs = (params = {}) => {
  const clean = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  return clean.length ? `?${new URLSearchParams(clean).toString()}` : "";
};

export const authApi = {
  login: (identifier, password) => request("/auth/login", { method: "POST", body: { identifier, password }, auth: false }),
  register: (body) => request("/auth/register", { method: "POST", body, auth: false }),
  // The token is passed in explicitly because the app forgets it locally BEFORE this call (see AuthContext.logout).
  logout: (token) => request("/auth/logout", { method: "POST", auth: false, headers: { Authorization: `Bearer ${token}` } }),
};

export const userApi = {
  me: (signal) => request("/users/me", { signal }),
  update: (body) => request("/users/me", { method: "PATCH", body }),
  paymentMethods: (signal) => request("/users/me/payment-methods", { signal }),
  addPaymentMethod: (body) => request("/users/me/payment-methods", { method: "POST", body }),
  removePaymentMethod: (id) => request(`/users/me/payment-methods/${id}`, { method: "DELETE" }),
};

// Menu data is public: auth:false keeps these GETs identical for everyone, so the service worker can cache them.
export const menuApi = {
  products: (params, signal) => request(`/products${qs(params)}`, { auth: false, signal }),
  product: (id, signal) => request(`/products/${id}`, { auth: false, signal }),
  categories: (signal) => request("/categories", { auth: false, signal }),
  branches: (signal) => request("/branches", { auth: false, signal }),
};

export const favoritesApi = {
  list: (signal) => request("/favorites", { signal }),
  add: (productId) => request("/favorites", { method: "POST", body: { productId } }),
  remove: (productId) => request(`/favorites/${productId}`, { method: "DELETE" }),
};

export const cartApi = {
  get: (fulfillment, signal) => request(`/cart${qs({ fulfillment })}`, { signal }),
  addItem: (body) => request("/cart/items", { method: "POST", body }),
  updateItem: (itemId, body) => request(`/cart/items/${itemId}`, { method: "PATCH", body }),
  removeItem: (itemId) => request(`/cart/items/${itemId}`, { method: "DELETE" }),
  applyCoupon: (code) => request("/cart/coupon", { method: "POST", body: { code } }),
  removeCoupon: () => request("/cart/coupon", { method: "DELETE" }),
};

export const checkoutApi = {
  // The Idempotency-Key makes a double tap / retry safe: the same key can never create two orders.
  submit: (body, idempotencyKey) => request("/checkout", { method: "POST", body, idempotencyKey }),
};

export const ordersApi = {
  list: (params, signal) => request(`/orders${qs(params)}`, { signal }),
  get: (id, signal) => request(`/orders/${id}`, { signal }),
  cancel: (id) => request(`/orders/${id}/cancel`, { method: "POST" }),
  reorder: (id) => request(`/orders/${id}/reorder`, { method: "POST" }),
  reconcile: (id) => request(`/orders/${id}/reconcile`, { method: "POST" }), // asks the payment provider what really happened
};

export const rewardsApi = {
  summary: (signal) => request("/rewards", { signal }),
  catalog: (signal) => request("/rewards/catalog", { signal }),
  coupons: (params, signal) => request(`/rewards/coupons${qs(params)}`, { signal }),
  history: (params, signal) => request(`/rewards/history${qs(params)}`, { signal }),
  redeem: (rewardId) => request("/rewards/redeem", { method: "POST", body: { rewardId } }),
  checkIn: () => request("/rewards/streak/check-in", { method: "POST" }),
};

export const notificationsApi = {
  list: (params, signal) => request(`/notifications${qs(params)}`, { signal }),
  readAll: () => request("/notifications/read-all", { method: "POST" }),
};

export const aiApi = {
  recommend: (query) => request("/ai/recommendations", { method: "POST", body: { query } }),
};

export const contactApi = {
  channels: (signal) => request("/contact/channels", { auth: false, signal }),
  send: (body) => request("/contact", { method: "POST", body }),
};
