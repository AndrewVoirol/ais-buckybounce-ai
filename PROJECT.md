# Project: BuckyBounce 2.0 Agentic Studio Media Showcase

## Architecture & App Profile
- **Archetype**: `webgl_3d_canvas` (High-Entropy 3D Molecular Simulation)
- **Tech Stack**: React 19, Three.js, React Three Fiber (@react-three/fiber 9.4.0), @react-three/drei 10.7.7, Tailwind CSS v4, Lucide React, Vite 6
- **Physics Solver**: 4-substep spring-mass numerical integration, Hooke's Law elastic deformation, viscous damping, harmonic oscillator resonance driver (0.5-15 Hz), Brownian thermal agitation (0-1000 K), covalent bond yield cleavage and magnetic repair.
- **Visuals**: Instanced 3D shard debris (3,000 particles), bloom postprocessing, dynamic strain heatmaps (cyan -> yellow -> red), dynamic lighting & dark/light theme presets.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | C60 Fullerene 3D Geometry & OrbitControls | Interactive 3D molecular mesh with polar elevation & azimuth orbit | M1, M2 | Codebase Survey |
| 2 | Slingshot Particle Probe Launcher | Elastic ricochets, kinetic energy transfer, pentagon ring target scoring | M2, M3 | Codebase Survey |
| 3 | Stress & Resonance Lab Mode | Forced harmonic resonance driver, frequency sweeps, Hooke strain heatmap | M2, M3 | Codebase Survey |
| 4 | Allotrope Metamorphosis | Dynamic topology switching (C60, C70, SWCNT Nanotube, Graphene, Dome, Tensegrity) | M2, M3 | Codebase Survey |
| 5 | Macro Dolly Zoom & Theme Switch | Camera plunge into nanotube core + theme toggling (Obsidian / Solar Plasma) | M2, M3 | Codebase Survey |
| 6 | Shatter Catastrophe & Covalent Repair | High-energy structural failure, 3,000 instanced shards, magnetic laser repair | M2, M3 | Codebase Survey |
| 7 | Multi-Format Media Suite Generation | Portfolio MP4 (<=15MB), Animated WebP (<=8MB), GIF (<=10MB), hero.webp, screenshots/ | M4 | Media Survey |
| 8 | Media Validation & Forensic Audit | Deterministic SSIM validation, Critic evaluation, Forensic Auditor gate | M5 | Studio Rules |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Reconnaissance & Environment Pre-Flight | Port hygiene, dev server launch, single-browser invariant, `.studio/app_profile.json`, `.studio/blackboard.md` | Survey | PLANNED |
| 2 | Choreography & Script Compilation | Design 4-scene choreography (27.5s), compile `capture_script.js` with `StudioInteractionEngine`, create `record.js` and `edl.yaml` | M1 | PLANNED |
| 3 | Playwright Studio Capture & Visual Gate 1 | Execute Playwright non-headless capture, record timestamps to `capture_timeline.json`, extract & verify quartile frames | M2 | PLANNED |
| 4 | Post-Production & Media Suite Generation | Execute `compress_media.sh` with 4-tier fallback, generate MP4, WebP, GIF, hero.webp, and update `screenshots/` | M3 | PLANNED |
| 5 | QA, Verification & Forensic Audit | Run `validate_media.sh`, Post-Edit Critic evaluation, Forensic Auditor check, Visual Gate 2 verification | M4 | PLANNED |

## Interface Contracts
### Blackboard Protocol (`.studio/`)
- `blackboard.md`: Single-writer pipeline state machine managed by Director/Orchestrator.
- `app_profile.json`: Written in M1 containing archetypes, capabilities, ports, and selectors.
- `choreography.json` & `edl.yaml`: Written in M2 specifying exact scene markers, timing, and actions.
- `capture_timeline.json`: Written in M3 containing `video_start_epoch_ms` and executed markers.
- `validation.json`: Written in M5 containing SSIM metrics and deliverable health checks.
- `pipeline_complete`: Written in M5 teardown to signal clean shutdown.

## Code Layout & Deliverables
- Raw Recording: `.studio/raw_screencast.webm`
- Intermediate Chunks: `.studio/tmp/`
- Production Deliverables:
  - `deliverables/demo.mp4` (H.264 1080p master, <= 15MB)
  - `deliverables/demo.webp` (Animated WebP 1080p/720p, <= 8MB)
  - `deliverables/demo.gif` (Palette-optimized 800px GIF, <= 10MB)
  - `deliverables/hero.webp` (Full 1080p static hero screenshot)
- Repo Showcase:
  - `screenshots/demo.gif`
  - `screenshots/initial-state.png`
  - `screenshots/mid-flight.png`
  - `screenshots/alternate-config.png`
