import { useRegisterSW } from "virtual:pwa-register/react";

// registerType: 'prompt' -> the customer decides when to update, so a reload never wipes a half-filled checkout.
export default function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div role="alert" className="pwa-toast">
      <span>{offlineReady ? "Brew Go is ready to work offline." : "A new version is available."}</span>
      <div className="pwa-toast__actions">
        {needRefresh && (
          <button type="button" className="btn btn--small btn--primary" onClick={() => updateServiceWorker(true)}>
            Reload
          </button>
        )}
        <button type="button" className="btn btn--small btn--ghost" onClick={close}>
          Close
        </button>
      </div>
    </div>
  );
}
