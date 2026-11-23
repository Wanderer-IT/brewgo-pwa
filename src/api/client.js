import { getToken, notifyUnauthorized } from "./session";

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1").replace(/\/$/, "");
const API_ORIGIN = new URL(API_BASE_URL).origin;

export class ApiError extends Error {
  constructor({ status, code, message, details, requestId, retryAfter }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
    this.retryAfter = retryAfter ? Number(retryAfter) : null;
  }
}

// Success envelope: { success: true, data, meta }   Error envelope: { success: false, error: { code, message, details }, requestId }
export async function request(path, { method = "GET", body, auth = true, headers = {}, signal, idempotencyKey } = {}) {
  const finalHeaders = { Accept: "application/json", ...headers };
  if (body !== undefined) finalHeaders["Content-Type"] = "application/json";
  const token = auth ? getToken() : null; // public GETs go without a token so the service worker may cache them safely
  if (token) finalHeaders.Authorization = `Bearer ${token}`;
  if (idempotencyKey) finalHeaders["Idempotency-Key"] = idempotencyKey;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { method, headers: finalHeaders, body: body !== undefined ? JSON.stringify(body) : undefined, signal });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError({
      status: 0,
      code: "NETWORK_ERROR",
      message: navigator.onLine ? "We can't reach the server right now. Please try again." : "You're offline. Reconnect and try again.",
    });
  }

  if (response.status === 204) return { data: null, meta: null, status: 204, headers: response.headers };

  let json = null;
  try { json = await response.json(); } catch { /* not JSON */ }

  if (response.ok && json && json.success) return { data: json.data, meta: json.meta ?? null, status: response.status, headers: response.headers };

  const error = new ApiError({
    status: response.status,
    code: json?.error?.code || "UNKNOWN_ERROR",
    message: json?.error?.message || `Request failed (${response.status})`,
    details: json?.error?.details,
    requestId: json?.requestId,
    retryAfter: response.headers.get("Retry-After"),
  });
  if (response.status === 401 && auth && token) notifyUnauthorized(error); // expired/invalid session -> back to login
  throw error;
}

// Image paths from the API are relative ("/images/x.svg"); make them absolute.
export const assetUrl = (path) => (!path ? "" : /^https?:/.test(path) ? path : `${API_ORIGIN}${path}`);
