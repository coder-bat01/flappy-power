# Flappy Power ⚡🐦

A modern 3D browser-based Flappy Bird game built with Three.js featuring procedural 3D scenery, responsive desktop & mobile vertical layout, synthesized Web Audio sound effects, and 3 gameplay superpowers.

No external image, 3D model, or audio asset downloads are required at runtime — everything is procedurally modeled with Three.js and synthesized using the Web Audio API.

---

## 🎮 Superpowers

| Power                   | Duration | Cooldown | Effect                                                                           |
| :---------------------- | :------: | :------: | :------------------------------------------------------------------------------- |
| **👻 Ghost Mode** (`1`) |    3s    |   14s    | Pass directly through obstacle pipes. Ground and ceiling remain solid.           |
| **🐥 Mini Bird** (`2`)  |    5s    |   12s    | Shrink the bird and its collision radius to 52% to navigate tighter gaps easily. |
| **⏱️ Slow Time** (`3`)  |    4s    |   16s    | Slow bird physics and obstacle speed to 58% for precise maneuvers.               |

> Only one power can be active at a time. Powers recharge in real-time while flying and pause when the game is paused.

---

## 🕹️ Controls

| Action                  | Keyboard                         | Touch / Mouse                  |
| :---------------------- | :------------------------------- | :----------------------------- |
| **Flap Wings**          | <kbd>Space</kbd> or <kbd>↑</kbd> | Click or Tap the sky           |
| **Activate Ghost Mode** | <kbd>1</kbd>                     | Tap the Ghost power card       |
| **Activate Mini Bird**  | <kbd>2</kbd>                     | Tap the Mini power card        |
| **Activate Slow Time**  | <kbd>3</kbd>                     | Tap the Slow power card        |
| **Pause / Resume**      | <kbd>P</kbd> or <kbd>Esc</kbd>   | Tap the Pause button           |
| **Restart Flight**      | <kbd>R</kbd>                     | Tap "Fly again" on Game Over   |
| **Toggle Sound**        | —                                | Tap the Sound button in header |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- WebGL-enabled web browser

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/your-username/flappy-power.git
cd flappy-power

# Install dependencies
npm install

# Run the local development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
# Compile and optimize for production
npm run build

# Preview the production build locally
npm run preview
```

The production output will be generated in the `dist/` directory, ready to deploy to GitHub Pages, Vercel, Netlify, or any static host.

---

## 📁 Project Architecture

```
flappy-power/
├── index.html          # Main HTML structure with SVG icon library & accessible dialogs
├── package.json        # Dependencies (Three.js, Vite) and build scripts
├── vite.config.js      # Vite build configuration with vendor chunk splitting
├── .gitignore          # Git exclusion rules for node_modules, build artifacts, etc.
└── src/
    ├── main.js         # Controls, HUD updates, Web Audio sound effects, and main loop
    ├── game.js         # Core simulation, collision detection, pipe spawning, and power state
    ├── scene.js        # Three.js 3D world: bird, pipes, clouds, hills, ground, and lighting
    └── style.css       # Responsive vertical arcade layout, glassmorphic HUD, and themes
```

---

## 🛠️ Built With

- [Three.js](https://threejs.org/) — 3D graphics rendering and animation
- [Vite](https://vite.dev/) — Fast frontend tooling and bundling
- Web Audio API — Real-time programmatic sound synthesis
- HTML5 Canvas & WebGL — Hardware-accelerated rendering

---

## 📄 License

MIT License. Free to use, modify, and distribute.
