import React from 'react';
import { StructureType, PuzzleLevel } from '../types';

export const PUZZLE_LEVELS: PuzzleLevel[] = [
  {
    id: 'p1',
    title: '1. The 12-Pentagon Target Run',
    structure: 'c60',
    description: 'Buckminsterfullerene C₆₀ contains exactly 12 pentagons which create its spherical 3D curvature.',
    instruction: 'Drag to aim your slingshot probe and thread 3 glowing Magenta Pentagon rings!',
    targetMetric: 'combo',
    targetValue: 3,
    currentValue: 0,
    completed: false
  },
  {
    id: 'p2',
    title: '2. Resonance Catastrophe',
    structure: 'c60',
    description: 'Every mechanical structure has natural vibrational eigenfrequencies where energy input causes extreme harmonic oscillation.',
    instruction: 'In Stress Lab, activate Harmonic Resonance and tune the frequency slider until Stress exceeds 1.5!',
    targetMetric: 'resonance',
    targetValue: 1.5,
    currentValue: 0,
    completed: false
  },
  {
    id: 'p3',
    title: '3. Nanotube Tensile Deflection',
    structure: 'nanotube',
    description: 'Carbon nanotubes possess over 100 GPa of axial tensile strength due to unrolled hexagonal sp² carbon bonds.',
    instruction: 'Switch to Carbon Nanotube, launch a probe with high power, and score at least 500 points in one ricochet!',
    targetMetric: 'deflect',
    targetValue: 500,
    currentValue: 0,
    completed: false
  },
  {
    id: 'p4',
    title: '4. Laser Bond Repair & Synthesis',
    structure: 'c70',
    description: 'Shattered or strained molecular cages can be re-bonded using focused covalent laser splicing.',
    instruction: 'Hit Shatter, then click directly on 5 disconnected atoms to laser-weld and repair the cage!',
    targetMetric: 'repair',
    targetValue: 5,
    currentValue: 0,
    completed: false
  }
];

interface PuzzleModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePuzzle: PuzzleLevel | null;
  onSelectPuzzle: (puzzle: PuzzleLevel) => void;
  completedPuzzles: Set<string>;
}

export const PuzzleModal: React.FC<PuzzleModalProps> = ({
  isOpen,
  onClose,
  activePuzzle,
  onSelectPuzzle,
  completedPuzzles
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in pointer-events-auto">
      <div className="relative w-full max-w-2xl bg-[#0d1222]/95 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden text-gray-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400 font-bold">
              🧩
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide">
                PHYSICS CHALLENGES & PUZZLES
              </h2>
              <p className="text-xs text-amber-300/80 font-mono">
                Hands-on structural mechanics milestones & scientific trials
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

        {/* Puzzle Cards */}
        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
          {PUZZLE_LEVELS.map((puzzle) => {
            const isCompleted = completedPuzzles.has(puzzle.id);
            const isCurrent = activePuzzle?.id === puzzle.id;

            return (
              <div
                key={puzzle.id}
                onClick={() => {
                  onSelectPuzzle(puzzle);
                  onClose();
                }}
                className={`p-4 rounded-xl border transition cursor-pointer ${
                  isCurrent
                    ? 'bg-amber-500/20 border-amber-400'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base">{puzzle.title}</span>
                    {isCompleted && (
                      <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs font-mono font-bold border border-green-500/30">
                        COMPLETED ✓
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono uppercase text-gray-400 bg-white/5 px-2 py-1 rounded">
                    Structure: {puzzle.structure.toUpperCase()}
                  </span>
                </div>

                <p className="text-xs text-gray-300 mt-2">
                  {puzzle.description}
                </p>

                <div className="mt-3 p-2.5 bg-black/40 rounded-lg border border-white/5 text-xs text-amber-200 flex items-center gap-2">
                  <span className="text-amber-400 font-bold">Goal:</span>
                  <span>{puzzle.instruction}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-white/10 bg-black/60 text-xs text-gray-400 font-mono">
          <span>{completedPuzzles.size} of {PUZZLE_LEVELS.length} Challenges Cleared</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-amber-500 text-black font-bold hover:bg-amber-400 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
