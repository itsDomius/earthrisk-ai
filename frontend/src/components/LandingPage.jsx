import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { IconSatellite, IconRefresh, IconClipboard, IconClose } from "./Icons";

const PILL_DETAILS = {
  "Real Sentinel-2 Data": {
    icon: <IconSatellite size={28} />,
    color: "#00D4AA",
    tagline: "Eyes in orbit. Always on.",
    description:
      "We ingest multispectral imagery from ESA's Sentinel-2 constellation — freely available, globally covering, updated every 5 days. Each image captures 13 spectral bands at 10–60m resolution, letting us detect vegetation stress, soil moisture loss, and burn scars invisible to the naked eye.",
    stats: [
      { value: "10m", label: "Spatial Resolution" },
      { value: "5 days", label: "Revisit Cycle" },
      { value: "13", label: "Spectral Bands" },
      { value: "290km", label: "Swath Width" },
    ],
    bullets: [
      "NDVI vegetation index computed per patch",
      "Temporal composites filter cloud cover",
      "Band ratios detect drought & fire damage",
      "Open data — zero vendor lock-in",
    ],
  },
  "Underwriter Feedback Loop": {
    icon: <IconRefresh size={28} />,
    color: "#a78bfa",
    tagline: "Human expertise meets machine precision.",
    description:
      "Every AI risk assessment can be confirmed or overridden by the underwriter. Those decisions feed back into the model — making it smarter with each interaction. This closed loop ensures the system adapts to your portfolio's unique exposure profile over time.",
    stats: [
      { value: "2-click", label: "Feedback Input" },
      { value: "Real-time", label: "Model Adaptation" },
      { value: "100%", label: "Decisions Logged" },
      { value: "XGBoost", label: "Scoring Engine" },
    ],
    bullets: [
      "Agree or override any AI score in seconds",
      "Override reason captured for audit purposes",
      "Feedback signals improve future predictions",
      "Underwriter authority always preserved",
    ],
  },
  "Regulatory Audit Trail": {
    icon: <IconClipboard size={28} />,
    color: "#F59E0B",
    tagline: "Every decision. Timestamped. Explainable.",
    description:
      "Every assessment, override, and score change is immutably logged with a timestamp, underwriter ID, and the AI's reasoning. Regulators and internal auditors get a complete, exportable chain of custody — from raw satellite data to final policy decision.",
    stats: [
      { value: "100%", label: "Decision Coverage" },
      { value: "PDF", label: "Export Format" },
      { value: "XAI", label: "Explainability Layer" },
      { value: "GDPR", label: "Compliant Design" },
    ],
    bullets: [
      "Immutable log of every AI and human action",
      "One-click PDF report per risk zone",
      "Explainable AI — no black-box decisions",
      "Ready for Solvency II & IDD frameworks",
    ],
  },
};

function PillModal({ pill, onClose }) {
  const detail = PILL_DETAILS[pill.label];
  if (!detail) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", background: "rgba(10,15,30,0.75)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden animate-fade-in-up"
        style={{
          background: "linear-gradient(160deg, rgba(20,28,50,0.98) 0%, rgba(10,15,30,0.99) 100%)",
          border: `1px solid ${detail.color}30`,
          boxShadow: `0 40px 80px rgba(0,0,0,0.6), 0 0 60px ${detail.color}15`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow top bar */}
        <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${detail.color}80, transparent)` }} />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all z-10"
        >
          <IconClose size={15} />
        </button>

        {/* Header */}
        <div className="px-7 pt-8 pb-4 flex flex-col items-center text-center gap-3">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: `${detail.color}15`, border: `1px solid ${detail.color}30`, color: detail.color }}
          >
            {detail.icon}
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: `${detail.color}80` }}>
              Platform Feature
            </div>
            <h2 className="text-lg font-bold text-white leading-tight">{pill.label}</h2>
          </div>
        </div>

        {/* Tagline */}
        <div className="px-7 pb-4 text-center">
          <p className="text-sm font-semibold italic" style={{ color: detail.color }}>
            "{detail.tagline}"
          </p>
        </div>

        {/* Description */}
        <div className="px-7 pb-5 text-center">
          <p className="text-sm text-white/50 leading-relaxed">{detail.description}</p>
        </div>

        {/* Stats grid */}
        <div className="mx-7 mb-5 grid grid-cols-4 gap-2">
          {detail.stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-2.5 text-center"
              style={{ background: `${detail.color}08`, border: `1px solid ${detail.color}18` }}
            >
              <div className="font-mono font-bold text-sm leading-none mb-1" style={{ color: detail.color }}>
                {s.value}
              </div>
              <div className="text-[9px] text-white/30 leading-tight">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Bullets */}
        <div className="px-7 pb-7 flex flex-col items-center gap-2">
          {detail.bullets.map((b) => (
            <div key={b} className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: detail.color }} />
              <span className="text-xs text-white/50">{b}</span>
            </div>
          ))}
        </div>

        {/* Bottom glow bar */}
        <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${detail.color}40, transparent)` }} />
      </div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [activePill, setActivePill] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!activePill) return;
    const onKey = (e) => e.key === "Escape" && setActivePill(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activePill]);

  return (
    <div className="relative min-h-screen bg-[#0A0F1E] overflow-hidden flex flex-col items-center justify-center">
      {/* Animated CSS Grid Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,212,170,0.07) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,212,170,0.07) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            animation: "gridMove 20s linear infinite",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,212,170,0.08) 0%, transparent 70%)",
          }}
        />
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${80 + i * 40}px`,
              height: `${80 + i * 40}px`,
              left: `${10 + i * 15}%`,
              top: `${15 + (i % 3) * 25}%`,
              background: i % 2 === 0
                ? "radial-gradient(circle, rgba(0,212,170,0.12) 0%, transparent 70%)"
                : "radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)",
              animation: `floatOrb ${8 + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 1.5}s`,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div
        className={`relative z-10 text-center px-6 max-w-4xl mx-auto transition-all duration-1000 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Logo Badge */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00D4AA] to-[#00a882] flex items-center justify-center shadow-lg shadow-[#00D4AA]/30">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" stroke="white" strokeWidth="1.5" fill="rgba(255,255,255,0.1)" />
                <circle cx="12" cy="12" r="3" fill="white" />
              </svg>
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#EF4444] rounded-full animate-pulse" />
          </div>
          <span className="text-3xl font-bold text-white tracking-tight">
            Earth<span className="text-[#00D4AA]">Risk</span>{" "}
            <span className="text-white/60 font-light">AI</span>
          </span>
        </div>

        {/* IBM Challenge aligned headline */}
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
          Detect how areas
          <br />
          <span
            className="text-transparent bg-clip-text"
            style={{ backgroundImage: "linear-gradient(135deg, #00D4AA 0%, #00a0ff 100%)" }}
          >
            change over time
          </span>
        </h1>

        <p className="text-lg md:text-xl text-white/55 mb-3 font-light max-w-2xl mx-auto leading-relaxed">
          Convert environmental data into explainable insurance risk insights.
        </p>

        <p className="text-sm text-white/35 mb-10">
          For the insurance industry · Powered by real satellite data · XGBoost ML · Explainable AI
        </p>

        {/* CTA Button */}
        <button
          onClick={() => navigate("/app")}
          className="group relative inline-flex items-center gap-3 px-10 py-5 rounded-2xl text-lg font-semibold text-[#0A0F1E] transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#00D4AA]/40"
          style={{
            background: "linear-gradient(135deg, #00D4AA 0%, #00c49a 100%)",
            boxShadow: "0 0 40px rgba(0,212,170,0.3)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="transition-transform group-hover:rotate-12">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="9" r="2.5" fill="currentColor" />
          </svg>
          Open Risk Map
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="transition-transform group-hover:translate-x-1">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-10">
          {[
            { icon: <IconSatellite size={14} />, label: "Real Sentinel-2 Data" },
            { icon: <IconRefresh size={14} />, label: "Underwriter Feedback Loop" },
            { icon: <IconClipboard size={14} />, label: "Regulatory Audit Trail" },
          ].map((pill) => (
            <button
              key={pill.label}
              onClick={() => setActivePill(pill)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 text-white/70 text-sm backdrop-blur-sm hover:border-[#00D4AA]/40 hover:text-white hover:bg-white/10 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
            >
              {pill.icon}
              <span>{pill.label}</span>
            </button>
          ))}
        </div>

        {/* Data Sources footer badges — IBM challenge requirement */}
        <div className="flex flex-wrap justify-center items-center gap-3 mt-10">
          <span className="text-[10px] text-white/25 uppercase tracking-widest mr-1">Data Sources</span>
          {[
            { label: "Sentinel-2", color: "#00D4AA" },
            { label: "ERA5", color: "#60a5fa" },
            { label: "XGBoost", color: "#a78bfa" },
            { label: "Explainable AI", color: "#F59E0B" },
          ].map(({ label, color }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold"
              style={{
                background: `${color}15`,
                border: `1px solid ${color}35`,
                color,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom stats */}
      <div
        className={`absolute bottom-8 left-0 right-0 flex justify-center gap-3 px-6 transition-all duration-1000 delay-500 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {[
          { value: "200+", label: "Risk Zones Monitored", color: "#00D4AA" },
          { value: "4",    label: "Data Moats",           color: "#60a5fa" },
          { value: "93%",  label: "Prediction Accuracy",  color: "#a78bfa" },
          { value: "Live", label: "Risk Updates",         color: "#F59E0B" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center justify-center text-center px-5 py-4 rounded-2xl min-w-[100px] transition-all duration-300 hover:scale-105"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${stat.color}22`,
              boxShadow: `0 0 24px ${stat.color}0a`,
              backdropFilter: "blur(12px)",
            }}
          >
            <div
              className="text-2xl font-bold font-mono leading-none mb-1.5"
              style={{ color: stat.color }}
            >
              {stat.value}
            </div>
            <div className="text-[10px] text-white/35 uppercase tracking-wider leading-tight">
              {stat.label}
            </div>
            <div
              className="w-6 h-px mt-2.5 rounded-full"
              style={{ background: `${stat.color}60` }}
            />
          </div>
        ))}
      </div>

      {activePill && <PillModal pill={activePill} onClose={() => setActivePill(null)} />}

      <style>{`
        @keyframes gridMove {
          0% { transform: translateY(0); }
          100% { transform: translateY(60px); }
        }
        @keyframes floatOrb {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.6; }
          50% { transform: translateY(-30px) scale(1.1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
