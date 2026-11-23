const PATHS = {
  home: "M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z",
  cup: "M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 10h1.5a2.5 2.5 0 0 1 0 5H17M7 3v2M11 3v2M15 3v2",
  bag: "M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2",
  gift: "M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7c-2 0-4-1-3.5-3S12 4 12 7zM12 7c2 0 4-1 3.5-3S12 4 12 7z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  bell: "M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4",
  heart: "M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  back: "M15 5l-7 7 7 7",
  chevron: "M9 5l7 7-7 7",
  close: "M6 6l12 12M18 6L6 18",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5",
  check: "M5 12l5 5 9-10",
  alert: "M12 8v5M12 17h.01M10.3 3.9L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  eyeOff: "M3 3l18 18M10.6 6.2A9 9 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.2 3.7M6.1 7.7A17 17 0 0 0 2 12s4 6 10 6a9 9 0 0 0 3.4-.7",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  cloudOff: "M3 3l18 18M8 8a5 5 0 0 0-1 9h11M10 5.2A6 6 0 0 1 18 10a4 4 0 0 1 3 3.5",
  flame: "M12 22c4 0 7-3 7-7 0-3-2-5-3-7-1 2-2 3-3 3 0-4-2-7-5-9 0 5-3 7-3 11 0 4 3 7 7 9z",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z",
  chat: "M4 5h16v11H9l-5 4z",
  mail: "M3 6h18v12H3zM3 7l9 7 9-7",
  pin: "M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  logout: "M9 4H5v16h4M16 8l4 4-4 4M20 12H9",
  card: "M3 6h18v12H3zM3 10h18",
  wallet: "M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 7l3-3h11M16 14h2",
  store: "M4 9l1-5h14l1 5M4 9v11h16V9M4 9a3 3 0 0 0 5 0 3 3 0 0 0 6 0 3 3 0 0 0 5 0",
  sliders: "M4 7h10M18 7h2M4 17h2M10 17h10M14 5v4M6 15v4",
  refresh: "M20 11a8 8 0 1 0-2 6M20 5v6h-6",
  cash: "M3 7h18v10H3zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  tag: "M3 12V4h8l10 10-8 8zM7.5 8.5h.01",
};

// Decorative by default (aria-hidden). Pass `label` when the icon stands alone.
export default function Icon({ name, size = 22, label, filled = false, className = "" }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
      focusable="false"
    >
      <path d={PATHS[name] || PATHS.alert} />
    </svg>
  );
}
