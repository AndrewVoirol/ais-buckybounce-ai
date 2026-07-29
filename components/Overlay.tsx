import React, { useState, useEffect } from 'react';
import { Theme } from '../types';

interface OverlayProps {
  theme: Theme;
  onThemeChange: (prompt: string) => void;
  isExploded: boolean;
  onToggleExplode: () => void;
  isBreathing: boolean;
  onToggleBreathe: () => void;
  loading: boolean;
  score: number;
  combo: number;
}

export const Overlay: React.FC<OverlayProps> = ({ 
  theme, 
  onThemeChange, 
  isExploded, 
  onToggleExplode,
  isBreathing,
  onToggleBreathe,
  loading,
  score,
  combo
}) => {
  const [prompt, setPrompt] = useState('');
  const [isOpen, setIsOpen] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onThemeChange(prompt);
      setPrompt('');
    }
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between p-6">
      {/* Header & Score */}
      <div className="pointer-events-auto flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 drop-shadow-lg tracking-tighter">
            BUCKY<span style={{ color: theme.colors.node }}>BOUNCE</span>
          </h1>
          <div className="mt-2 font-mono">
            <div className="text-2xl font-bold text-white tracking-widest">
              SCORE: {score.toLocaleString()}
            </div>
            {combo > 1 && (
              <div className="text-xl font-bold animate-pulse" style={{ color: theme.colors.glow }}>
                {combo}x COMBO!
              </div>
            )}
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full hover:bg-white/20 transition"
        >
          {isOpen ? 'Hide Controls' : 'Show Controls'}
        </button>
      </div>

      {/* Controls Container */}
      {isOpen && (
        <div className="pointer-events-auto w-full max-w-sm self-end bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl transition-all duration-300">
          
          {/* Action Buttons */}
          <div className="mb-6 grid grid-cols-2 gap-3">
             <button
              onClick={onToggleExplode}
              className={`py-3 rounded-xl font-bold text-lg transition-all active:scale-95 shadow-lg
                ${isExploded 
                  ? 'bg-red-500 text-white shadow-red-500/30' 
                  : 'bg-white text-black shadow-white/20 hover:bg-gray-200'
                }`}
            >
              {isExploded ? 'MAGNETIZE' : 'SHATTER'}
            </button>
            <button
              onClick={onToggleBreathe}
              disabled={isExploded}
              className={`py-3 rounded-xl font-bold text-lg transition-all active:scale-95 shadow-lg
                ${isBreathing && !isExploded
                  ? 'bg-blue-500 text-white shadow-blue-500/30' 
                  : 'bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed'
                }`}
            >
              BREATHE
            </button>
            
            <div className="col-span-2 flex flex-col justify-center items-center text-xs text-gray-400 bg-white/5 rounded-xl p-2">
               <div className="w-full flex justify-between">
                 <span>G: {theme.physics.gravity[1]}</span>
                 <span>B: {theme.physics.bounciness}</span>
               </div>
               <div className="w-full mt-1 h-1 bg-white/10 rounded overflow-hidden">
                 <div className="h-full bg-white transition-all duration-500" style={{ width: `${Math.min(combo * 5, 100)}%` }} />
               </div>
            </div>
          </div>

          {/* AI Theme Generator */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              AI Theme Generator
            </label>
            <form onSubmit={handleSubmit} className="relative">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. 'Cyberpunk', 'Gold Rush', 'Ice'"
                className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all"
                disabled={loading}
              />
              <button 
                type="submit" 
                disabled={loading || !prompt}
                className="absolute right-2 top-2 bottom-2 aspect-square bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-lg flex items-center justify-center transition-colors"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
              </button>
            </form>
            <div className="flex justify-between items-center text-xs">
               <span className="text-gray-500">Current: <span className="text-white">{theme.name}</span></span>
            </div>
          </div>
        </div>
      )}
      
      {/* Instructions Overlay */}
      <div className="absolute bottom-6 left-6 text-white/50 text-sm pointer-events-none">
        <p className="font-bold mb-1">CONTROLS</p>
        <p>• <span className="text-white">Click</span> atoms to hit them</p>
        <p>• <span className="text-white">Hold Click</span> to attract atoms (Gravity Gun)</p>
        <p>• <span className="text-white">Shatter</span> to break, <span className="text-white">Magnetize</span> to reform</p>
        <p>• <span className="text-white">Breathe</span> to pulse structure (Hoberman style)</p>
      </div>
    </div>
  );
};
