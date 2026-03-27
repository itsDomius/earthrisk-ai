import { useState, useRef } from "react";

export default function PortfolioUploader({ onAssetsLoaded }) {
  const [open, setOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  async function processFile(file) {
    if (!file || !file.name.endsWith(".csv")) {
      setError("Please upload a CSV file with columns: name, lat, lon, value");
      return;
    }
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/assets/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.features) {
        const assets = data.features.map((f) => ({
          ...f.properties,
          lat: f.geometry.coordinates[1],
          lon: f.geometry.coordinates[0],
        }));
        const highRisk = assets.filter((a) => a.proximity_risk).length;
        const maxRisk = assets.reduce((m, a) => (a.proximity_risk && a.value > (m?.value || 0) ? a : m), null);

        setStats({
          total: assets.length,
          highRisk,
          pct: Math.round((highRisk / assets.length) * 100),
          topAsset: maxRisk?.name || "N/A",
        });
        onAssetsLoaded(assets);
      }
    } catch {
      // Fallback: parse CSV client-side
      const text = await file.text();
      const lines = text.trim().split("\n");
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const assets = [];

      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(",");
        const obj = {};
        headers.forEach((h, idx) => {
          obj[h] = vals[idx]?.trim();
        });
        if (obj.lat && obj.lon) {
          assets.push({
            name: obj.name || `Asset ${i}`,
            lat: parseFloat(obj.lat),
            lon: parseFloat(obj.lon),
            value: parseFloat(obj.value) || 0,
            proximity_risk: 0,
          });
        }
      }

      const highRisk = assets.filter((a) => {
        // Rough proximity check: within 5km of HIGH/CRITICAL cluster centers
        const highCenters = [
          { lat: 39.6, lon: 22.4 }, { lat: 38.6, lon: 23.6 },
          { lat: 36.2, lon: 28.0 }, { lat: 37.5, lon: 22.3 },
        ];
        return highCenters.some((c) => {
          const d = Math.sqrt((a.lat - c.lat) ** 2 + (a.lon - c.lon) ** 2) * 111;
          return d < 30;
        });
      });

      highRisk.forEach((a) => (a.proximity_risk = 1));
      setStats({
        total: assets.length,
        highRisk: highRisk.length,
        pct: Math.round((highRisk.length / assets.length) * 100),
        topAsset: highRisk[0]?.name || "N/A",
      });
      onAssetsLoaded(assets);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    processFile(e.dataTransfer.files[0]);
  }

  function handleFileChange(e) {
    processFile(e.target.files[0]);
  }

  function downloadSampleCSV() {
    const csv = `name,lat,lon,value\nAthens Office Complex,37.9838,23.7275,2500000\nThessaloniki Warehouse,40.6401,22.9444,1800000\nRhodes Resort Hotel,36.4341,28.2176,5200000\nVolos Industrial Park,39.3617,22.9417,3100000\nPatras Commercial,38.2466,21.7346,1400000`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample-portfolio.csv";
    a.click();
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold text-white transition-all hover:scale-105 shadow-xl"
        style={{
          background: open
            ? "rgba(0,212,170,0.25)"
            : "rgba(30,41,59,0.95)",
          border: "1px solid rgba(0,212,170,0.3)",
          boxShadow: "0 0 20px rgba(0,212,170,0.15)",
          backdropFilter: "blur(12px)",
        }}
      >
        <span className="text-lg">📁</span>
        <span>Portfolio Upload</span>
        {stats && (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-bold"
            style={{ background: "rgba(0,212,170,0.2)", color: "#00D4AA" }}
          >
            {stats.total}
          </span>
        )}
      </button>

      {/* Upload panel */}
      {open && (
        <div
          className="fixed bottom-20 left-6 z-50 w-80 rounded-2xl overflow-hidden"
          style={{
            background: "rgba(10,15,30,0.97)",
            border: "1px solid rgba(0,212,170,0.2)",
            boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div>
              <div className="text-sm font-bold text-white">Asset Portfolio</div>
              <div className="text-xs text-white/30">Upload CSV to map insured assets</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/30 hover:text-white text-lg"
            >
              ✕
            </button>
          </div>

          {/* Drop zone */}
          <div className="p-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-8 cursor-pointer transition-all"
              style={{
                borderColor: dragOver ? "#00D4AA" : "rgba(255,255,255,0.1)",
                background: dragOver ? "rgba(0,212,170,0.05)" : "rgba(255,255,255,0.02)",
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
              {uploading ? (
                <div className="text-[#00D4AA] text-sm animate-pulse">Processing…</div>
              ) : (
                <>
                  <span className="text-3xl mb-2">📊</span>
                  <p className="text-sm text-white/60 text-center">
                    Drop CSV file here
                    <br />
                    <span className="text-white/30 text-xs">or click to browse</span>
                  </p>
                  <p className="text-xs text-white/20 mt-2">
                    Columns: name, lat, lon, value
                  </p>
                </>
              )}
            </div>

            {error && (
              <div className="mt-2 text-xs text-red-400 text-center">{error}</div>
            )}

            <button
              onClick={downloadSampleCSV}
              className="mt-2 w-full text-xs text-white/30 hover:text-[#00D4AA] transition-colors py-1.5 text-center"
            >
              Download sample CSV →
            </button>
          </div>

          {/* Stats */}
          {stats && (
            <div
              className="mx-4 mb-4 p-3 rounded-xl"
              style={{ background: "rgba(0,212,170,0.06)", border: "1px solid rgba(0,212,170,0.15)" }}
            >
              <div className="text-xs font-semibold text-[#00D4AA] mb-2 uppercase tracking-wider">
                Portfolio Analysis
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xl font-bold text-white">{stats.total}</div>
                  <div className="text-xs text-white/40">Total Assets</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-[#F59E0B]">{stats.pct}%</div>
                  <div className="text-xs text-white/40">In High-Risk Zones</div>
                </div>
              </div>
              {stats.topAsset !== "N/A" && (
                <div className="mt-2 pt-2 border-t border-white/5">
                  <div className="text-xs text-white/40">Highest Risk Asset</div>
                  <div className="text-sm text-[#EF4444] font-medium truncate">{stats.topAsset}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
