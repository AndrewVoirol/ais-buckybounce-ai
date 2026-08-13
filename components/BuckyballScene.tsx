import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Environment, Float, Line } from '@react-three/drei';
import * as THREE from 'three';
import { StructureData, Theme, TelemetryData, GameMode, RingData } from '../types';
import { 
  playPopSound, 
  playShatterSound, 
  playReassembleSound, 
  playRingScoreSound, 
  playSlingshotRelease, 
  playStressGroan, 
  playLaserRepairSound 
} from '../utils';
import { Particles, ParticleHandle } from './Effects';

interface BuckyballSceneProps {
  structure: StructureData;
  theme: Theme;
  mode: GameMode;
  isExploded: boolean;
  isBreathing: boolean;
  isStressHeatmap: boolean;
  allowBondBreak: boolean;
  harmonicExcitation: boolean;
  thermalAgitation: boolean;
  temperature: number;
  resonanceFrequency: number;
  launchTrigger?: number;
  onScore: (pts: number, isPentagon?: boolean) => void;
  onTelemetryUpdate: (telemetry: TelemetryData) => void;
  onStructureHealthChange?: (health: number) => void;
}

interface PhysicsNode {
  pos: THREE.Vector3;
  prevPos: THREE.Vector3;
  vel: THREE.Vector3;
  force: THREE.Vector3;
  basePos: THREE.Vector3;
  isFixed: boolean;
  mass: number;
  flash: number;
}

interface PhysicsLink {
  nodeA: number;
  nodeB: number;
  restLength: number;
  isCable: boolean;
  active: boolean;
  stress: number; // 0 = relaxed, 1 = 100% strain
}

interface Projectile {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
  bounces: number;
  passedRings: Set<number>;
}

// Pre-created cylinder geometry aligned along Z axis
const strutGeometry = new THREE.CylinderGeometry(0.07, 0.07, 1, 8);
strutGeometry.rotateX(Math.PI / 2);

// Strut Cylinder Mesh for Dynamic Bonds
const VisualStrut = ({
  posA,
  posB,
  stress,
  themeColor,
  isStressHeatmap,
  isCable
}: {
  posA: THREE.Vector3;
  posB: THREE.Vector3;
  stress: number;
  themeColor: string;
  isStressHeatmap: boolean;
  isCable?: boolean;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.position.copy(posA).lerp(posB, 0.5);
    meshRef.current.lookAt(posB);
    const dist = posA.distanceTo(posB);
    meshRef.current.scale.set(isCable ? 0.6 : 1, isCable ? 0.6 : 1, dist);

    if (isStressHeatmap) {
      if (stress < 0.25) {
        color.set('#00ffff'); // Relaxed cyan
      } else if (stress < 0.65) {
        color.set('#eab308'); // Moderate strain yellow
      } else {
        color.set('#ef4444'); // High stress red
      }
      (meshRef.current.material as THREE.MeshStandardMaterial).color.copy(color);
      (meshRef.current.material as THREE.MeshStandardMaterial).emissive.copy(color);
      (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = Math.min(stress * 0.8, 1);
    } else {
      color.set(themeColor);
      (meshRef.current.material as THREE.MeshStandardMaterial).color.copy(color);
      (meshRef.current.material as THREE.MeshStandardMaterial).emissive.set(0x000000);
      (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
    }
  });

  return (
    <mesh ref={meshRef} geometry={strutGeometry}>
      <meshStandardMaterial 
        metalness={0.8} 
        roughness={0.2} 
        wireframe={isCable}
        transparent={isCable}
        opacity={isCable ? 0.7 : 1}
      />
    </mesh>
  );
};

// Atom Sphere Mesh that tracks physics node in real-time
const VisualAtom = ({
  node,
  color,
  glowColor,
  onClick
}: {
  node: PhysicsNode;
  color: string;
  glowColor: string;
  onClick: () => void;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.position.copy(node.pos);

    if (matRef.current) {
      if (node.flash > 0.1) {
        matRef.current.color.set('#ffffff');
        matRef.current.emissive.set('#ffffff');
        matRef.current.emissiveIntensity = node.flash * 1.5;
      } else if (node.isFixed) {
        matRef.current.color.set('#ffaa00');
        matRef.current.emissive.set('#ff6600');
        matRef.current.emissiveIntensity = 0.8;
      } else {
        matRef.current.color.set(color);
        matRef.current.emissive.set(glowColor);
        matRef.current.emissiveIntensity = 0.3;
      }
    }
  });

  return (
    <mesh
      ref={meshRef}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <sphereGeometry args={[node.isFixed ? 0.35 : 0.25, 24, 24]} />
      <meshStandardMaterial
        ref={matRef}
        metalness={0.85}
        roughness={0.15}
      />
    </mesh>
  );
};

// Target Ring (for Arcade and Geometry Highlighting)
const TargetRing = ({
  ring,
  color,
  active,
  hitCount,
  nodesRef
}: {
  ring: RingData;
  color: string;
  active: boolean;
  hitCount: number;
  nodesRef: React.MutableRefObject<PhysicsNode[]>;
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const ringGeo = useMemo(() => new THREE.TorusGeometry(ring.radius * 0.75, 0.04, 8, 24), [ring.radius]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const nodes = nodesRef.current;
    if (ring.nodeIndices && ring.nodeIndices.length >= 3 && nodes.length > 0) {
      const center = new THREE.Vector3();
      ring.nodeIndices.forEach(idx => {
        if (nodes[idx]) center.add(nodes[idx].pos);
      });
      center.divideScalar(ring.nodeIndices.length);
      meshRef.current.position.copy(center);

      const p0 = nodes[ring.nodeIndices[0]]?.pos;
      const p1 = nodes[ring.nodeIndices[1]]?.pos;
      const p2 = nodes[ring.nodeIndices[2]]?.pos;
      if (p0 && p1 && p2) {
        const vA = p1.clone().sub(p0);
        const vB = p2.clone().sub(p0);
        const normal = new THREE.Vector3().crossVectors(vA, vB).normalize();
        if (normal.dot(center) < 0) normal.negate();
        meshRef.current.lookAt(center.clone().add(normal));
      }
    }

    if (active) {
      const pulse = 1 + Math.sin(clock.getElapsedTime() * 6) * 0.08;
      meshRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <group ref={meshRef}>
      <mesh geometry={ringGeo}>
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={active ? 0.85 : 0.25}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
};

// Visual Projectile in flight
const VisualProjectile = ({ projectile }: { projectile: Projectile }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.position.copy(projectile.pos);
    meshRef.current.visible = projectile.life > 0;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[projectile.radius, 16, 16]} />
      <meshBasicMaterial color={projectile.color} toneMapped={false} />
    </mesh>
  );
};

// Main Simulation Container
const SimulationCanvas = ({
  structure,
  theme,
  mode,
  isExploded,
  isBreathing,
  isStressHeatmap,
  allowBondBreak,
  harmonicExcitation,
  thermalAgitation,
  temperature,
  resonanceFrequency,
  launchTrigger,
  onScore,
  onTelemetryUpdate,
  onStructureHealthChange
}: BuckyballSceneProps) => {
  const { camera, raycaster, gl } = useThree();
  const particleRef = useRef<ParticleHandle>(null);

  // Physics State
  const nodesRef = useRef<PhysicsNode[]>([]);
  const linksRef = useRef<PhysicsLink[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const nextProjId = useRef(1);

  // Interaction State
  const isDraggingSlingshot = useRef(false);
  const slingshotStart = useRef(new THREE.Vector3());
  const slingshotCurr = useRef(new THREE.Vector3());
  const [slingshotLine, setSlingshotLine] = useState<[number, number, number][] | null>(null);

  const prevExploded = useRef(isExploded);
  const breathTime = useRef(0);
  const targetScale = useRef(1);
  const currentScale = useRef(1);

  const activeRingsState = useRef<Map<number, number>>(new Map()); // ringId -> hits
  const [, setRingsTick] = useState(0);

  // Initialize Physics Graph from Structure
  useEffect(() => {
    const fixedSet = new Set(structure.fixedNodes || []);
    nodesRef.current = structure.nodes.map(([x, y, z], i) => ({
      pos: new THREE.Vector3(x, y, z),
      prevPos: new THREE.Vector3(x, y, z),
      vel: new THREE.Vector3(0, 0, 0),
      force: new THREE.Vector3(0, 0, 0),
      basePos: new THREE.Vector3(x, y, z),
      isFixed: fixedSet.has(i),
      mass: 1,
      flash: 0
    }));

    linksRef.current = structure.links.map(([a, b], i) => {
      const pA = new THREE.Vector3(...structure.nodes[a]);
      const pB = new THREE.Vector3(...structure.nodes[b]);
      const isCable = structure.strutTypes ? structure.strutTypes[i] === 'cable' : false;
      return {
        nodeA: a,
        nodeB: b,
        restLength: pA.distanceTo(pB),
        isCable,
        active: true,
        stress: 0
      };
    });

    projectilesRef.current = [];
  }, [structure]);

  // Handle Shatter / Reassemble
  useEffect(() => {
    if (isExploded && !prevExploded.current) {
      // Shatter
      nodesRef.current.forEach((n) => {
        const blast = n.pos.clone().normalize().multiplyScalar(theme.physics.blastForce * (0.8 + Math.random() * 0.4));
        n.vel.add(blast);
      });
      if (particleRef.current) {
        particleRef.current.spawnShatterExplosion(
          new THREE.Vector3(0, 0, 0),
          nodesRef.current.map(n => n.pos),
          [theme.colors.node, theme.colors.link, theme.colors.glow],
          theme.physics.blastForce
        );
      }
      playShatterSound();
    } else if (!isExploded && prevExploded.current) {
      // Magnetize Reassemble
      nodesRef.current.forEach((n) => {
        n.pos.copy(n.basePos.clone().multiplyScalar(currentScale.current));
        n.vel.set(0, 0, 0);
      });
      linksRef.current.forEach(l => { l.active = true; });
      playReassembleSound();
    }
    prevExploded.current = isExploded;
  }, [isExploded, theme]);

  // Handle Launch Trigger (from button/keyboard)
  useEffect(() => {
    if (launchTrigger && launchTrigger > 0) {
      const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
      const spawnPos = camera.position.clone().add(dir.clone().multiplyScalar(2));
      projectilesRef.current.push({
        pos: spawnPos,
        vel: dir.multiplyScalar(38),
        radius: 0.35,
        color: theme.colors.glow,
        life: 1.0,
        maxLife: 6.0,
        bounces: 0,
        passedRings: new Set()
      });
      playSlingshotRelease(2);
      if (particleRef.current) {
        particleRef.current.spawn(spawnPos, theme.colors.glow, 20, 2);
      }
    }
  }, [launchTrigger, camera, theme]);
  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    isDraggingSlingshot.current = true;
    slingshotStart.current.copy(e.point);
    slingshotCurr.current.copy(e.point);
    setSlingshotLine([[e.point.x, e.point.y, e.point.z], [e.point.x, e.point.y, e.point.z]]);
  };

  const handlePointerMove = (e: any) => {
    if (!isDraggingSlingshot.current) return;
    slingshotCurr.current.copy(e.point);
    setSlingshotLine([
      [slingshotStart.current.x, slingshotStart.current.y, slingshotStart.current.z],
      [e.point.x, e.point.y, e.point.z]
    ]);
  };

  const handlePointerUp = () => {
    if (!isDraggingSlingshot.current) return;
    isDraggingSlingshot.current = false;
    setSlingshotLine(null);

    const pullVec = new THREE.Vector3().subVectors(slingshotStart.current, slingshotCurr.current);
    const pullDist = pullVec.length();

    if (pullDist > 0.4) {
      // Launch Projectile Probe
      const dir = pullVec.clone().normalize();
      const speed = Math.min(pullDist * 14, 55);
      const spawnPos = slingshotStart.current.clone().add(dir.clone().multiplyScalar(0.5));

      projectilesRef.current.push({
        pos: spawnPos,
        vel: dir.multiplyScalar(speed),
        radius: 0.35,
        color: theme.colors.glow,
        life: 1.0,
        maxLife: 6.0,
        bounces: 0,
        passedRings: new Set()
      });

      playSlingshotRelease(Math.min(pullDist, 3));

      if (particleRef.current) {
        particleRef.current.spawn(spawnPos, theme.colors.glow, 25, 2);
      }
    }
  };

  // Click direct atom to punch / repair
  const handleNodeClick = (nodeIdx: number) => {
    const node = nodesRef.current[nodeIdx];
    if (!node) return;

    if (isExploded || linksRef.current.some(l => !l.active)) {
      // Repair bonds connected to this node
      let repaired = 0;
      linksRef.current.forEach(l => {
        if (!l.active && (l.nodeA === nodeIdx || l.nodeB === nodeIdx)) {
          l.active = true;
          repaired++;
        }
      });
      if (repaired > 0) {
        playLaserRepairSound();
        if (particleRef.current) particleRef.current.spawn(node.pos, '#00ff88', 20, 1.5);
      }
    }

    // Punch impulse
    const impulse = node.pos.clone().normalize().multiplyScalar(15);
    node.vel.add(impulse);
    node.flash = 1.0;
    playPopSound(1.5);
    onScore(100);

    if (particleRef.current) {
      particleRef.current.spawn(node.pos, [theme.colors.node, theme.colors.glow], 30, 2);
    }
  };

  // Main Physics Frame Loop
  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.033);
    const nodes = nodesRef.current;
    const links = linksRef.current;
    const projs = projectilesRef.current;

    if (nodes.length === 0) return;

    // 1. Breathing Hoberman Scale Update
    if (isBreathing && !isExploded) {
      breathTime.current += dt * 1.8;
      targetScale.current = 1 + Math.sin(breathTime.current) * 0.45;
      currentScale.current = THREE.MathUtils.lerp(currentScale.current, targetScale.current, dt * 5);
    } else {
      currentScale.current = THREE.MathUtils.lerp(currentScale.current, 1, dt * 5);
    }

    // 2. Harmonic Resonance Driver
    let resonanceForce = new THREE.Vector3();
    if (harmonicExcitation && !isExploded) {
      const omega = 2 * Math.PI * resonanceFrequency;
      const t = clock.getElapsedTime();
      resonanceForce.set(
        Math.sin(omega * t) * 8,
        Math.cos(omega * t * 0.5) * 5,
        Math.sin(omega * t * 1.2) * 6
      );
    }

    // 3. Sub-stepped Numerical Physics Solver for Extreme Stability
    const grav = new THREE.Vector3(...theme.physics.gravity);
    const kThermal = Math.sqrt(Math.max(0, temperature) / 300) * 1.5;

    let totalStrainEnergy = 0;
    let maxStressVal = 0;
    let sumStressVal = 0;
    let activeBonds = 0;
    const floorY = -6;

    const subSteps = 4;
    const subDt = dt / subSteps;
    const stiffness = Math.min(theme.physics.linkStiffness, 1600) * 0.25;
    const dampingVal = theme.physics.damping * 8;

    for (let step = 0; step < subSteps; step++) {
      // A. Reset forces & Apply Environment
      nodes.forEach((n) => {
        if (n.isFixed) {
          n.vel.set(0, 0, 0);
          return;
        }

        n.force.copy(grav).multiplyScalar(n.mass);

        if (harmonicExcitation) {
          n.force.add(resonanceForce);
        }

        if (thermalAgitation && temperature > 0) {
          n.force.add(new THREE.Vector3(
            (Math.random() - 0.5) * kThermal * 15,
            (Math.random() - 0.5) * kThermal * 15,
            (Math.random() - 0.5) * kThermal * 15
          ));
        }

        if (!isExploded) {
          const targetPos = n.basePos.clone().multiplyScalar(currentScale.current);
          const toTarget = new THREE.Vector3().subVectors(targetPos, n.pos);
          n.force.add(toTarget.multiplyScalar(22));
        }

        if (n.flash > 0 && step === 0) {
          n.flash = Math.max(0, n.flash - dt * 5);
        }
      });

      // B. Spring / Bond Constraint Forces
      links.forEach((link) => {
        if (!link.active) return;
        if (step === 0) activeBonds++;

        const nA = nodes[link.nodeA];
        const nB = nodes[link.nodeB];
        if (!nA || !nB) return;

        const deltaPos = new THREE.Vector3().subVectors(nB.pos, nA.pos);
        const currentDist = deltaPos.length();
        if (currentDist < 0.001) return;

        const targetRest = link.restLength * currentScale.current;
        const strain = currentDist - targetRest;
        const strainRatio = Math.abs(strain) / targetRest;
        link.stress = strainRatio;

        if (step === subSteps - 1) {
          if (strainRatio > maxStressVal) maxStressVal = strainRatio;
          sumStressVal += strainRatio;
          totalStrainEnergy += 0.5 * stiffness * strain * strain * 0.001;
        }

        if (allowBondBreak && strainRatio > theme.physics.yieldStrength) {
          link.active = false;
          if (particleRef.current) {
            particleRef.current.spawn(nA.pos.clone().lerp(nB.pos, 0.5), '#ef4444', 25, 2.5);
          }
          playStressGroan(2.5);
          return;
        }

        if (link.isCable && strain < 0) return;

        const dir = deltaPos.clone().normalize();
        const springForceMag = THREE.MathUtils.clamp(stiffness * strain, -350, 350);
        const relVel = new THREE.Vector3().subVectors(nB.vel, nA.vel);
        const dampForceMag = THREE.MathUtils.clamp(relVel.dot(dir) * dampingVal, -120, 120);

        const totalForce = dir.multiplyScalar(springForceMag + dampForceMag);

        if (!nA.isFixed) nA.force.add(totalForce);
        if (!nB.isFixed) nB.force.sub(totalForce);
      });

      // C. Integrate Positions & Velocity
      nodes.forEach((n) => {
        if (n.isFixed) return;

        const accel = n.force.clone().divideScalar(n.mass);
        n.vel.addScaledVector(accel, subDt);
        n.vel.multiplyScalar(0.985);
        n.vel.clampLength(0, 15);
        n.pos.addScaledVector(n.vel, subDt);

        if (n.pos.y < floorY + 0.25) {
          n.pos.y = floorY + 0.25;
          if (n.vel.y < 0) {
            n.vel.y = -n.vel.y * theme.physics.bounciness;
            if (Math.abs(n.vel.y) > 1.5 && step === 0) playPopSound(n.vel.y * 0.3);
          }
        }
      });
    }

    let totalKineticEnergy = 0;
    nodes.forEach(n => {
      totalKineticEnergy += 0.5 * n.mass * n.vel.lengthSq();
    });

    // 6. Projectiles Physics & Collision Loop
    for (let i = projs.length - 1; i >= 0; i--) {
      const p = projs[i];
      p.life -= dt / p.maxLife;

      if (p.life <= 0) {
        projs.splice(i, 1);
        continue;
      }

      p.vel.addScaledVector(grav, dt);
      p.pos.addScaledVector(p.vel, dt);

      // Floor bounce
      if (p.pos.y < floorY + p.radius) {
        p.pos.y = floorY + p.radius;
        p.vel.y = -p.vel.y * 0.75;
        p.bounces++;
      }

      // Check Collision with Nodes (Elastic Deflection)
      nodes.forEach((n) => {
        const dist = p.pos.distanceTo(n.pos);
        const minDist = p.radius + 0.25;

        if (dist < minDist && dist > 0.001) {
          const normal = new THREE.Vector3().subVectors(p.pos, n.pos).divideScalar(dist);
          p.pos.copy(n.pos).addScaledVector(normal, minDist + 0.08);

          // Elastic collision momentum transfer
          const relVel = new THREE.Vector3().subVectors(p.vel, n.vel);
          const sepVel = relVel.dot(normal);
          if (sepVel < -0.2) {
            const impulseMag = -(1 + theme.physics.bounciness) * sepVel * 0.45;
            const impulse = normal.clone().multiplyScalar(impulseMag);
            p.vel.add(impulse);
            if (!n.isFixed) {
              n.vel.sub(impulse.multiplyScalar(0.4));
              n.vel.clampLength(0, 12);
            }

            n.flash = 1.0;
            p.bounces++;
            if (p.bounces > 12) p.life = 0; // Natural probe expiration after 12 ricochets

            onScore(150 + p.bounces * 25);
            playPopSound(1.5, 1100);

            if (particleRef.current) {
              particleRef.current.spawn(p.pos, [theme.colors.glow, theme.colors.particle], 12, 1.2);
            }
          }
        }
      });

      // Check Passing Through Target Rings
      structure.rings.forEach((ring) => {
        if (p.passedRings.has(ring.id)) return;

        const ringCenter = new THREE.Vector3(...ring.center).multiplyScalar(currentScale.current);
        const ringNormal = new THREE.Vector3(...ring.normal);
        const distToPlane = Math.abs(p.pos.clone().sub(ringCenter).dot(ringNormal));
        const distToCenter = p.pos.distanceTo(ringCenter);

        if (distToPlane < 0.6 && distToCenter < ring.radius * 0.9) {
          p.passedRings.add(ring.id);
          const isPentagon = ring.type === 'pentagon';
          const points = ring.points * (1 + p.bounces);
          onScore(points, isPentagon);
          playRingScoreSound(p.passedRings.size, isPentagon);

          activeRingsState.current.set(ring.id, (activeRingsState.current.get(ring.id) || 0) + 1);
          setRingsTick(t => t + 1);

          if (particleRef.current) {
            particleRef.current.spawnRingBurst(ringCenter, ringNormal, ring.radius, isPentagon ? theme.colors.pentagon : theme.colors.hexagon);
          }
        }
      });
    }

    // 7. Telemetry & Health Callbacks
    const healthPercent = links.length > 0 ? (activeBonds / links.length) * 100 : 100;
    if (onStructureHealthChange) onStructureHealthChange(healthPercent);

    onTelemetryUpdate({
      kineticEnergy: Math.round(totalKineticEnergy * 10) / 10,
      strainEnergy: Math.round(totalStrainEnergy * 10) / 10,
      totalEnergy: Math.round((totalKineticEnergy + totalStrainEnergy) * 10) / 10,
      averageStress: activeBonds > 0 ? sumStressVal / activeBonds : 0,
      maxStress: maxStressVal,
      structuralHealth: Math.round(healthPercent),
      brokenBondsCount: links.length - activeBonds,
      activeFrequency: harmonicExcitation ? resonanceFrequency : 0,
      resonanceAmplitude: maxStressVal * 5
    });
  });

  return (
    <>
      {/* 3D Visual Mesh Hierarchy */}
      <group>
        {/* Render Atoms / Nodes */}
        {nodesRef.current.map((node, i) => (
          <VisualAtom
            key={i}
            node={node}
            color={theme.colors.node}
            glowColor={theme.colors.glow}
            onClick={() => handleNodeClick(i)}
          />
        ))}

        {/* Render Bonds / Struts */}
        {linksRef.current.map((link, i) => {
          if (!link.active) return null;
          const nA = nodesRef.current[link.nodeA];
          const nB = nodesRef.current[link.nodeB];
          if (!nA || !nB) return null;

          return (
            <VisualStrut
              key={i}
              posA={nA.pos}
              posB={nB.pos}
              stress={link.stress}
              themeColor={theme.colors.link}
              isStressHeatmap={isStressHeatmap}
              isCable={link.isCable}
            />
          );
        })}

        {/* Render Holographic Target Rings */}
        {structure.rings.map((ring) => (
          <TargetRing
            key={ring.id}
            ring={ring}
            color={ring.type === 'pentagon' ? theme.colors.pentagon : (ring.type === 'triangle' ? '#ffd700' : theme.colors.hexagon)}
            active={mode === 'arcade'}
            hitCount={activeRingsState.current.get(ring.id) || 0}
            nodesRef={nodesRef}
          />
        ))}

        {/* Render Active Projectiles */}
        {projectilesRef.current.map((p, i) => (
          <VisualProjectile key={i} projectile={p} />
        ))}

        {/* Slingshot Trajectory Preview Line */}
        {slingshotLine && (
          <Line
            points={slingshotLine}
            color="#00ffff"
            lineWidth={3}
            dashed
            dashScale={2}
          />
        )}
      </group>

      {/* Invisible Plane for Slingshot & Drag interaction */}
      <mesh
        position={[0, 0, 0]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* VFX Particles */}
      <Particles ref={particleRef} />
    </>
  );
};

export const BuckyballScene: React.FC<BuckyballSceneProps> = (props) => {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 2, 14], fov: 45 }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      className="w-full h-full"
    >
      <color attach="background" args={[props.theme.colors.background]} />

      <ambientLight intensity={0.4} />
      <directionalLight position={[15, 20, 15]} intensity={1.5} castShadow />
      <pointLight position={[-12, -10, -10]} intensity={1.2} color={props.theme.colors.glow} />
      <pointLight position={[10, -5, 10]} intensity={0.8} color={props.theme.colors.pentagon} />

      <Stars radius={120} depth={60} count={3500} factor={4} saturation={0} fade speed={0.5} />
      <Environment preset="city" />

      {/* Floor Grid with Soft Reflection */}
      <mesh position={[0, -6, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial 
          color="#060914" 
          roughness={0.4} 
          metalness={0.6}
        />
      </mesh>
      <gridHelper args={[100, 50, '#1e293b', '#0f172a']} position={[0, -5.99, 0]} />

      <Float
        speed={props.isExploded ? 0 : 1.5}
        rotationIntensity={props.isExploded ? 0 : 0.25}
        floatIntensity={props.isExploded ? 0 : 0.3}
        floatingRange={[-0.3, 0.3]}
      >
        <SimulationCanvas {...props} />
      </Float>

      <OrbitControls
        makeDefault
        enablePan={false}
        maxDistance={35}
        minDistance={4}
        maxPolarAngle={Math.PI / 2 + 0.05} // Don't go below floor
      />
    </Canvas>
  );
};