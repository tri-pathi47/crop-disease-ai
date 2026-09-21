import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Status } from "../components/Ui.jsx";
import Empty from "../components/Empty.jsx";
import { api } from "../lib/api.js";
import { useFarm } from "../lib/useFarm.jsx";

export default function Alerts() {
  const { farm } = useFarm();
  const nav = useNavigate();
  const [alerts, setAlerts] = useState(null);

  useEffect(() => { api.alerts(farm.id).then(setAlerts).catch(() => setAlerts([])); }, [farm.id]);

  if (alerts === null) return <p className="muted">Loading alerts…</p>;

  return (
    <>
      <h1>Alerts</h1>
      <p className="lede">Each alert says why it fired. Raised risk is not the same as a confirmed problem.</p>
      {alerts.length === 0 ? (
        <Empty title="Nothing flagged right now"
          body="Alerts appear when the weather, your field readings or your own photos suggest a problem is starting."
          action="Check my crop" onAction={() => nav("/analyse")} />
      ) : (
        <div className="grid">
          {alerts.map((a, i) => (
            <div className="card" key={i}>
              <Status level={a.level}>{a.level === "risk" ? "Act soon" : a.level === "watch" ? "Monitor" : "For information"}</Status>
              <h3 style={{ marginTop: 9 }}>{a.title}</h3>
              <p className="muted" style={{ marginBottom: 10 }}>{a.reason}</p>
              {a.action && <button className="btn ghost" onClick={() => nav("/analyse")}>{a.action}</button>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
