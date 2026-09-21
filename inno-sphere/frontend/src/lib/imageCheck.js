// Client-side quality pre-check so the farmer gets feedback before the upload
// even starts — useful on a slow rural connection. The backend runs the
// authoritative check again in app/services/image_quality.py.

export function checkImage(img) {
  const W = 240;
  const H = Math.max(1, Math.round((img.height / img.width) * W));
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, W, H);
  const d = ctx.getImageData(0, 0, W, H).data;

  const gray = new Float32Array(W * H);
  let sum = 0, plant = 0;
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    gray[p] = l; sum += l;
    if (g > r * 1.05 && g > b * 1.05 && g > 45) plant++;
  }
  const mean = sum / (W * H);
  let varSum = 0;
  for (let p = 0; p < gray.length; p++) varSum += (gray[p] - mean) ** 2;
  const contrast = Math.sqrt(varSum / gray.length);

  let lap = 0, n = 0;
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      const v = 4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - W] - gray[i + W];
      lap += v * v; n++;
    }
  }
  const sharpness = n ? lap / n : 0;
  const plantPct = (plant / (W * H)) * 100;

  const issues = [];
  if (img.width < 600 || img.height < 600) issues.push("resolution is low");
  if (mean < 52) issues.push("photo is too dark");
  if (mean > 212) issues.push("photo is overexposed");
  if (contrast < 22) issues.push("image looks flat or hazy");
  if (sharpness < 45) issues.push("photo is blurred");
  if (plantPct < 8) issues.push("plant is not clearly visible");

  let score = 100 - issues.length * 17 - Math.max(0, (60 - Math.min(sharpness, 60)) * 0.5);
  score = Math.max(8, Math.min(99, Math.round(score)));

  return { score, issues, usable: score >= 55, mean, contrast, sharpness, plantPct };
}

// Colour-shift map: pixels that have moved from healthy green toward yellow or
// brown. Stands in for a Grad-CAM overlay until a trained model exists — the UI
// must label it as a heuristic, not model attention.
export function lesionMap(img) {
  const W = 220;
  const H = Math.max(1, Math.round((img.height / img.width) * W));
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, W, H);
  const d = ctx.getImageData(0, 0, W, H).data;

  const mask = new Uint8Array(W * H);
  let plant = 0, lesion = 0, yellow = 0;
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    const l = (mx + mn) / 2, sat = mx - mn;
    const green = g > r * 1.04 && g > b * 1.04 && g > 45;
    const veg = green || (sat > 28 && g >= b && l > 35 && l < 230 && r >= g * 0.75);
    if (!veg) continue;
    plant++;
    if (green && !(r > g * 0.92)) continue;
    if (r >= g * 0.92 && g > b * 1.1 && l > 70) { mask[p] = 1; lesion++; yellow++; }
    else if (r > g && l < 95 && sat > 18) { mask[p] = 2; lesion++; }
  }
  return {
    mask, W, H,
    lesionPct: plant ? +((lesion / plant) * 100).toFixed(1) : 0,
    yellowShare: lesion ? yellow / lesion : 0,
  };
}

export function drawOverlay(canvas, img, map, maxWidth = 760) {
  const W = Math.min(maxWidth, img.width);
  const H = Math.round((img.height / img.width) * W);
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, W, H);

  const layer = ctx.createImageData(W, H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const m = map.mask[Math.floor((y / H) * map.H) * map.W + Math.floor((x / W) * map.W)];
      const i = (y * W + x) * 4;
      if (m) {
        layer.data[i] = 214; layer.data[i + 1] = 40; layer.data[i + 2] = 30;
        layer.data[i + 3] = m === 2 ? 135 : 105;
      }
    }
  }
  const tmp = document.createElement("canvas");
  tmp.width = W; tmp.height = H;
  tmp.getContext("2d").putImageData(layer, 0, 0);
  ctx.drawImage(tmp, 0, 0);
}
