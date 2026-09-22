import { useState } from "react";
import { useFarm } from "../lib/useFarm.jsx";
import { CROPS } from "../lib/appData.js";
import { useAuth } from "../lib/auth.jsx";
import { api } from "../lib/api.js";

export default function Profile() {
  const { farmer, farm, setFarmer, setFarm } = useFarm();
  const { logout } = useAuth();
  const [saved, setSaved] = useState(false);
  const [locating, setLocating] = useState(false);

  function locateFarm() {
    if (!navigator.geolocation) {
      setSaved("Location is not supported by this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const patch = { lat: coords.latitude, lng: coords.longitude };
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}&zoom=10`, { headers: { Accept: "application/json" } });
        const place = await response.json();
        const address = place.address || {};
        setFarmer({
          district: address.county || address.city_district || address.city || farmer.district,
          state: address.state || farmer.state,
          village: address.village || address.town || address.city || farmer.village,
        });
        setSaved("Location and locality detected.");
      } catch {
        setSaved("Coordinates detected. Locality lookup is temporarily unavailable.");
      } finally { setFarm(patch); setLocating(false); }
    }, () => { setSaved("Location permission was not granted."); setLocating(false); }, { enableHighAccuracy: true, timeout: 10000 });
  }

  async function saveDetails() {
    try {
      await api.updateFarm(farm.id, {
        name: farm.name, latitude: farm.lat, longitude: farm.lng, area_ha: farmer.area,
      });
      await api.updateMe({
        name: farmer.name, state: farmer.state, district: farmer.district,
        village: farmer.village, land_area_ha: Number(farmer.area) || null,
        experience_years: Number(farmer.experience) || null,
      });
      await api.updateCrop(farm.cropCycleId, {
        farm_id: farm.id, crop: farm.crop, variety: farm.variety || null,
        sowing_date: farm.sown || null, growth_stage: farm.stage,
      });
      setSaved("Farm details saved.");
    } catch (err) { setSaved(err.message); }
  }

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
          <button className="btn ghost" type="button" onClick={locateFarm} disabled={locating}>
            {locating ? "Detecting location..." : "Use my current location"}
          </button>
          <a className="muted" href={`https://www.google.com/maps/search/?api=1&query=${farm.lat},${farm.lng}`} target="_blank" rel="noreferrer">
            Open this farm in Google Maps
          </a>
        </div>
      </div>

      <h2>Connected services</h2>
      <div className="card">
        <div className="kv"><span>Weather</span><b>Open-Meteo, live</b></div>
        <div className="kv"><span>Satellite imagery</span><b>{farm.lat && farm.lng ? "Location ready; live Sentinel-2 needs a connected provider" : "Add a farm location"}</b></div>
        <div className="kv"><span>Soil values</span><b>Enter values from a Soil Health Card or lab report</b></div>
        <div className="kv"><span>Indian-language speech</span><b>Browser speech, or Bhashini when configured</b></div>
      </div>

      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn" onClick={saveDetails}>Save details</button>
        <button className="btn ghost" onClick={() => {
          const el = document.documentElement;
          el.dataset.theme = el.dataset.theme === "dark" ? "light" : "dark";
        }}>Switch light / dark</button>
        <button className="btn ghost" onClick={logout}>Sign out</button>
      </div>
      {saved && <p className="muted" style={{ marginTop: 10 }}>Saved on this device.</p>}
    </>
  );
}
