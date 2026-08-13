import React, { useState } from 'react';
import { Theme, PRESET_THEMES } from '../types';
import { generateTheme } from '../services/geminiService';

interface AIArchitectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: Theme;
  onApplyTheme: (theme: Theme) => void;
}

const PRESET_IDEAS = [
  { label: "Neutron Star Core", prompt: "Extreme gravity, ultra-dense high stiffness obsidian carbon lattice under intense pressure" },
  { label: "Quantum Superconductor", prompt: "Superconducting neon-cyan lattice at near absolute zero in deep space zero-g" },
  { label: "Titan Methane Ocean", prompt: "Cryogenic orange-hued fullerene floating in buoyant liquid methane with high elasticity" },
  { label: "Solar Flare Corona", prompt: "Superheated 1000K solar plasma fullerene experiencing violent Brownian motion and glowing gold" },
  { label: "Alien Hyper-Elastic", prompt: "Bioluminescent emerald rubbery molecular matrix with maximum rebound and low damping" },
  { label: "Black Hole Event Horizon", prompt: "Vortex gravitational pull, violet ultraviolet radiation, relativistic velocity" }
];

export const AIArchitectModal: React.FC<AIArchitectModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onApplyTheme
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const generated = await generateTheme(query);
      onApplyTheme(generated);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to generate material");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (presetName: string) => {
    if (PRESET_THEMES[presetName]) {
      onApplyTheme(PRESET_THEMES[presetName]);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in pointer-events-auto">
      <div className="relative w-full max-w-2xl bg-[#0d1222]/95 border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden text-gray-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-purple-950/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-400 flex items-center justify-center text-purple-400 font-bold">
              ✨
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide">
                AI MATERIAL ARCHITECT
              </h2>
              <p className="text-xs text-purple-300/80 font-mono">
                Powered by Google Gemini 2.5 • Generative Molecular Materials & Physics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Prompt Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGenerate(prompt);
            }}
            className="space-y-3"
          >
            <label className="block text-xs uppercase font-mono tracking-wider text-purple-300 font-bold">
              Describe Your Custom Material or Celestial Environment
            </label>
            <div className="relative">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. 'Cryogenic methane sponge', 'Solar plasma core'"
                className="w-full bg-black/60 border border-purple-500/40 rounded-xl px-4 py-3.5 pr-36 text-white placeholder-gray-500 text-xs sm:text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="absolute right-2 top-2 bottom-2 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 transition"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <span>Generate</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
            {errorMsg && (
              <div className="text-xs text-red-400 bg-red-950/40 border border-red-500/30 p-2 rounded-lg">
                {errorMsg}
              </div>
            )}
          </form>

          {/* Quick Idea Chips */}
          <div className="space-y-2">
            <div className="text-xs uppercase font-mono text-gray-400">Or Select a Quick Idea:</div>
            <div className="flex flex-wrap gap-2">
              {PRESET_IDEAS.map((idea, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setPrompt(idea.prompt);
                    handleGenerate(idea.prompt);
                  }}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/40 text-xs text-gray-300 hover:text-white transition active:scale-95"
                >
                  ⚡ {idea.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Preset Palettes */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="text-xs uppercase font-mono text-gray-400">Pre-Configured Materials:</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.keys(PRESET_THEMES).map((name) => (
                <button
                  key={name}
                  onClick={() => handleSelectPreset(name)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition ${
                    currentTheme.name === name
                      ? 'bg-purple-600/20 border-purple-400 text-white font-bold'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: PRESET_THEMES[name].colors.node }}
                    />
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: PRESET_THEMES[name].colors.link }}
                    />
                  </div>
                  <div>{name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Current Material Lore */}
          {currentTheme.lore && (
            <div className="p-3.5 bg-black/40 rounded-xl border border-white/10 text-xs font-mono text-gray-300">
              <span className="text-purple-400 font-bold">Active Simulation Lore: </span>
              {currentTheme.lore}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
