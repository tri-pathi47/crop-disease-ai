// Reference data that ships with the product: crop stages, photo views, and the
// source list shown under every research-backed answer.
export const CROPS = {
  tomato: { name: "Tomato", stages: ["Seedling", "Vegetative", "Flowering", "Fruiting", "Harvest"] },
  wheat: { name: "Wheat", stages: ["Tillering", "Jointing", "Booting", "Heading", "Grain fill"] },
  potato: { name: "Potato", stages: ["Emergence", "Vegetative", "Tuber initiation", "Bulking", "Maturity"] },
};

export const VIEWS = [
  { key: "whole", label: "Whole plant" },
  { key: "top", label: "Leaf top" },
  { key: "under", label: "Leaf underside" },
  { key: "stem", label: "Stem" },
  { key: "fruit", label: "Fruit / flower" },
  { key: "damage", label: "Damaged area" },
];

export const SOURCES = [
  { name: "ICAR", detail: "Crop protection and IPM package of practices", url: "https://icar.org.in" },
  { name: "FAO", detail: "Plant health and diagnostic methodology", url: "https://www.fao.org/plant-health" },
  { name: "IMD", detail: "Weather observation and forecast", url: "https://mausam.imd.gov.in" },
  { name: "Copernicus Sentinel-2", detail: "Multispectral field monitoring", url: "https://dataspace.copernicus.eu" },
  { name: "ISRO Bhuvan", detail: "Earth observation and field mapping", url: "https://bhuvan.nrsc.gov.in" },
];

// Starting soil values for a new farm, replaced as soon as the farmer enters
// their Soil Health Card.
export const SOIL_FIELDS = [
  ["soil_type", "Soil type", ""],
  ["ph", "pH", ""],
  ["ec", "Electrical conductivity", "dS/m"],
  ["organic_carbon", "Organic carbon", "%"],
  ["nitrogen", "Nitrogen", "kg/ha"],
  ["phosphorus", "Phosphorus", "kg/ha"],
  ["potassium", "Potassium", "kg/ha"],
  ["sulphur", "Sulphur", "ppm"],
  ["zinc", "Zinc", "ppm"],
  ["iron", "Iron", "ppm"],
  ["manganese", "Manganese", "ppm"],
  ["boron", "Boron", "ppm"],
];

export const SUFFICIENCY = {
  ph: [6.0, 7.5], organic_carbon: [0.5, 1.0], zinc: [0.6, 2.0],
  iron: [4.5, 20], manganese: [2.0, 10], boron: [0.5, 2.0],
  nitrogen: [280, 560], phosphorus: [10, 25], potassium: [120, 280],
};
