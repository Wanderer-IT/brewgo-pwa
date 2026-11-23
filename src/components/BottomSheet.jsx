import { useEffect, useId, useRef } from "react";
import Icon from "./Icon";

// Slide-up drawer (filters, add card, QR code...). Closes with Escape or a tap on the backdrop.
export default function BottomSheet({ open, onClose, title, children }) {
  const titleId = useId();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.classList.add("no-scroll");
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("no-scroll");
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="sheet-wrap">
      <button type="button" className="sheet-backdrop" aria-label="Close" onClick={onClose} />
      <section className="sheet" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} ref={panelRef}>
        <header className="sheet__header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><Icon name="close" /></button>
        </header>
        <div className="sheet__body">{children}</div>
      </section>
    </div>
  );
}
