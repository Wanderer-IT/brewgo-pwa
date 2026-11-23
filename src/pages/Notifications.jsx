import { Link } from "react-router-dom";
import { notificationsApi } from "../api/endpoints";
import EmptyState from "../components/EmptyState";
import ErrorAlert from "../components/ErrorAlert";
import PageHeader from "../components/PageHeader";
import SkeletonLoader from "../components/SkeletonLoader";
import { useNetwork } from "../context/NetworkStatusContext";
import { usePagedList } from "../hooks/usePagedList";
import { formatDateTime } from "../utils/format";

export default function Notifications() {
  const { online } = useNetwork();
  const list = usePagedList((page, signal) => notificationsApi.list({ page, limit: 10 }, signal), "all", { enabled: online });
  const unread = list.meta?.unreadCount ?? 0;

  const markAll = async () => { await notificationsApi.readAll().catch(() => {}); list.reload(); };

  return (
    <main className="page">
      <PageHeader title="Notifications" subtitle={unread ? `${unread} unread` : "All caught up"} back right={unread > 0 ? <button type="button" className="btn btn--small btn--ghost" onClick={markAll}>Mark all read</button> : null} />
      {!online && <div className="alert alert--warn" role="status"><p>Reconnect to see your notifications.</p></div>}
      {list.status === "loading" && <SkeletonLoader variant="list" count={4} />}
      {list.status === "error" && <ErrorAlert error={list.error} onRetry={list.reload} />}
      {list.status === "ready" && list.items.length === 0 && <EmptyState icon="bell" title="Nothing new" text="Order updates and rewards show up here." />}
      <ul className="order-list">
        {list.items.map((n) => {
          const body = (<><div className="row row--between"><strong>{n.title}</strong>{!n.read && <span className="badge badge--info">New</span>}</div><p>{n.body}</p><small className="muted">{formatDateTime(n.createdAt)}</small></>);
          return <li key={n.id} className={`card notice${n.read ? "" : " notice--unread"}`}>{n.data?.orderId ? <Link to={`/orders/${n.data.orderId}`}>{body}</Link> : body}</li>;
        })}
      </ul>
      {list.hasMore && <button type="button" className="btn btn--ghost btn--block" onClick={list.loadMore}>Load more</button>}
    </main>
  );
}
