import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authApi, userApi } from "../api/endpoints";
import { getToken, setToken, setUnauthorizedHandler } from "../api/session";
import { useToast } from "./ToastContext";

const AuthContext = createContext(null);
const USER_KEY = "brewgo.user";

// A saved copy of the public profile lets the app reopen OFFLINE (cart and saved menu stay viewable).
// It is only a display cache: every API call is still checked by the server with the token.
function readCachedUser() {
  try {
    const saved = JSON.parse(localStorage.getItem(USER_KEY));
    return saved && getToken() ? saved : null;
  } catch { return null; }
}
function writeCachedUser(user) {
  try { user ? localStorage.setItem(USER_KEY, JSON.stringify(user)) : localStorage.removeItem(USER_KEY); } catch { /* storage blocked */ }
}

// Lifting state up: one place knows who is logged in (JWT-style token + role).
export function AuthProvider({ children }) {
  const [user, setUser] = useState(readCachedUser);
  const [profile, setProfile] = useState(null); // { stats, perks } from /users/me
  const [loading, setLoading] = useState(() => Boolean(getToken()) && !readCachedUser());
  const [sessionEnd, setSessionEnd] = useState(null); // why the session ended: "logout" (on purpose) | "expired" (server said 401)
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const locationRef = useRef(location);
  locationRef.current = location;

  useEffect(() => { writeCachedUser(user); }, [user]);

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async (signal) => {
    const { data } = await userApi.me(signal);
    if (!getToken()) return data; // logged out while this request was in flight: do not bring the user back
    setUser(data.user);
    setProfile({ stats: data.stats, perks: data.perks });
    return data;
  }, []);

  // A 401 from ANY request lands here: forget the session and send the customer to log in again.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (!getToken()) return; // already logged out (e.g. a request that was in flight while signing out)
      setSessionEnd("expired");
      clearSession();
      toast("Your session ended. Please log in again.", "warn");
      navigate("/login", { state: { from: locationRef.current } });
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession, navigate, toast]);

  // On first load: if a token is stored, ask the server who it belongs to. (Offline? we keep the saved profile.)
  useEffect(() => {
    if (!getToken()) return undefined;
    const controller = new AbortController();
    refreshProfile(controller.signal)
      .catch((error) => { if (error.name !== "AbortError" && error.status === 401) clearSession(); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refreshProfile, clearSession]);

  const login = useCallback(async (identifier, password) => {
    const { data } = await authApi.login(identifier, password);
    setSessionEnd(null);
    setToken(data.token);
    setUser(data.user);
    refreshProfile().catch(() => {});
    return data.user;
  }, [refreshProfile]);

  const register = useCallback(async (body) => {
    const { data } = await authApi.register(body);
    setSessionEnd(null);
    setToken(data.token);
    setUser(data.user);
    refreshProfile().catch(() => {});
    return data.user;
  }, [refreshProfile]);

  const logout = useCallback(async () => {
    const token = getToken();
    setSessionEnd("logout");
    clearSession(); // forget locally FIRST so nothing still in flight can trigger a "session ended" redirect
    try { if (token) await authApi.logout(token); } catch { /* the server session may already be gone; we are logged out locally anyway */ }
  }, [clearSession]);

  const value = useMemo(
    () => ({ user, profile, loading, sessionEnd, isAuthenticated: Boolean(user), isAdmin: user?.role === "admin", login, register, logout, refreshProfile }),
    [user, profile, loading, sessionEnd, login, register, logout, refreshProfile]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
