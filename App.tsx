import React, { useState, useCallback, useRef, useEffect } from 'react';
import { BuckyballScene } from './components/BuckyballScene';
import { Overlay } from './components/Overlay';
import { CodexModal } from './components/CodexModal';
import { AIArchitectModal } from './components/AIArchitectModal';
import { PuzzleModal, PUZZLE_LEVELS } from './components/PuzzleModal';
import { StructureType, StructureData, Theme, DEFAULT_THEME, TelemetryData, GameMode, PuzzleLevel } from './types';
import { STRUCTURE_BUILDERS } from './geometry/structures';

const App: React.FC = () => {
  // Structure & Theme State
  const [structureType, setStructureType] = useState<StructureType>('c60');
  const [structureData, setStructureData] = useState<StructureData>(() => STRUCTURE_BUILDERS['c60']());
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [mode, setMode] = useState<GameMode>('arcade');

  // Physics Simulation Controls
  const [isExploded, setIsExploded] = useState(false);
  const [isBreathing, setIsBreathing] = useState(false);
  const [isStressHeatmap, setIsStressHeatmap] = useState(false);
  const [allowBondBreak, setAllowBondBreak] = useState(false);
  const [harmonicExcitation, setHarmonicExcitation] = useState(false);
  const [thermalAgitation, setThermalAgitation] = useState(false);
  const [temperature, setTemperature] = useState(theme.physics.temperature);
  const [resonanceFrequency, setResonanceFrequency] = useState(theme.physics.resonanceFreq);
  const [gravityY, setGravityY] = useState(theme.physics.gravity[1]);
  const [stiffness, setStiffness] = useState(theme.physics.linkStiffness);
  const [bounciness, setBounciness] = useState(theme.physics.bounciness);

  // Score & Gameplay State
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [launchTrigger, setLaunchTrigger] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('buckybounce_highscore') || '0', 10);
    } catch {
      return 0;
    }
  });

  const comboTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Telemetry
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    kineticEnergy: 0,
    strainEnergy: 0,
    totalEnergy: 0,
    averageStress: 0,
    maxStress: 0,
    structuralHealth: 100,
    brokenBondsCount: 0,
    activeFrequency: 0,
    resonanceAmplitude: 0
  });

  // Modals
  const [isCodexOpen, setIsCodexOpen] = useState(false);
  const [isAIArchitectOpen, setIsAIArchitectOpen] = useState(false);
  const [isPuzzlesOpen, setIsPuzzlesOpen] = useState(false);
  const [activePuzzle, setActivePuzzle] = useState<PuzzleLevel | null>(null);
  const [completedPuzzles, setCompletedPuzzles] = useState<Set<string>>(new Set());

  // Handle Structure Switch
  const handleSelectStructure = useCallback((type: StructureType) => {
    setStructureType(type);
    const builder = STRUCTURE_BUILDERS[type];
    if (builder) {
      setStructureData(builder());
    }
    setIsExploded(false);
  }, []);

  // Handle Scoring & Combos
  const handleScore = useCallback((pts: number, isPentagon: boolean = false) => {
    setCombo(c => {
      const nextCombo = c + 1;
      const multiplier = isPentagon ? nextCombo * 1.5 : nextCombo;
      const gained = Math.round(pts * multiplier);

      setScore(s => {
        const newScore = s + gained;
        if (newScore > highScore) {
          setHighScore(newScore);
          try {
            localStorage.setItem('buckybounce_highscore', newScore.toString());
          } catch {
            // Ignore storage error
          }
        }
        return newScore;
      });

      if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
      comboTimeoutRef.current = setTimeout(() => setCombo(0), 3000);

      // Check active puzzle milestones
      if (activePuzzle && activePuzzle.targetMetric === 'combo' && nextCombo >= activePuzzle.targetValue) {
        setCompletedPuzzles(prev => new Set(prev).add(activePuzzle.id));
      }

      return nextCombo;
    });
  }, [highScore, activePuzzle]);

  // Handle Mode Switch
  const handleSelectMode = useCallback((newMode: GameMode) => {
    setMode(newMode);
    if (newMode === 'stress_lab') {
      setIsStressHeatmap(true);
      setHarmonicExcitation(true);
    } else if (newMode === 'arcade') {
      setIsStressHeatmap(false);
      setHarmonicExcitation(false);
    }
  }, []);

  // Handle Apply Generated/Preset Theme
  const handleApplyTheme = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    setGravityY(newTheme.physics.gravity[1]);
    setStiffness(newTheme.physics.linkStiffness);
    setBounciness(newTheme.physics.bounciness);
    setTemperature(newTheme.physics.temperature);
    setResonanceFrequency(newTheme.physics.resonanceFreq);
    setIsExploded(false);
  }, []);

  // Handle Puzzle Selection
  const handleSelectPuzzle = useCallback((puzzle: PuzzleLevel) => {
    setActivePuzzle(puzzle);
    handleSelectStructure(puzzle.structure);
    if (puzzle.initialPhysics) {
      if (puzzle.initialPhysics.gravity) setGravityY(puzzle.initialPhysics.gravity[1]);
      if (puzzle.initialPhysics.linkStiffness) setStiffness(puzzle.initialPhysics.linkStiffness);
      if (puzzle.initialPhysics.bounciness) setBounciness(puzzle.initialPhysics.bounciness);
    }
  }, [handleSelectStructure]);

  // Dynamic Theme object with user slider overrides
  const liveTheme: Theme = {
    ...theme,
    physics: {
      ...theme.physics,
      gravity: [0, gravityY, 0],
      linkStiffness: stiffness,
      bounciness: bounciness,
      temperature: temperature,
      resonanceFreq: resonanceFrequency
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsExploded(prev => !prev);
      } else if (e.key === 'b' || e.key === 'B') {
        setIsBreathing(prev => !prev);
      } else if (e.key === 'h' || e.key === 'H') {
        setIsStressHeatmap(prev => !prev);
      } else if (e.key === '1') {
        handleSelectStructure('c60');
      } else if (e.key === '2') {
        handleSelectStructure('c70');
      } else if (e.key === '3') {
        handleSelectStructure('nanotube');
      } else if (e.key === '4') {
        handleSelectStructure('graphene');
      } else if (e.key === '5') {
        handleSelectStructure('geodesic');
      } else if (e.key === '6') {
        handleSelectStructure('tensegrity');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSelectStructure]);

  return (
    <div className="relative w-full h-full bg-[#050814] select-none overflow-hidden">
      {/* 3D WebGL Canvas */}
      <BuckyballScene
        structure={structureData}
        theme={liveTheme}
        mode={mode}
        isExploded={isExploded}
        isBreathing={isBreathing}
        isStressHeatmap={isStressHeatmap}
        allowBondBreak={allowBondBreak}
        harmonicExcitation={harmonicExcitation}
        thermalAgitation={thermalAgitation}
        temperature={temperature}
        resonanceFrequency={resonanceFrequency}
        launchTrigger={launchTrigger}
        onScore={handleScore}
        onTelemetryUpdate={setTelemetry}
      />

      {/* User Interface HUD & Controls */}
      <Overlay
        structure={structureData}
        onSelectStructure={handleSelectStructure}
        theme={liveTheme}
        mode={mode}
        onSelectMode={handleSelectMode}
        isExploded={isExploded}
        onToggleExplode={() => setIsExploded(e => !e)}
        isBreathing={isBreathing}
        onToggleBreathe={() => setIsBreathing(b => !b)}
        isStressHeatmap={isStressHeatmap}
        onToggleStressHeatmap={() => setIsStressHeatmap(s => !s)}
        allowBondBreak={allowBondBreak}
        onToggleBondBreak={() => setAllowBondBreak(b => !b)}
        harmonicExcitation={harmonicExcitation}
        onToggleHarmonicExcitation={() => setHarmonicExcitation(h => !h)}
        thermalAgitation={thermalAgitation}
        onToggleThermalAgitation={() => setThermalAgitation(t => !t)}
        temperature={temperature}
        onTemperatureChange={setTemperature}
        resonanceFrequency={resonanceFrequency}
        onResonanceFrequencyChange={setResonanceFrequency}
        gravityY={gravityY}
        onGravityChange={setGravityY}
        stiffness={stiffness}
        onStiffnessChange={setStiffness}
        bounciness={bounciness}
        onBouncinessChange={setBounciness}
        score={score}
        combo={combo}
        highScore={highScore}
        telemetry={telemetry}
        activePuzzle={activePuzzle}
        onLaunchProbe={() => setLaunchTrigger(t => t + 1)}
        onOpenCodex={() => setIsCodexOpen(true)}
        onOpenAIArchitect={() => setIsAIArchitectOpen(true)}
        onOpenPuzzles={() => setIsPuzzlesOpen(true)}
      />

      {/* Interactive Educational Codex Modal */}
      <CodexModal
        isOpen={isCodexOpen}
        onClose={() => setIsCodexOpen(false)}
        currentStructure={structureData}
      />

      {/* AI Material Architect Modal */}
      <AIArchitectModal
        isOpen={isAIArchitectOpen}
        onClose={() => setIsAIArchitectOpen(false)}
        currentTheme={liveTheme}
        onApplyTheme={handleApplyTheme}
      />

      {/* Challenges & Puzzles Modal */}
      <PuzzleModal
        isOpen={isPuzzlesOpen}
        onClose={() => setIsPuzzlesOpen(false)}
        activePuzzle={activePuzzle}
        onSelectPuzzle={handleSelectPuzzle}
        completedPuzzles={completedPuzzles}
      />
    </div>
  );
};

export default App;
