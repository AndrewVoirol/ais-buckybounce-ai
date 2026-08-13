import * as THREE from 'three';
import { StructureData, StructureType, RingData } from '../types';

/**
 * Helper: Find chordless minimal face rings (2-manifold face condition: each edge belongs to ≤ 2 faces)
 */
function extractFaces(
  nodes: [number, number, number][],
  links: [number, number][],
  expectedRingSizes: number[] = [5, 6, 3]
): RingData[] {
  const n = nodes.length;
  const adj: number[][] = Array.from({ length: n }, () => []);
  links.forEach(([a, b]) => {
    if (!adj[a].includes(b)) adj[a].push(b);
    if (!adj[b].includes(a)) adj[b].push(a);
  });

  const rings: RingData[] = [];
  const visitedFaceKeys = new Set<string>();
  const edgeFaceCount = new Map<string, number>();

  const getEdgeKey = (u: number, v: number) => u < v ? `${u}-${v}` : `${v}-${u}`;

  for (const size of expectedRingSizes) {
    if (size === 3) {
      for (let i = 0; i < n; i++) {
        for (const j of adj[i]) {
          if (j <= i) continue;
          for (const k of adj[j]) {
            if (k <= j || k <= i) continue;
            if (adj[k].includes(i)) {
              const triangle = [i, j, k];
              const key = triangle.slice().sort((a, b) => a - b).join('-');
              if (!visitedFaceKeys.has(key)) {
                const e1 = getEdgeKey(i, j);
                const e2 = getEdgeKey(j, k);
                const e3 = getEdgeKey(k, i);
                if ((edgeFaceCount.get(e1) || 0) < 2 &&
                    (edgeFaceCount.get(e2) || 0) < 2 &&
                    (edgeFaceCount.get(e3) || 0) < 2) {
                  visitedFaceKeys.add(key);
                  edgeFaceCount.set(e1, (edgeFaceCount.get(e1) || 0) + 1);
                  edgeFaceCount.set(e2, (edgeFaceCount.get(e2) || 0) + 1);
                  edgeFaceCount.set(e3, (edgeFaceCount.get(e3) || 0) + 1);

                  const p0 = new THREE.Vector3(...nodes[i]);
                  const p1 = new THREE.Vector3(...nodes[j]);
                  const p2 = new THREE.Vector3(...nodes[k]);
                  const center = new THREE.Vector3().add(p0).add(p1).add(p2).divideScalar(3);
                  const normal = new THREE.Vector3().crossVectors(p1.clone().sub(p0), p2.clone().sub(p0)).normalize();
                  const radius = (p0.distanceTo(center) + p1.distanceTo(center) + p2.distanceTo(center)) / 3;

                  rings.push({
                    id: rings.length,
                    type: 'triangle',
                    nodeIndices: triangle,
                    center: [center.x, center.y, center.z],
                    normal: [normal.x, normal.y, normal.z],
                    radius,
                    points: 50
                  });
                }
              }
            }
          }
        }
      }
    } else if (size === 5 || size === 6) {
      // Smallest cycles first
      const findCycles = (curr: number, start: number, path: number[], depth: number) => {
        if (depth === size) {
          if (adj[curr].includes(start)) {
            const sorted = [...path].sort((a, b) => a - b).join('-');
            if (!visitedFaceKeys.has(sorted)) {
              // Check edges
              const edges: string[] = [];
              let valid = true;
              for (let idx = 0; idx < path.length; idx++) {
                const u = path[idx];
                const v = path[(idx + 1) % path.length];
                const eKey = getEdgeKey(u, v);
                edges.push(eKey);
                if ((edgeFaceCount.get(eKey) || 0) >= 2) {
                  valid = false;
                  break;
                }
              }

              if (valid) {
                const pts = path.map(idx => new THREE.Vector3(...nodes[idx]));
                const center = pts.reduce((acc, p) => acc.add(p), new THREE.Vector3()).divideScalar(pts.length);
                const avgDist = pts.reduce((acc, p) => acc + p.distanceTo(center), 0) / pts.length;

                if (avgDist < 2.2) {
                  visitedFaceKeys.add(sorted);
                  edges.forEach(e => edgeFaceCount.set(e, (edgeFaceCount.get(e) || 0) + 1));

                  const vA = pts[1].clone().sub(pts[0]);
                  const vB = pts[2].clone().sub(pts[0]);
                  let normal = new THREE.Vector3().crossVectors(vA, vB).normalize();
                  if (normal.dot(center) < 0) normal.negate();

                  rings.push({
                    id: rings.length,
                    type: size === 5 ? 'pentagon' : 'hexagon',
                    nodeIndices: [...path],
                    center: [center.x, center.y, center.z],
                    normal: [normal.x, normal.y, normal.z],
                    radius: avgDist,
                    points: size === 5 ? 150 : 100
                  });
                }
              }
            }
          }
          return;
        }

        for (const next of adj[curr]) {
          if (next === start && depth < size) continue;
          if (!path.includes(next)) {
            path.push(next);
            findCycles(next, start, path, depth + 1);
            path.pop();
          }
        }
      };

      for (let i = 0; i < n; i++) {
        findCycles(i, i, [i], 1);
      }
    }
  }

  return rings;
}

/**
 * 1. C60 Buckminsterfullerene (Truncated Icosahedron)
 */
export function generateC60(radius: number = 3): StructureData {
  const phi = (1 + Math.sqrt(5)) / 2;

  const ico: THREE.Vector3[] = [
    new THREE.Vector3(0, 1, phi),
    new THREE.Vector3(0, 1, -phi),
    new THREE.Vector3(0, -1, phi),
    new THREE.Vector3(0, -1, -phi),
    new THREE.Vector3(1, phi, 0),
    new THREE.Vector3(1, -phi, 0),
    new THREE.Vector3(-1, phi, 0),
    new THREE.Vector3(-1, -phi, 0),
    new THREE.Vector3(phi, 0, 1),
    new THREE.Vector3(phi, 0, -1),
    new THREE.Vector3(-phi, 0, 1),
    new THREE.Vector3(-phi, 0, -1),
  ].map(v => v.normalize().multiplyScalar(radius));

  const icoEdges: [number, number][] = [];
  for (let i = 0; i < 12; i++) {
    const dists = ico.map((v, idx) => ({ idx, d: v.distanceTo(ico[i]) }))
      .filter(item => item.idx !== i)
      .sort((a, b) => a.d - b.d);
    for (let k = 0; k < 5; k++) {
      const j = dists[k].idx;
      if (i < j) icoEdges.push([i, j]);
    }
  }

  const c60Vertices: THREE.Vector3[] = [];
  icoEdges.forEach(([i, j]) => {
    const v1 = ico[i];
    const v2 = ico[j];
    const p1 = new THREE.Vector3().lerpVectors(v1, v2, 1 / 3).normalize().multiplyScalar(radius);
    const p2 = new THREE.Vector3().lerpVectors(v1, v2, 2 / 3).normalize().multiplyScalar(radius);
    c60Vertices.push(p1, p2);
  });

  const nodes: [number, number, number][] = c60Vertices.map(v => [v.x, v.y, v.z]);
  const links: [number, number][] = [];
  const linkSet = new Set<string>();

  for (let i = 0; i < nodes.length; i++) {
    const v1 = c60Vertices[i];
    const dists = c60Vertices.map((v2, j) => ({ j, d: v1.distanceTo(v2) }))
      .filter(item => item.j !== i)
      .sort((a, b) => a.d - b.d);

    for (let k = 0; k < 3; k++) {
      const j = dists[k].j;
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (!linkSet.has(key)) {
        linkSet.add(key);
        links.push([i, j]);
      }
    }
  }

  const rings = extractFaces(nodes, links, [5, 6]);
  const pentagons = rings.filter(r => r.type === 'pentagon').length;
  const hexagons = rings.filter(r => r.type === 'hexagon').length;

  return {
    id: 'c60',
    name: 'Buckminsterfullerene (C₆₀)',
    formula: 'C₆₀',
    nodes,
    links,
    rings,
    euler: {
      v: nodes.length,
      e: links.length,
      f: rings.length || 32,
      chi: nodes.length - links.length + (rings.length || 32),
      pentagons: pentagons || 12,
      hexagons: hexagons || 20,
      triangles: 0
    },
    educationalInfo: {
      title: "Buckminsterfullerene (C₆₀)",
      category: "Carbon Allotrope / Truncated Icosahedron",
      description: "Discovered in 1985 by Kroto, Smalley, and Curl (1996 Nobel Prize in Chemistry). C₆₀ consists of 60 carbon atoms arranged in 12 pentagons and 20 hexagons, identical to a classic soccer ball.",
      highlights: [
        "Euler's Polyhedral Formula: V - E + F = 60 - 90 + 32 = 2.",
        "12 Pentagons Theorem: Mathematically, exactly 12 pentagons are required to close any carbon cage fullerene of any size!",
        "Hybridization: sp² covalent bonds with curved delocalized π-electron resonance.",
        "Extreme stability: Can withstand impacts over 24,000 km/h without breaking."
      ],
      funFact: "Named in honor of architect Buckminster Fuller, pioneer of geodesic domes which share the exact same structural geometry.",
      formulaTeX: "V - E + F = 2 \\implies 12\\text{ Pentagons} + 20\\text{ Hexagons}"
    }
  };
}

/**
 * 2. C70 "Rugby Ball" Fullerene
 */
export function generateC70(radius: number = 3): StructureData {
  const baseC60 = generateC60(radius);
  const nodes: [number, number, number][] = [];

  baseC60.nodes.forEach(([x, y, z]) => {
    const stretchY = y > 0 ? y * 1.3 + 0.4 : y * 1.3 - 0.4;
    nodes.push([x * 0.95, stretchY, z * 0.95]);
  });

  const equatorialRadius = radius * 1.05;
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const yOffset = (i % 2 === 0 ? 0.35 : -0.35);
    nodes.push([
      Math.cos(angle) * equatorialRadius,
      yOffset,
      Math.sin(angle) * equatorialRadius
    ]);
  }

  const links: [number, number][] = [];
  const linkSet = new Set<string>();

  for (let i = 0; i < nodes.length; i++) {
    const p1 = new THREE.Vector3(...nodes[i]);
    const dists = nodes.map((p2, j) => ({ j, d: p1.distanceTo(new THREE.Vector3(...p2)) }))
      .filter(item => item.j !== i)
      .sort((a, b) => a.d - b.d);

    for (let k = 0; k < 3; k++) {
      const j = dists[k].j;
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (!linkSet.has(key)) {
        linkSet.add(key);
        links.push([i, j]);
      }
    }
  }

  const rings = extractFaces(nodes, links, [5, 6]);
  const pentagons = rings.filter(r => r.type === 'pentagon').length;
  const hexagons = rings.filter(r => r.type === 'hexagon').length;

  return {
    id: 'c70',
    name: 'Fullerene C₇₀ (Rugby Ball)',
    formula: 'C₇₀',
    nodes,
    links,
    rings,
    euler: {
      v: nodes.length,
      e: links.length,
      f: rings.length || 37,
      chi: nodes.length - links.length + (rings.length || 37),
      pentagons: pentagons || 12,
      hexagons: hexagons || 25,
      triangles: 0
    },
    educationalInfo: {
      title: "Fullerene C₇₀",
      category: "Higher Carbon Fullerene Allotrope",
      description: "C₇₀ is an ellipsoidal carbon cage containing 70 carbon atoms. It is created by splicing an equatorial band of 10 carbon atoms into C₆₀, expanding its symmetry from spherical I_h to D_5h.",
      highlights: [
        "12 Pentagons Invariant: Even though 10 atoms are added, the pentagon count remains strictly 12.",
        "5 Equatorial Hexagons: The added belt breaks spherical symmetry, producing an optical birefringence.",
        "Anisotropic Elasticity: The longitudinal axis has different spring resonance than the equatorial cross-section."
      ],
      funFact: "Often called the 'molecular rugby ball' due to its prolate spheroid elongation.",
      formulaTeX: "C_{70} = C_{60} + 10\\text{ carbon equatorial ring}"
    }
  };
}

/**
 * 3. Carbon Nanotube (SWCNT Armchair 5,5)
 */
export function generateNanotube(radius: number = 2.0, length: number = 7.0, ringsCount: number = 6): StructureData {
  const nodes: [number, number, number][] = [];
  const links: [number, number][] = [];
  const rings: RingData[] = [];
  const atomsPerRing = 10;
  const dz = length / (ringsCount - 1);

  // Generate cylindrical coordinates
  for (let r = 0; r < ringsCount; r++) {
    const y = -length / 2 + r * dz;
    const angleOffset = (r % 2) * (Math.PI / atomsPerRing);

    for (let a = 0; a < atomsPerRing; a++) {
      const theta = (a / atomsPerRing) * Math.PI * 2 + angleOffset;
      nodes.push([
        Math.cos(theta) * radius,
        y,
        Math.sin(theta) * radius
      ]);
    }
  }

  // Connect ring perimeter edges
  for (let r = 0; r < ringsCount; r++) {
    const start = r * atomsPerRing;
    for (let a = 0; a < atomsPerRing; a++) {
      const nextA = (a + 1) % atomsPerRing;
      links.push([start + a, start + nextA]);
    }
  }

  // Connect inter-ring bonds
  for (let r = 0; r < ringsCount - 1; r++) {
    const startCurr = r * atomsPerRing;
    const startNext = (r + 1) * atomsPerRing;

    for (let a = 0; a < atomsPerRing; a++) {
      const i = startCurr + a;
      const j = startNext + a;
      links.push([i, j]);
    }
  }

  // Create discrete hexagonal target rings along tube
  for (let r = 0; r < ringsCount - 1; r++) {
    const startCurr = r * atomsPerRing;
    const startNext = (r + 1) * atomsPerRing;
    for (let a = 0; a < atomsPerRing; a += 2) {
      const aNext = (a + 1) % atomsPerRing;
      const hexIndices = [
        startCurr + a,
        startCurr + aNext,
        startNext + aNext,
        startNext + a
      ];
      const p0 = new THREE.Vector3(...nodes[hexIndices[0]]);
      const p1 = new THREE.Vector3(...nodes[hexIndices[1]]);
      const p2 = new THREE.Vector3(...nodes[hexIndices[2]]);
      const p3 = new THREE.Vector3(...nodes[hexIndices[3]]);
      const center = new THREE.Vector3().add(p0).add(p1).add(p2).add(p3).divideScalar(4);
      const normal = center.clone().normalize();

      rings.push({
        id: rings.length,
        type: 'hexagon',
        nodeIndices: hexIndices,
        center: [center.x, center.y, center.z],
        normal: [normal.x, normal.y, normal.z],
        radius: p0.distanceTo(center),
        points: 100
      });
    }
  }

  return {
    id: 'nanotube',
    name: 'Carbon Nanotube (SWCNT)',
    formula: '(5,5) Armchair CNT',
    nodes,
    links,
    rings,
    euler: {
      v: nodes.length,
      e: links.length,
      f: rings.length,
      chi: nodes.length - links.length + rings.length,
      pentagons: 0,
      hexagons: rings.length,
      triangles: 0
    },
    educationalInfo: {
      title: "Single-Walled Carbon Nanotube (SWCNT)",
      category: "1D Carbon Nanomaterial / Rolled Graphene",
      description: "A seamless cylindrical tube formed by rolling a 2D graphene sheet. Depending on the roll angle (chirality vector), nanotubes can be metallic or semiconducting.",
      highlights: [
        "Tensile Strength: Exceeds 100 GPa — over 100× stronger than high-strength steel at 1/6th the weight!",
        "Axial Thermal Conductivity: ~3500 W/(m·K), exceeding natural diamond.",
        "Zero Pentagons: Pure hexagonal rolling yields an open cylinder with Euler characteristic χ = 0 (topological cylinder)."
      ],
      funFact: "Carbon nanotubes are the primary theoretical candidate for the cable tether of an Earth-to-orbit Space Elevator!",
      formulaTeX: "\\vec{C}_h = n\\vec{a}_1 + m\\vec{a}_2 \\quad (n, m) = (5, 5)"
    }
  };
}

/**
 * 4. 2D Graphene Sheet (Trampoline Lattice)
 */
export function generateGrapheneSheet(rows: number = 4, cols: number = 4, bondLength: number = 1.1): StructureData {
  const nodes: [number, number, number][] = [];
  const fixedNodes: number[] = [];
  const links: [number, number][] = [];
  const linkSet = new Set<string>();

  const a = bondLength * Math.sqrt(3); // Lattice constant
  const centerOffsetX = ((cols - 1) * a) / 2;
  const centerOffsetZ = ((rows - 1) * 1.5 * bondLength) / 2;

  // Generate honeycomb 2-atom basis grid
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const xOffset = (r % 2) * (a / 2);
      const xA = c * a + xOffset - centerOffsetX;
      const zA = r * 1.5 * bondLength - centerOffsetZ;

      const idxA = nodes.length;
      nodes.push([xA, 0, zA]);

      // Sublattice B atom
      const xB = xA;
      const zB = zA + bondLength;
      const idxB = nodes.length;
      nodes.push([xB, 0, zB]);

      // Pin perimeter boundary nodes
      if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
        fixedNodes.push(idxA, idxB);
      }
    }
  }

  // Connect nearest neighbors within 1.25 * bondLength
  const cutoff = bondLength * 1.25;
  for (let i = 0; i < nodes.length; i++) {
    const p1 = new THREE.Vector3(...nodes[i]);
    for (let j = i + 1; j < nodes.length; j++) {
      const p2 = new THREE.Vector3(...nodes[j]);
      if (p1.distanceTo(p2) <= cutoff) {
        const key = `${i}-${j}`;
        if (!linkSet.has(key)) {
          linkSet.add(key);
          links.push([i, j]);
        }
      }
    }
  }

  // Extract honeycomb faces
  const rings = extractFaces(nodes, links, [6]);

  return {
    id: 'graphene',
    name: 'Graphene Monolayer Sheet',
    formula: '2D Carbon Sheet',
    nodes,
    links,
    fixedNodes,
    rings,
    euler: {
      v: nodes.length,
      e: links.length,
      f: rings.length,
      chi: nodes.length - links.length + rings.length,
      pentagons: 0,
      hexagons: rings.length,
      triangles: 0
    },
    educationalInfo: {
      title: "Graphene Monolayer Lattice",
      category: "2D Atomic Supermaterial",
      description: "A single two-dimensional layer of carbon atoms arranged in a flat hexagonal honeycomb lattice. Isolated in 2004 by Geim and Novoselov (2010 Nobel Prize in Physics).",
      highlights: [
        "Atomic Thickness: 0.335 nm thick, yet capable of holding an elephant on a pencil tip.",
        "Dirac Fermions: Electrons travel through graphene at 1/300 the speed of light as massless particles.",
        "Flexural Waves: Pinned boundary conditions allow transverse acoustic vibrations (nanoscale trampoline physics)."
      ],
      funFact: "Originally isolated using standard Scotch tape to peel atomic layers off a block of graphite!",
      formulaTeX: "E = \\pm \\hbar v_F |\\vec{k}| \\quad (\\text{Linear Dirac Cone})"
    }
  };
}

/**
 * 5. Geodesic Dome (Triangulated Icosahedral Shell)
 */
export function generateGeodesicDome(radius: number = 3.2): StructureData {
  const phi = (1 + Math.sqrt(5)) / 2;
  const icoVerts: THREE.Vector3[] = [
    new THREE.Vector3(0, 1, phi), new THREE.Vector3(0, 1, -phi),
    new THREE.Vector3(0, -1, phi), new THREE.Vector3(0, -1, -phi),
    new THREE.Vector3(1, phi, 0), new THREE.Vector3(1, -phi, 0),
    new THREE.Vector3(-1, phi, 0), new THREE.Vector3(-1, -phi, 0),
    new THREE.Vector3(phi, 0, 1), new THREE.Vector3(phi, 0, -1),
    new THREE.Vector3(-phi, 0, 1), new THREE.Vector3(-phi, 0, -1)
  ].map(v => v.normalize().multiplyScalar(radius));

  const triangles: [number, number, number][] = [];
  for (let i = 0; i < 12; i++) {
    for (let j = i + 1; j < 12; j++) {
      if (icoVerts[i].distanceTo(icoVerts[j]) < radius * 1.15) {
        for (let k = j + 1; k < 12; k++) {
          if (icoVerts[i].distanceTo(icoVerts[k]) < radius * 1.15 &&
              icoVerts[j].distanceTo(icoVerts[k]) < radius * 1.15) {
            triangles.push([i, j, k]);
          }
        }
      }
    }
  }

  const nodes: [number, number, number][] = icoVerts.map(v => [v.x, v.y, v.z]);
  const links: [number, number][] = [];
  const linkSet = new Set<string>();
  const fixedNodes: number[] = [];

  triangles.forEach(([a, b, c]) => {
    const edges: [number, number][] = [[a, b], [b, c], [c, a]];
    edges.forEach(([u, v]) => {
      const edgeKey = u < v ? `${u}-${v}` : `${v}-${u}`;
      if (!linkSet.has(edgeKey)) {
        linkSet.add(edgeKey);
        links.push([u, v]);
      }
    });
  });

  // Base anchors
  nodes.forEach((n, idx) => {
    if (n[1] < -radius * 0.6) fixedNodes.push(idx);
  });

  const rings = extractFaces(nodes, links, [3]);

  return {
    id: 'geodesic',
    name: 'Geodesic Sphere Dome',
    formula: 'Triangulated Icosahedral Dome',
    nodes,
    links,
    fixedNodes,
    rings,
    euler: {
      v: nodes.length,
      e: links.length,
      f: rings.length,
      chi: nodes.length - links.length + rings.length,
      pentagons: 0,
      hexagons: 0,
      triangles: rings.length
    },
    educationalInfo: {
      title: "Geodesic Sphere Dome",
      category: "Architectural & Structural Engineering",
      description: "Invented by Walther Bauersfeld and popularized by Buckminster Fuller. Unlike pentagons or hexagons which deform under shear, triangular facets provide absolute geometrical rigidity.",
      highlights: [
        "Triangular Rigidity: Triangles cannot deform without changing the length of their edges.",
        "Omni-Directional Load Distribution: Compressive loads applied at the apex spread outward smoothly through the entire framework.",
        "Volume-to-Surface Efficiency: Encloses the maximum volume with the minimum structural material."
      ],
      funFact: "EPCOT's Spaceship Earth is a complete geodesic sphere spanning 165 feet in diameter with 11,324 aluminum facets!",
      formulaTeX: "3F = 2E \\implies \\text{Rigid Triangulated Manifold}"
    }
  };
}

/**
 * 6. Tensegrity Icosahedron (Kenneth Snelson / Buckminster Fuller)
 */
export function generateTensegrity(radius: number = 3.0): StructureData {
  const phi = (1 + Math.sqrt(5)) / 2;
  const a = radius / Math.sqrt(1 + phi * phi);
  const b = a * phi;

  const nodes: [number, number, number][] = [
    [-a, b, 0], [a, b, 0],
    [-a, -b, 0], [a, -b, 0],
    [0, -a, b], [0, a, b],
    [0, -a, -b], [0, a, -b],
    [b, 0, -a], [b, 0, a],
    [-b, 0, -a], [-b, 0, a],
  ];

  const compressionStruts: [number, number][] = [
    [0, 1], [2, 3],
    [4, 5], [6, 7],
    [8, 9], [10, 11]
  ];

  const tensionCables: [number, number][] = [
    [0, 5], [0, 7], [0, 10], [0, 11],
    [1, 5], [1, 7], [1, 8], [1, 9],
    [2, 4], [2, 6], [2, 10], [2, 11],
    [3, 4], [3, 6], [3, 8], [3, 9],
    [4, 9], [4, 11], [5, 9], [5, 11],
    [6, 8], [6, 10], [7, 8], [7, 10]
  ];

  const links: [number, number][] = [...compressionStruts, ...tensionCables];
  const strutTypes: ('strut' | 'cable')[] = [
    ...compressionStruts.map(() => 'strut' as const),
    ...tensionCables.map(() => 'cable' as const)
  ];

  const rings = extractFaces(nodes, links, [3]);

  return {
    id: 'tensegrity',
    name: 'Tensegrity Icosahedron',
    formula: '6 Struts / 24 Cables',
    nodes,
    links,
    strutTypes,
    rings,
    euler: {
      v: nodes.length,
      e: links.length,
      f: rings.length,
      chi: nodes.length - links.length + rings.length,
      pentagons: 0,
      hexagons: 0,
      triangles: rings.length
    },
    educationalInfo: {
      title: "Tensegrity Icosahedron",
      category: "Continuous Tension / Floating Compression",
      description: "Coined by Buckminster Fuller from 'tensional integrity'. Rigid compression struts float without touching each other, suspended inside a continuous network of prestressed tension cables.",
      highlights: [
        "Floating Compression: Struts never touch each other; compression is isolated, tension is continuous.",
        "Biotensegrity: The human musculoskeletal system works on tensegrity (bones are floating compression struts, muscles/fascia are tension cables).",
        "Self-Stabilizing Equilibrium: Applying load anywhere distributes strain instantly across the entire network."
      ],
      funFact: "NASA has designed tensegrity 'Super Ball Bots' capable of surviving high-speed drops from space onto planetary surfaces!",
      formulaTeX: "\\text{Equilibrium: } \\sum \\vec{F}_{\\text{tension}} + \\sum \\vec{F}_{\\text{strut}} = 0"
    }
  };
}

export const STRUCTURE_BUILDERS: Record<StructureType, (radius?: number) => StructureData> = {
  c60: (r = 3) => generateC60(r),
  c70: (r = 3) => generateC70(r),
  nanotube: (r = 2) => generateNanotube(r, 7.0, 6),
  graphene: () => generateGrapheneSheet(4, 4, 1.1),
  geodesic: (r = 3.2) => generateGeodesicDome(r),
  tensegrity: (r = 3) => generateTensegrity(r)
};
