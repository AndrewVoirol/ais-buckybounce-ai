import React, { useState } from 'react';
import { StructureType, GameMode, StructureData, Theme, TelemetryData, PuzzleLevel } from '../types';
import { toggleAudioMute, getIsAudioMuted } from '../utils';

interface OverlayProps {
  structure: StructureData;
  onSelectStructure: (type: StructureType) => void;
  theme: Theme;
  mode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  isExploded: boolean;
  onToggleExplode: () => void;
  isBreathing: boolean;
  onToggleBreathe: () => void;
  isStressHeatmap: boolean;
  onToggleStressHeatmap: () => void;
  allowBondBreak: boolean;
  onToggleBondBreak: () => void;
  harmonicExcitation: boolean;
  onToggleHarmonicExcitation: () => void;
  thermalAgitation: boolean;
  onToggleThermalAgitation: () => void;
  temperature: number;
  onTemperatureChange: (val: number) => void;
  resonanceFrequency: number;
  onResonanceFrequencyChange: (val: number) => void;
  gravityY: number;
  onGravityChange: (val: number) => void;
  stiffness: number;
  onStiffnessChange: (val: number) => void;
  bounciness: number;
  onBouncinessChange: (val: number) => void;
  score: number;
  combo: number;
  highScore: number;
  telemetry: TelemetryData;
  activePuzzle: PuzzleLevel | null;
  onLaunchProbe?: () => void;
  onOpenCodex: () => void;
  onOpenAIArchitect: () => void;
  onOpenPuzzles: () => void;
}

const STRUCTURE_LIST: { id: StructureType; label: string; formula: string }[] = [
  { id: 'c60', label: 'C₆₀ Fullerene', formula: 'C₆₀' },
  { id: 'c70', label: 'C₇₀ Rugby', formula: 'C₇₀' },
  { id: 'nanotube', label: 'Nanotube', formula: 'SWCNT' },
  { id: 'graphene', label: 'Graphene', formula: '2D Sheet' },
  { id: 'geodesic', label: 'Geodesic Dome', formula: 'Tri-Dome' },
  { id: 'tensegrity', label: 'Tensegrity', formula: '6-Strut' }
];

export const Overlay: React.FC<OverlayProps> = ({
  structure,
  onSelectStructure,
  theme,
  mode,
  onSelectMode,
  isExploded,
  onToggleExplode,
  isBreathing,
  onToggleBreathe,
  isStressHeatmap,
  onToggleStressHeatmap,
  allowBondBreak,
  onToggleBondBreak,
  harmonicExcitation,
  onToggleHarmonicExcitation,
  thermalAgitation,
  onToggleThermalAgitation,
  temperature,
  onTemperatureChange,
  resonanceFrequency,
  onResonanceFrequencyChange,
  gravityY,
  onGravityChange,
  stiffness,
  onStiffnessChange,
  bounciness,
  onBouncinessChange,
  score,
  combo,
  highScore,
  telemetry,
  activePuzzle,
  onLaunchProbe,
  onOpenCodex,
  onOpenAIArchitect,
  onOpenPuzzles
}) => {
  const [isMuted, setIsMuted] = useState(getIsAudioMuted());
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isSweeping, setIsSweeping] = useState(false);

  const handleMuteToggle = () => {
    const muted = toggleAudioMute();
    setIsMuted(muted);
  };

  // Resonance Frequency Sweep Animation
  const handleAutoSweep = () => {
    if (isSweeping) return;
    setIsSweeping(true);
    let curr = 1.0;
    const interval = setInterval(() => {
      curr += 0.25;
      if (curr > 12.0) {
        clearInterval(interval);
        setIsSweeping(false);
      } else {
        onResonanceFrequencyChange(Math.round(curr * 10) / 10);
      }
    }, 120);
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6 overflow-hidden select-none">
      
      {/* 1. TOP HEADER & NAVIGATION */}
      <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-3 bg-black/60 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl">
        
        {/* Brand & Active Formula */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-cyan-500/20">
            ⚛
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-gray-400 tracking-tight leading-none">
              BUCKY<span style={{ color: theme.colors.node }}>BOUNCE</span> <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-white/10 text-cyan-400 border border-white/10 font-bold">2.0</span>
            </h1>
            <div className="text-xs font-mono text-gray-400 mt-0.5 flex items-center gap-2">
              <span className="text-cyan-300 font-bold">{structure.name}</span>
              <span>•</span>
              <span className="text-purple-300">{theme.name}</span>
            </div>
          </div>
        </div>

        {/* Structure Selector Pills */}
        <div className="hidden lg:flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
          {STRUCTURE_LIST.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectStructure(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition active:scale-95 ${
                structure.id === item.id
                  ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => onSelectMode('arcade')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              mode === 'arcade'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/30'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🎯</span>
            <span>Arcade</span>
          </button>
          <button
            onClick={() => onSelectMode('stress_lab')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              mode === 'stress_lab'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>⚡</span>
            <span>Stress Lab</span>
          </button>
          <button
            onClick={() => onSelectMode('sandbox')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              mode === 'sandbox'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🪐</span>
            <span>Sandbox</span>
          </button>
        </div>

        {/* Action Tool Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCodex}
            title="Open Physics & Structural Codex"
            className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
          >
            <span>📖</span>
            <span className="hidden sm:inline">Codex</span>
          </button>

          <button
            onClick={onOpenPuzzles}
            title="Challenges & Puzzles"
            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
          >
            <span>🧩</span>
            <span className="hidden sm:inline">Puzzles</span>
          </button>

          <button
            onClick={onOpenAIArchitect}
            title="AI Material Architect"
            className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
          >
            <span>✨</span>
            <span className="hidden sm:inline">AI Architect</span>
          </button>

          <button
            onClick={handleMuteToggle}
            title={isMuted ? "Unmute Audio" : "Mute Audio"}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Mobile Structure Switcher (Visible on smaller screens) */}
      <div className="lg:hidden pointer-events-auto flex overflow-x-auto gap-1 bg-black/70 backdrop-blur-md p-1.5 rounded-xl border border-white/10 mt-2 max-w-full">
        {STRUCTURE_LIST.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectStructure(item.id)}
            className={`px-3 py-1 rounded-lg text-xs font-mono whitespace-nowrap ${
              structure.id === item.id
                ? 'bg-cyan-500 text-black font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 2. MAIN HUD BODY (TELEMETRY + CONTROLS) */}
      <div className="flex-1 flex justify-between items-end gap-4 mt-4 overflow-hidden pointer-events-none">
        
        {/* Left Telemetry HUD */}
        <div className="pointer-events-auto hidden md:flex flex-col gap-2.5 max-w-xs bg-black/65 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl font-mono text-xs text-gray-300">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 text-cyan-400 font-bold tracking-wider">
            <span>REAL-TIME TELEMETRY</span>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Kinetic Energy (Eₖ):</span>
              <span className="font-bold text-cyan-300">{telemetry.kineticEnergy} J</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">Strain Energy (Eₚ):</span>
              <span className="font-bold text-purple-300">{telemetry.strainEnergy} J</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">Max Bond Stress:</span>
              <span className={`font-bold ${telemetry.maxStress > 0.8 ? 'text-red-400' : 'text-green-400'}`}>
                {(telemetry.maxStress * 100).toFixed(1)}%
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">Structural Health:</span>
              <span className={`font-bold ${telemetry.structuralHealth < 70 ? 'text-red-400' : 'text-emerald-400'}`}>
                {telemetry.structuralHealth}%
              </span>
            </div>

            {/* Health Meter Bar */}
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 via-yellow-400 to-red-500 transition-all duration-300"
                style={{ width: `${telemetry.structuralHealth}%` }}
              />
            </div>

            {/* Euler Characteristic */}
            <div className="pt-2 border-t border-white/10 flex justify-between items-center text-xs">
              <span className="text-gray-400">Euler Polyhedron:</span>
              <span className="text-cyan-400 font-bold">
                V({structure.euler.v}) - E({structure.euler.e}) + F({structure.euler.f}) = {structure.euler.chi}
              </span>
            </div>
          </div>
        </div>

        {/* Right Dynamic Controls Panel */}
        <div className="pointer-events-auto w-full max-w-sm bg-black/75 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl space-y-4">
          
          {/* Header with Collapse toggle */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs font-mono uppercase font-bold tracking-widest text-cyan-400">
              {mode === 'arcade' ? '🎯 ARCADE REBOUND' : (mode === 'stress_lab' ? '⚡ STRESS & RESONANCE' : '🪐 SANDBOX CONTROLS')}
            </span>
            <button
              onClick={() => setIsPanelOpen(!isPanelOpen)}
              className="text-xs text-gray-400 hover:text-white px-2 py-0.5 rounded bg-white/5"
            >
              {isPanelOpen ? 'Hide' : 'Show'}
            </button>
          </div>

          {isPanelOpen && (
            <div className="space-y-4 text-xs font-mono">
              
              {/* --- MODE A: ARCADE REBOUND HUD --- */}
              {mode === 'arcade' && (
                <div className="space-y-3">
                  <div className="p-3 bg-gradient-to-r from-pink-950/40 to-purple-950/40 rounded-xl border border-pink-500/30 flex justify-between items-center">
                    <div>
                      <div className="text-gray-400 uppercase text-[10px]">CURRENT SCORE</div>
                      <div className="text-2xl font-black text-white">{score.toLocaleString()}</div>
                    </div>
                    {combo > 1 && (
                      <div className="text-right">
                        <div className="text-pink-400 font-black text-lg animate-pulse">{combo}x COMBO!</div>
                        <div className="text-[10px] text-gray-400">MULTIPLIER ACTIVE</div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={onLaunchProbe}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 hover:from-pink-400 hover:to-cyan-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-pink-500/25 active:scale-95 transition flex items-center justify-center gap-2"
                  >
                    <span>🎯</span>
                    <span>FIRE ENERGY PROBE (OR DRAG)</span>
                  </button>

                  <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 text-gray-300 text-[11px] leading-relaxed">
                    🎯 <strong className="text-cyan-400">Controls:</strong> Click button above, press Space, or drag anywhere on the canvas to slingshot high-speed probes through target rings!
                  </div>
                </div>
              )}

              {/* --- MODE B: STRESS & RESONANCE LAB --- */}
              {mode === 'stress_lab' && (
                <div className="space-y-3">
                  {/* Resonance Frequency Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-gray-300">
                      <span>Harmonic Driver:</span>
                      <span className="text-amber-400 font-bold">{resonanceFrequency.toFixed(1)} Hz</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="15.0"
                      step="0.1"
                      value={resonanceFrequency}
                      onChange={(e) => onResonanceFrequencyChange(parseFloat(e.target.value))}
                      className="w-full accent-amber-400"
                    />
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={onToggleHarmonicExcitation}
                        className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition ${
                          harmonicExcitation
                            ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {harmonicExcitation ? 'DRIVER ACTIVE ⚡' : 'ENGAGE DRIVER'}
                      </button>
                      <button
                        onClick={handleAutoSweep}
                        disabled={isSweeping}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-gray-200 rounded-lg text-xs font-bold"
                      >
                        {isSweeping ? 'Sweeping...' : 'Sweep Freq'}
                      </button>
                    </div>
                  </div>

                  {/* Thermal Agitation Slider */}
                  <div className="space-y-1 pt-2 border-t border-white/10">
                    <div className="flex justify-between items-center text-gray-300">
                      <span>Thermal Brownian (K):</span>
                      <span className="text-purple-400 font-bold">{temperature} K</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      step="25"
                      value={temperature}
                      onChange={(e) => onTemperatureChange(parseInt(e.target.value))}
                      className="w-full accent-purple-400"
                    />
                    <button
                      onClick={onToggleThermalAgitation}
                      className={`w-full py-1.5 rounded-lg font-bold text-xs transition ${
                        thermalAgitation
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {thermalAgitation ? 'THERMAL AGITATION ON 🔥' : 'HEAT MOLECULE'}
                    </button>
                  </div>

                  {/* Stress Heatmap Toggle */}
                  <div className="flex gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={onToggleStressHeatmap}
                      className={`flex-1 py-2 rounded-lg font-bold text-xs transition ${
                        isStressHeatmap
                          ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {isStressHeatmap ? 'HEATMAP ON (CYAN/RED)' : 'SHOW STRESS HEATMAP'}
                    </button>
                    <button
                      onClick={onToggleBondBreak}
                      className={`flex-1 py-2 rounded-lg font-bold text-xs transition ${
                        allowBondBreak
                          ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {allowBondBreak ? 'BOND CLEAVAGE ON' : 'SNAP BONDS ON STRAIN'}
                    </button>
                  </div>
                </div>
              )}

              {/* --- MODE C: CREATIVE SANDBOX CONTROLS --- */}
              {mode === 'sandbox' && (
                <div className="space-y-3">
                  {/* Gravity Y */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-gray-300">
                      <span>Gravity ($g_y$):</span>
                      <span className="text-cyan-400 font-bold">{gravityY.toFixed(1)} m/s²</span>
                    </div>
                    <input
                      type="range"
                      min="-15"
                      max="5"
                      step="0.5"
                      value={gravityY}
                      onChange={(e) => onGravityChange(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>

                  {/* Restitution (Bounciness) */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-gray-300">
                      <span>Restitution (Bounciness):</span>
                      <span className="text-cyan-400 font-bold">{bounciness.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={bounciness}
                      onChange={(e) => onBouncinessChange(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>

                  {/* Spring Stiffness */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-gray-300">
                      <span>Hooke Stiffness ($k$):</span>
                      <span className="text-purple-400 font-bold">{stiffness} N/m</span>
                    </div>
                    <input
                      type="range"
                      min="300"
                      max="3000"
                      step="100"
                      value={stiffness}
                      onChange={(e) => onStiffnessChange(parseInt(e.target.value))}
                      className="w-full accent-purple-400"
                    />
                  </div>
                </div>
              )}

              {/* Universal Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={onToggleExplode}
                  className={`py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 shadow-lg ${
                    isExploded
                      ? 'bg-cyan-500 text-black shadow-cyan-500/30'
                      : 'bg-red-500/90 text-white hover:bg-red-500 shadow-red-500/20'
                  }`}
                >
                  {isExploded ? '🧲 MAGNETIZE REPAIR' : '💥 SHATTER'}
                </button>

                <button
                  onClick={onToggleBreathe}
                  disabled={isExploded}
                  className={`py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 shadow-lg ${
                    isBreathing && !isExploded
                      ? 'bg-blue-600 text-white shadow-blue-600/30'
                      : 'bg-white/10 text-white hover:bg-white/20 disabled:opacity-30'
                  }`}
                >
                  {isBreathing ? '🌊 PULSING ON' : '🌊 HOBERMAN BREATHE'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. BOTTOM KNOWLEDGE & INTERACTION BAR */}
      <div className="pointer-events-auto flex items-center justify-between gap-4 mt-3 px-4 py-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 text-xs text-gray-400 font-mono">
        <div className="flex items-center gap-2 truncate">
          <span className="text-cyan-400 font-bold">✦ SCIENCE INSIGHT:</span>
          <span className="text-gray-300 truncate">
            {structure.educationalInfo.highlights[0] || structure.educationalInfo.funFact}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-gray-400 shrink-0">
          <span>Click atom to punch</span>
          <span>•</span>
          <span>Drag to Slingshot</span>
          <span>•</span>
          <span>Scroll to Zoom</span>
        </div>
      </div>
    </div>
  );
};
