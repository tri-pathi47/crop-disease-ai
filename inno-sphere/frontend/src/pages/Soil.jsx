import { useEffect, useState } from "react";
import { Banner } from "../components/Ui.jsx";
import Empty from "../components/Empty.jsx";
import { api } from "../lib/api.js";
import { useFarm } from "../lib/useFarm.jsx";
import { SOIL_FIELDS, SUFFICIENCY } from "../lib/appData.js";

export default function Soil() {
  const { farm } = useFarm();
  const [soil, setSoil] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});
  const [saved, setSaved] = useState(null);

  useEffect(() => {
    api.soil(farm.id).then((s) => { setSoil(s); setDraft(s); }).catch(() => setSoil(false));
  }, [farm.id]);

  async function save() {
    const payload = { farm_id: farm.id, source: "soil_health_card", ...draft };
    try {
      await api.saveSoil(payload);
      setSoil(payload); setEditing(false); setSaved("Soil record saved");
    } catch (err) { setSaved(err.message); }
  }

  const flag = (key, value) => {
    const range = SUFFICIENCY[key];
    if (!range || value == null || value === "") return null;
    const v = Number(value);
    if (v < range[0]) return "below the usual sufficiency range";
    if (v > range[1]) return "above the usual range";
    return null;
  };

  if (soil === null) return <p className="muted">Loading soil record…</p>;

  if (soil === false && !editing) {
    return (
      <>
        <h1>Soil</h1>
        <Empty title="No soil record yet"
          body="Enter the values from your Soil Health Card. Lab values are what separate a nutrient problem from a disease — satellite data cannot give them."
          action="Enter soil values" onAction={() => setEditing(true)} />
      </>
    );
  }

  if (editing) {
    return (
      <>
        <h1>Soil values</h1>
        <p className="lede">Copy the figures from your Soil Health Card. Leave anything you do not have blank.</p>
        <div className="card">
          <div className="grid g3">
            {SOIL_FIELDS.map(([key, label, unit]) => (
              <label className="field" key={key}>{label}{unit && ` (${unit})`}
                <input value={draft[key] ?? ""} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />
              </label>
            ))}
          </div>
          <div className="row">
            <button className="btn" onClick={save}>Save soil record</button>
            <button className="btn ghost" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      </>
    );
  }

  const issues = SOIL_FIELDS.map(([k, label]) => [label, flag(k, soil[k])]).filter(([, f]) => f);

  return (
    <>
      <h1>Soil</h1>
      <p className="lede">
        {soil.source === "soil_health_card" ? "From your Soil Health Card" : "Entered by you"}
        {soil.tested_on ? `, tested ${soil.tested_on}` : ""}.
      </p>
      <div className="grid g2">
        <div className="card">
          <h3>Test values</h3>
          {SOIL_FIELDS.map(([key, label, unit]) => (
            <div className="kv" key={key}>
              <span>{label}</span>
              <b>{soil[key] ?? "—"}{soil[key] != null && unit ? ` ${unit}` : ""}</b>
            </div>
          ))}
          <button className="btn ghost" style={{ marginTop: 12 }} onClick={() => setEditing(true)}>Update values</button>
        </div>
        <div className="card">
          <h3>What this means for your crop</h3>
          {issues.length === 0 ? (
            <p>Every value you entered sits inside the usual sufficiency range for this soil type.</p>
          ) : (
            <ul style={{ paddingLeft: 18 }}>
              {issues.map(([label, note]) => <li key={label} style={{ marginBottom: 6 }}>{label} is {note}.</li>)}
            </ul>
          )}
          <p>
            A nutrient shortage shows as a pattern tied to leaf age and veins. A fungal
            disease shows as discrete spots, usually starting on older leaves. That
            difference is what the assessment uses these values for.
          </p>
          <Banner>Satellite data cannot give lab-grade nitrogen, phosphorus or potassium values. Only a soil test can.</Banner>
        </div>
      </div>
      {saved && <p className="muted" style={{ marginTop: 10 }}>{saved}</p>}
    </>
  );
}
