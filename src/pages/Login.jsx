import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import ErrorAlert from "../components/ErrorAlert";
import Icon from "../components/Icon";
import { TextField } from "../components/Field";
import { useAuth } from "../context/AuthContext";
import { useNetwork } from "../context/NetworkStatusContext";
import { fieldErrorsFrom } from "../utils/errors";
import { hasErrors, validateLogin } from "../utils/validators";

export default function Login() {
  const { user, login } = useAuth();
  const { online } = useNetwork();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const [form, setForm] = useState({ identifier: "", password: "" }); // controlled inputs
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from ? `${from.pathname}${from.search || ""}` : "/"} replace />;

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const found = validateLogin(form);
    setErrors(found);
    setApiError(null);
    if (hasErrors(found)) return;
    setBusy(true);
    try {
      await login(form.identifier.trim(), form.password);
      navigate(from ? `${from.pathname}${from.search || ""}` : "/", { replace: true });
    } catch (err) {
      setErrors(fieldErrorsFrom(err));
      setApiError(err);
    } finally { setBusy(false); }
  };

  return (
    <main className="page page--auth">
      <header className="auth-hero">
        <span className="auth-hero__logo" aria-hidden="true"><Icon name="cup" size={34} /></span>
        <h1>Welcome back</h1>
        <p className="muted">Log in to order ahead and earn rewards.</p>
      </header>
      <form onSubmit={submit} className="card stack" noValidate>
        <TextField label="Email or phone number" value={form.identifier} onChange={update("identifier")} error={errors.identifier} autoComplete="username" inputMode="email" autoCapitalize="none" />
        <div className="field-with-action">
          <TextField label="Password" type={show ? "text" : "password"} value={form.password} onChange={update("password")} error={errors.password} autoComplete="current-password" />
          <button type="button" className="icon-btn field-with-action__btn" aria-label={show ? "Hide password" : "Show password"} aria-pressed={show} onClick={() => setShow(!show)}><Icon name={show ? "eyeOff" : "eye"} size={20} /></button>
        </div>
        {apiError && <ErrorAlert error={apiError} />}
        {!online && <small className="muted">You're offline. Logging in needs an internet connection.</small>}
        <button type="submit" className="btn btn--primary btn--block" disabled={busy || !online} title={online ? undefined : "Reconnect to log in"}>{busy ? "Logging in..." : "Log in"}</button>
        {import.meta.env.DEV && <small className="muted">Demo: maya.santos@email.com / Password123</small>}
      </form>
      <p className="center">New to Brew Go? <Link to="/register" state={{ from }} className="link">Create an account</Link></p>
      <p className="center"><Link to="/" className="link">Continue browsing the menu</Link></p>
    </main>
  );
}
