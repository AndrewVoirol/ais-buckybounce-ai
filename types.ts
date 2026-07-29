export interface Theme {
  name: string;
  colors: {
    node: string;
    link: string;
    background: string;
    glow: string;
  };
  physics: {
    gravity: [number, number, number];
    bounciness: number; // Restitution
    linkStiffness: number;
    blastForce: number;
  };
}

export interface BuckyballData {
  nodes: [number, number, number][]; // Positions
  links: [number, number][]; // Indices of connected nodes
}

export const DEFAULT_THEME: Theme = {
  name: "Neon Nights",
  colors: {
    node: "#00ffff",
    link: "#ff00ff",
    background: "#050510",
    glow: "#00ffff",
  },
  physics: {
    gravity: [0, -2, 0],
    bounciness: 0.8,
    linkStiffness: 1000,
    blastForce: 15,
  },
};
