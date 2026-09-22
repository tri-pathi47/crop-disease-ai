import { NavLink, useLocation } from "react-router-dom";
import { Icons } from "./Icons.jsx";
import { LANGUAGES, makeT } from "../lib/i18n.js";
import { useFarm } from "../lib/useFarm.jsx";
import { useEffect, useState } from "react";

export const NAV = [
  { to: "/", key: "home", label: "Home", icon: "home", group: "Every day" },
  { to: "/analyse", key: "analyse", label: "Check crop", icon: "cam", group: "Every day" },
  { to: "/chat", key: "chat", label: "Assistant", icon: "chat", group: "Every day" },
  { to: "/map", key: "map", label: "Farm map", icon: "map", group: "Every day" },
  { to: "/soil", key: "soil", label: "Soil", icon: "soil", group: "Field intelligence" },
  { to: "/weather", key: "weather", label: "Weather", icon: "sun", group: "Field intelligence" },
  { to: "/satellite", key: "satellite", label: "Satellite", icon: "sat", group: "Field intelligence" },
  { to: "/monitoring", key: "monitoring", label: "Monitoring", icon: "clock", group: "Records" },
  { to: "/alerts", key: "alerts", label: "Alerts", icon: "bell", group: "Records" },
  { to: "/knowledge", key: "knowledge", label: "Knowledge", icon: "book", group: "Records" },
  { to: "/reports", key: "reports", label: "Reports", icon: "doc", group: "Records" },
  { to: "/profile", key: "profile", label: "Profile", icon: "user", group: "Records" },
];

const TABS = ["/", "/analyse", "/chat", "/map", "/more"];

export default function Shell({ children }) {
  const { lang, expert, set } = useFarm();
  const t = makeT(lang);
  const { pathname } = useLocation();
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(id); }, []);
  const groups = [...new Set(NAV.map((n) => n.group))];

  return (
    <>
      <div className="app">
        <nav className="rail" aria-label="Sections">
          <div className="brand">
            <Icons.leaf width="30" height="30" />
            <b>Inno Sphere</b>
            <span>{t("tagline")}</span>
          </div>
          <div>
            {groups.map((g) => (
              <div key={g}>
                <div className="group">{g}</div>
                {NAV.filter((n) => n.group === g).map((n) => {
                  const Icon = Icons[n.icon];
                  return (
                    <NavLink key={n.to} to={n.to} end={n.to === "/"}
                      className="nav"
                      style={({ isActive }) => (isActive ? { background: "var(--leaf-soft)", color: "var(--leaf-deep)" } : undefined)}>
                      <Icon width="19" height="19" />
                      <span>{n.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </div>
        </nav>

        <div className="main">
          <header className="topbar">
            <div className="brand">
              <Icons.leaf width="26" height="26" />
              <b>Inno Sphere</b>
            </div>
            <div className="spacer" />
            <time className="local-time" dateTime={now.toISOString()}>
              {now.toLocaleDateString(undefined, { day: "numeric", month: "short" })} · {now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            </time>
            <select aria-label="Language" value={lang}
              onChange={(e) => set({ lang: e.target.value })}
              style={{ width: "auto", margin: 0, padding: "8px 10px", fontSize: ".84rem", fontWeight: 600 }}>
              {LANGUAGES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
            </select>
            <button className={`pill ${expert ? "on" : ""}`} aria-pressed={expert}
              onClick={() => set({ expert: !expert })}>🔬 <span>{t("expert")}</span></button>
          </header>

          <main className="content" id="view">{children}</main>
        </div>
      </div>

      <nav className="tabbar" aria-label="Main">
        {TABS.map((to) => {
          const n = to === "/more"
            ? { to, label: "More", icon: "more" }
            : NAV.find((x) => x.to === to);
          const Icon = Icons[n.icon];
          const current = to === "/more" ? !TABS.includes(pathname) : pathname === to;
          return (
            <NavLink key={to} to={to} end={to === "/"} aria-current={current ? "page" : undefined}>
              <Icon width="22" height="22" />
              <span>{n.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
