import Icon from "./Icon";

export default function EmptyState({ icon = "cup", title, text, action }) {
  return (
    <div className="empty">
      <div className="empty__art"><Icon name={icon} size={40} /></div>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}
