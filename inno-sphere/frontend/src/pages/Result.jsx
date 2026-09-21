import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Banner, Sources, Status } from "../components/Ui.jsx";
import Empty from "../components/Empty.jsx";
import { drawOverlay } from "../lib/imageCheck.js";
import { useFarm } from "../lib/useFarm.jsx";
import { CROPS, SOURCES } from "../lib/appData.js";

export default function Result({ result }) {
  const { lang, expert, farm, set } = useFarm();
  const nav = useNavigate();
  const canvas = useRef(null);

  useEffect(() => {
    if (canvas.current && result?.local?.bestImage) {
      drawOverlay(canvas.current, result.local.bestImage, result.local.bestMap);
    }
  }, [result]);

  if (!result) {
    return <Empty title="No assessment yet"
      body="Send a few photos of the affected plant and the assessment will appear here."
      action="Check my crop" onAction={() => nav("/analyse")} />;
  }

  if (result.offline) {
    const l = result.local;
    return (
      <>
        <h1>Photo measurements</h1>
        <p className="lede">
          The assessment service is unreachable, so only the on-device measurements
          are shown. Reconnect to get the full differential and advisory.
        </p>
        <div className="card">
          <div className="kv"><span>Photos checked</span><b>{l.views.length}</b></div>
          <div className="kv"><span>Average photo quality</span><b>{l.avgQuality}/100</b></div>
          <div className="kv"><span>Leaf area with colour change</span><b>{l.lesionPct}%</b></div>
        </div>
        <h2>Where the colour change is</h2>
        <div className="card"><div className="viewer"><canvas ref={canvas} /></div></div>
      </>
    );
  }

  const top = result.differential[0];
  const plain = result.plain_language[lang] || result.plain_language.en;

  return (
    <>
      <h1>Assessment</h1>
      <p className="lede">
        {CROPS[farm.crop]?.name} · {farm.stage} · from {result.evidence[0]?.value}
      </p>

      <div className="card" style={{ borderLeft: `4px solid ${result.severity === "risk" ? "var(--risk)" : result.severity === "watch" ? "var(--wheat)" : "var(--ok)"}` }}>
        <Status level={result.severity}>{result.confidence} confidence</Status>
        <h2 style={{ margin: "10px 0 4px" }}>{result.primary}</h2>
        <p>{plain}</p>
        {result.next_photo_request && <Banner>{result.next_photo_request}</Banner>}
      </div>

      <h2>Other possible causes</h2>
      <div className="card">
        {result.differential.map((c) => (
          <div key={c.key} style={{ marginBottom: 12 }}>
            <div className="kv" style={{ border: 0, padding: "0 0 5px" }}>
              <b>{c.label}</b><span className="muted">{c.share}%</span>
            </div>
            <div className="bar"><i style={{ width: `${c.share}%`, background: c === top ? "var(--leaf)" : "var(--ink-3)" }} /></div>
          </div>
        ))}
        <p className="muted" style={{ margin: 0 }}>{result.scoring_note}</p>
      </div>

      <h2>What the assistant looked at</h2>
      <div className="card">
        {result.evidence.map((e) => (
          <div className="kv" key={e.key}><span>{e.ok ? "✓" : "○"} {e.key}</span><b className="muted">{e.value}</b></div>
        ))}
      </div>

      {result.local?.bestImage && (
        <>
          <h2>Where the colour change is</h2>
          <div className="card">
            <div className="viewer"><canvas ref={canvas} /></div>
            <p className="muted" style={{ marginTop: 10 }}>
              Red shading marks leaf pixels whose colour has moved away from healthy
              green toward yellow or brown.
            </p>
          </div>
        </>
      )}

      <h2>What to do now</h2>
      <div className="card">
        <ol style={{ margin: 0, paddingLeft: 20 }}>
          {result.actions.map((a) => <li key={a} style={{ marginBottom: 8 }}>{a}</li>)}
        </ol>
        <Banner>
          Avoid spraying anything before the problem is confirmed. A wrong spray costs
          money and can make pest problems worse by killing natural enemies.
        </Banner>
        <div className="kv" style={{ marginTop: 10 }}><span>Check again</span><b>In 24–48 hours</b></div>
      </div>

      {expert ? (
        <>
          <h2>Scientific detail</h2>
          <div className="card">
            <div className="kv"><span>Confidence rule</span><b>views × photo quality × margin between top two causes</b></div>
            <div className="kv"><span>Leaf area with colour change</span><b>{result.local?.lesionPct ?? "—"}%</b></div>
            <div className="kv"><span>Average photo quality</span><b>{result.local?.avgQuality ?? "—"}/100</b></div>
            <div className="kv"><span>Views compared</span><b>{result.local?.views.join(", ")}</b></div>
            <div className="kv"><span>Pipeline</span><b>quality gate → segmentation → rule scoring → context weighting → knowledge retrieval</b></div>
          </div>
        </>
      ) : (
        <div className="row" style={{ marginTop: 16 }}>
          <button className="btn ghost" onClick={() => set({ expert: true })}>🔬 Show scientific detail</button>
          <button className="btn ghost" onClick={() => nav("/reports")}>Save to reports</button>
        </div>
      )}

      <h2>Sources</h2>
      <Sources list={result.sources || SOURCES} />
    </>
  );
}
