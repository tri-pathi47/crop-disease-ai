import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Banner } from "../components/Ui.jsx";
import Empty from "../components/Empty.jsx";
import { api } from "../lib/api.js";
import { useFarm } from "../lib/useFarm.jsx";

function Spark({ values }) {
  if (!values?.length) return null;
  const w = 280, h = 80;
  const max = Math.max(...values), min = Math.min(...values);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * (h - 10) - 5}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto", margin: "6px 0 10px" }} aria-hidden="true">
      <polyline points={pts} fill="none" stroke="var(--leaf)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export default function Satellite() {
  const { farm } = useFarm();
  const nav = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => { api.satellite(farm.id).then(setData).catch(() => setData({ zones: [] })); }, [farm.id]);

  if (data && !data.series?.length) {
    return (
      <>
        <h1>Satellite and field trend</h1>
        <p className="lede">Field-level monitoring from open Earth observation data. No special hardware on your side.</p>
        <Empty title="Not connected yet"
          body={data.message || "Add Copernicus Data Space credentials to pull Sentinel-2 imagery for this farm."}
          action="Open profile" onAction={() => nav("/profile")} />
        <h2>What the bands measure</h2>
        <Bands />
      </>
    );
  }

  return (
    <>
      <h1>Satellite and field trend</h1>
      <p className="lede">Field-level monitoring from open Earth observation data.</p>
      <div className="grid g2" style={{ marginTop: 14 }}>
        <div className="card">
          <h3>Vegetation index over time</h3>
          <Spark values={data?.series} />
          <p className="muted">
            {data?.flagged_zones?.length
              ? `The decline is concentrated in ${data.flagged_zones.join(", ")} rather than spread evenly, which usually points at a local problem.`
              : "Loading field history."}
          </p>
        </div>
        <div className="card"><h3>What the bands measure</h3><Bands /></div>
      </div>
      <Banner>
        Satellite-observed spectral response and environmental data are used as
        supporting evidence for crop-health analysis. They are not a direct disease
        measurement.
      </Banner>
    </>
  );
}

function Bands() {
  return (
    <div className="card" style={{ border: 0, boxShadow: "none", padding: 0 }}>
      <div className="kv"><span>NDVI (red / near-infrared)</span><b>Canopy vigour</b></div>
      <div className="kv"><span>NDRE (red edge)</span><b>Early stress before it is visible</b></div>
      <div className="kv"><span>NDMI (shortwave infrared)</span><b>Canopy moisture</b></div>
      <div className="kv"><span>Revisit</span><b>About every 5 days, cloud permitting</b></div>
    </div>
  );
}
