# ⚓ AERO-HYDRO HEAVY RIG // MK-VIII TACTICAL 3D TELEMETRY

[![React 19](https://img.shields.io/badge/React-19.1.0-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r174-000000?style=for-the-badge&logo=threedotjs)](https://threejs.org/)
[![R3F](https://img.shields.io/badge/@react--three/fiber-v9-black?style=for-the-badge)](https://r3f.docs.pmnd.rs/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite)](https://vite.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

An executive, high-performance, dark tactical 3D Web telemetry application for the **"Big Hovercraft"** amphibious platform, built with **React 19**, **Vite**, **TypeScript**, **Tailwind CSS v4**, **Three.js**, and **@react-three/fiber / @react-three/drei**.

---

## 🌟 Key Features

### 1. 3D Model Auto-Framing & Marine Physics
- **Dual High-Poly GLB Assets**:
  - `hovercraft.glb`: Centered and scale-normalized using dynamic bounding box calculations (`THREE.Box3`).
  - `ocean.glb`: Real-time wave displacement and animated water surface with distance atmospheric naval fog (`#06090e`).
- **Buoyancy & Cushion Physics**:
  - Realistic sinusoidal hover bobbing and sea swell coupling.
  - Dynamic pitch tilt and roll sway responsive to propulsion throttle speed.
  - Active skirt perimeter spray particle simulation with additive blending.

### 2. Interactive Deck Artillery & Surveillance Radar
- **Pointer-Raycast Gun Aiming**:
  - Live azimuth yaw and elevation pitch tracking across deck-mounted turrets, synchronized with cursor movement using exponential damping.
- **Muzzle Flash & Tracer Projectiles**:
  - `Spacebar` or HUD trigger discharges high-velocity tracer projectiles (`MuzzleProjectiles.tsx`) with emissive barrel flash points and distance artillery pulse audio.
- **Continuous Radar Surveillance Sweep**:
  - 360-degree rotating radar scanner dish mounted on the aft mast assembly operating continuously regardless of propulsion state.
- **Live Spinning Turbine Rotors**:
  - Real-time angular velocity modulation for lift plenum fans and ducted rear propellers tied to active throttle multipliers (`0.5x DRIFT`, `1.0x CRUISE`, `2.0x BOOST`).

### 3. Zero-Asset Procedural Web Audio Turbine Engine
- Built strictly on the native **Web Audio API** (0 external sound files):
  - Dual oscillators (warm low triangle drone + detuned sub-sine for cushion beat frequency).
  - Resonant Biquad lowpass filter (`120Hz - 420Hz`) dynamically modulated in real time by throttle setting (`0.5x DRIFT`, `1.0x CRUISE`, `2.0x BOOST`).
  - Procedural pink/white noise buffer for air-cushion plenum airflow turbulence.
  - 0.4s attack fade-in and 0.5s decay fade-out eliminating audio pops and crackles.
  - Tactile UI audio chirps on HUD control clicks and explosive naval gun bursts.

### 4. Glassmorphic Marine Telemetry HUD
- **Strict Pointer-Events Isolation**:
  - HUD root container uses `pointer-events-none fixed inset-0 z-20` so orbit drag and zoom remain fluid and uninterrupted across the entire 3D canvas.
  - Only interactive buttons and telemetry glass cards have `pointer-events-auto`.
- **Top Header Bar**:
  - Unit identifier: `[HVR] AERO-HYDRO HEAVY RIG // MK-VIII`.
  - Soft-pulsing cyan `[TURBINE AIR-CUSHION ACTIVE]` status chip.
  - Live `[RADAR SWEEP // 360° ACTIVE]` surveillance indicator.
  - Quick action controls: Mute/Unmute audio, Wireframe inspection mode toggle, Reset Orbit view.
- **Left Core Panel (`LIFT & PROPULSION CORE`)**:
  - Real-time Velocity readout in knots (`KTS`) and metric speed (`KM/H`).
  - Plenum cushion pressure bar gauge (kPa).
  - Turbine rotor RPM gauge.
  - Hydrodynamic trim angle and fan blade frequency (`RPS`).
- **Right Core Panel (`NAVAL SPECIFICATIONS & SEAS`)**:
  - Real-time compass heading bearing linked to OrbitControls azimuthal orientation.
  - Live gun targeting status (`POINTER SYNC // LIVE`) with real-time azimuth and elevation readings.
  - Sea wave swell displacement height.
  - Live mesh polygon telemetry (Triangles & Vertices count).
  - 4-Camouflage hull finish selector:
    - 🛡️ **Naval Slate** (Military steel gray)
    - ❄️ **Arctic White** (Snow camouflage with ice blue accents)
    - 🏜️ **Desert Sand** (Tactical tan with amber accents)
    - 🌑 **Deep Abyss** (Stealth carbon black with emerald neon)
- **Bottom Tactical Dock**:
  - Camera Presets: `NAVAL ORBIT`, `COCKPIT HELM`, `FAN TURBINES`, `TOP SCAN` (interpolated smoothly with `THREE.Vector3.lerp`).
  - Prominent **ENGAGE PROPULSION / STANDBY** button with dynamic gradient transitions.
  - Throttle speed selector: `0.5x DRIFT`, `1.0x CRUISE`, `2.0x BOOST`.
  - **FIRE BATTERIES [SPACE]** tactical trigger.

---

## 🛠️ Architecture & Tech Stack

aero-hydro-heavy-hovercraft-3d/
├── public/
│   ├── hovercraft.glb            # High-poly hovercraft vehicle asset
│   └── ocean.glb                 # Animated ocean water baseline asset
├── src/
│   ├── components/
│   │   ├── CameraController.tsx  # Smooth camera preset lerp interpolation
│   │   ├── CanvasScene.tsx       # R3F Canvas, studio lighting, fog, controls
│   │   ├── HovercraftModel.tsx   # Model bounding box, camo, buoyancy & fan spin
│   │   ├── LoadingScreen.tsx     # Radar sweep tactical initialization screen
│   │   ├── MuzzleProjectiles.tsx # Additive particle tracers & muzzle flash
│   │   ├── OceanModel.tsx        # Animated ocean waves & material tuning
│   │   ├── SprayParticles.tsx    # Dynamic water spray & cushion airflow particles
│   │   └── TelemetryHUD.tsx      # Glassmorphic tactical telemetry HUD
│   ├── hooks/
│   │   └── useHovercraftAudio.ts # Zero-asset procedural Web Audio synthesizer
│   ├── types.ts                  # TypeScript interfaces and telemetry types
│   ├── index.css                 # Tailwind CSS v4 design tokens & glassmorphic styles
│   ├── App.tsx                   # Root application coordinator & event bindings
│   └── main.tsx                  # React 19 application entry point
├── package.json
├── tsconfig.json
└── vite.config.ts


---

## 🚀 Getting Started

### Prerequisites
- Node.js `v18+` or `v20+` or `v22+`
- npm `v9+` or `v10+`

### Installation & Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev
Visit http://localhost:5173/ in your browser.

Production Build
Bash
# Run TypeScript type check and build production bundle
npm run build

# Preview production build locally
npm run preview
🚢 Model Credits & Attribution
"Big Hovercraft" 3D Model design by 3DHaupt on Sketchfab, licensed under CC BY 4.0.

"Animated Ocean Scene" environment water baseline.# aero-hydro-heavy-hovercraft-3d
