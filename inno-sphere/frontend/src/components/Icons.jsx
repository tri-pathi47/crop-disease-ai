const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };

export const Icons = {
  home: (p) => <svg viewBox="0 0 24 24" {...p}><g {...s}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></g></svg>,
  cam: (p) => <svg viewBox="0 0 24 24" {...p}><g {...s}><path d="M3 8h3l1.5-2h9L18 8h3v12H3z" /><circle cx="12" cy="13.5" r="3.6" /></g></svg>,
  chat: (p) => <svg viewBox="0 0 24 24" {...p}><g {...s}><path d="M21 12c0 4.1-4 7.4-9 7.4-1 0-2-.1-2.9-.4L4 20.5l1.2-3.3C3.8 15.9 3 14 3 12c0-4.1 4-7.4 9-7.4s9 3.3 9 7.4Z" /></g></svg>,
  map: (p) => <svg viewBox="0 0 24 24" {...p}><g {...s}><path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2z" /><path d="M9 4v14M15 6v14" /></g></svg>,
  more: (p) => <svg viewBox="0 0 24 24" {...p}><g {...s}><circle cx="5" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="19" cy="12" r="1.4" /></g></svg>,
  mic: (p) => <svg viewBox="0 0 24 24" {...p}><g {...s}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></g></svg>,
  soil: (p) => <svg viewBox="0 0 24 24" {...p}><g {...s}><path d="M3 14h18M3 18h18" /><path d="M12 13V8m0 0c-2 0-3-1.4-3-3 2 0 3 1.3 3 3Zm0 0c0-2 1.3-3.4 3.4-3.4 0 2-1.4 3.4-3.4 3.4Z" /></g></svg>,
  sun: (p) => <svg viewBox="0 0 24 24" {...p}><g {...s}><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.5 1.5m11.2 11.2 1.5 1.5M19.1 4.9l-1.5 1.5M6.4 17.6l-1.5 1.5" /></g></svg>,
  sat: (p) => <svg viewBox="0 0 24 24" {...p}><g {...s}><path d="m7 7 3-3 4 4-3 3zM10 14l3 3-3 3-4-4z" /><path d="m11 11 4 4M14 4l6 6" /></g></svg>,
  book: (p) => <svg viewBox="0 0 24 24" {...p}><g {...s}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5" /></g></svg>,
  bell: (p) => <svg viewBox="0 0 24 24" {...p}><g {...s}><path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9Z" /><path d="M10 18.5a2 2 0 0 0 4 0" /></g></svg>,
  clock: (p) => <svg viewBox="0 0 24 24" {...p}><g {...s}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></g></svg>,
  doc: (p) => <svg viewBox="0 0 24 24" {...p}><g {...s}><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4M9 12h6M9 16h6" /></g></svg>,
  user: (p) => <svg viewBox="0 0 24 24" {...p}><g {...s}><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20c.8-3.6 3.9-5.5 7.5-5.5s6.7 1.9 7.5 5.5" /></g></svg>,
  send: (p) => <svg viewBox="0 0 24 24" {...p}><path d="M3 20.5 21 12 3 3.5 6 12z" fill="currentColor" /></svg>,
  leaf: (p) => <svg viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="10" fill="none" stroke="var(--leaf)" strokeWidth="1.6" /><path d="M12 18c0-4 2.4-6.6 6-7-.3 4.2-2.6 6.7-6 7Z" fill="var(--leaf)" /><path d="M12 18c0-3.3-2-5.5-5-5.9.3 3.5 2.2 5.6 5 5.9Z" fill="var(--soil)" /></svg>,
};
