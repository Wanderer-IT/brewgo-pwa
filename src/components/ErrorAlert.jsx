import { getErrorMessage } from "../utils/errors";
import Icon from "./Icon";

// Shows the API's error in plain words. role="alert" makes screen readers announce it.
export default function ErrorAlert({ error, message, onRetry }) {
  const text = message || getErrorMessage(error);
  return (
    <div className="alert alert--bad" role="alert">
      <Icon name="alert" size={20} />
      <div className="alert__text">
        <p>{text}</p>
        {error?.requestId && <small>Reference: {error.requestId.slice(0, 8)}</small>}
      </div>
      {onRetry && <button type="button" className="btn btn--small btn--ghost" onClick={onRetry}>Try again</button>}
    </div>
  );
}
