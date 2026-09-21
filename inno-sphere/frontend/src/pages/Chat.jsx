import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icons } from "../components/Icons.jsx";
import { api } from "../lib/api.js";
import { makeT } from "../lib/i18n.js";
import { useFarm } from "../lib/useFarm.jsx";

export default function Chat() {
  const { lang, farm } = useFarm();
  const t = makeT(lang);
  const nav = useNavigate();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
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

  return (
    <>
      <h1>Farm assistant</h1>
      <p className="lede">Ask in your own words. Answers use your farm record, current weather and the crop knowledge base.</p>

      <div className="chips" style={{ marginBottom: 14 }}>
        {[t("sampleQuestion"), "What is happening in my field?", "Which pest attacks tomato at flowering?"].map((q) => (
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
          <button className="iconbtn" onClick={() => nav("/voice")} aria-label="Voice"><Icons.mic width="20" height="20" /></button>
          <button className="iconbtn" onClick={() => nav("/analyse")} aria-label="Photo"><Icons.cam width="20" height="20" /></button>
          <textarea rows="1" value={draft} placeholder={t("askPlaceholder")}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
          <button className="iconbtn send" onClick={() => send()} aria-label="Send"><Icons.send width="20" height="20" /></button>
        </div>
      </div>
    </>
  );
}
