import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Banner, Status, zoneColor } from "../components/Ui.jsx";
import Empty from "../components/Empty.jsx";
import { api } from "../lib/api.js";
import { useFarm } from "../lib/useFarm.jsx";
import { CROPS } from "../lib/appData.js";

export default function FarmMap() {
  const { farm, farmer } = useFarm();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => { api.satellite(farm.id).then(setData).catch(() => setData({ zones: [], source: "error" })); }, [farm.id]);

  const zones = data?.zones ?? [];
  const zone = zones.find((z) => z.id === selected);

  return (
    <>
      <h1>Farm map</h1>
      <p className="lede">{farm.name} · {farmer.area} ha · {farm.lat}, {farm.lng}</p>

      {zones.length === 0 ? (
        <Empty title="No field readings yet"
          body={data?.message || "Connect a Copernicus Data Space account in settings to pull Sentinel-2 imagery, or draw your field boundary to start local monitoring."}
          action="Open profile" onAction={() => nav("/profile")} />
      ) : (
        <div className="grid g2" style={{ marginTop: 14 }}>
          <div className="card">
            <div className="fieldmap">
              {zones.map((z) => (
                <button key={z.id} style={{ background: zoneColor(z.status) }}
                  aria-pressed={selected === z.id} onClick={() => setSelected(z.id)}>{z.id}</button>
              ))}
            </div>
            <div className="chips" style={{ marginTop: 12 }}>
              <Status level="ok">Healthy</Status>
              <Status level="watch">Monitor</Status>
              <Status level="risk">Stress</Status>
            </div>
            <p className="muted" style={{ marginTop: 10 }}>Tap a zone to see its condition.</p>
          </div>

          <div className="card">
            {zone ? (
              <>
                <h3>Zone {zone.id}</h3>
                <Status level={zone.status}>
                  {zone.status === "ok" ? "Normal" : zone.status === "watch" ? "Monitor" : "Stress detected"}
                </Status>
                <div className="kv" style={{ marginTop: 10 }}><span>Crop</span><b>{CROPS[farm.crop]?.name}</b></div>
                <div className="kv"><span>Vegetation index</span><b>{zone.ndvi?.toFixed(2)}</b></div>
                <div className="kv"><span>Suggested action</span><b>{zone.status === "ok" ? "No action" : "Walk this zone and photograph five plants"}</b></div>
                <button className="btn" style={{ marginTop: 12 }} onClick={() => nav("/analyse")}>Send photos from this zone</button>
              </>
            ) : (
              <>
                <h3>No zone selected</h3>
                <p className="muted">Tap a square to see crop condition, satellite trend and what to check on the ground.</p>
              </>
            )}
          </div>
        </div>
      )}

      <Banner>
        The satellite view shows how parts of the field differ from each other. It
        cannot identify a specific disease on its own — it tells you where to walk
        and look.
      </Banner>
    </>
  );
}
