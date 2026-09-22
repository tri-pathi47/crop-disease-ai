import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icons } from "../components/Icons.jsx";
import { api } from "../lib/api.js";
import { makeT, SPEECH_LOCALE } from "../lib/i18n.js";
import { useFarm } from "../lib/useFarm.jsx";
import { CROPS, cropInfo } from "../lib/appData.js";

export default function Chat() {
  const { lang, farm, setFarm } = useFarm();
  const t = makeT(lang);
  const nav = useNavigate();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const recognition = useRef(null);
  const end = useRef(null);

  useEffect(() => {
    api.chatHistory().then((rows) => {
      setMessages(rows.length ? rows : [{
        role: "assistant",
        text: "Tell me what you are seeing in the field, or send a photo of the affected plant. I check your farm details, the weather and the crop knowledge base before answering.",
      }]);
    }).catch(() => setMessages([{
      role: "assistant",
      text: "Tell me what you are seeing in the field, or send a photo of the affected plant.",
    }]));
  }, []);

  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send(text) {
    const question = (text ?? draft).trim();
    if (!question || busy) return;
    setDraft("");
    setMessages((m) => [...m, { role: "user", text: question }]);
    setBusy(true);
    try {
      const res = await api.chat({ question, crop_cycle_id: farm.cropCycleId, language: lang });
      setMessages((m) => [...m, { role: "assistant", text: res.answer, sources: res.sources, route: res.route }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", text: `I could not reach the knowledge service. ${err.message}` }]);
    } finally {
      setBusy(false);
    }
  }

  function toggleVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessages((m) => [...m, { role: "assistant", text: "Voice input is not available in this browser. You can type your question instead." }]);
      return;
    }
    if (listening) { recognition.current?.stop(); setListening(false); return; }
    const recorder = new SpeechRecognition();
    recorder.lang = SPEECH_LOCALE[lang] || "en-IN";
    recorder.onresult = (event) => setDraft(event.results[0][0].transcript);
    recorder.onerror = () => setListening(false);
    recorder.onend = () => setListening(false);
    recognition.current = recorder;
    recorder.start();
    setListening(true);
  }

  return (
    <>
      <h1>{t("assistantTitle")}</h1>
      <p className="lede">{t("assistantHint")}</p>

      <div className="card assistant-context">
        <label className="field">{t("cropLabel")}
          <input list="assistant-crops" value={farm.crop}
            onChange={(event) => setFarm({ crop: event.target.value, stage: cropInfo(event.target.value).stages[0] })}
            placeholder={t("cropPlaceholder")} />
          <datalist id="assistant-crops">
            {Object.entries(CROPS).map(([key, crop]) => <option key={key} value={crop.name} />)}
          </datalist>
        </label>
        <span className="muted">{cropInfo(farm.crop).name} · {farm.stage} · {farm.name}</span>
      </div>

      <div className="chips" style={{ marginBottom: 14 }}>
        {[t("sampleQuestion"), "What is happening in my field?", `Which pest attacks ${cropInfo(farm.crop).name} at flowering?`].map((q) => (
          <button className="chip" key={q} onClick={() => send(q)}>{q}</button>
        ))}
      </div>

      <div className="chat">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role === "user" ? "me" : "ai"}`}>
            {m.text}
            {m.sources && (
              <div className="src">
                {m.route && <>Evidence used: {m.route.replace("_", " + ")}<br /></>}
                Sources: {m.sources.map((s) => s.name).join(" · ")}
              </div>
            )}
          </div>
        ))}
        {busy && <div className="msg ai">Checking your farm, the weather and the knowledge base…</div>}
        <div ref={end} />
      </div>

      <div className="composer">
        <div className="box">
          <button className={`iconbtn ${listening ? "listening" : ""}`} onClick={toggleVoice} aria-label={t("voiceLabel")}><Icons.mic width="20" height="20" /></button>
          <button className="iconbtn" onClick={() => nav("/analyse")} aria-label={t("photoLabel")}><Icons.cam width="20" height="20" /></button>
          <textarea rows="1" value={draft} placeholder={t("askPlaceholder")}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
          <button className="iconbtn send" onClick={() => send()} aria-label={t("sendLabel")}><Icons.send width="20" height="20" /></button>
        </div>
      </div>
    </>
  );
}
