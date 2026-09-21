import { useNavigate } from "react-router-dom";
import { NAV } from "../components/Shell.jsx";
import { Icons } from "../components/Icons.jsx";

const TABS = ["/", "/analyse", "/chat", "/map"];

export default function More() {
  const nav = useNavigate();
  return (
    <>
      <h1>More</h1>
      <p className="lede">Everything else Inno Sphere keeps for your farm.</p>
      <div className="grid g3">
        {NAV.filter((n) => !TABS.includes(n.to)).map((n) => {
          const Icon = Icons[n.icon];
          return (
            <button className="tile" key={n.to} onClick={() => nav(n.to)}
              style={{ cursor: "pointer", textAlign: "left", alignItems: "flex-start" }}>
              <span style={{ color: "var(--leaf)", display: "block", width: 24, height: 24 }}>
                <Icon width="24" height="24" />
              </span>
              <span className="n" style={{ fontSize: "1rem" }}>{n.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
