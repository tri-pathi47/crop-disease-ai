import { useState } from "react";
import { useAuth } from "../lib/auth.jsx";

export default function Auth() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (mode === "register" && form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const credentials = { name: form.name, password: form.password };
      await (mode === "login" ? login(credentials) : register({ ...credentials, language: "en" }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card card">
        <p className="eyebrow">Inno Sphere</p>
        <h1>{mode === "login" ? "Welcome back" : "Create your farm account"}</h1>
        <p className="lede">Crop health decisions grounded in your field data.</p>
        <form onSubmit={submit}>
          {mode === "register" && <label className="field">Your name
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>}
          <label className="field">Your name
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="field">Password
            <input required minLength="6" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </label>
          {mode === "register" && <label className="field">Confirm password
            <input required minLength="6" type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
          </label>}
          {error && <p className="error" role="alert">{error}</p>}
          <button className="btn" disabled={busy}>{busy ? "Connecting..." : mode === "login" ? "Sign in" : "Create account"}</button>
        </form>
        <button className="btn ghost" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
          {mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}