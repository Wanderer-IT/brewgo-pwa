import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext({ toast: () => {} });

// Small status messages ("Added to cart"). aria-live announces them to screen readers.
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const toast = useCallback((message, tone = "ok") => {
    const id = nextId.current++;
    setToasts((list) => [...list.slice(-2), { id, message, tone }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toasts" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.tone}`}>{t.message}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
