import { useEffect, useRef, useState, useCallback } from "react";
import { greecePatches, getRiskColor } from "../data/greeceData";

// Mercator projection utilities
function latLonToXY(lat, lon, bounds, width, height) {
  const { minLon, maxLon, minLat, maxLat } = bounds;
  const x = ((lon - minLon) / (maxLon - minLon)) * width;
  // Flip Y (lat increases up, canvas increases down)
  const y = ((maxLat - lat) / (maxLat - minLat)) * height;
  return { x, y };
}

const GREECE_BOUNDS = {
  minLat: 34.8,
  maxLat: 42.0,
  minLon: 19.4,
  maxLon: 29.8,
};

export default function GreeceMap({ onPatchClick, assetPins = [], selectedPatch }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [transform, setTransform] = useState({ scale: 1, tx: 0, ty: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [hoveredPatch, setHoveredPatch] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const animFrameRef = useRef(null);
  const pulseRef = useRef(0);
  const geoJsonRef = useRef(null);
  const [geoLoaded, setGeoLoaded] = useState(false);

  // Load Greece GeoJSON boundary
  useEffect(() => {
    fetch("https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson")
      .then((r) => r.json())
      .then((data) => {
        const greece = data.features.find(
          (f) => f.properties.ISO_A3 === "GRC" || f.properties.ADMIN === "Greece"
        );
        if (greece) geoJsonRef.current = greece;
        setGeoLoaded(true);
      })
      .catch(() => setGeoLoaded(true));
  }, []);

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setDimensions({ width: el.offsetWidth, height: el.offsetHeight });
    });
    ro.observe(el);
    setDimensions({ width: el.offsetWidth, height: el.offsetHeight });
    return () => ro.disconnect();
  }, []);

  // Project point with current transform
  const project = useCallback((lat, lon) => {
    const { width, height } = dimensions;
    const { scale, tx, ty } = transform;
    const base = latLonToXY(lat, lon, GREECE_BOUNDS, width, height);
    return {
      x: (base.x - width / 2) * scale + width / 2 + tx,
      y: (base.y - height / 2) * scale + height / 2 + ty,
    };
  }, [dimensions, transform]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let pulse = 0;

    function drawGeoJSON(ctx) {
      if (!geoJsonRef.current) return;
      const geom = geoJsonRef.current.geometry;
      const polys = geom.type === "MultiPolygon" ? geom.coordinates : [geom.coordinates];

      ctx.strokeStyle = "rgba(0,212,170,0.5)";
      ctx.lineWidth = 1.5 / transform.scale;
      ctx.fillStyle = "rgba(0,212,170,0.04)";

      polys.forEach((poly) => {
        poly.forEach((ring) => {
          ctx.beginPath();
          ring.forEach(([lon, lat], i) => {
            const { x, y } = project(lat, lon);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        });
      });

      // Glow effect for boundary
      ctx.strokeStyle = "rgba(0,212,170,0.15)";
      ctx.lineWidth = 4 / transform.scale;
      polys.forEach((poly) => {
        poly.forEach((ring) => {
          ctx.beginPath();
          ring.forEach(([lon, lat], i) => {
            const { x, y } = project(lat, lon);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.closePath();
          ctx.stroke();
        });
      });
    }

    function drawPatches(ctx, pulse) {
      greecePatches.forEach((patch) => {
        const { x, y } = project(patch.lat, patch.lon);
        const isCritical = patch.score >= 76;
        const isSelected = selectedPatch?.id === patch.id;
        const isHovered = hoveredPatch?.id === patch.id;
        const color = getRiskColor(patch.score);

        const baseRadius = 6 + (patch.score / 100) * 8;
        const radius = (isSelected || isHovered) ? baseRadius * 1.4 : baseRadius;

        // Pulse ring for high/critical
        if (isCritical) {
          const pulseRadius = radius + 6 + Math.sin(pulse * 0.08) * 5;
          const pulseAlpha = 0.3 + Math.sin(pulse * 0.08) * 0.2;
          ctx.beginPath();
          ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `${color}${Math.round(pulseAlpha * 255).toString(16).padStart(2, "0")}`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Outer glow
        const grd = ctx.createRadialGradient(x, y, 0, x, y, radius * 2.5);
        grd.addColorStop(0, color + "40");
        grd.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(x, y, radius * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Main dot
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color + "cc";
        ctx.fill();
        ctx.strokeStyle = isSelected ? "white" : color;
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.stroke();

        // Center highlight
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fill();
      });
    }

    function drawAssetPins(ctx) {
      assetPins.forEach((pin) => {
        const { x, y } = project(pin.lat, pin.lon);
        const isHighRisk = pin.proximity_risk;

        if (isHighRisk) {
          ctx.beginPath();
          ctx.arc(x, y, 12 + Math.sin(pulse * 0.08) * 3, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(245,158,11,0.5)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Diamond shape
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.PI / 4);
        ctx.beginPath();
        ctx.rect(-5, -5, 10, 10);
        ctx.fillStyle = isHighRisk ? "#F59E0B" : "rgba(255,255,255,0.9)";
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.5)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      });
    }

    function drawTooltip(ctx) {
      if (!tooltip) return;
      const { x, y, patch } = tooltip;
      const color = getRiskColor(patch.score);
      const padding = 10;
      const w = 160;
      const h = 56;
      let tx = x + 14;
      let ty = y - h / 2;
      if (tx + w > dimensions.width - 10) tx = x - w - 14;
      if (ty < 5) ty = 5;

      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.roundRect(tx, ty, w, h, 8);
      ctx.fillStyle = "rgba(10,15,30,0.95)";
      ctx.fill();
      ctx.strokeStyle = color + "60";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      ctx.fillStyle = "white";
      ctx.font = "bold 12px Inter, sans-serif";
      ctx.fillText(patch.name, tx + padding, ty + padding + 12);
      ctx.fillStyle = color;
      ctx.font = "11px Inter, sans-serif";
      ctx.fillText(`Score: ${patch.score} · ${patch.tier}`, tx + padding, ty + padding + 28);
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "10px Inter, sans-serif";
      ctx.fillText(patch.region, tx + padding, ty + padding + 44);
    }

    function render() {
      const { width, height } = dimensions;
      canvas.width = width;
      canvas.height = height;

      // Background
      ctx.fillStyle = "#0A0F1E";
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = "rgba(0,212,170,0.04)";
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
      }
      for (let j = 0; j < height; j += 40) {
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(width, j); ctx.stroke();
      }

      drawGeoJSON(ctx);
      drawPatches(ctx, pulse);
      drawAssetPins(ctx);
      drawTooltip(ctx);

      pulse++;
      animId = requestAnimationFrame(render);
    }

    render();
    return () => cancelAnimationFrame(animId);
  }, [dimensions, transform, geoLoaded, hoveredPatch, tooltip, selectedPatch, assetPins, project]);

  // Mouse interactions
  function getPatchAtPoint(clientX, clientY) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    let closest = null;
    let minDist = 20;

    greecePatches.forEach((patch) => {
      const { x, y } = project(patch.lat, patch.lon);
      const dist = Math.sqrt((x - mx) ** 2 + (y - my) ** 2);
      if (dist < minDist) {
        minDist = dist;
        closest = patch;
      }
    });
    return closest;
  }

  function handleMouseMove(e) {
    const patch = getPatchAtPoint(e.clientX, e.clientY);
    setHoveredPatch(patch);
    if (patch) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, patch });
      canvasRef.current.style.cursor = "pointer";
    } else {
      setTooltip(null);
      canvasRef.current.style.cursor = isDragging ? "grabbing" : "grab";
    }

    if (isDragging && dragStart) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setTransform((t) => ({ ...t, tx: t.tx + dx, ty: t.ty + dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }

  function handleMouseDown(e) {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }

  function handleMouseUp(e) {
    setIsDragging(false);
    setDragStart(null);
  }

  function handleClick(e) {
    const patch = getPatchAtPoint(e.clientX, e.clientY);
    if (patch) onPatchClick(patch);
  }

  function handleWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.85 : 1.18;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const { width, height } = dimensions;

    setTransform((t) => {
      const newScale = Math.max(0.5, Math.min(8, t.scale * delta));
      const ratio = newScale / t.scale;
      // Zoom toward mouse position
      const newTx = mx - ratio * (mx - (width / 2 + t.tx)) - width / 2;
      const newTy = my - ratio * (my - (height / 2 + t.ty)) - height / 2;
      return { scale: newScale, tx: newTx, ty: newTy };
    });
  }

  function handleTouchStart(e) {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  }

  function handleTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging) {
      const dx = e.touches[0].clientX - dragStart.x;
      const dy = e.touches[0].clientY - dragStart.y;
      setTransform((t) => ({ ...t, tx: t.tx + dx, ty: t.ty + dy }));
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  }

  function handleTouchEnd() {
    setIsDragging(false);
  }

  function resetView() {
    setTransform({ scale: 1, tx: 0, ty: 0 });
  }

  function zoomIn() {
    setTransform((t) => ({ ...t, scale: Math.min(8, t.scale * 1.3) }));
  }

  function zoomOut() {
    setTransform((t) => ({ ...t, scale: Math.max(0.5, t.scale * 0.77) }));
  }

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden" style={{ background: "#0A0F1E" }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: "grab" }}
      />

      {/* Map Legend */}
      <div
        className="absolute bottom-4 left-4 p-3 rounded-xl text-xs space-y-1.5"
        style={{
          background: "rgba(10,15,30,0.85)",
          border: "1px solid rgba(0,212,170,0.15)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="text-white/40 font-semibold uppercase tracking-wider text-[10px] mb-2">Risk Level</div>
        {[
          { color: "#EF4444", label: "Critical (76-100)" },
          { color: "#F59E0B", label: "High (51-75)" },
          { color: "#EAB308", label: "Medium (26-50)" },
          { color: "#00D4AA", label: "Low (0-25)" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
            <span className="text-white/60">{item.label}</span>
          </div>
        ))}
        {assetPins.length > 0 && (
          <>
            <div className="border-t border-white/10 pt-1.5 mt-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-white/80 rotate-45" />
                <span className="text-white/60">Portfolio Asset</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Zoom controls */}
      <div className="absolute right-4 bottom-4 flex flex-col gap-1">
        {[
          { label: "+", fn: zoomIn },
          { label: "−", fn: zoomOut },
          { label: "⌂", fn: resetView },
        ].map(({ label, fn }) => (
          <button
            key={label}
            onClick={fn}
            className="w-8 h-8 rounded-lg font-bold text-white/70 hover:text-white hover:bg-white/15 transition-all text-sm flex items-center justify-center"
            style={{ background: "rgba(10,15,30,0.85)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Attribution */}
      <div className="absolute bottom-2 right-14 text-[10px] text-white/20">
        © EarthRisk AI · Sentinel-2 derived
      </div>

      {/* Loading overlay */}
      {!geoLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-[#00D4AA] text-sm animate-pulse">Loading map data…</div>
        </div>
      )}
    </div>
  );
}
