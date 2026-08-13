import React, { useState } from 'react';
import { StructureData } from '../types';

interface CodexModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStructure: StructureData;
}

export const CodexModal: React.FC<CodexModalProps> = ({ isOpen, onClose, currentStructure }) => {
  const [activeTab, setActiveTab] = useState<'current' | 'euler' | 'hybridization' | 'nanotubes' | 'tensegrity' | 'resonance'>('current');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in pointer-events-auto">
      <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col bg-[#0b0f19]/95 border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden text-gray-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-400 font-bold">
              ⚛
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide">
                PHYSICS & MOLECULAR CODEX
              </h2>
              <p className="text-xs text-cyan-400/80 font-mono">
                Interactive Structural Science & Mechanics Compendium
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

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-black/40 overflow-x-auto px-4 py-2 gap-2 text-sm font-medium">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              activeTab === 'current'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            🌟 {currentStructure.name}
          </button>
          <button
            onClick={() => setActiveTab('euler')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              activeTab === 'euler'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            📐 12 Pentagons & Euler
          </button>
          <button
            onClick={() => setActiveTab('hybridization')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              activeTab === 'hybridization'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            🧪 sp² vs sp³ Orbitals
          </button>
          <button
            onClick={() => setActiveTab('nanotubes')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              activeTab === 'nanotubes'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            🚀 Carbon Nanotubes
          </button>
          <button
            onClick={() => setActiveTab('tensegrity')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              activeTab === 'tensegrity'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            🏗️ Tensegrity & Geodesics
          </button>
          <button
            onClick={() => setActiveTab('resonance')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              activeTab === 'resonance'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            ⚡ Resonance & Hooke's Law
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm leading-relaxed">
          
          {/* 1. CURRENT STRUCTURE */}
          {activeTab === 'current' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30">
                <span className="text-xs uppercase font-mono text-cyan-400 font-bold tracking-widest">
                  {currentStructure.educationalInfo.category}
                </span>
                <h3 className="text-2xl font-black text-white mt-1">
                  {currentStructure.name} <span className="text-cyan-400 font-mono text-lg">({currentStructure.formula})</span>
                </h3>
                <p className="text-gray-300 mt-2 text-base">
                  {currentStructure.educationalInfo.description}
                </p>
              </div>

              {/* Geometry Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-xs text-gray-400">VERTICES (V)</div>
                  <div className="text-2xl font-bold text-white">{currentStructure.euler.v}</div>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-xs text-gray-400">EDGES / BONDS (E)</div>
                  <div className="text-2xl font-bold text-cyan-400">{currentStructure.euler.e}</div>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-xs text-gray-400">FACES / RINGS (F)</div>
                  <div className="text-2xl font-bold text-purple-400">{currentStructure.euler.f}</div>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-xs text-gray-400">EULER CHAR. (χ)</div>
                  <div className="text-2xl font-bold text-green-400">{currentStructure.euler.chi}</div>
                </div>
              </div>

              {/* Highlights */}
              <div>
                <h4 className="font-bold text-white text-base mb-2">Key Physical & Structural Properties:</h4>
                <ul className="space-y-2">
                  {currentStructure.educationalInfo.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-cyan-400">✦</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Fun Fact */}
              <div className="p-3 bg-purple-950/30 border border-purple-500/30 rounded-xl text-purple-200">
                <span className="font-bold text-purple-400">💡 Science Note: </span>
                {currentStructure.educationalInfo.funFact}
              </div>
            </div>
          )}

          {/* 2. EULER'S FORMULA & 12 PENTAGONS */}
          {activeTab === 'euler' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">Why Every Closed Fullerene Sphere Needs Exactly 12 Pentagons</h3>
              <p>
                In 1758, Leonhard Euler proved that any convex polyhedron homeomorphic to a sphere obeys:
              </p>
              <div className="p-3 bg-black/60 rounded-xl border border-cyan-500/40 text-center font-mono text-lg text-cyan-400">
                V - E + F = 2
              </div>
              <p>
                In a carbon fullerene, every carbon atom is trivalent (connected to exactly 3 neighboring atoms, so <span className="font-mono text-cyan-300">2E = 3V</span>). 
                If the cage consists of <span className="font-mono text-pink-400">P</span> pentagons (5-sided faces) and <span className="font-mono text-blue-400">H</span> hexagons (6-sided faces):
              </p>
              <div className="bg-white/5 p-4 rounded-xl space-y-2 font-mono text-sm border border-white/10">
                <div>• Total Faces: <span className="text-purple-300">F = P + H</span></div>
                <div>• Total Edges: <span className="text-purple-300">2E = 5P + 6H</span>  ⟹  <span className="text-purple-300">E = (5P + 6H) / 2</span></div>
                <div>• Total Vertices: <span className="text-purple-300">3V = 2E</span>  ⟹  <span className="text-purple-300">V = (5P + 6H) / 3</span></div>
              </div>
              <p>
                Substituting into Euler's formula:
              </p>
              <div className="p-3 bg-black/60 rounded-xl font-mono text-center text-sm border border-pink-500/30 text-pink-300">
                (5P + 6H)/3 - (5P + 6H)/2 + (P + H) = 2
                <br />
                (10P + 12H - 15P - 18H + 6P + 6H) / 6 = 2
                <br />
                P / 6 = 2  ⟹  <strong className="text-white text-base">P = 12</strong>
              </div>
              <p>
                <strong>The Result:</strong> The number of hexagons <span className="font-mono text-blue-400">H</span> completely cancels out! No matter whether a fullerene has 60, 70, 540, or 2,000 carbon atoms, it <em>must</em> have exactly <strong>12 pentagons</strong> to introduce the 720° of positive Gaussian curvature required to close the 3D spherical cage.
              </p>
            </div>
          )}

          {/* 3. HYBRIDIZATION */}
          {activeTab === 'hybridization' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">Orbital Hybridization: Fullerenes (sp²) vs Diamond (sp³)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-cyan-950/20 border border-cyan-500/30 rounded-xl space-y-2">
                  <h4 className="font-bold text-cyan-400 text-base">sp² Hybridization (Fullerenes / Graphene)</h4>
                  <p className="text-xs text-gray-300">
                    Carbon mixes 1 s-orbital and 2 p-orbitals to form 3 planar sigma-bonds at 120° angles. The remaining unhybridized p_z orbital forms a delocalized pi-electron cloud.
                  </p>
                  <ul className="text-xs space-y-1 text-gray-400">
                    <li>• Superb electrical conductivity (delocalized pi-electrons)</li>
                    <li>• High in-plane tensile strength</li>
                    <li>• Curved in C₆₀ due to 108° pentagonal strain</li>
                  </ul>
                </div>

                <div className="p-4 bg-purple-950/20 border border-purple-500/30 rounded-xl space-y-2">
                  <h4 className="font-bold text-purple-400 text-base">sp³ Hybridization (Diamond)</h4>
                  <p className="text-xs text-gray-300">
                    Carbon mixes 1 s-orbital and 3 p-orbitals to form 4 tetrahedral sigma-bonds at 109.5° angles in all three spatial dimensions.
                  </p>
                  <ul className="text-xs space-y-1 text-gray-400">
                    <li>• Extreme 3D bulk hardness (10 on Mohs scale)</li>
                    <li>• Wide bandgap electrical insulator (Eg ≈ 5.5 eV)</li>
                    <li>• Highest known bulk thermal conductivity</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 4. NANOTUBES */}
          {activeTab === 'nanotubes' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">Carbon Nanotubes & Space Elevators</h3>
              <p>
                Single-Walled Carbon Nanotubes (SWCNTs) are essentially seamless cylinders of rolled graphene. The direction in which the honeycomb is rolled is defined by the chiral vector:
              </p>
              <div className="grid grid-cols-3 gap-3 font-mono text-center text-xs">
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-cyan-400 font-bold">Armchair (n, n)</div>
                  <div className="text-gray-300 mt-1">Metallic conductor (ballistic transport)</div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-purple-400 font-bold">Zigzag (n, 0)</div>
                  <div className="text-gray-300 mt-1">Semiconducting or semi-metallic</div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-pink-400 font-bold">Chiral (n, m)</div>
                  <div className="text-gray-300 mt-1">Helical symmetry & optical activity</div>
                </div>
              </div>
              <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-xl text-xs text-cyan-200">
                <strong>Space Elevator Physics:</strong> To build a 36,000 km elevator cable from Earth to Geostationary Orbit, a material must support its own weight under planetary gravity. Carbon nanotubes boast a tensile strength of over <strong>100 GPa</strong> and a specific strength of ~48,000 kN·m/kg, making them the only known material theoretically capable of withstanding the orbital tension.
              </div>
            </div>
          )}

          {/* 5. TENSEGRITY & GEODESICS */}
          {activeTab === 'tensegrity' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">Tensegrity & Geodesic Structures</h3>
              <p>
                Architect Buckminster Fuller and sculptor Kenneth Snelson discovered that structures can achieve incredible strength not by massive stone compression, but through <strong>tensile integrity</strong>:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
                  <h4 className="font-bold text-white">Tensegrity (Floating Compression)</h4>
                  <p className="text-xs text-gray-300">
                    Rigid compression struts never touch one another; they float suspended in a continuous network of pre-tensioned cables. An external impact at one node is immediately dissipated across all cables simultaneously.
                  </p>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
                  <h4 className="font-bold text-white">Geodesic Domes (Triangulated Shells)</h4>
                  <p className="text-xs text-gray-300">
                    Triangles are geometrically rigid — their angles cannot change without stretching or compressing their sides. Geodesic domes distribute mechanical loads uniformly throughout the spherical shell.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 6. RESONANCE & HOOKE'S LAW */}
          {activeTab === 'resonance' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">Hooke's Law & Structural Natural Resonance</h3>
              <p>
                Every molecular bond in BuckyBounce is simulated as an elastic spring following <strong>Hooke's Law</strong> with damping:
              </p>
              <div className="p-3 bg-black/60 rounded-xl font-mono text-center text-cyan-400 text-base border border-cyan-500/30">
                F = -k Δx - c v
              </div>
              <p>
                When an external cyclic force (like the seismic oscillator in Stress Lab) vibrates at frequency ω, the amplitude of oscillation spikes dramatically at the structure's <strong>eigenfrequency</strong> (natural frequency):
              </p>
              <div className="p-3 bg-black/60 rounded-xl font-mono text-center text-purple-300 text-sm border border-purple-500/30">
                ω₀ = √(k_effective / m)
              </div>
              <p className="text-xs text-gray-400">
                At resonance, energy from the oscillator is transferred into the molecular framework with maximum efficiency, leading to mechanical stress buildup, strain color shifts (cyan → red), and eventual bond cleavage (cleavage catastrophe)!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-white/10 bg-black/60 text-xs text-gray-400 font-mono">
          <span>Nobel Prize in Chemistry 1996 • Harold Kroto, Richard Smalley, Robert Curl</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 text-black font-bold hover:bg-cyan-400 transition"
          >
            Resume Lab
          </button>
        </div>
      </div>
    </div>
  );
};
