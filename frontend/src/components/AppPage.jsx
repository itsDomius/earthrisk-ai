import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import GreeceMap from "./GreeceMap";
import ScorePanel from "./ScorePanel";
import StatsBar from "./StatsBar";
import PortfolioUploader from "./PortfolioUploader";
import HistoryDrawer from "./HistoryDrawer";

export default function AppPage() {
  const navigate = useNavigate();
  const [selectedPatch, setSelectedPatch] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [assetPins, setAssetPins] = useState([]);
  const [feedbackCount, setFeedbackCount] = useState(0);

  const handlePatchClick = useCallback((patch) => {
    setSelectedPatch(patch);
    setPanelOpen(true);
  }, []);

  const handleClosePanel = useCallback(() => {
    setPanelOpen(false);
    setTimeout(() => setSelectedPatch(null), 500);
  }, []);

  const handleFeedbackSubmit = useCallback(() => {
    setFeedbackCount((c) => c + 1);
  }, []);

  const handleAssetsLoaded = useCallback((assets) => {
    setAssetPins(assets);
  }, []);

  // Show alert banner when selected zone score > 80
  const showCriticalAlert = selectedPatch && (selectedPatch.score > 80);

  return (
    <div className="h-screen flex flex-col bg-[#0A0F1E] overflow-hidden">
      {/* Top Navigation Bar */}
      <header
        className="flex items-center justify-between flex-shrink-0 z-20"
        style={{
          background: "rgba(10,15,30,0.95)",
          borderBottom: "1px solid rgba(0,212,170,0.12)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div
          className="flex items-center gap-2.5 px-5 py-3 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00D4AA] to-[#00a882] flex items-center justify-center shadow-md shadow-[#00D4AA]/20">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.15)" />
              <circle cx="12" cy="12" r="3" fill="white" />
            </svg>
          </div>
          <span className="text-sm font-bold text-white">
            Earth<span className="text-[#00D4AA]">Risk</span>
            <span className="text-white/30 font-light"> AI</span>
          </span>
          <div
            className="text-[10px] px-2 py-0.5 rounded-full ml-1 font-bold tracking-wider"
            style={{ background: "rgba(0,212,170,0.1)", color: "#00D4AA", border: "1px solid rgba(0,212,170,0.2)" }}
          >
            LIVE
          </div>
        </div>

        <div className="flex-1 flex justify-center overflow-hidden">
          <StatsBar refreshTrigger={feedbackCount} />
        </div>

        <div className="flex items-center gap-2 px-4">
          <div className="hidden md:flex items-center gap-1.5 text-xs text-white/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D4AA] animate-pulse" />
            Greece · 200 zones
          </div>
          <button
            onClick={() => navigate("/")}
            className="text-xs text-white/30 hover:text-white transition-colors px-3 py-1.5"
          >
            ← Home
          </button>
        </div>
      </header>

      {/* ── Critical zone alert banner ────────────────────────────────────────── */}
      {showCriticalAlert && (
        <div
          className="flex-shrink-0 flex items-center justify-between px-5 py-2.5 z-20"
          style={{
            background: "linear-gradient(90deg, rgba(239,68,68,0.18) 0%, rgba(239,68,68,0.08) 100%)",
            borderBottom: "1px solid rgba(239,68,68,0.35)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-2 h-2 rounded-full bg-[#EF4444] flex-shrink-0"
              style={{ boxShadow: "0 0 6px #EF4444", animation: "pulse 1s infinite" }}
            />
            <span className="text-xs font-semibold text-[#EF4444]">
              ALERT: {selectedPatch.name} (score {selectedPatch.score}/100) requires immediate risk reassessment
            </span>
          </div>
          <button
            onClick={handleClosePanel}
            className="text-[#EF4444]/50 hover:text-[#EF4444] text-xs ml-4 transition-colors"
          >
            ✕ Dismiss
          </button>
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Map area */}
        <div
          className="flex-1 relative transition-all duration-500"
          style={{ marginRight: panelOpen ? "400px" : "0" }}
        >
          <GreeceMap
            onPatchClick={handlePatchClick}
            assetPins={assetPins}
            selectedPatch={selectedPatch}
          />

          {!selectedPatch && (
            <div
              className="absolute top-16 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full text-xs text-white/50 pointer-events-none animate-pulse"
              style={{
                background: "rgba(10,15,30,0.7)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(8px)",
              }}
            >
              <span>👆</span>
              Click any risk zone to open assessment
            </div>
          )}
        </div>

        {/* Score Panel */}
        {panelOpen && selectedPatch && (
          <ScorePanel
            patch={selectedPatch}
            onClose={handleClosePanel}
            onFeedbackSubmit={handleFeedbackSubmit}
          />
        )}
      </div>

      <PortfolioUploader onAssetsLoaded={handleAssetsLoaded} />
      <HistoryDrawer refreshTrigger={feedbackCount} />
    </div>
  );
}
