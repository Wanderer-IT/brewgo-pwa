import { useState } from "react";
import { rewardsApi } from "../api/endpoints";
import BottomSheet from "../components/BottomSheet";
import ErrorAlert from "../components/ErrorAlert";
import Icon from "../components/Icon";
import PageHeader from "../components/PageHeader";
import SkeletonLoader from "../components/SkeletonLoader";
import { useAuth } from "../context/AuthContext";
import { useNetwork } from "../context/NetworkStatusContext";
import { useToast } from "../context/ToastContext";
import { useFetch } from "../hooks/useFetch";
import { usePagedList } from "../hooks/usePagedList";
import { getErrorMessage } from "../utils/errors";
import { formatDateTime } from "../utils/format";

export default function Rewards() {
  const { user, refreshProfile } = useAuth();
  const { online } = useNetwork();
  const { toast } = useToast();
  const summary = useFetch((s) => rewardsApi.summary(s), [], { enabled: online });
  const catalog = useFetch((s) => rewardsApi.catalog(s), [], { enabled: online });
  const coupons = useFetch((s) => rewardsApi.coupons({ status: "active" }, s), [], { enabled: online });
  const [historyOpen, setHistoryOpen] = useState(false);
  const history = usePagedList((page, signal) => rewardsApi.history({ page, limit: 8 }, signal), "history", { enabled: historyOpen && online });
  const [busy, setBusy] = useState(null);

  const reloadAll = () => { summary.reload(); catalog.reload(); coupons.reload(); refreshProfile().catch(() => {}); };

  const checkIn = async () => {
    setBusy("checkin");
    try {
      const { data } = await rewardsApi.checkIn();
      toast(data.rewardAwarded ? `Streak complete! +${data.rewardAwarded} pts` : "Checked in. See you tomorrow!");
      reloadAll();
    } catch (e) { toast(getErrorMessage(e), e.code === "ALREADY_CHECKED_IN" ? "warn" : "bad"); } finally { setBusy(null); }
  };

  const redeem = async (reward) => {
    setBusy(reward.id);
    try {
      const { data } = await rewardsApi.redeem(reward.id);
      toast(`${reward.title} ready. Code ${data.coupon.code}`);
      reloadAll();
    } catch (e) { toast(e.code === "INSUFFICIENT_POINTS" ? e.message : getErrorMessage(e), "bad"); } finally { setBusy(null); }
  };

  const s = summary.data;
  return (
    <main className="page">
      <PageHeader title="Rewards" subtitle={user ? user.fullName : ""} />
      {!online && <div className="alert alert--warn" role="status"><p>Rewards need an internet connection.</p></div>}
      {summary.loading && <SkeletonLoader variant="detail" />}
      {summary.error && <ErrorAlert error={summary.error} onRetry={summary.reload} />}

      {s && (
        <>
          <section className="card points-card" aria-label="Your points">
            <span className="badge badge--light">{s.tier}</span>
            <p className="points-card__big">{s.pointsBalance} <small>pts</small></p>
            <p className="points-card__sub">Available balance to redeem in-store & online</p>
            <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={s.nextFreeDrink.target} aria-valuenow={Math.min(s.nextFreeDrink.current, s.nextFreeDrink.target)} aria-label={s.nextFreeDrink.label}>
              <span style={{ width: `${s.nextFreeDrink.progressPercent}%` }} />
            </div>
            <p className="points-card__sub">{s.nextFreeDrink.message}</p>
            <button type="button" className="btn btn--light" onClick={() => setHistoryOpen(true)}>Redeem history</button>
          </section>

          <section className="card" aria-labelledby="streak-title">
            <div className="section__head">
              <h2 id="streak-title" className="section__title"><Icon name="flame" size={20} /> Daily Brew Streak</h2>
              <span className="badge badge--info">+{s.streak.rewardPoints} pts reward</span>
            </div>
            <p className="muted">{s.streak.completed} of {s.streak.target} daily visits completed</p>
            <ol className="streak" aria-label="Streak days">
              {Array.from({ length: s.streak.target }, (_, i) => (
                <li key={i} className={i < s.streak.completed ? "is-done" : ""}>
                  <span className="streak__dot">{i < s.streak.completed ? <Icon name="check" size={18} /> : i + 1}</span>
                  <small>Day {i + 1}</small>
                </li>
              ))}
            </ol>
            <button type="button" className="btn btn--primary btn--block" disabled={s.streak.checkedInToday || busy === "checkin"} onClick={checkIn}>
              {s.streak.checkedInToday ? "Checked in today" : busy === "checkin" ? "Checking in..." : "Check in today"}
            </button>
          </section>

          <section className="card" aria-labelledby="missions-title">
            <div className="section__head"><h2 id="missions-title" className="section__title">Bonus Missions</h2><span className="muted">This week</span></div>
            <ul className="plain-list">
              {s.missions.map((m) => (
                <li key={m.key} className="list-row">
                  <div><strong>{m.title}</strong><p className="muted">{m.description}</p></div>
                  {m.completed ? <span className="badge badge--ok">Done</span> : <span className="badge badge--info">+{m.rewardPoints} pts</span>}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {coupons.data?.length > 0 && (
        <section className="card" aria-labelledby="mycoupons-title">
          <h2 id="mycoupons-title" className="section__title">My coupons</h2>
          <ul className="plain-list">
            {coupons.data.map((c) => (
              <li key={c.id} className="list-row"><div><strong>{c.title}</strong><p className="muted">Code {c.code} · until {new Date(c.expiresAt).toLocaleDateString("en-PH")}</p></div><span className="badge badge--ok">Ready</span></li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="redeem-title" className="section">
        <h2 id="redeem-title" className="section__title">Redeem rewards</h2>
        <p className="muted">Choose your treat using your {user?.pointsBalance ?? 0} points</p>
        {catalog.loading && <SkeletonLoader variant="list" count={3} />}
        <ul className="reward-list">
          {catalog.data?.map((r) => (
            <li key={r.id} className="card reward">
              <div>
                <strong>{r.title}</strong>
                <p className="muted">{r.pointsCost} pts{r.perk ? ` · ${r.perk}` : ""}</p>
                {!r.canRedeem && <small className="muted">Need {r.pointsNeeded} more pts</small>}
              </div>
              <button type="button" className="btn btn--small btn--primary" disabled={!r.canRedeem || busy === r.id || !online} onClick={() => redeem(r)}>{busy === r.id ? "..." : "Claim"}</button>
            </li>
          ))}
        </ul>
      </section>

      <BottomSheet open={historyOpen} onClose={() => setHistoryOpen(false)} title="Points history">
        {history.status === "loading" && <SkeletonLoader variant="list" count={4} />}
        {history.status === "error" && <ErrorAlert error={history.error} onRetry={history.reload} />}
        <ul className="plain-list">
          {history.items.map((h) => (
            <li key={h.id} className="list-row">
              <div><strong>{h.description}</strong><p className="muted">{formatDateTime(h.createdAt)}</p></div>
              <span className={h.points > 0 ? "text-good" : "text-bad"}>{h.points > 0 ? `+${h.points}` : h.points} pts</span>
            </li>
          ))}
        </ul>
        {history.hasMore && <button type="button" className="btn btn--ghost btn--block" onClick={history.loadMore}>Load more</button>}
      </BottomSheet>
    </main>
  );
}
