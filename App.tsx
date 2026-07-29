import React, { useState, useCallback, useRef } from 'react';
import { BuckyballScene } from './components/BuckyballScene';
import { Overlay } from './components/Overlay';
import { Theme, DEFAULT_THEME } from './types';
import { generateTheme } from './services/geminiService';

const App = () => {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [isExploded, setIsExploded] = useState(false);
  const [isBreathing, setIsBreathing] = useState(true); // Default to breathing
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const comboTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleThemeChange = async (prompt: string) => {
    setLoading(true);
    try {
      const newTheme = await generateTheme(prompt);
      setTheme(newTheme);
      setIsExploded(false);
    } catch (error) {
      console.error("Failed to generate theme", error);
    } finally {
      setLoading(false);
    }
  };

  const incrementScore = useCallback((points: number) => {
    setScore(s => s + points);
    setCombo(c => c + 1);
    if (comboTimeoutRef.current) {
      clearTimeout(comboTimeoutRef.current);
    }
    comboTimeoutRef.current = setTimeout(() => setCombo(0), 2000);
  }, []);

  return (
    <div className="relative w-full h-full bg-black select-none">
      <BuckyballScene 
        theme={theme} 
        isExploded={isExploded} 
        isBreathing={isBreathing}
        onScore={incrementScore}
      />
      <Overlay 
        theme={theme} 
        onThemeChange={handleThemeChange} 
        isExploded={isExploded}
        onToggleExplode={() => setIsExploded(!isExploded)}
        isBreathing={isBreathing}
        onToggleBreathe={() => setIsBreathing(!isBreathing)}
        loading={loading}
        score={score}
        combo={combo}
      />
    </div>
  );
};

export default App;
