import { lazy, Suspense } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import BottomNav from "./components/BottomNav";
import OfflineBanner from "./components/OfflineBanner";
import ReloadPrompt from "./components/ReloadPrompt";
import ProtectedRoute from "./components/ProtectedRoute";
import SkeletonLoader from "./components/SkeletonLoader";

// Route-level code splitting (React.lazy): each page downloads only when it is opened.
const Home = lazy(() => import("./pages/Home"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const AiAssistant = lazy(() => import("./pages/AiAssistant"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const PaymentResult = lazy(() => import("./pages/PaymentResult"));
const Orders = lazy(() => import("./pages/Orders"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const Rewards = lazy(() => import("./pages/Rewards"));
const Profile = lazy(() => import("./pages/Profile"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Contact = lazy(() => import("./pages/Contact"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Pages that show the bottom tab bar. Cart, checkout, product detail and payment pages use their own sticky action bar instead.
const NAV_PATHS = ["/", "/products", "/orders", "/rewards", "/profile", "/favorites", "/notifications", "/ai-assistant", "/contact"];

export default function App() {
  const { pathname } = useLocation();
  const showNav = NAV_PATHS.includes(pathname) || /^\/orders\/\d+$/.test(pathname);

  return (
    <div className="app-shell">
      <OfflineBanner />
      <Suspense fallback={<main className="page" aria-busy="true"><SkeletonLoader variant="grid" count={4} /></main>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/ai-assistant" element={<AiAssistant />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* customer-only pages */}
          <Route element={<ProtectedRoute />}>
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/payment/success" element={<PaymentResult variant="success" />} />
            <Route path="/payment/cancelled" element={<PaymentResult variant="cancelled" />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/rewards" element={<Rewards />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/notifications" element={<Notifications />} />
          </Route>

          {/* The finals brief marks /admin/* as optional. This build has no admin UI: staff use the API/Postman. */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      {showNav && <BottomNav />}
      <ReloadPrompt />
    </div>
  );
}
