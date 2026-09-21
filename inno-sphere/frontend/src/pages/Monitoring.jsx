import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Status } from "../components/Ui.jsx";
import Empty from "../components/Empty.jsx";
import { api } from "../lib/api.js";
import { useFarm } from "../lib/useFarm.jsx";

export default function Monitoring() {
  const { farm } = useFarm();
  const nav = useNavigate();
  const [history, setHistory] = useState(null);

  useEffect(() => {
    api.diagnosisHistory(farm.cropCycleId).then(setHistory).catch(() => setHistory([]));
  }, [farm.cropCycleId]);

  if (history === null) return <p className="muted">Loading history…</p>;

  if (!history.length) {
    return (
      <>
        <h1>Crop health over time</h1>
        <Empty title="No checks recorded yet"
          body="Every time you send photos, the result is saved here so improvement or spread can be compared across days."
          action="Check my crop" onAction={() => nav("/analyse")} />
      </>
    );
  }

  const ordered = [...history].reverse();
  const first = ordered[0], last = ordered[ordered.length - 1];
  const rank = { ok: 0, watch: 1, risk: 2 };
  const direction = rank[last.severity] < rank[first.severity] ? "Improving"
    : rank[last.severity] > rank[first.severity] ? "Getting worse" : "Steady";

  return (
    <>
      <h1>Crop health over time</h1>
      <p className="lede">Every check on this crop, oldest first.</p>
      <div className="card">
        <ul className="tl">
          {ordered.map((h) => (
            <li key={h.id}>
              <div className="d">
                {new Date(h.date).toLocaleDateString()}{" "}
                <Status level={h.severity}>{h.severity === "ok" ? "Normal" : h.severity === "watch" ? "Watch" : "Problem"}</Status>
              </div>
              {h.finding} · {h.confidence} confidence
            </li>
          ))}
        </ul>
      </div>

      <h2>What changed</h2>
      <div className="card">
        <div className="kv"><span>Direction</span><b>{direction}</b></div>
        <div className="kv"><span>Checks recorded</span><b>{history.length}</b></div>
        <div className="kv"><span>Latest finding</span><b>{last.finding}</b></div>
      </div>

      <button className="btn" style={{ marginTop: 14 }} onClick={() => nav("/analyse")}>Add today's photos</button>
    </>
  );
}
