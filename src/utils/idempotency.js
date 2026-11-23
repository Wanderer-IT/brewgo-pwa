// One key per checkout attempt. Same key + same request = the server returns the SAME order instead of a duplicate.
export function newIdempotencyKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return `bg-${crypto.randomUUID()}`;
  return `bg-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}
