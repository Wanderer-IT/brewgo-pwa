import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import ErrorAlert from "../components/ErrorAlert";
import Icon from "../components/Icon";
import { CheckField, TextField } from "../components/Field";
import { useAuth } from "../context/AuthContext";
import { useNetwork } from "../context/NetworkStatusContext";
import { useToast } from "../context/ToastContext";
import { fieldErrorsFrom } from "../utils/errors";
import { hasErrors, validateRegister } from "../utils/validators";

export default function Register() {
  const { user, register } = useAuth();
  const { online } = useNetwork();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", address: "", password: "", acceptTerms: false });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  if (user && !busy) return <Navigate to="/" replace />;

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const found = validateRegister(form);
    setErrors(found);
    setApiError(null);
    if (hasErrors(found)) return;
    setBusy(true);
    try {
      await register({ fullName: form.fullName.trim(), email: form.email.trim(), phone: form.phone.trim(), address: form.address.trim(), password: form.password, acceptTerms: form.acceptTerms });
      toast("Welcome to Brew Go! 50 bonus points added.");
      navigate(from ? `${from.pathname}${from.search || ""}` : "/", { replace: true });
    } catch (err) {
      setErrors(fieldErrorsFrom(err));
      setApiError(err);
      setBusy(false);
    }
  };

  return (
    <main className="page page--auth">
      <header className="auth-hero">
        <span className="auth-hero__logo" aria-hidden="true"><Icon name="cup" size={34} /></span>
        <h1>Create your account</h1>
        <p className="badge badge--ok">Get 50 bonus Brew Go points when you sign up</p>
      </header>
      <form onSubmit={submit} className="card stack" noValidate>
        <TextField label="Full name" value={form.fullName} onChange={update("fullName")} error={errors.fullName} autoComplete="name" />
        <TextField label="Email" type="email" value={form.email} onChange={update("email")} error={errors.email} autoComplete="email" autoCapitalize="none" />
        <TextField label="Mobile number (+63)" type="tel" value={form.phone} onChange={update("phone")} error={errors.phone} autoComplete="tel" placeholder="917 123 4567" />
        <TextField as="textarea" rows={2} label="Address" value={form.address} onChange={update("address")} error={errors.address} autoComplete="street-address" />
        <div className="field-with-action">
          <TextField label="Password" type={show ? "text" : "password"} value={form.password} onChange={update("password")} error={errors.password} autoComplete="new-password" hint="At least 8 characters" />
          <button type="button" className="icon-btn field-with-action__btn" aria-label={show ? "Hide password" : "Show password"} aria-pressed={show} onClick={() => setShow(!show)}><Icon name={show ? "eyeOff" : "eye"} size={20} /></button>
        </div>
        <CheckField checked={form.acceptTerms} onChange={update("acceptTerms")} error={errors.acceptTerms}>I agree to the Terms of Service and Privacy Policy</CheckField>
        {apiError && !apiError.details && <ErrorAlert error={apiError} />}
        {!online && <small className="muted">You're offline. Creating an account needs an internet connection.</small>}
        <button type="submit" className="btn btn--primary btn--block" disabled={busy || !online} title={online ? undefined : "Reconnect to sign up"}>{busy ? "Creating account..." : "Create account"}</button>
      </form>
      <p className="center">Already have an account? <Link to="/login" state={{ from }} className="link">Log in</Link></p>
    </main>
  );
}
