import React, { useRef, useMemo, useImperativeHandle, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface ParticleHandle {
  spawn: (pos: THREE.Vector3, color: string | string[], count: number, speedMult?: number) => void;
  spawnRingBurst: (center: THREE.Vector3, normal: THREE.Vector3, radius: number, color: string) => void;
  spawnShatterExplosion: (
    center: THREE.Vector3,
    nodePositions: THREE.Vector3[],
    palette: string[],
    blastForce?: number
  ) => void;
}

interface ParticleItem {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Euler;
  rotationSpeed: THREE.Vector3;
  life: number;
  maxLife: number;
  scale: number;
  aspectScale: THREE.Vector3;
  color: THREE.Color;
  drag: number;
  gravity: number;
  isGlow: boolean;
}

export const Particles = forwardRef<ParticleHandle, {}>((_, ref) => {
  const shardMeshRef = useRef<THREE.InstancedMesh>(null);
  const glowMeshRef = useRef<THREE.InstancedMesh>(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useRef<ParticleItem[]>([]);
  const maxParticles = 3000;

  const helperColor = useMemo(() => new THREE.Color(), []);

  const getRandomColor = (palette: string | string[]): THREE.Color => {
    if (Array.isArray(palette)) {
      if (palette.length === 0) return new THREE.Color('#ffffff');
      const hex = palette[Math.floor(Math.random() * palette.length)];
      helperColor.set(hex);
    } else {
      helperColor.set(palette);
    }
    return helperColor.clone().offsetHSL((Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.15);
  };

  useImperativeHandle(ref, () => ({
    spawn: (pos: THREE.Vector3, color: string | string[], count: number, speedMult: number = 1) => {
      for (let i = 0; i < count; i++) {
        if (particles.current.length >= maxParticles) break;

        const pColor = getRandomColor(color);
        const speed = (3 + Math.random() * 8) * speedMult;
        const dir = new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize();

        const isGlow = Math.random() > 0.35;

        particles.current.push({
          position: pos.clone(),
          velocity: dir.multiplyScalar(speed),
          rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
          rotationSpeed: new THREE.Vector3(
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 15
          ),
          life: 1.0,
          maxLife: 0.4 + Math.random() * 0.5,
          scale: 0.12 + Math.random() * 0.2,
          aspectScale: new THREE.Vector3(0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4),
          color: pColor,
          drag: 0.94 + Math.random() * 0.03,
          gravity: -4 - Math.random() * 4,
          isGlow
        });
      }
    },

    spawnRingBurst: (center: THREE.Vector3, normal: THREE.Vector3, radius: number, color: string) => {
      const ringParticleCount = 36;
      // Generate orthogonal basis to normal
      const vUp = Math.abs(normal.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
      const tangentX = new THREE.Vector3().crossVectors(normal, vUp).normalize();
      const tangentY = new THREE.Vector3().crossVectors(normal, tangentX).normalize();

      for (let i = 0; i < ringParticleCount; i++) {
        if (particles.current.length >= maxParticles) break;

        const theta = (i / ringParticleCount) * Math.PI * 2;
        const posOffset = new THREE.Vector3()
          .addScaledVector(tangentX, Math.cos(theta) * radius)
          .addScaledVector(tangentY, Math.sin(theta) * radius);

        const spawnPos = center.clone().add(posOffset);
        const outwardDir = posOffset.clone().normalize().addScaledVector(normal, (Math.random() - 0.5) * 0.5).normalize();

        const pColor = new THREE.Color(color).offsetHSL(0, 0, (Math.random() - 0.5) * 0.2);

        particles.current.push({
          position: spawnPos,
          velocity: outwardDir.multiplyScalar(4 + Math.random() * 6),
          rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
          rotationSpeed: new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10),
          life: 1.0,
          maxLife: 0.5 + Math.random() * 0.3,
          scale: 0.18 + Math.random() * 0.15,
          aspectScale: new THREE.Vector3(1, 1, 1),
          color: pColor,
          drag: 0.92,
          gravity: -1.5,
          isGlow: true
        });
      }
    },

    spawnShatterExplosion: (
      center: THREE.Vector3,
      nodePositions: THREE.Vector3[],
      palette: string[],
      blastForce: number = 20
    ) => {
      const forceFactor = Math.max(0.8, blastForce / 15);

      // Shards per node
      nodePositions.forEach((nodePos) => {
        const outwardDir = new THREE.Vector3().subVectors(nodePos, center).normalize();
        const shardsPerNode = 8;

        for (let i = 0; i < shardsPerNode; i++) {
          if (particles.current.length >= maxParticles) break;

          const pColor = getRandomColor(palette);
          const randomSpread = new THREE.Vector3(
            (Math.random() - 0.5) * 0.8,
            (Math.random() - 0.5) * 0.8,
            (Math.random() - 0.5) * 0.8
          );
          const velDir = outwardDir.clone().add(randomSpread).normalize();
          const speed = (5 + Math.random() * 16) * forceFactor;

          particles.current.push({
            position: nodePos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3)),
            velocity: velDir.multiplyScalar(speed),
            rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
            rotationSpeed: new THREE.Vector3((Math.random() - 0.5) * 18, (Math.random() - 0.5) * 18, (Math.random() - 0.5) * 18),
            life: 1.0,
            maxLife: 0.5 + Math.random() * 0.6,
            scale: 0.15 + Math.random() * 0.3,
            aspectScale: new THREE.Vector3(0.5 + Math.random(), 0.5 + Math.random(), 0.5 + Math.random()),
            color: pColor,
            drag: 0.95,
            gravity: -3 - Math.random() * 5,
            isGlow: Math.random() > 0.4
          });
        }
      });

      // Shockwave Ring
      const shockwaveCount = 80;
      for (let i = 0; i < shockwaveCount; i++) {
        if (particles.current.length >= maxParticles) break;
        const angle = (i / shockwaveCount) * Math.PI * 2;
        const dir = new THREE.Vector3(Math.cos(angle), (Math.random() - 0.5) * 0.4, Math.sin(angle)).normalize();
        const speed = (12 + Math.random() * 18) * forceFactor;

        particles.current.push({
          position: center.clone(),
          velocity: dir.multiplyScalar(speed),
          rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
          rotationSpeed: new THREE.Vector3(5, 5, 5),
          life: 1.0,
          maxLife: 0.4 + Math.random() * 0.4,
          scale: 0.2 + Math.random() * 0.25,
          aspectScale: new THREE.Vector3(1, 1, 1),
          color: getRandomColor(palette),
          drag: 0.92,
          gravity: -0.5,
          isGlow: true
        });
      }
    }
  }));

  useFrame((_, delta) => {
    let shardIndex = 0;
    let glowIndex = 0;

    for (let i = particles.current.length - 1; i >= 0; i--) {
      const p = particles.current[i];
      p.life -= delta / p.maxLife;

      if (p.life <= 0) {
        particles.current.splice(i, 1);
        continue;
      }

      p.velocity.y += p.gravity * delta;
      p.velocity.multiplyScalar(p.drag);
      p.position.addScaledVector(p.velocity, delta);

      p.rotation.x += p.rotationSpeed.x * delta;
      p.rotation.y += p.rotationSpeed.y * delta;
      p.rotation.z += p.rotationSpeed.z * delta;
    }

    const activeParticles = particles.current;

    for (let i = 0; i < activeParticles.length; i++) {
      const p = activeParticles[i];

      dummy.position.copy(p.position);
      dummy.rotation.copy(p.rotation);

      const lifeRatio = Math.max(0, p.life);
      const scaleEase = Math.sin(lifeRatio * Math.PI);
      const currentScale = p.scale * scaleEase;

      dummy.scale.set(
        currentScale * p.aspectScale.x,
        currentScale * p.aspectScale.y,
        currentScale * p.aspectScale.z
      );
      dummy.updateMatrix();

      if (p.isGlow && glowMeshRef.current) {
        glowMeshRef.current.setMatrixAt(glowIndex, dummy.matrix);
        glowMeshRef.current.setColorAt(glowIndex, p.color);
        glowIndex++;
      } else if (shardMeshRef.current) {
        shardMeshRef.current.setMatrixAt(shardIndex, dummy.matrix);
        shardMeshRef.current.setColorAt(shardIndex, p.color);
        shardIndex++;
      }
    }

    if (shardMeshRef.current) {
      shardMeshRef.current.count = shardIndex;
      shardMeshRef.current.instanceMatrix.needsUpdate = true;
      if (shardMeshRef.current.instanceColor) shardMeshRef.current.instanceColor.needsUpdate = true;
    }

    if (glowMeshRef.current) {
      glowMeshRef.current.count = glowIndex;
      glowMeshRef.current.instanceMatrix.needsUpdate = true;
      if (glowMeshRef.current.instanceColor) glowMeshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <>
      <instancedMesh ref={shardMeshRef} args={[undefined, undefined, maxParticles]}>
        <tetrahedronGeometry args={[0.25, 0]} />
        <meshStandardMaterial 
          metalness={0.8}
          roughness={0.2}
          vertexColors
          transparent
          opacity={0.95}
        />
      </instancedMesh>

      <instancedMesh ref={glowMeshRef} args={[undefined, undefined, maxParticles]}>
        <octahedronGeometry args={[0.18, 0]} />
        <meshBasicMaterial 
          toneMapped={false} 
          vertexColors 
          transparent 
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>
    </>
  );
});

Particles.displayName = 'Particles';