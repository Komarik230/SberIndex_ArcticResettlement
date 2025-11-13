/* =====================================================
   2D карта России (Equirectangular) + точки по населению
   ===================================================== */

const GEOJSON_URL = "/static/russia.geojson";
const POINTS_URL  = "/static/points.json";

const BG_COLOR      = "#050914";
const STROKE_COLOR  = "rgba(255,255,255,0.9)";
const STROKE_WIDTH  = 1.1;
const ARCTIC_LAT    = 66.5;
const ARCTIC_TINT   = "rgba(120,200,255,0.07)";
const POINT_BASE_R  = 2.4;
const POP_SQRT_SCALE = 0.015;

const PULSE_FREQ = 1.2;
const PULSE_AMPL = 0.35;
const FLICKER_FREQ = 6.0;
const FADE_DURATION = 4.0;

/* ------------------ Вспомогательные функции ------------------ */

async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("Не удалось загрузить " + url);
  return await r.json();
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

/* ------------------ Проекция ------------------ */

function createProjector(geojson, canvas) {
  let minLon = 999, maxLon = -999, minLat = 999, maxLat = -999;

  function scanCoords(g) {
    if (g.type === "Polygon") {
      g.coordinates.forEach(r =>
        r.forEach(([lon, lat]) => {
          minLon = Math.min(minLon, lon);
          maxLon = Math.max(maxLon, lon);
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
        })
      );
    } else if (g.type === "MultiPolygon") {
      g.coordinates.forEach(p =>
        p.forEach(r =>
          r.forEach(([lon, lat]) => {
            minLon = Math.min(minLon, lon);
            maxLon = Math.max(maxLon, lon);
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
          })
        )
      );
    }
  }

  if (geojson.type === "FeatureCollection")
    geojson.features.forEach(f => scanCoords(f.geometry));
  else if (geojson.type === "Feature")
    scanCoords(geojson.geometry);
  else
    scanCoords(geojson);

  const w = canvas.width, h = canvas.height;
  const lonSpan = maxLon - minLon;
  const latSpan = maxLat - minLat;
  const scale = 0.86 * Math.min(w / lonSpan, h / latSpan);
  const offsetX = (w - lonSpan * scale) / 2;
  const offsetY = (h - latSpan * scale) / 2;

  return {
    project(lon, lat) {
      const x = offsetX + (lon - minLon) * scale;
      const y = offsetY + (maxLat - lat) * scale;
      return { x, y };
    },
    bounds: { minLon, maxLon, minLat, maxLat },
  };
}

/* ------------------ Рисование ------------------ */

function drawGeoJSON(ctx, geojson, project) {
  ctx.strokeStyle = STROKE_COLOR;
  ctx.lineWidth = STROKE_WIDTH;

  function drawGeom(g) {
    if (g.type === "Polygon") {
      g.coordinates.forEach(ring => {
        ctx.beginPath();
        ring.forEach(([lon, lat], i) => {
          const p = project(lon, lat);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.stroke();
      });
    } else if (g.type === "MultiPolygon") {
      g.coordinates.forEach(poly =>
        poly.forEach(ring => {
          ctx.beginPath();
          ring.forEach(([lon, lat], i) => {
            const p = project(lon, lat);
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          });
          ctx.closePath();
          ctx.stroke();
        })
      );
    }
  }

  if (geojson.type === "FeatureCollection")
    geojson.features.forEach(f => drawGeom(f.geometry));
  else if (geojson.type === "Feature")
    drawGeom(geojson.geometry);
  else
    drawGeom(geojson);
}

function drawArcticTint(ctx, proj) {
  const { minLon, maxLon, maxLat } = proj.bounds;
  ctx.fillStyle = ARCTIC_TINT;
  const p1 = proj.project(minLon, ARCTIC_LAT);
  const p2 = proj.project(maxLon, ARCTIC_LAT);
  const p3 = proj.project(maxLon, maxLat);
  const p4 = proj.project(minLon, maxLat);

  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.lineTo(p4.x, p4.y);
  ctx.closePath();
  ctx.fill();
}

/* ------------------ Основная анимация ------------------ */

async function start() {
  const canvas = document.getElementById("mapCanvas");
  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  document.body.style.background = BG_COLOR;

  const [russia, points] = await Promise.all([
    fetchJSON(GEOJSON_URL),
    fetchJSON(POINTS_URL)
  ]);

  const proj = createProjector(russia, canvas);
  const now = performance.now();

  const pts = points.map(p => {
    const pop = Math.max(0, +p.population || +p.pop_total || 0);
    return {
      lat: +p.lat,
      lon: +p.lon,
      pv: +p.pop_var_bin,
      pop,
      r: POINT_BASE_R + Math.sqrt(pop) * POP_SQRT_SCALE,
      phase: Math.random() * Math.PI * 2,
      fadeStart: now + Math.random() * 1000
    };
  });

  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawArcticTint(ctx, proj);
    drawGeoJSON(ctx, russia, proj.project.bind(proj));

    const t = performance.now() / 1000;

    pts.forEach(p => {
      const { x, y } = proj.project(p.lon, p.lat);
      let radius = p.r, alpha = 1;

      if (p.pv === 1) {
        // растущие — лёгкая пульсация
        radius = p.r + Math.sin((t + p.phase) * 2 * Math.PI * PULSE_FREQ) * PULSE_AMPL;
      } else {
        // убывающие — мерцают и гаснут
        const flick = 0.6 + 0.4 * Math.sin((t + p.phase) * 2 * Math.PI * FLICKER_FREQ);
        alpha = clamp(flick, 0, 1);
        const elapsed = (performance.now() - p.fadeStart) / 1000;
        if (elapsed > 0)
          alpha *= clamp(1 - elapsed / FADE_DURATION, 0, 1);
      }

      if (alpha < 0.02) return;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

document.addEventListener("DOMContentLoaded", start);
