// Turns an API error into a sentence for the customer. The server's code decides the wording.
const MESSAGES = {
  INVALID_CREDENTIALS: "That email/phone or password isn't right.",
  EMAIL_TAKEN: "An account with this email already exists. Try logging in.",
  PHONE_TAKEN: "An account with this phone number already exists.",
  RATE_LIMITED: "Too many attempts. Please wait a moment and try again.",
  INSUFFICIENT_STOCK: "Some items are no longer available in that quantity.",
  PRODUCT_UNAVAILABLE: "That item is currently unavailable.",
  CART_EMPTY: "Your cart is empty.",
  COUPON_INVALID: "That coupon code isn't valid.",
  COUPON_EXPIRED: "That coupon has expired.",
  COUPON_ALREADY_USED: "You've already used that coupon.",
  PAYMENT_GATEWAY_ERROR: "The payment provider is unavailable right now. Your cart is safe, so please try again in a moment.",
  PAYMENT_METHOD_NOT_ALLOWED: "Cash is only available for pickup orders.",
  AI_UNAVAILABLE: "The AI assistant is taking a break.",
  ALREADY_CHECKED_IN: "You already checked in today. Come back tomorrow!",
  ILLEGAL_ORDER_STATE: "That order can't be changed anymore.",
  FORBIDDEN: "You don't have permission to do that.",
  IDEMPOTENCY_KEY_REUSED: "Something changed in your order. Please review it and try again.",
};

export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (!error) return fallback;
  if (error.code && MESSAGES[error.code]) return MESSAGES[error.code];
  return error.message || fallback;
}

// Turns details [{ field, message }] into { field: message } for inline form errors.
export function fieldErrorsFrom(error) {
  if (!error || !Array.isArray(error.details)) return {};
  return error.details.reduce((acc, d) => (d && d.field ? { ...acc, [d.field]: d.message } : acc), {});
}
