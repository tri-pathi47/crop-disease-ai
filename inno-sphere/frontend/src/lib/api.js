// Thin API client. Point VITE_API_URL at the FastAPI service.
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

function token() {
  try { return localStorage.getItem("inno.token"); } catch { return null; }
}

async function request(path, { method = "GET", body, form } = {}) {
  const headers = {};
  const t = token();
  if (t) headers.Authorization = `Bearer ${t}`;
  if (body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: form ? form : body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `Request failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  base: BASE,
  isOffline: () => !token(),

  register: (b) => request("/auth/register", { method: "POST", body: b }),
  login: (b) => request("/auth/login", { method: "POST", body: b }),
  me: () => request("/auth/me"),

  farms: () => request("/farms"),
  createFarm: (b) => request("/farms", { method: "POST", body: b }),
  crops: (farmId) => request(`/crops?farm_id=${farmId}`),
  soil: (farmId) => request(`/soil/${farmId}`),
  saveSoil: (b) => request("/soil", { method: "POST", body: b }),

  uploadImage: (cropCycleId, viewType, file, language = "en") => {
    const form = new FormData();
    form.append("crop_cycle_id", cropCycleId);
    form.append("view_type", viewType);
    form.append("language", language);
    form.append("file", file);
    return request("/images/upload", { method: "POST", form });
  },
  evidenceUrl: (imageId) => `${BASE}/images/${imageId}/evidence.png`,

  analyse: (b) => request("/diagnosis/analyse", { method: "POST", body: b }),
  diagnosisHistory: (id) => request(`/diagnosis/history/${id}`),

  weather: (lat, lon) => request(`/weather?lat=${lat}&lon=${lon}`),
  satellite: (farmId) => request(`/satellite/${farmId}`),
  alerts: (farmId) => request(`/alerts/${farmId}`),

  chat: (b) => request("/chat", { method: "POST", body: b }),
  chatHistory: () => request("/chat/history"),

  knowledgeDiseases: (crop) => request(`/knowledge/diseases${crop ? `?crop=${crop}` : ""}`),
  knowledgePests: (crop) => request(`/knowledge/pests${crop ? `?crop=${crop}` : ""}`),
  glossary: () => request("/knowledge/glossary"),
};

export function setToken(t) {
  try { localStorage.setItem("inno.token", t); } catch {}
}
