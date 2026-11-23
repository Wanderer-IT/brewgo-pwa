import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { userApi } from "../api/endpoints";
import BottomSheet from "../components/BottomSheet";
import ErrorAlert from "../components/ErrorAlert";
import Icon from "../components/Icon";
import PageHeader from "../components/PageHeader";
import { TextField } from "../components/Field";
import { useAuth } from "../context/AuthContext";
import { useNetwork } from "../context/NetworkStatusContext";
import { useToast } from "../context/ToastContext";
import { useFetch } from "../hooks/useFetch";
import { fieldErrorsFrom, getErrorMessage } from "../utils/errors";

export default function Profile() {
  const { user, profile, refreshProfile, logout } = useAuth();
  const { online } = useNetwork();
  const { toast } = useToast();
  const [sheet, setSheet] = useState(null); // "info" | "cards" | null
  const [form, setForm] = useState({ fullName: "", phone: "", address: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const cards = useFetch((s) => userApi.paymentMethods(s), [sheet === "cards"], { enabled: sheet === "cards" && online });
  const [cardForm, setCardForm] = useState({ type: "card", provider: "Visa", last4: "" });
  const [cardError, setCardError] = useState("");

  useEffect(() => { if (online) refreshProfile().catch(() => {}); }, [online]); // eslint-disable-line react-hooks/exhaustive-deps

  const openInfo = () => { setForm({ fullName: user.fullName, phone: user.phone, address: user.address }); setErrors({}); setSheet("info"); };

  const saveInfo = async (e) => {
    e.preventDefault();
    const local = {};
    if (form.fullName.trim().length < 2) local.fullName = "Enter your full name";
    if (form.address.trim().length < 5) local.address = "Enter your address";
    if (Object.keys(local).length) return setErrors(local);
    setSaving(true);
    try { await userApi.update({ fullName: form.fullName.trim(), phone: form.phone, address: form.address.trim() }); await refreshProfile(); toast("Profile saved"); setSheet(null); }
    catch (err) { setErrors({ ...fieldErrorsFrom(err), form: getErrorMessage(err) }); } finally { setSaving(false); }
  };

  const addCard = async (e) => {
    e.preventDefault();
    setCardError("");
    if (cardForm.type === "card" && !/^\d{4}$/.test(cardForm.last4)) return setCardError("Enter the last 4 digits of the card");
    try { await userApi.addPaymentMethod({ type: cardForm.type, provider: cardForm.provider, ...(cardForm.last4 ? { last4: cardForm.last4 } : {}) }); setCardForm({ ...cardForm, last4: "" }); cards.reload(); refreshProfile().catch(() => {}); toast("Payment method saved"); }
    catch (err) { setCardError(getErrorMessage(err)); }
  };
  const removeCard = async (id) => { try { await userApi.removePaymentMethod(id); cards.reload(); refreshProfile().catch(() => {}); } catch (err) { toast(getErrorMessage(err), "bad"); } };

  // ProtectedRoute sees "signed out on purpose" and sends the customer home (not to the login page).
  const signOut = async () => { await logout(); toast("You're logged out"); };

  const stats = profile?.stats;
  const perks = profile?.perks;
  return (
    <main className="page">
      <PageHeader title="Profile" right={<Link to="/notifications" className="icon-btn" aria-label="Notifications"><Icon name="bell" /></Link>} />

      <section className="card profile-card">
        <span className="avatar avatar--lg" aria-hidden="true">{user.fullName[0]}</span>
        <h2>{user.fullName}</h2>
        <p className="muted">{user.email}</p>
        <span className="badge badge--info">{user.tier}</span>
        {user.role === "admin" && <span className="badge badge--warn">Staff account</span>}
        <dl className="stats">
          <div><dd>{stats?.orders ?? "-"}</dd><dt>Orders</dt></div>
          <div><dd>{stats?.favorites ?? "-"}</dd><dt>Favorites</dt></div>
          <div><dd>{stats?.cards ?? "-"}</dd><dt>Cards</dt></div>
        </dl>
      </section>

      {perks && (
        <section className="card" aria-labelledby="perks-title">
          <div className="section__head"><h2 id="perks-title" className="section__title"><Icon name="gift" size={20} /> Brew Go Perks</h2><span className="badge badge--info">{perks.pointsBalance} pts</span></div>
          <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={perks.nextFreeDrink.target} aria-valuenow={Math.min(perks.nextFreeDrink.current, perks.nextFreeDrink.target)} aria-label={perks.nextFreeDrink.label}><span style={{ width: `${perks.nextFreeDrink.progressPercent}%` }} /></div>
          <p className="muted">{perks.nextFreeDrink.message}</p>
          <Link to="/rewards" className="btn btn--primary btn--block">Redeem rewards</Link>
        </section>
      )}

      <section aria-labelledby="pref-title">
        <h2 id="pref-title" className="section__title section__title--quiet">Preferences & orders</h2>
        <ul className="menu-list card">
          <li><button type="button" onClick={() => setSheet("cards")}><Icon name="wallet" /><span><strong>Payment methods</strong><small>Saved cards and e-wallets</small></span><Icon name="chevron" size={18} /></button></li>
          <li><button type="button" onClick={openInfo}><Icon name="user" /><span><strong>Personal information</strong><small>{user.fullName} · {user.phoneDisplay}</small></span><Icon name="chevron" size={18} /></button></li>
          <li><Link to="/favorites"><Icon name="heart" /><span><strong>Favorites</strong><small>Your go-to drinks</small></span><Icon name="chevron" size={18} /></Link></li>
          <li><Link to="/contact"><Icon name="chat" /><span><strong>Contact us</strong><small>Chat, call or email</small></span><Icon name="chevron" size={18} /></Link></li>
        </ul>
      </section>

      <button type="button" className="btn btn--ghost btn--block btn--danger" onClick={signOut}><Icon name="logout" size={20} /> Sign out</button>
      <p className="muted help-line">Brew Go PWA · made for coffee lovers</p>

      <BottomSheet open={sheet === "info"} onClose={() => setSheet(null)} title="Personal information">
        <form onSubmit={saveInfo} className="stack" noValidate>
          <TextField label="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} error={errors.fullName} autoComplete="name" />
          <TextField label="Mobile number" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={errors.phone} autoComplete="tel" />
          <TextField as="textarea" rows={3} label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} error={errors.address} autoComplete="street-address" />
          {errors.form && !errors.phone && <ErrorAlert message={errors.form} />}
          <button type="submit" className="btn btn--primary btn--block" disabled={saving || !online}>{saving ? "Saving..." : "Save changes"}</button>
        </form>
      </BottomSheet>

      <BottomSheet open={sheet === "cards"} onClose={() => setSheet(null)} title="Payment methods">
        {cards.loading && <p className="muted">Loading...</p>}
        {cards.error && <ErrorAlert error={cards.error} onRetry={cards.reload} />}
        <ul className="plain-list">
          {cards.data?.map((c) => (
            <li key={c.id} className="list-row"><div><strong>{c.label}</strong><p className="muted">{c.type === "card" ? "Card" : "E-wallet"}</p></div><button type="button" className="icon-btn" aria-label={`Remove ${c.label}`} onClick={() => removeCard(c.id)}><Icon name="trash" size={20} /></button></li>
          ))}
        </ul>
        <form onSubmit={addCard} className="stack" noValidate>
          <h3 className="section__title">Add a card</h3>
          <p className="muted">We only keep the card brand and last 4 digits. Payments are processed by Maya.</p>
          <TextField as="select" label="Card brand" value={cardForm.provider} onChange={(e) => setCardForm({ ...cardForm, provider: e.target.value })}>
            <option>Visa</option><option>Mastercard</option><option>JCB</option>
          </TextField>
          <TextField label="Last 4 digits" inputMode="numeric" maxLength={4} value={cardForm.last4} onChange={(e) => setCardForm({ ...cardForm, last4: e.target.value.replace(/\D/g, "") })} error={cardError} />
          <button type="submit" className="btn btn--primary btn--block" disabled={!online}>Save card</button>
        </form>
      </BottomSheet>
    </main>
  );
}
