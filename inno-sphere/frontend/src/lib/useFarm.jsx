import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "./api.js";

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
    let active = true;
    async function hydrate() {
      try {
        const farms = await api.farms();
        let remoteFarm = farms[0];
        if (!remoteFarm) {
          remoteFarm = await api.createFarm({
            name: "My Farm", latitude: DEFAULT.farm.lat, longitude: DEFAULT.farm.lng,
            area_ha: DEFAULT.farmer.area,
          });
        }
        let crops = await api.crops(remoteFarm.id);
        let crop = crops[0];
        if (!crop) {
          crop = await fetchCrop(remoteFarm.id);
        }
        if (active) {
          setState((current) => ({
            ...current,
            farm: {
              ...current.farm,
              id: remoteFarm.id,
              name: remoteFarm.name,
              lat: remoteFarm.latitude ?? current.farm.lat,
              lng: remoteFarm.longitude ?? current.farm.lng,
              cropCycleId: crop.id,
              crop: crop.crop,
              variety: crop.variety || current.farm.variety,
              stage: crop.growth_stage || current.farm.stage,
              sown: crop.sowing_date || current.farm.sown,
            },
          }));
        }
      } catch {
        // Keep the local shell usable while the API is waking up or unavailable.
      }
    }
    async function fetchCrop(farmId) {
      return api.createCrop({
        farm_id: farmId, crop: DEFAULT.farm.crop, variety: DEFAULT.farm.variety,
        sowing_date: DEFAULT.farm.sown, growth_stage: DEFAULT.farm.stage,
      });
    }
    hydrate();
    return () => { active = false; };
  }, []);

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
