# Crossy Road 3D 🐔🚗🌊

A vibrant, polished 3D endless arcade game inspired by Crossy Road, built with Three.js, procedural voxel environments, custom Web Audio synthesis, and mobile-friendly touch controls.

![Crossy Road 3D Banner](public/vite.svg)

## 🎮 Play Online
- **Controls**:
  - `W` / `↑` : Hop Forward
  - `S` / `↓` : Hop Backward
  - `A` / `←` : Steer Left
  - `D` / `→` : Steer Right
  - `Space` / `Enter` : Start or Restart
  - **Mouse / Touch**:
    - **Tap**: Hop forward
    - **Swipe**: Swipe in any direction
    - **On-Screen D-Pad**: Available on mobile and tablets

## ✨ Key Features
- **Authentic Isometric Arcade Camera**: Orthographic camera perspective with soft real-time directional shadows and smooth tracking.
- **Cute Voxel Rooster**: Custom procedural character with animated wings, hop squash-and-stretch physics, and idle pecking.
- **Endless Procedural World**:
  - **Grass Lanes**: Natural rest zones with pine trees, oak trees, rocks, wildflowers, and collectible gold coins.
  - **Busy Roads**: Moving cars, pickup trucks, and long buses in alternating directions.
  - **Rivers & Floating Logs**: Flowing water with floating logs and lilypads; dynamic player attachment to moving logs.
  - **High-Speed Railway**: Flashing red signal lights and warning bells preceding bullet trains.
- **Anti-AFK Predator**: Swooping voxel eagle snatches players who linger too long.
- **Custom Web Audio Synthesizer**: Zero external audio files; all boings, splashes, crashes, bells, and chimes are generated procedurally with Web Audio API.
- **Particle System**: Hop dust puffs, water splashes, voxel explosions, coin sparkles, and celebratory confetti on high scores.
- **Score Persistence**: Automatically stores your best score in `localStorage`.

## 🛠️ Tech Stack
- **Three.js** (WebGL 3D Rendering)
- **Vite** (Next-gen Bundler & Dev Server)
- **Web Audio API** (Procedural Audio Synthesis)
- **Canvas-Confetti** (Milestone Celebrations)
- **Vanilla CSS** (Retro arcade styling & responsive HUD)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
git clone https://github.com/HIMAMANTH-3/crossy-road-3d.git
cd crossy-road-3d
npm install
```

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

## 📄 License
MIT License
