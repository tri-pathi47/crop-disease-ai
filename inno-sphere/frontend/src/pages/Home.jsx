import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icons } from "../components/Icons.jsx";
import { Status, Tile, Banner } from "../components/Ui.jsx";
import { api } from "../lib/api.js";
import { makeT } from "../lib/i18n.js";
import { useFarm } from "../lib/useFarm.jsx";
import { cropInfo } from "../lib/appData.js";

export default function Home() {
  const { lang, farmer, farm, remoteReady } = useFarm();
  const t = makeT(lang);
  const nav = useNavigate();
  const [weather, setWeather] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.weather(farm.lat, farm.lng).then((data) => {
      if (!data?.current) {
        setError("weather");
        return;
      }
      setWeather(data);
    }).catch(() => setError("weather"));
    api.alerts(farm.id).then(setAlerts).catch(() => {});
    if (remoteReady) api.diagnosisHistory(farm.cropCycleId).then(setTimeline).catch(() => {});
  }, [farm.id, farm.lat, farm.lng, farm.cropCycleId]);

  const pressure = weather?.disease_pressure;
  const level = pressure === "high" ? "risk" : pressure === "moderate" ? "watch" : "ok";
  const latest = timeline[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t("greetMorning")
    : hour < 17 ? t("greetAfternoon")
      : hour < 21 ? t("greetEvening") : t("greetNight");

  return (
    <>
      <h1>{greeting}, {farmer.name}</h1>
      <p className="lede">
        {farm.name} · {cropInfo(farm.crop).name} · {farm.stage} stage · {farmer.district}
      </p>

      <div className="grid g4">
        <Tile label={t("health")} level={latest ? latest.severity : "ok"}
          value={latest ? latest.finding.split(",")[0] : "No check yet"}
          sub={latest ? `Checked ${new Date(latest.date).toLocaleDateString()}` : "Send photos to start"} />
        <Tile label={t("disease")} level={level}
          value={pressure ? pressure[0].toUpperCase() + pressure.slice(1) : "—"}
          sub={weather ? `${weather.humid_nights} humid nights ahead` : error ? "Unavailable right now" : "Loading forecast"} />
        <Tile label="Temperature" level="ok"
          value={weather?.current ? `${weather.current.temp}°C` : "—"}
          sub={weather?.current ? weather.current.condition : "Unavailable"} />
        <Tile label="Humidity" level={weather?.current && weather.current.humidity > 78 ? "watch" : "ok"}
          value={weather?.current ? `${weather.current.humidity}%` : "—"}
          sub="Right now at your farm" />
      </div>

      <h2>What would you like to do?</h2>
      <div className="grid g2">
        <button className="btn" onClick={() => nav("/analyse")}><Icons.cam width="20" height="20" /> {t("check")}</button>
        <button className="btn ghost" onClick={() => nav("/chat")}><Icons.chat width="20" height="20" /> {t("ask")}</button>
        <button className="btn ghost" onClick={() => nav("/map")}><Icons.map width="20" height="20" /> {t("map")}</button>
        <button className="btn soil" onClick={() => nav("/chat")}><Icons.mic width="20" height="20" /> {t("speak")}</button>
      </div>

      <h2>Needs your attention</h2>
      {alerts.length === 0 ? (
        <div className="card"><p className="muted" style={{ margin: 0 }}>
          Nothing is flagged right now. Alerts appear here when the weather, your
          field readings or your own photos suggest a problem is starting.
        </p></div>
      ) : (
        <div className="grid">
          {alerts.map((a, i) => (
            <div className="card" key={i}>
              <Status level={a.level}>{a.level === "risk" ? "Act soon" : "Monitor"}</Status>
              <h3 style={{ marginTop: 9 }}>{a.title}</h3>
              <p className="muted" style={{ marginBottom: 10 }}>{a.reason}</p>
              <button className="btn ghost" onClick={() => nav("/analyse")}>{a.action}</button>
            </div>
          ))}
        </div>
      )}

      {error === "weather" && 
        <Banner>Weather data is temporarily unavailable. It will return when the forecast provider responds.</Banner>
      }
    </>
  );
}
