import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { contactApi } from "../api/endpoints";
import ErrorAlert from "../components/ErrorAlert";
import Icon from "../components/Icon";
import PageHeader from "../components/PageHeader";
import { TextField } from "../components/Field";
import { useAuth } from "../context/AuthContext";
import { useNetwork } from "../context/NetworkStatusContext";
import { useFetch } from "../hooks/useFetch";
import { fieldErrorsFrom } from "../utils/errors";
import { hasErrors, validateContact } from "../utils/validators";

export default function Contact() {
  const { user } = useAuth();
  const { online } = useNetwork();
  const [params] = useSearchParams();
  const orderId = params.get("orderId");
  const channels = useFetch((s) => contactApi.channels(s), []);
  const [form, setForm] = useState({ name: user?.fullName || "", email: user?.email || "", message: "", channel: "email" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [ticket, setTicket] = useState(null);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const found = validateContact(form);
    setErrors(found);
    setApiError(null);
    if (hasErrors(found)) return;
    setBusy(true);
    try {
      const { data } = await contactApi.send({ name: form.name.trim(), email: form.email.trim(), message: form.message.trim(), channel: form.channel, ...(orderId ? { orderId: Number(orderId) } : {}) });
      setTicket(data);
    } catch (err) { setErrors(fieldErrorsFrom(err)); setApiError(err); } finally { setBusy(false); }
  };

  const c = channels.data;
  return (
    <main className="page">
      <PageHeader title="Contact us" subtitle="We're happy to help" back />
      {c && (
        <ul className="card menu-list menu-list--static">
          <li><span><Icon name="chat" /></span><span><strong>{c.chat.label}</strong><small>{c.chat.hours}</small></span></li>
          <li><span><Icon name="phone" /></span><span><strong>{c.call.label}</strong><small><a href={`tel:${c.call.phone.replace(/\s/g, "")}`} className="link">{c.call.phone}</a> · {c.call.hours}</small></span></li>
          <li><span><Icon name="mail" /></span><span><strong>{c.email.label}</strong><small>{c.email.address} · {c.email.responseTime}</small></span></li>
        </ul>
      )}
      {ticket ? (
        <section className="card result" aria-live="polite">
          <div className="result__icon result__icon--ok"><Icon name="check" size={34} /></div>
          <h2>Message sent</h2>
          <p className="muted">Your ticket number is <strong>{ticket.ticketId}</strong>. We'll get back to you soon.</p>
          <Link to="/" className="btn btn--primary btn--block">Back to home</Link>
        </section>
      ) : (
        <form onSubmit={submit} className="card stack" noValidate>
          <h2 className="section__title">Send us a message{orderId ? " about your order" : ""}</h2>
          <TextField label="Your name" value={form.name} onChange={update("name")} error={errors.name} autoComplete="name" />
          <TextField label="Email" type="email" value={form.email} onChange={update("email")} error={errors.email} autoComplete="email" />
          <TextField as="select" label="Preferred reply" value={form.channel} onChange={update("channel")}>
            <option value="email">Email</option><option value="chat">Chat</option><option value="call">Call</option>
          </TextField>
          <TextField as="textarea" rows={4} label="Message" value={form.message} onChange={update("message")} error={errors.message} maxLength={1000} />
          {apiError && !apiError.details && <ErrorAlert error={apiError} />}
          {!online && <small className="muted">You're offline. Sending needs an internet connection.</small>}
          <button type="submit" className="btn btn--primary btn--block" disabled={busy || !online}>{busy ? "Sending..." : "Send message"}</button>
        </form>
      )}
    </main>
  );
}
