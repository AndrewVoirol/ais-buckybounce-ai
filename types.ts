export type StructureType = 'c60' | 'c70' | 'nanotube' | 'graphene' | 'geodesic' | 'tensegrity';

export type GameMode = 'arcade' | 'stress_lab' | 'puzzle' | 'sandbox';

export interface RingData {
  id: number;
  type: 'pentagon' | 'hexagon' | 'triangle';
  nodeIndices: number[];
  center: [number, number, number];
  normal: [number, number, number];
  radius: number;
  points: number;
}

export interface EducationalInfo {
  title: string;
  category: string;
  description: string;
  highlights: string[];
  funFact: string;
  formulaTeX?: string;
}

export interface StructureData {
  id: StructureType;
  name: string;
  formula: string;
  nodes: [number, number, number][]; // 3D coordinates
  links: [number, number][]; // Connected node index pairs
  fixedNodes?: number[]; // Pinned nodes (e.g. ground anchors)
  strutTypes?: ('strut' | 'cable')[]; // For tensegrity
  rings: RingData[];
  euler: {
    v: number;
    e: number;
    f: number;
    chi: number; // V - E + F
    pentagons: number;
    hexagons: number;
    triangles: number;
  };
  educationalInfo: EducationalInfo;
}

export interface Theme {
  name: string;
  colors: {
    node: string;
    link: string;
    background: string;
    glow: string;
    pentagon: string;
    hexagon: string;
    particle: string;
  };
  physics: {
    gravity: [number, number, number];
    bounciness: number; // Restitution (0-1)
    linkStiffness: number; // Hooke's constant (100-3000)
    blastForce: number;
    damping: number; // Viscous damping
    yieldStrength: number; // Breaking strain threshold (e.g. 1.8)
    temperature: number; // Kelvin (0 - 1000 K)
    resonanceFreq: number; // Hz (0.5 - 20 Hz)
  };
  lore?: string;
}

export interface TelemetryData {
  kineticEnergy: number; // Joules (scaled)
  strainEnergy: number; // Joules (scaled)
  totalEnergy: number;
  averageStress: number; // 0 (relaxed) to 2+ (critical)
  maxStress: number;
  structuralHealth: number; // 100% to 0%
  brokenBondsCount: number;
  activeFrequency: number;
  resonanceAmplitude: number;
}

export interface Projectile {
  id: number;
  position: [number, number, number];
  velocity: [number, number, number];
  radius: number;
  color: string;
  life: number;
  bounces: number;
  ringsPassed: number[];
}

export interface PuzzleLevel {
  id: string;
  title: string;
  structure: StructureType;
  description: string;
  instruction: string;
  targetMetric: 'resonance' | 'deflect' | 'repair' | 'stabilize' | 'combo';
  targetValue: number;
  currentValue: number;
  initialPhysics?: Partial<Theme['physics']>;
  completed: boolean;
}

export const DEFAULT_THEME: Theme = {
  name: "Quantum Neon",
  colors: {
    node: "#00ffff",
    link: "#a855f7",
    background: "#050814",
    glow: "#00f5ff",
    pentagon: "#ff007f",
    hexagon: "#00e5ff",
    particle: "#00ffff",
  },
  physics: {
    gravity: [0, -2, 0],
    bounciness: 0.8,
    linkStiffness: 1200,
    blastForce: 20,
    damping: 0.4,
    yieldStrength: 2.2,
    temperature: 50,
    resonanceFreq: 4.5,
  },
  lore: "Standard carbon allotrope testbed under superconducting neon quantum excitation."
};

export const PRESET_THEMES: Record<string, Theme> = {
  "Quantum Neon": DEFAULT_THEME,
  "Solar Plasma": {
    name: "Solar Plasma",
    colors: {
      node: "#ffaa00",
      link: "#ff3300",
      background: "#150503",
      glow: "#ffdd00",
      pentagon: "#ff0055",
      hexagon: "#ff8800",
      particle: "#ffcc00",
    },
    physics: {
      gravity: [0, -4, 0],
      bounciness: 0.9,
      linkStiffness: 900,
      blastForce: 35,
      damping: 0.25,
      yieldStrength: 1.8,
      temperature: 600,
      resonanceFreq: 6.0,
    },
    lore: "Superheated corona plasma fullerene experiencing high Brownian velocity distribution."
  },
  "Cyber Void": {
    name: "Cyber Void",
    colors: {
      node: "#00ff66",
      link: "#0088ff",
      background: "#020908",
      glow: "#00ffcc",
      pentagon: "#ff00aa",
      hexagon: "#00ff66",
      particle: "#00ffaa",
    },
    physics: {
      gravity: [0, -0.5, 0],
      bounciness: 0.85,
      linkStiffness: 1500,
      blastForce: 18,
      damping: 0.35,
      yieldStrength: 2.5,
      temperature: 20,
      resonanceFreq: 3.2,
    },
    lore: "Zero-G cryogenic carbon lattice stabilized for optical space communication arrays."
  },
  "Obsidian Core": {
    name: "Obsidian Core",
    colors: {
      node: "#ffffff",
      link: "#4b5563",
      background: "#0a0a0f",
      glow: "#9ca3af",
      pentagon: "#ef4444",
      hexagon: "#3b82f6",
      particle: "#e5e7eb",
    },
    physics: {
      gravity: [0, -9.8, 0],
      bounciness: 0.65,
      linkStiffness: 2200,
      blastForce: 25,
      damping: 0.6,
      yieldStrength: 3.0,
      temperature: 100,
      resonanceFreq: 8.5,
    },
    lore: "High-density Earth-gravity carbon matrix with ultra-rigid covalent sp² bonding."
  }
};
