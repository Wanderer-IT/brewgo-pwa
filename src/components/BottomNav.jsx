import { NavLink } from "react-router-dom";
import Icon from "./Icon";

const ITEMS = [
  { to: "/", label: "Home", icon: "home", end: true },
  { to: "/products", label: "Menu", icon: "cup" },
  { to: "/orders", label: "Orders", icon: "bag" },
  { to: "/rewards", label: "Rewards", icon: "gift" },
  { to: "/profile", label: "Profile", icon: "user" },
];

// Thumb-friendly sticky navigation (replaces a desktop top navbar).
export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Main">
      <ul>
        {ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink to={item.to} end={item.end} className={({ isActive }) => `bottom-nav__link${isActive ? " is-active" : ""}`}>
              <Icon name={item.icon} size={22} />
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
