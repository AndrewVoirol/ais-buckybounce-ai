import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Physics, useSphere, useSpring, usePlane } from '@react-three/cannon';
import { OrbitControls, Stars, Environment, Float } from '@react-three/drei';
import * as THREE from 'three';
import { generateBuckyballGeometry, playPopSound, playShatterSound } from '../utils';
import { Theme } from '../types';
import { Particles, ParticleHandle } from './Effects';

interface AtomProps {
  position: [number, number, number];
  color: string;
  radius?: number;
  glowColor: string;
  onPop: (velocity: number) => void;
  onScore: (points: number) => void;
  isExploded: boolean;
  blastForce: number;
  spawnParticles: (pos: THREE.Vector3, color: string | string[], count: number, speed?: number) => void;
  mouseMagnetStrength: React.MutableRefObject<number>;
  cursorPos: React.MutableRefObject<THREE.Vector3>;
  targetRadius: React.MutableRefObject<number>;
  driveStrength: number;
}

// Individual Atom Component
const Atom = React.forwardRef<THREE.Mesh, AtomProps>(({ 
  position, 
  color, 
  radius = 0.25, 
  glowColor, 
  onPop,
  onScore,
  isExploded,
  blastForce,
  spawnParticles,
  mouseMagnetStrength,
  cursorPos,
  targetRadius,
  driveStrength
}, ref) => {
  const [sphereRef, api] = useSphere(() => ({ 
    mass: 1, 
    position, 
    args: [radius],
    linearDamping: 0.5, // High damping for mechanical stability
    angularDamping: 0.5,
    material: { friction: 0.1, restitution: 0.7 },
    onCollide: (e) => {
      const v = e.contact.impactVelocity;
      if (v > 1.5) {
         onPop(v); 
         const pos = new THREE.Vector3(e.body.position.x, e.body.position.y, e.body.position.z);
         const count = Math.min(Math.floor(v * 2), 20);
         spawnParticles(pos, [color, glowColor], count);
      }
    }
  }), ref as React.RefObject<THREE.Mesh>);

  const [hovered, setHover] = useState(false);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const flashIntensity = useRef(0);

  // Handle Explosion Logic
  useEffect(() => {
    if (isExploded) {
      api.applyImpulse(
        [(Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5],
        [0, 0, 0]
      );
      api.wakeUp();
    } 
  }, [isExploded, api]);

  // Physics Loop
  useFrame((_, delta) => {
    if (!sphereRef.current) return;

    // 1. Mouse Attraction (Gravity Gun)
    if (mouseMagnetStrength.current > 0) {
      const currentPos = new THREE.Vector3();
      currentPos.copy(sphereRef.current.position);
      
      const dir = new THREE.Vector3().subVectors(cursorPos.current, currentPos);
      const dist = dir.length();
      
      if (dist > 0.5) {
        dir.normalize();
        const force = dir.multiplyScalar(mouseMagnetStrength.current * 40 * delta); 
        api.applyForce([force.x, force.y, force.z], [0, 0, 0]);
        api.wakeUp();
      }
    }

    // 2. Hoberman Radial Drive (Expansion/Contraction)
    // Only apply if not exploded and not being grabbed by magnet
    if (!isExploded && mouseMagnetStrength.current === 0 && driveStrength > 0) {
      const currentPos = new THREE.Vector3();
      currentPos.copy(sphereRef.current.position);
      const distFromCenter = currentPos.length();
      
      // Calculate force to push towards target radius
      // We assume the center of the structure is at (0,0,0) due to symmetry/float
      const dir = currentPos.clone().normalize();
      const error = targetRadius.current - distFromCenter;
      
      // Strong Proportional controller to guide the mechanical expansion
      const kP = 50 * driveStrength; 
      
      // Apply force along the radius
      const forceMag = error * kP;
      const force = dir.multiplyScalar(forceMag * delta);
      
      api.applyForce([force.x, force.y, force.z], [0, 0, 0]);
      api.wakeUp();
    }

    // 3. Flash Decay
    if (flashIntensity.current > 0) {
      flashIntensity.current = Math.max(0, flashIntensity.current - delta * 15);
    }
    
    if (materialRef.current) {
      const baseIntensity = hovered ? 0.8 : 0.2;
      materialRef.current.emissiveIntensity = baseIntensity + flashIntensity.current;
      materialRef.current.color.set(hovered ? '#ffffff' : color);
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    const impulse = new THREE.Vector3().copy(e.ray.direction).multiplyScalar(15);
    api.applyImpulse([impulse.x, impulse.y, impulse.z], [0, 0, 0]);
    api.wakeUp();
    
    onPop(20);
    onScore(200);
    flashIntensity.current = 5;
    
    if (sphereRef.current) {
      spawnParticles(sphereRef.current.position, [color, glowColor], 40, 2.0);
    }
  };

  return (
    <mesh 
      ref={sphereRef} 
      onClick={handleClick}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
      castShadow receiveShadow
    >
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial 
        ref={materialRef}
        color={color} 
        emissive={glowColor}
        emissiveIntensity={0.2}
        metalness={0.9}
        roughness={0.1}
        envMapIntensity={1}
      />
    </mesh>
  );
});
Atom.displayName = 'Atom';

// Visual Link (Struts)
const VisualLink = ({ nodeA, nodeB, color }: { nodeA: React.RefObject<THREE.Mesh | null>, nodeB: React.RefObject<THREE.Mesh | null>, color: string }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.08, 0.08, 1, 6);
    geo.rotateX(Math.PI / 2);
    return geo;
  }, []);
  
  useFrame(() => {
    if (nodeA.current && nodeB.current && meshRef.current) {
      const start = nodeA.current.position;
      const end = nodeB.current.position;
      
      // Position at midpoint
      meshRef.current.position.copy(start).lerp(end, 0.5);
      // Look at endpoint
      meshRef.current.lookAt(end);
      // Scale length to match distance
      const dist = start.distanceTo(end);
      meshRef.current.scale.set(1, 1, dist);
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
    </mesh>
  );
}

interface BondProps {
  nodeA: React.RefObject<THREE.Object3D | null>;
  nodeB: React.RefObject<THREE.Object3D | null>;
  stiffness: number;
  baseRestLength: number;
  currentScale: number;
}

// Spring Bond (Flexible Constraints)
const Bond: React.FC<BondProps> = ({ nodeA, nodeB, stiffness, baseRestLength, currentScale }) => {
  // We update the rest length based on the expansion scale
  // This allows the bonds to grow with the Hoberman sphere
  const targetRestLength = baseRestLength * currentScale;

  useSpring(nodeA as React.RefObject<THREE.Object3D>, nodeB as React.RefObject<THREE.Object3D>, {
    restLength: targetRestLength,
    stiffness: stiffness,
    damping: stiffness * 0.05, 
  }, [targetRestLength, stiffness]); // Re-configure spring when target length changes

  return null;
};

const Floor = ({ bounce }: { bounce: number }) => {
  const [ref] = usePlane(() => ({ 
    position: [0, -8, 0], 
    rotation: [-Math.PI / 2, 0, 0],
    material: { restitution: bounce * 0.8, friction: 0.5 } 
  }));
  return (
    <mesh ref={ref as any} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <shadowMaterial opacity={0.3} color="black" />
    </mesh>
  );
};

const MagnetControl = ({ 
  mouseMagnetStrength, 
  cursorPos 
}: { 
  mouseMagnetStrength: React.MutableRefObject<number>; 
  cursorPos: React.MutableRefObject<THREE.Vector3>;
}) => {
  return (
    <mesh
      visible={false}
      onPointerMove={(e) => cursorPos.current.copy(e.point)}
      onPointerDown={() => { mouseMagnetStrength.current = 1; }}
      onPointerUp={() => { mouseMagnetStrength.current = 0; }}
    >
      <planeGeometry args={[100, 100]} />
    </mesh>
  );
};

const BuckyballModel = ({ 
  theme, 
  isExploded,
  isBreathing,
  spawnParticles,
  spawnShatterExplosion,
  onScore,
  mouseMagnetStrength,
  cursorPos
}: { 
  theme: Theme; 
  isExploded: boolean;
  isBreathing: boolean;
  spawnParticles: (pos: THREE.Vector3, color: string | string[], count: number, speed?: number) => void;
  spawnShatterExplosion: (center: THREE.Vector3, nodes: THREE.Vector3[], palette: string[], blastForce?: number) => void;
  onScore: (pts: number) => void;
  mouseMagnetStrength: React.MutableRefObject<number>;
  cursorPos: React.MutableRefObject<THREE.Vector3>;
}) => {
  const baseRadius = 3;
  const { nodes, links } = useMemo(() => generateBuckyballGeometry(baseRadius), []);
  const atomRefs = useMemo(() => Array(nodes.length).fill(0).map(() => React.createRef<THREE.Mesh>()), [nodes.length]);

  const themePalette = useMemo(() => [
    theme.colors.node,
    theme.colors.link,
    theme.colors.glow,
  ], [theme.colors.node, theme.colors.link, theme.colors.glow]);

  const prevExploded = useRef(isExploded);

  useEffect(() => {
    if (isExploded && !prevExploded.current) {
      const nodeVecs = nodes.map(n => new THREE.Vector3(...n));
      spawnShatterExplosion(new THREE.Vector3(0, 0, 0), nodeVecs, themePalette, theme.physics.blastForce);
      playShatterSound();
    }
    prevExploded.current = isExploded;
  }, [isExploded, nodes, themePalette, theme.physics.blastForce, spawnShatterExplosion]);

  // Calculate initial bond length (approximate)
  const initialBondLength = useMemo(() => {
    if (nodes.length > 1 && links.length > 0) {
      const p1 = new THREE.Vector3(...nodes[links[0][0]]);
      const p2 = new THREE.Vector3(...nodes[links[0][1]]);
      return p1.distanceTo(p2);
    }
    return 1.4;
  }, [nodes, links]);

  // Breathing Animation State
  const targetRadiusRef = useRef(baseRadius);
  const currentScaleRef = useRef(1);
  const [currentScale, setCurrentScale] = useState(1);
  const timeRef = useRef(0);
  const frameCountRef = useRef(0);

  useFrame((_, delta) => {
    if (isBreathing && !isExploded) {
      timeRef.current += delta * 1.5; // Moderate breathing speed
      
      // Oscillate radius between 2.5 (contracted) and 5.0 (expanded)
      // Use sine wave for smooth mechanical motion
      const minR = 2.5;
      const maxR = 5.0;
      const range = maxR - minR;
      const normalizedSine = (Math.sin(timeRef.current) + 1) / 2; // 0 to 1
      
      const r = minR + normalizedSine * range;
      targetRadiusRef.current = r;
      currentScaleRef.current = r / baseRadius;
      
      // Throttle React state updates for Bond spring reconfiguration (~10fps)
      frameCountRef.current++;
      if (frameCountRef.current % 6 === 0) {
        setCurrentScale(r / baseRadius);
      }
    } else {
      // Return to default size smoothly if breathing stops
      const currentTarget = targetRadiusRef.current;
      if (Math.abs(currentTarget - baseRadius) > 0.05) {
        const newTarget = THREE.MathUtils.lerp(currentTarget, baseRadius, delta * 5);
        targetRadiusRef.current = newTarget;
        currentScaleRef.current = newTarget / baseRadius;
        
        frameCountRef.current++;
        if (frameCountRef.current % 6 === 0) {
          setCurrentScale(newTarget / baseRadius);
        }
      } else {
        targetRadiusRef.current = baseRadius;
        currentScaleRef.current = 1;
        setCurrentScale(1);
        timeRef.current = 0;
      }
    }
  });

  return (
    <group>
      {nodes.map((pos, i) => (
        <Atom 
          key={i} 
          position={pos} 
          color={theme.colors.node} 
          glowColor={theme.colors.glow}
          ref={atomRefs[i]}
          onPop={(v) => {
             playPopSound(v/10);
          }}
          onScore={onScore}
          isExploded={isExploded}
          blastForce={theme.physics.blastForce}
          spawnParticles={spawnParticles}
          mouseMagnetStrength={mouseMagnetStrength}
          cursorPos={cursorPos}
          targetRadius={targetRadiusRef}
          driveStrength={isBreathing ? 1 : 0.05} 
        />
      ))}

      {/* Render Bonds and Visual Struts */}
      {!isExploded && links.map(([a, b], i) => (
        <React.Fragment key={i}>
          {/* Physics Bond (Spring) with Dynamic Rest Length */}
          <Bond 
            nodeA={atomRefs[a]} 
            nodeB={atomRefs[b]} 
            stiffness={theme.physics.linkStiffness}
            baseRestLength={initialBondLength}
            currentScale={currentScale}
          />
          {/* Visual Strut */}
          <VisualLink 
            nodeA={atomRefs[a]}
            nodeB={atomRefs[b]}
            color={theme.colors.link}
          />
        </React.Fragment>
      ))}
    </group>
  );
};

export const BuckyballScene = ({ 
  theme, 
  isExploded, 
  isBreathing,
  onScore
}: { 
  theme: Theme; 
  isExploded: boolean; 
  isBreathing: boolean;
  onScore: (pts: number) => void;
}) => {
  const particleRef = useRef<ParticleHandle>(null);
  const mouseMagnetStrength = useRef(0);
  const cursorPos = useRef(new THREE.Vector3(0, 0, 0));

  const spawnParticles = useCallback((pos: THREE.Vector3, color: string | string[], count: number, speed: number = 1) => {
    if (particleRef.current) {
      particleRef.current.spawn(pos, color, count, speed);
    }
  }, []);

  const spawnShatterExplosion = useCallback((center: THREE.Vector3, nodes: THREE.Vector3[], palette: string[], blastForce?: number) => {
    if (particleRef.current) {
      particleRef.current.spawnShatterExplosion(center, nodes, palette, blastForce);
    }
  }, []);

  return (
    <Canvas shadows camera={{ position: [0, 0, 14], fov: 45 }} gl={{ antialias: true }}>
      <color attach="background" args={[theme.colors.background]} />
      
      <ambientLight intensity={0.4} />
      <spotLight position={[20, 20, 20]} angle={0.3} penumbra={1} intensity={2} castShadow />
      <pointLight position={[-10, -10, -10]} intensity={1} color={theme.colors.glow} />
      
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />
      <Environment preset="city" />

      <MagnetControl mouseMagnetStrength={mouseMagnetStrength} cursorPos={cursorPos} />
      <Particles ref={particleRef} />

      <Physics 
        gravity={isExploded ? [0, -2, 0] : [0, 0, 0]} 
        defaultContactMaterial={{ restitution: 0.7, friction: 0.1 }}
      >
        <Float 
           speed={isExploded ? 0 : 2} 
           rotationIntensity={isExploded ? 0 : 0.5} 
           floatIntensity={isExploded ? 0 : 0.5} 
           floatingRange={[0, 1]}
        >
           <BuckyballModel 
             theme={theme} 
             isExploded={isExploded} 
             isBreathing={isBreathing}
             spawnParticles={spawnParticles} 
             spawnShatterExplosion={spawnShatterExplosion}
             onScore={onScore}
             mouseMagnetStrength={mouseMagnetStrength}
             cursorPos={cursorPos}
            />
        </Float>
        <Floor bounce={theme.physics.bounciness} />
      </Physics>

      <OrbitControls makeDefault enablePan={false} maxDistance={30} minDistance={5} />
    </Canvas>
  );
};