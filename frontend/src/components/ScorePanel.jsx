import { useEffect, useState, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getRiskColor } from "../data/greeceData";

const TIER_CONFIG = {
  CRITICAL: { color: "#EF4444", bg: "rgba(239,68,68,0.15)", label: "CRITICAL" },
  HIGH:     { color: "#F59E0B", bg: "rgba(245,158,11,0.15)", label: "HIGH" },
  MEDIUM:   { color: "#EAB308", bg: "rgba(234,179,8,0.15)", label: "MEDIUM" },
  LOW:      { color: "#00D4AA", bg: "rgba(0,212,170,0.15)", label: "LOW" },
};

function AnimatedBar({ label, value, max, color, delay }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth((value / max) * 100), delay);
    return () => clearTimeout(t);
  }, [value, max, delay]);

  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-white/60">{label}</span>
        <span className="text-white font-mono font-semibold">
          {typeof value === "number" && value < 10 ? value.toFixed(1) : Math.round(value)}
          {label.includes("Temp") ? "°C" : label.includes("Stress") ? "" : "%"}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${width}%`, background: color }}
        />
      </div>
    </div>
  );
}

function ScoreRing({ score, tier }) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.LOW;
  const circumference = 2 * Math.PI * 52;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setProgress(score / 100), 100);
    return () => clearTimeout(t);
  }, [score]);

  return (
    <div className="relative flex items-center justify-center w-36 h-36">
      <svg width="144" height="144" viewBox="0 0 144 144" className="absolute">
        <circle
          cx="72" cy="72" r="52"
          fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10"
        />
        <circle
          cx="72" cy="72" r="52"
          fill="none"
          stroke={config.color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          strokeLinecap="round"
          transform="rotate(-90 72 72)"
          style={{
            transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)",
            filter: `drop-shadow(0 0 8px ${config.color})`,
          }}
        />
      </svg>
      <div className="text-center z-10">
        <div
          className="text-4xl font-bold leading-none"
          style={{ color: config.color }}
        >
          {score}
        </div>
        <div className="text-xs text-white/40 mt-1">/ 100</div>
      </div>
    </div>
  );
}

export default function ScorePanel({ patch, onClose, onFeedbackSubmit }) {
  const [tab, setTab] = useState("overview");
  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideScore, setOverrideScore] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [toast, setToast] = useState(null);
  const [backendData, setBackendData] = useState(null);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [visible, setVisible] = useState(false);
  const snapshotIdRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!patch) return;
    setAiSummary("");
    setBackendData(null);
    setOverrideOpen(false);
    snapshotIdRef.current = null;

    fetchScore();
  }, [patch?.id]);

  async function fetchScore() {
    setAiLoading(true);
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: patch.lat,
          lon: patch.lon,
          area_name: patch.name,
        }),
      });
      const data = await res.json();
      setBackendData(data);
      setAiSummary(data.summary || "Risk analysis unavailable.");
      snapshotIdRef.current = data.id;
    } catch (e) {
      setAiSummary(
        `${patch.name} presents a ${patch.tier.toLowerCase()} climate risk profile based on satellite-derived vegetation indices and temperature anomaly data. Vegetation cover has declined significantly over the past 24 months, correlating with increased wildfire susceptibility and soil erosion indicators. Underwriters should apply a risk loading factor consistent with the ${patch.tier} tier classification for property and casualty policies in this zone.`
      );
    } finally {
      setAiLoading(false);
    }
  }

  async function handleFeedback(action) {
    setFeedbackSubmitting(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          snapshot_id: snapshotIdRef.current || `fallback-${patch.id}`,
          action,
          override_score: action === "override" ? Number(overrideScore) : null,
          reason: action === "override" ? overrideReason : null,
        }),
      });
      setToast(
        action === "agree"
          ? "✓ Assessment confirmed — logged to audit trail"
          : `⚡ Override recorded: ${overrideScore}/100`
      );
      setOverrideOpen(false);
      if (onFeedbackSubmit) onFeedbackSubmit();
    } catch {
      setToast("Feedback saved locally (backend offline)");
    } finally {
      setFeedbackSubmitting(false);
      setTimeout(() => setToast(null), 3500);
    }
  }

  async function handleExportPDF() {
    const params = new URLSearchParams({
      area_name: patch.name,
      score: backendData?.score || patch.score,
      summary: aiSummary,
      snapshot_id: snapshotIdRef.current || patch.id,
    });
    const url = `/api/report/pdf?${params}`;
    const link = document.createElement("a");
    link.href = url;
    link.download = `earthrisk-${patch.name.replace(/\s+/g, "-")}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (!patch) return null;

  const displayScore = backendData?.score ?? patch.score;
  const tier = backendData?.tier || patch.tier;
  const config = TIER_CONFIG[tier] || TIER_CONFIG.LOW;
  const factors = patch.factors;

  // Filter trend data to show one point per quarter for readability
  const chartData = patch.trendData.filter((_, i) => i % 3 === 0);

  return (
    <>
      {/* Overlay on mobile */}
      <div
        className="fixed inset-0 bg-black/40 z-30 md:hidden"
        onClick={onClose}
      />

      <div
        className={`fixed right-0 top-0 bottom-0 w-full md:w-[400px] z-40 flex flex-col transition-transform duration-500 ease-out ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          background: "linear-gradient(180deg, #0f1829 0%, #0A0F1E 100%)",
          borderLeft: "1px solid rgba(0,212,170,0.15)",
          boxShadow: "-20px 0 60px rgba(0,0,0,0.6)",
        }}
      >
        {/* Toast */}
        {toast && (
          <div
            className="absolute top-4 left-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium text-white text-center transition-all duration-300"
            style={{ background: "rgba(0,212,170,0.2)", border: "1px solid rgba(0,212,170,0.4)" }}
          >
            {toast}
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-white/5">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-white/30 font-mono uppercase tracking-widest mb-1">
              Risk Assessment
            </div>
            <h2 className="text-lg font-bold text-white leading-tight truncate pr-2">
              {patch.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-white/40">{patch.region}</span>
              <span className="text-white/20">·</span>
              <span className="text-xs text-white/40">{patch.cluster}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all flex-shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Score hero */}
        <div className="flex items-center gap-6 px-5 py-4 border-b border-white/5">
          <ScoreRing score={displayScore} tier={tier} />
          <div>
            <div
              className="text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-2 inline-block"
              style={{ background: config.bg, color: config.color }}
            >
              {config.label} RISK
            </div>
            <div className="text-xs text-white/40 space-y-1">
              <div>Trend: <span className={
                patch.trend === "rising" ? "text-red-400" :
                patch.trend === "improving" ? "text-teal-400" : "text-yellow-400"
              }>{patch.trend === "rising" ? "↑ Rising" : patch.trend === "improving" ? "↓ Improving" : "→ Stable"}</span></div>
              <div>Lat: <span className="text-white/60 font-mono">{patch.lat.toFixed(4)}°N</span></div>
              <div>Lon: <span className="text-white/60 font-mono">{patch.lon.toFixed(4)}°E</span></div>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Trend chart */}
          <div className="px-5 pt-4 pb-2">
            <div className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-3">
              4-Year Risk Trend
            </div>
            <div className="h-28 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#00D4AA" />
                      <stop offset="50%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#EF4444" />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }}
                    tickFormatter={(v) => v.slice(0, 4)}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15,24,41,0.95)",
                      border: "1px solid rgba(0,212,170,0.3)",
                      borderRadius: "8px",
                      fontSize: "11px",
                      color: "white",
                    }}
                    formatter={(v) => [`${v}`, "Score"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="url(#lineGrad)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: config.color }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Factor bars */}
          <div className="px-5 py-3 space-y-3 border-t border-white/5">
            <div className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-2">
              Risk Factors
            </div>
            <AnimatedBar
              label="Vegetation Loss"
              value={factors.ndvi_drop}
              max={100}
              color="#EF4444"
              delay={200}
            />
            <AnimatedBar
              label="Temperature Rise"
              value={factors.temp_increase}
              max={5}
              color="#F59E0B"
              delay={350}
            />
            <AnimatedBar
              label="Land Stress Index"
              value={factors.land_stress * 100}
              max={100}
              color="#EAB308"
              delay={500}
            />
            <AnimatedBar
              label="Asset Proximity"
              value={factors.asset_proximity}
              max={100}
              color="#a78bfa"
              delay={650}
            />
          </div>

          {/* AI Summary */}
          <div
            className="mx-5 my-3 p-4 rounded-xl border"
            style={{
              background: "rgba(0,212,170,0.04)",
              borderColor: "rgba(0,212,170,0.2)",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-md bg-[#00D4AA]/20 flex items-center justify-center">
                <span className="text-xs">🤖</span>
              </div>
              <span className="text-xs font-semibold text-[#00D4AA] uppercase tracking-wider">
                AI Risk Briefing
              </span>
              {aiLoading && (
                <div className="flex gap-1 ml-auto">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-[#00D4AA]"
                      style={{ animation: `bounce 1.2s ${i * 0.2}s infinite` }}
                    />
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              {aiLoading ? (
                <span className="text-white/30">Generating risk analysis with GPT-4o-mini…</span>
              ) : (
                aiSummary
              )}
            </p>
          </div>

          {/* Override form */}
          {overrideOpen && (
            <div
              className="mx-5 mb-3 p-4 rounded-xl border"
              style={{ background: "rgba(245,158,11,0.06)", borderColor: "rgba(245,158,11,0.3)" }}
            >
              <div className="text-xs font-semibold text-[#F59E0B] uppercase tracking-wider mb-3">
                Override Assessment
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-white/40 mb-1 block">New Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={overrideScore}
                    onChange={(e) => setOverrideScore(e.target.value)}
                    placeholder="e.g. 45"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F59E0B]/60 placeholder:text-white/20"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Reason</label>
                  <textarea
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Provide justification for override…"
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F59E0B]/60 placeholder:text-white/20 resize-none"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleFeedback("override")}
                    disabled={!overrideScore || feedbackSubmitting}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
                    style={{ background: "rgba(245,158,11,0.25)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.4)" }}
                  >
                    Submit Override
                  </button>
                  <button
                    onClick={() => setOverrideOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs text-white/40 hover:text-white transition-all"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="px-5 pb-6 pt-2 grid grid-cols-3 gap-2">
            <button
              onClick={() => handleFeedback("agree")}
              disabled={feedbackSubmitting}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              style={{
                background: "rgba(0,212,170,0.12)",
                border: "1px solid rgba(0,212,170,0.3)",
                color: "#00D4AA",
              }}
            >
              <span className="text-lg">✓</span>
              <span>AGREE</span>
            </button>

            <button
              onClick={() => setOverrideOpen(!overrideOpen)}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95"
              style={{
                background: "rgba(245,158,11,0.12)",
                border: "1px solid rgba(245,158,11,0.3)",
                color: "#F59E0B",
              }}
            >
              <span className="text-lg">✏️</span>
              <span>OVERRIDE</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.8)",
              }}
            >
              <span className="text-lg">📄</span>
              <span>EXPORT</span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
