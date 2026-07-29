import { BuckyballData } from "./types";
import * as THREE from 'three';

// Generate a Truncated Icosahedron (C60 structure)
export const generateBuckyballGeometry = (radius: number = 2): BuckyballData => {
  // Golden ratio
  const phi = (1 + Math.sqrt(5)) / 2;

  // 1. Generate Icosahedron vertices (12 vertices)
  const icosahedronVertices: THREE.Vector3[] = [];
  
  // (0, ±1, ±phi)
  icosahedronVertices.push(new THREE.Vector3(0, 1, phi));
  icosahedronVertices.push(new THREE.Vector3(0, 1, -phi));
  icosahedronVertices.push(new THREE.Vector3(0, -1, phi));
  icosahedronVertices.push(new THREE.Vector3(0, -1, -phi));
  
  // (±1, ±phi, 0)
  icosahedronVertices.push(new THREE.Vector3(1, phi, 0));
  icosahedronVertices.push(new THREE.Vector3(1, -phi, 0));
  icosahedronVertices.push(new THREE.Vector3(-1, phi, 0));
  icosahedronVertices.push(new THREE.Vector3(-1, -phi, 0));
  
  // (±phi, 0, ±1)
  icosahedronVertices.push(new THREE.Vector3(phi, 0, 1));
  icosahedronVertices.push(new THREE.Vector3(phi, 0, -1));
  icosahedronVertices.push(new THREE.Vector3(-phi, 0, 1));
  icosahedronVertices.push(new THREE.Vector3(-phi, 0, -1));

  // Normalize to sphere surface
  icosahedronVertices.forEach(v => v.normalize().multiplyScalar(radius));

  // Neighbors logic for wiring
  const neighbors: number[][] = Array(12).fill(0).map(() => []);
  for (let i = 0; i < 12; i++) {
    const dists = icosahedronVertices.map((v, idx) => ({ idx, d: v.distanceTo(icosahedronVertices[i]) }));
    dists.sort((a, b) => a.d - b.d);
    // The 5 closest non-zero distance vertices are neighbors
    for (let k = 1; k <= 5; k++) {
      neighbors[i].push(dists[k].idx);
    }
  }

  // Unique edges
  const edges: [number, number][] = [];
  const edgeSet = new Set<string>();
  
  neighbors.forEach((nbrs, i) => {
    nbrs.forEach(j => {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push([i, j]);
      }
    });
  });

  // 3. Create C60 vertices
  const c60Vertices: THREE.Vector3[] = [];
  edges.forEach((edge) => {
    const [i, j] = edge;
    const v1 = icosahedronVertices[i];
    const v2 = icosahedronVertices[j];

    // Point A: 1/3 from v1 to v2
    const p1 = new THREE.Vector3().lerpVectors(v1, v2, 1/3).normalize().multiplyScalar(radius);
    // Point B: 2/3 from v1 to v2
    const p2 = new THREE.Vector3().lerpVectors(v1, v2, 2/3).normalize().multiplyScalar(radius);

    c60Vertices.push(p1);
    c60Vertices.push(p2);
  });
  
  const nodes: [number, number, number][] = c60Vertices.map(v => [v.x, v.y, v.z]);
  const links: [number, number][] = [];
  
  // Naive distance based connection
  for (let i = 0; i < nodes.length; i++) {
    const v1 = new THREE.Vector3(...nodes[i]);
    const candidates = [];
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      const v2 = new THREE.Vector3(...nodes[j]);
      candidates.push({ id: j, dist: v1.distanceTo(v2) });
    }
    candidates.sort((a, b) => a.dist - b.dist);
    // Take top 3
    for (let k = 0; k < 3; k++) {
      const neighbor = candidates[k].id;
      if (i < neighbor) {
        links.push([i, neighbor]);
      }
    }
  }

  return { nodes, links };
};

// Shared AudioContext (lazy initialization)
let sharedAudioCtx: AudioContext | null = null;
let lastPopTime = 0;
const POP_COOLDOWN_MS = 50;
const MAX_CONCURRENT_SOUNDS = 5;
let activeSoundCount = 0;

const getAudioContext = (): AudioContext | null => {
  try {
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return null;
      sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
};

// Audio Synth for "Clack" / "Pop"
export const playPopSound = (intensity: number = 1) => {
  const now = performance.now();
  if (now - lastPopTime < POP_COOLDOWN_MS) return;
  if (activeSoundCount >= MAX_CONCURRENT_SOUNDS) return;
  lastPopTime = now;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    activeSoundCount++;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // FM Synthesis for metallic timbre
    const modulator = ctx.createOscillator();
    const modGain = ctx.createGain();

    const baseFreq = 800 + Math.random() * 400; // Higher pitch for "bearing" sound

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, ctx.currentTime + 0.1);
    
    modulator.type = 'square';
    modulator.frequency.setValueAtTime(baseFreq * 2.5, ctx.currentTime);
    modulator.connect(modGain);
    
    modGain.gain.setValueAtTime(500 * intensity, ctx.currentTime);
    modGain.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 0.05);
    modGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0.4 * Math.min(intensity, 1), ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08); // Very short decay
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    modulator.start();
    osc.stop(ctx.currentTime + 0.1);
    modulator.stop(ctx.currentTime + 0.1);
    
    osc.onended = () => { activeSoundCount--; };
  } catch (e) {
    activeSoundCount--;
  }
};

// Audio Synth for "Shatter" / Glassy explosion
export const playShatterSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    for (let i = 0; i < 8; i++) {
      const delay = i * 0.015 + Math.random() * 0.02;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      const pitch = 1200 + Math.random() * 1600 - i * 100;
      osc.type = i % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(pitch, now + delay);
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.2, now + delay + 0.15);
      
      gain.gain.setValueAtTime(0.3 / (i + 1), now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.15);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + delay);
      osc.stop(now + delay + 0.16);
    }
  } catch (e) {
    // Ignore audio errors
  }
};