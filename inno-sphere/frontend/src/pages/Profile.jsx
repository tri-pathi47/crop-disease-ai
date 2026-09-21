import { useState } from "react";
import { useFarm } from "../lib/useFarm.jsx";
import { CROPS } from "../lib/appData.js";

export default function Profile() {
  const { farmer, farm, setFarmer, setFarm } = useFarm();
  const [saved, setSaved] = useState(false);

  const field = (label, value, onChange, type = "text") => (
    <label className="field" key={label}>{label}
      <input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </label>
  );

  return (
    <>
      <h1>Profile and farm</h1>
      <p className="lede">These details become the context every part of the assistant uses.</p>

      <div className="grid g2">
        <div className="card">
          <h3>Farmer</h3>
          {field("Name", farmer.name, (v) => setFarmer({ name: v }))}
          {field("State", farmer.state, (v) => setFarmer({ state: v }))}
          {field("District", farmer.district, (v) => setFarmer({ district: v }))}
          {field("Village or region (optional)", farmer.village, (v) => setFarmer({ village: v }))}
          {field("Land area (hectares)", farmer.area, (v) => setFarmer({ area: v }))}
          {field("Years of farming", farmer.experience, (v) => setFarmer({ experience: v }))}
          <label className="field">Answer style
            <select><option>Voice and text</option><option>Voice only</option><option>Text only</option></select>
          </label>
          <p className="muted">Language is chosen at the top of the screen and is never set automatically from your location.</p>
        </div>

        <div className="card">
          <h3>Farm</h3>
          {field("Farm name", farm.name, (v) => setFarm({ name: v }))}
          <label className="field">Crop
            <select value={farm.crop} onChange={(e) => setFarm({ crop: e.target.value, stage: CROPS[e.target.value].stages[0] })}>
              {Object.entries(CROPS).map(([k, c]) => <option key={k} value={k}>{c.name}</option>)}
            </select>
          </label>
          {field("Variety", farm.variety, (v) => setFarm({ variety: v }))}
          <label className="field">Growth stage
            <select value={farm.stage} onChange={(e) => setFarm({ stage: e.target.value })}>
              {CROPS[farm.crop].stages.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          {field("Sowing date", farm.sown, (v) => setFarm({ sown: v }), "date")}
          <div className="row">
            <div style={{ flex: 1 }}>{field("Latitude", farm.lat, (v) => setFarm({ lat: Number(v) }))}</div>
            <div style={{ flex: 1 }}>{field("Longitude", farm.lng, (v) => setFarm({ lng: Number(v) }))}</div>
          </div>
        </div>
      </div>

      <h2>Connected services</h2>
      <div className="card">
        <div className="kv"><span>Weather</span><b>Open-Meteo, live</b></div>
        <div className="kv"><span>Satellite imagery</span><b>Copernicus Data Space — add credentials in the backend .env</b></div>
        <div className="kv"><span>Indian-language speech</span><b>Browser speech, or Bhashini when configured</b></div>
      </div>

      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn" onClick={() => setSaved(true)}>Save details</button>
        <button className="btn ghost" onClick={() => {
          const el = document.documentElement;
          el.dataset.theme = el.dataset.theme === "dark" ? "light" : "dark";
        }}>Switch light / dark</button>
      </div>
      {saved && <p className="muted" style={{ marginTop: 10 }}>Saved on this device.</p>}
    </>
  );
}
