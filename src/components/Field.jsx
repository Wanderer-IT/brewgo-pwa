import { useId } from "react";

// Every input has a visible <label> (accessibility) and an inline error line.
export function TextField({ label, error, hint, as: Tag = "input", className = "", children, ...props }) {
  const id = useId();
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className={`field ${error ? "field--error" : ""} ${className}`}>
      <label htmlFor={id}>{label}</label>
      <Tag id={id} aria-invalid={error ? "true" : undefined} aria-describedby={describedBy} {...props}>{children}</Tag>
      {hint && !error && <small id={`${id}-hint`} className="field__hint">{hint}</small>}
      {error && <small id={`${id}-err`} className="field__error" role="alert">{error}</small>}
    </div>
  );
}

export function CheckField({ label, error, children, ...props }) {
  const id = useId();
  return (
    <div className={`field field--check ${error ? "field--error" : ""}`}>
      <input id={id} type="checkbox" aria-invalid={error ? "true" : undefined} {...props} />
      <label htmlFor={id}>{children || label}</label>
      {error && <small className="field__error" role="alert">{error}</small>}
    </div>
  );
}
