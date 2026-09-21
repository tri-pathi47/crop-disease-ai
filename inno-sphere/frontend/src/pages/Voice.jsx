import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icons } from "../components/Icons.jsx";
import { api } from "../lib/api.js";
import { makeT, SPEECH_LOCALE } from "../lib/i18n.js";
import { useFarm } from "../lib/useFarm.jsx";

export default function Voice() {
  const { lang, farm } = useFarm();
  const t = makeT(lang);
  const nav = useNavigate();
  const recognition = useRef(null);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [answer, setAnswer] = useState(null);
  const [status, setStatus] = useState("Tap to speak");

  function toggle() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (listening) {
      recognition.current?.stop();
      setListening(false);
      setStatus("Tap to speak");
      return;
    }
    if (!SR) {
      setStatus("Speech input is not available in this browser");
      return;
    }
    const rec = new SR();
    rec.lang = SPEECH_LOCALE[lang] || "en-IN";
    rec.onresult = (e) => { const text = e.results[0][0].transcript; setHeard(text); respond(text); };
    rec.onerror = () => { setStatus("Microphone is not available"); setListening(false); };
    rec.onend = () => { setListening(false); setStatus("Tap to speak"); };
    recognition.current = rec;
    rec.start();
    setListening(true);
    setStatus("Listening...");
  }

  async function respond(text) {
    setStatus("Checking your farm");
    try {
      const res = await api.chat({ question: text, crop_cycle_id: farm.cropCycleId, language: lang });
      setAnswer(res);
      setStatus("Here is what I found");
    } catch (err) {
      setStatus(`Could not reach the assistant. ${err.message}`);
    }
  }

  function speak() {
    if (!answer || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(answer.answer);
    u.lang = SPEECH_LOCALE[lang] || "en-IN";
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }

  return (
    <>
      <h1>Voice assistant</h1>
      <p className="lede">{t("speakHint")}</p>

      <div className="card" style={{ textAlign: "center" }}>
        <button className={`mic ${listening ? "listening" : ""}`} onClick={toggle} aria-label="Speak">
          <Icons.mic width="52" height="52" />
        </button>
        <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{status}</div>
        {heard && <p className="muted" style={{ marginTop: 8 }}>You said: {heard}</p>}
      </div>

      {answer && (
        <div className="card" style={{ marginTop: 14 }}>
          <h3>Answer</h3>
          <p>{answer.answer}</p>
          <div className="row">
            <button className="btn ghost" onClick={speak}>🔊 Play answer</button>
            <button className="btn ghost" onClick={() => nav("/analyse")}>Send a photo</button>
          </div>
          <p className="muted" style={{ marginTop: 10 }}>
            Sources: {answer.sources.map((s) => s.name).join(" · ")}
          </p>
        </div>
      )}

      <div className="card" style={{ marginTop: 14 }}>
        <h3>How a voice answer is built</h3>
        {["Your speech is turned into text",
          "The language is detected, mixed speech included",
          "Local words are mapped to standard agricultural terms",
          "Your farm, crop stage, soil and weather are added as context",
          "The knowledge base is searched for a matching entry",
          "The answer is written in simple language, then spoken back"].map((s, i) => (
            <div className="kv" key={s}><span>{i + 1}. {s}</span></div>
          ))}
        <p className="muted" style={{ marginTop: 10 }}>
          Speech runs through your browser by default. Set BHASHINI_API_KEY in the
          backend to route Indian-language speech through Bhashini instead.
        </p>
      </div>
    </>
  );
}
