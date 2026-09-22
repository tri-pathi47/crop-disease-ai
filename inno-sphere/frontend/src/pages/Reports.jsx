import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sources } from "../components/Ui.jsx";
import Empty from "../components/Empty.jsx";
import { api } from "../lib/api.js";
import { useFarm } from "../lib/useFarm.jsx";
import { cropInfo, SOURCES } from "../lib/appData.js";

export default function Reports({ result }) {
  const { farm } = useFarm();
  const nav = useNavigate();
  const [history, setHistory] = useState([]);

  useEffect(() => { api.diagnosisHistory(farm.cropCycleId).then(setHistory).catch(() => {}); }, [farm.cropCycleId]);

  const latest = result && !result.offline ? result : null;

  if (!latest && history.length === 0) {
    return (
      <>
        <h1>Reports</h1>
        <Empty title="No report to show yet"
          body="A crop health report is created every time you complete a check. You can print it or save it as a PDF to take to a KVK."
          action="Check my crop" onAction={() => nav("/analyse")} />
      </>
    );
  }

  return (
    <>
      <h1>Crop health report</h1>
      <p className="lede">
        {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} · {farm.name}
      </p>

      {latest && (
        <div className="card">
          <div className="kv"><span>Crop</span><b>{cropInfo(farm.crop).name} ({farm.variety || "not specified"})</b></div>
          <div className="kv"><span>Growth stage</span><b>{farm.stage}</b></div>
          <div className="kv"><span>Main finding</span><b>{latest.primary}</b></div>
          <div className="kv"><span>Severity</span><b>{latest.severity === "risk" ? "High" : latest.severity === "watch" ? "Moderate" : "Low"}</b></div>
          <div className="kv"><span>Confidence</span><b>{latest.confidence}</b></div>
          <div className="kv"><span>Evidence used</span><b>{latest.evidence.filter((e) => e.ok).map((e) => e.key).join(", ")}</b></div>
          <div className="kv"><span>Other possibilities</span><b>{latest.differential.slice(1, 3).map((d) => d.label).join(", ")}</b></div>
          <div className="kv"><span>Recommended action</span><b>{latest.actions[0]}</b></div>
          <div className="kv"><span>Next check</span><b>Within 24–48 hours</b></div>
        </div>
      )}

      <h2>Earlier reports</h2>
      <div className="card scroll-x">
        <table>
          <thead><tr><th>Date</th><th>Finding</th><th>Confidence</th><th>Severity</th></tr></thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.id}>
                <td>{new Date(h.date).toLocaleDateString()}</td>
                <td>{h.finding}</td>
                <td>{h.confidence}</td>
                <td>{h.severity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn ghost" onClick={() => window.print()}>Print or save as PDF</button>
      </div>

      <h2>Sources</h2>
      <Sources list={SOURCES} />
    </>
  );
}
