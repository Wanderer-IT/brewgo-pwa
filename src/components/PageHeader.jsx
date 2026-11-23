import { useNavigate } from "react-router-dom";
import Icon from "./Icon";

export default function PageHeader({ title, subtitle, back = false, right = null }) {
  const navigate = useNavigate();
  return (
    <header className="page-header">
      {back ? (
        <button type="button" className="icon-btn icon-btn--round" aria-label="Go back" onClick={() => navigate(-1)}><Icon name="back" /></button>
      ) : <span className="page-header__spacer" />}
      <div className="page-header__titles">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="page-header__right">{right}</div>
    </header>
  );
}
