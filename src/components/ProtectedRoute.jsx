import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SkeletonLoader from "./SkeletonLoader";

// Guards customer pages (and staff pages with role="admin"). Remembers where the customer was heading.
export default function ProtectedRoute({ role }) {
  const { user, loading, sessionEnd } = useAuth();
  const location = useLocation();
  if (loading) return <main className="page"><SkeletonLoader variant="list" count={3} /></main>;
  // Signed out on purpose -> home. Never signed in / session expired -> login, remembering where they were going.
  if (!user && sessionEnd === "logout") return <Navigate to="/" replace />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (role && user.role !== role) {
    return (
      <main className="page"><div className="alert alert--bad" role="alert"><p>You don't have access to this page.</p></div></main>
    );
  }
  return <Outlet />;
}
