import { useNetwork } from "../context/NetworkStatusContext";
import Icon from "./Icon";

// Shown the whole time navigator.onLine is false. Non-blocking: browsing saved pages still works.
export default function OfflineBanner() {
  const { online } = useNetwork();
  if (online) return null;
  return (
    <div className="offline-banner" role="status">
      <Icon name="cloudOff" size={18} />
      <span>You're offline. Showing saved menu items. Login, checkout and AI need a connection.</span>
    </div>
  );
}
