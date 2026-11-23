const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });
export const formatPeso = (n) => peso.format(Number(n) || 0);

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export function relativeDay(iso) {
  const d = new Date(iso);
  const days = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

export const STATUS_LABELS = {
  pending_payment: "Waiting for payment",
  paid: "Paid",
  preparing: "Preparing your brew",
  ready: "Ready for pickup",
  completed: "Completed",
  cancelled: "Cancelled",
};
export const statusLabel = (status) => STATUS_LABELS[status] || status;
export const statusTone = (status) => ({ completed: "ok", ready: "ok", paid: "ok", preparing: "info", pending_payment: "warn", cancelled: "bad" }[status] || "info");

export const CATEGORY_LABELS = { hot: "Hot", iced: "Iced", pastries: "Pastries" };
