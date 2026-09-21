// Empty states are an invitation to act, never an apology.
export default function Empty({ title, body, action, onAction }) {
  return (
    <div className="card" style={{ textAlign: "center", padding: "28px 18px" }}>
      <h3 style={{ marginBottom: 6 }}>{title}</h3>
      <p className="muted" style={{ margin: "0 auto 14px", maxWidth: "44ch" }}>{body}</p>
      {action && <button className="btn" style={{ maxWidth: 320, margin: "0 auto" }} onClick={onAction}>{action}</button>}
    </div>
  );
}
