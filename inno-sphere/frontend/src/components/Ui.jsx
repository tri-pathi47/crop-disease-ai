export const statusClass = (s) => (s === "ok" ? "s-ok" : s === "watch" ? "s-watch" : "s-risk");
export const zoneColor = (s) => (s === "ok" ? "#2f8f4e" : s === "watch" ? "#c9922b" : "#c0392b");

export function Status({ level, children }) {
  return <span className={`status ${statusClass(level)}`}><i className="dot" />{children}</span>;
}

export function DemoTag({ detail }) {
  return <span className="status s-demo">Demo data{detail ? ` · ${detail}` : ""}</span>;
}

export function Tile({ label, value, level, sub }) {
  return (
    <div className="tile">
      <Status level={level}>{label}</Status>
      <span className="n">{value}</span>
      <span className="l">{sub}</span>
    </div>
  );
}

export function Kv({ label, children }) {
  return <div className="kv"><span>{label}</span><b>{children}</b></div>;
}

export function Card({ title, children, style }) {
  return (
    <div className="card" style={style}>
      {title && <h3>{title}</h3>}
      {children}
    </div>
  );
}

export function Banner({ children, level }) {
  const border = level === "risk" ? "var(--risk)" : level === "ok" ? "var(--ok)" : "var(--wheat)";
  return <div className="banner" style={{ borderColor: border }}>{children}</div>;
}

export function Sources({ list }) {
  return (
    <div className="card">
      {list.map((s) => (
        <div className="kv" key={s.name}>
          <span><b>{s.name}</b><br /><span className="muted">{s.detail}</span></span>
          <a href={s.url} target="_blank" rel="noreferrer"
             style={{ color: "var(--leaf)", fontWeight: 700, fontSize: ".82rem" }}>Open</a>
        </div>
      ))}
    </div>
  );
}
