import { useEffect, useState } from "react";
import { Banner, Status, Tile } from "../components/Ui.jsx";
import { api } from "../lib/api.js";
import { useFarm } from "../lib/useFarm.jsx";

export default function Weather() {
  const { farm, farmer } = useFarm();
  const [wx, setWx] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.weather(farm.lat, farm.lng).then(setWx).catch((e) => setError(e.message));
  }, [farm.lat, farm.lng]);

  if (error) return <><h1>Weather</h1><Banner level="risk">Weather is not loading. {error}</Banner></>;
  if (!wx) return <p className="muted">Loading forecast…</p>;

  return (
    <>
      <h1>Weather</h1>
      <p className="lede">{farmer.district} · {wx.current.condition}</p>
      <div className="grid g4">
        <Tile label="Temperature" value={`${wx.current.temp}°C`} level="ok" sub={wx.current.condition} />
        <Tile label="Humidity" value={`${wx.current.humidity}%`}
          level={wx.current.humidity > 78 ? "watch" : "ok"}
          sub={wx.current.humidity > 78 ? "Above the disease threshold" : "Within normal range"} />
        <Tile label="Wind" value={`${wx.current.wind} km/h`} level="ok" sub="At the farm" />
        <Tile label="Disease pressure" value={wx.disease_pressure[0].toUpperCase() + wx.disease_pressure.slice(1)}
          level={wx.disease_pressure === "high" ? "risk" : wx.disease_pressure === "moderate" ? "watch" : "ok"}
          sub={`${wx.humid_nights} humid nights ahead`} />
      </div>

      <h2>Next five days</h2>
      <div className="card scroll-x">
        <table>
          <thead><tr><th>Day</th><th>Max / Min</th><th>Rain</th><th>Humidity</th><th>Disease pressure</th></tr></thead>
          <tbody>
            {wx.forecast.map((d) => (
              <tr key={d.day}>
                <td><b>{d.day}</b></td>
                <td>{d.max} / {d.min} °C</td>
                <td>{d.rain}%</td>
                <td>{d.humidity}%</td>
                <td><Status level={d.humidity > 78 ? "risk" : "ok"}>{d.humidity > 78 ? "High" : "Low"}</Status></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Banner>{wx.note}</Banner>
      <p className="muted" style={{ marginTop: 10 }}>Forecast provided by {wx.provider}.</p>
    </>
  );
}
