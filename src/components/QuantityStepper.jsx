import Icon from "./Icon";

// Controlled stepper: the parent owns the number (props in, callback out).
export default function QuantityStepper({ value, onChange, min = 1, max = 20, label = "Quantity", disabled = false }) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" className="stepper__btn" aria-label={`Decrease ${label.toLowerCase()}`} disabled={disabled || value <= min} onClick={() => onChange(value - 1)}>
        <Icon name="minus" size={18} />
      </button>
      <output className="stepper__value" aria-live="polite">{value}</output>
      <button type="button" className="stepper__btn" aria-label={`Increase ${label.toLowerCase()}`} disabled={disabled || value >= max} onClick={() => onChange(value + 1)}>
        <Icon name="plus" size={18} />
      </button>
    </div>
  );
}
