import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { useFarm } from "../lib/useFarm.jsx";
import { Status } from "../components/Ui.jsx";

export default function Knowledge() {
  const { farm, expert } = useFarm();
  const [diseases, setDiseases] = useState([]);
  const [pests, setPests] = useState([]);
  const [glossary, setGlossary] = useState([]);
  const [scope, setScope] = useState(farm.crop);

  useEffect(() => {
    const crop = scope === "all" ? undefined : scope;
    api.knowledgeDiseases(crop).then(setDiseases).catch(() => {});
    api.knowledgePests(crop).then(setPests).catch(() => {});
    api.glossary().then(setGlossary).catch(() => {});
  }, [scope]);

  return (
    <>
      <h1>Knowledge base</h1>
      <p className="lede">Every entry carries its source and version. Nothing here is generated on the spot.</p>

      <div className="chips" style={{ marginBottom: 14 }}>
        {["tomato", "wheat", "potato", "all"].map((c) => (
          <button key={c} className="chip" aria-pressed={scope === c} onClick={() => setScope(c)}>
            {c === "all" ? "All crops" : c[0].toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      <h2>Diseases</h2>
      <div className="grid g2">
        {diseases.map((d) => (
          <div className="card" key={d.key}>
            <h3>{d.name}</h3>
            <p className="muted" style={{ margin: "0 0 8px" }}><i>{d.scientific_name}</i> · {d.crops.join(", ")}</p>
            <div className="kv"><span>Symptoms</span><b>{d.symptoms}</b></div>
            <div className="kv"><span>Favoured by</span><b>{d.favours}</b></div>
            <div className="kv"><span>Looks like</span><b>{d.similar_looking}</b></div>
            <div className="kv"><span>Prevention</span><b>{d.prevention}</b></div>
            <div className="kv"><span>Management</span><b>{d.management}</b></div>
            {expert && <div className="kv"><span>Source</span><b className="muted">{d.source} · {d.version}</b></div>}
          </div>
        ))}
      </div>

      <h2>Pests</h2>
      <div className="grid g2">
        {pests.map((p) => (
          <div className="card" key={p.key}>
            <h3>{p.name}</h3>
            <p className="muted" style={{ margin: "0 0 8px" }}><i>{p.scientific_name}</i> · {p.crops.join(", ")}</p>
            <div className="kv"><span>How to identify</span><b>{p.identification}</b></div>
            <div className="kv"><span>Damage</span><b>{p.damage}</b></div>
            <div className="kv"><span>Season</span><b>{p.season}</b></div>
            <div className="kv"><span>Natural enemies</span><b>{p.natural_enemies}</b></div>
            <div className="kv"><span>Monitoring</span><b>{p.monitoring}</b></div>
          </div>
        ))}
      </div>

      <h2>Local words farmers use</h2>
      <div className="card scroll-x">
        <table>
          <thead><tr><th>Local term</th><th>Language</th><th>Region</th><th>Standard term</th><th>Status</th></tr></thead>
          <tbody>
            {glossary.map((g) => (
              <tr key={g.local_term || g.local}>
                <td><b>{g.local_term || g.local}</b></td>
                <td>{g.language}</td>
                <td>{g.region}</td>
                <td>{g.standard_term || g.standard}</td>
                <td><Status level={g.status === "verified" ? "ok" : "watch"}>{g.status}</Status></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted" style={{ marginTop: 10 }}>
          A local word only becomes a diagnosis after an agronomist verifies the mapping.
        </p>
      </div>
    </>
  );
}
