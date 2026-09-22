import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icons } from "../components/Icons.jsx";
import { Banner } from "../components/Ui.jsx";
import { api } from "../lib/api.js";
import { checkImage, lesionMap } from "../lib/imageCheck.js";
import { useFarm } from "../lib/useFarm.jsx";
import { CROPS, VIEWS, cropInfo } from "../lib/appData.js";

const RETAKE = {
  en: "Please retake the photo in better lighting and keep the affected plant area clearly visible.",
  hi: "कृपया बेहतर रोशनी में दोबारा फोटो लें और प्रभावित पौधे का हिस्सा साफ दिखाई देना चाहिए।",
};

const STEPS = [
  "Checking photo quality",
  "Reading your farm record",
  "Measuring leaf colour and damage",
  "Comparing weather and soil",
  "Searching the crop knowledge base",
  "Verifying against sources",
];

export default function Analyse({ onResult }) {
  const { lang, farm, setFarm } = useFarm();
  const nav = useNavigate();
  const fileInput = useRef(null);
  const pending = useRef(null);
  const [photos, setPhotos] = useState({});
  const [note, setNote] = useState("");
  const [step, setStep] = useState(-1);
  const [error, setError] = useState(null);

  const pick = (view) => { pending.current = view; fileInput.current.value = ""; fileInput.current.click(); };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const quality = checkImage(img);
      setPhotos((p) => ({ ...p, [pending.current]: { file, url, img, quality } }));
    };
    img.onerror = () => setError("That file could not be read as an image. Try another photo.");
    img.src = url;
  };

  const poor = Object.entries(photos).filter(([, p]) => !p.quality.usable);
  const count = Object.keys(photos).length;
  const selectedCrop = cropInfo(farm.crop);

  async function analyse() {
    setError(null);
    for (let i = 0; i < STEPS.length; i++) {
      setStep(i);
      await new Promise((r) => setTimeout(r, 260));
    }
    try {
      const ids = [];
      for (const [view, p] of Object.entries(photos)) {
        const res = await api.uploadImage(farm.cropCycleId, view, p.file, lang);
        if (res.usable) ids.push(res.image_id);
      }
      const result = await api.analyse({
        crop_cycle_id: farm.cropCycleId, image_ids: ids, farmer_note: note,
      });
      onResult({ ...result, local: buildLocal(photos) });
      nav("/result");
    } catch (err) {
      // The server is unreachable; fall back to the on-device measurement so the
      // farmer still gets the quality check and colour evidence.
      onResult({ offline: true, local: buildLocal(photos), note });
      setError(err.message);
      nav("/result");
    } finally {
      setStep(-1);
    }
  }

  if (step >= 0) {
    return (
      <>
        <h1>Analysing</h1>
        <p className="lede">This takes a few seconds.</p>
        <div className="card">
          {STEPS.map((s, i) => (
            <div className="kv" key={s}><span>{i < step ? "✓" : i === step ? "…" : "○"} {s}</span></div>
          ))}
          <p className="muted" style={{ marginTop: 10 }}>
            Only the progress is shown here, never the assistant's internal reasoning.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <h1>Check my crop</h1>
      <p className="lede">
        Use your normal phone camera. Add at least three views so the assistant can
        compare evidence instead of guessing from one picture.
      </p>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="grid g2">
          <label className="field">Crop
            <input list="crop-suggestions" value={farm.crop} onChange={(e) => setFarm({ crop: e.target.value, stage: cropInfo(e.target.value).stages[0] })} placeholder="Type any crop" />
            <datalist id="crop-suggestions">
              {Object.entries(CROPS).map(([k, c]) => <option key={k} value={k}>{c.name}</option>)}
            </datalist>
          </label>
          <label className="field">Growth stage
            <select value={farm.stage} onChange={(e) => setFarm({ stage: e.target.value })}>
              {selectedCrop.stages.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
        </div>
        <label className="field">What are you seeing? (optional)
          <textarea rows="2" value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. lower leaves have brown spots since three days" />
        </label>
      </div>

      <h2>Photos</h2>
      <div className="slots">
        {VIEWS.map((v) => {
          const p = photos[v.key];
          return (
            <button key={v.key} className={`slot ${p ? "filled" : ""}`} onClick={() => pick(v.key)}>
              {p ? (
                <>
                  <img src={p.url} alt={v.label} />
                  <span className="q" style={{ background: p.quality.score >= 70 ? "#2f8f4e" : p.quality.score >= 55 ? "#c9922b" : "#c0392b" }}>
                    {p.quality.score}
                  </span>
                  <span className="tag">{v.label}</span>
                </>
              ) : (
                <>
                  <Icons.cam width="26" height="26" />
                  <span>{v.label}</span>
                  <span className="muted" style={{ fontSize: ".7rem" }}>Tap to add</span>
                </>
              )}
            </button>
          );
        })}
      </div>

      {poor.length > 0 && (
        <Banner level="risk">
          <b>{RETAKE[lang] || RETAKE.en}</b>
          <ul style={{ margin: "8px 0 0 18px", padding: 0 }}>
            {poor.map(([k, p]) => (
              <li key={k}>{VIEWS.find((v) => v.key === k).label}: {p.quality.issues.join(", ")}</li>
            ))}
          </ul>
        </Banner>
      )}

      <div className="row" style={{ marginTop: 16 }}>
        <button className="btn" disabled={count === 0} onClick={analyse}>
          {count === 0 ? "Add a photo to continue" : `Analyse ${count} photo${count > 1 ? "s" : ""}`}
        </button>
        {count > 0 && <button className="btn ghost" onClick={() => setPhotos({})}>Clear photos</button>}
      </div>

      {error && <p className="muted" style={{ marginTop: 12 }}>{error}</p>}
      <input ref={fileInput} type="file" accept="image/*" capture="environment"
        className="hide" onChange={onFile} />
    </>
  );
}

function buildLocal(photos) {
  const entries = Object.entries(photos);
  if (!entries.length) return null;
  const best = entries.slice().sort((a, b) => b[1].quality.score - a[1].quality.score)[0];
  const maps = entries.map(([, p]) => lesionMap(p.img));
  return {
    views: entries.map(([k]) => k),
    avgQuality: Math.round(entries.reduce((s, [, p]) => s + p.quality.score, 0) / entries.length),
    lesionPct: +(maps.reduce((s, m) => s + m.lesionPct, 0) / maps.length).toFixed(1),
    yellowShare: maps.reduce((s, m) => s + m.yellowShare, 0) / maps.length,
    bestImage: best[1].img,
    bestMap: lesionMap(best[1].img),
  };
}
