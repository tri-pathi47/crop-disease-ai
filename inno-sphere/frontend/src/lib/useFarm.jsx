import { createContext, useContext, useEffect, useMemo, useState } from "react";

const FarmContext = createContext(null);

const DEFAULT = {
  lang: "en",
  expert: false,
  farmer: { name: "Farmer", state: "Uttar Pradesh", district: "Ghaziabad", village: "", area: 1.6, experience: 12 },
  farm: { id: 1, cropCycleId: 1, name: "My Farm", crop: "tomato", variety: "Arka Rakshak", stage: "Flowering", sown: "2026-07-02", lat: 28.669, lng: 77.453 },
};

function load() {
  try {
    const raw = localStorage.getItem("inno.session");
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch { return DEFAULT; }
}

export function FarmProvider({ children }) {
  const [state, setState] = useState(load);

  useEffect(() => {
    try { localStorage.setItem("inno.session", JSON.stringify(state)); } catch {}
  }, [state]);

  const value = useMemo(() => ({
    ...state,
    set: (patch) => setState((s) => ({ ...s, ...patch })),
    setFarm: (patch) => setState((s) => ({ ...s, farm: { ...s.farm, ...patch } })),
    setFarmer: (patch) => setState((s) => ({ ...s, farmer: { ...s.farmer, ...patch } })),
  }), [state]);

  return <FarmContext.Provider value={value}>{children}</FarmContext.Provider>;
}

export const useFarm = () => useContext(FarmContext);
