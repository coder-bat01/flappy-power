import * as THREE from "three";
import { WORLD } from "./game.js";

export function createScene(container) {
  const geometries = new Set();
  const materials = new Set();
  const geometry = (value) => {
    geometries.add(value);
    return value;
  };
  const material = (value) => {
    materials.add(value);
    return value;
  };
  const matte = (color, extra = {}) =>
    material(
      new THREE.MeshStandardMaterial({ color, roughness: 0.78, ...extra }),
    );
  const flat = (color, extra = {}) =>
    material(new THREE.MeshBasicMaterial({ color, ...extra }));
  const sphere = geometry(new THREE.SphereGeometry(1, 28, 18));
  const box = geometry(new THREE.BoxGeometry(1, 1, 1));
  const disc = geometry(new THREE.CircleGeometry(1, 40));
  const ring = geometry(new THREE.TorusGeometry(0.49, 0.018, 8, 64));
  const scene = new THREE.Scene();
  const sky = new THREE.Color("#d7edf3");
  const slowSky = new THREE.Color("#cdeef0");
  scene.background = sky.clone();

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.domElement.className = "world-canvas";
  renderer.domElement.setAttribute("aria-hidden", "true");
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  container.appendChild(renderer.domElement);

  const camera = new THREE.OrthographicCamera(
    WORLD.left,
    5,
    WORLD.height / 2,
    -WORLD.height / 2,
    0.1,
    100,
  );
  camera.position.set(0, 0, 24);
  scene.add(new THREE.HemisphereLight("#fff9e4", "#80b5a4", 2.4));
  const sunlight = new THREE.DirectionalLight("#fff2ce", 3.1);
  sunlight.position.set(-5, 8, 12);
  scene.add(sunlight);
  const fill = new THREE.DirectionalLight("#ccefff", 0.85);
  fill.position.set(7, 2, 7);
  scene.add(fill);

  function mesh(shape, surface, parent, x, y, z, sx = 1, sy = sx, sz = sx) {
    const object = new THREE.Mesh(shape, surface);
    object.position.set(x, y, z);
    object.scale.set(sx, sy, sz);
    parent.add(object);
    return object;
  }

  // Flat silhouettes sit well behind the collision plane; rounded objects catch the soft key light.
  const scenery = new THREE.Group();
  scene.add(scenery);
  function hillLayer(color, baseline, peaks, depth) {
    const shape = new THREE.Shape();
    shape.moveTo(-32, -9);
    shape.lineTo(-32, baseline);
    for (let index = 0; index < peaks.length; index += 1) {
      const x = -32 + index * 12;
      shape.bezierCurveTo(
        x + 3,
        baseline + peaks[index],
        x + 8,
        baseline + peaks[index],
        x + 12,
        baseline,
      );
    }
    shape.lineTo(64, -9);
    shape.closePath();
    return mesh(
      geometry(new THREE.ShapeGeometry(shape, 24)),
      flat(color),
      scenery,
      0,
      0,
      depth,
    );
  }
  const farHills = hillLayer(
    "#b5d9cf",
    -3.35,
    [2.4, 1.65, 2.7, 1.4, 2.2, 1.9, 2.6, 1.7],
    -10,
  );
  const middleHills = hillLayer(
    "#8ec7ae",
    -4.05,
    [1.25, 1.75, 1.1, 1.9, 1.4, 1.8, 1.3, 1.6],
    -8,
  );
  const nearHills = hillLayer(
    "#70b69b",
    -4.8,
    [0.85, 0.55, 1.05, 0.65, 0.9, 0.55, 0.95, 0.7],
    -6,
  );

  const sunGlow = flat("#fff4c8", {
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
  });
  const sunCore = flat("#fff5d6");
  const sun = new THREE.Group();
  mesh(disc, sunGlow, sun, 0, 0, 0, 1.3);
  mesh(disc, sunGlow, sun, 0, 0, 0.01, 1.02);
  mesh(disc, sunCore, sun, 0, 0, 0.02, 0.75);
  sun.position.set(3, 4.2, -16);
  scene.add(sun);

  const cloudWhite = matte("#fffdf0");
  const cloudShade = matte("#edf4e9");
  const clouds = [];
  for (let index = 0; index < 13; index += 1) {
    const cloud = new THREE.Group();
    const size = 0.6 + (index % 4) * 0.12;
    mesh(sphere, cloudShade, cloud, 0, -0.13, -0.08, 1.1, 0.28, 0.3);
    mesh(sphere, cloudWhite, cloud, -0.59, 0, 0, 0.51, 0.36, 0.3);
    mesh(sphere, cloudWhite, cloud, -0.08, 0.17, 0.03, 0.58, 0.51, 0.34);
    mesh(sphere, cloudWhite, cloud, 0.51, 0.05, 0, 0.57, 0.39, 0.29);
    cloud.scale.setScalar(size);
    const baseX = -8 + index * 3.5;
    const baseY = 1.8 + ((index * 7) % 9) * 0.45;
    cloud.position.set(baseX, baseY, -12 - (index % 3));
    scene.add(cloud);
    clouds.push({
      object: cloud,
      baseX,
      baseY,
      speed: 0.05 + (index % 3) * 0.017,
      phase: index * 1.9,
    });
  }

  const shrubs = new THREE.Group();
  scene.add(shrubs);
  const shrubMaterial = matte("#7abe9e");
  const shrubLight = matte("#a6d3af");
  for (let index = 0; index < 35; index += 1) {
    const x = -10 + index * 1.25;
    mesh(
      sphere,
      index % 3 ? shrubMaterial : shrubLight,
      shrubs,
      x,
      -5.16,
      -3.5,
      0.65,
      0.37 + (index % 3) * 0.09,
      0.28,
    );
  }

  const ground = new THREE.Group();
  scene.add(ground);
  const groundWidth = 90;
  mesh(box, matte("#ead6ad"), ground, 18, -6.65, 0.1, groundWidth, 2.5, 1.2);
  mesh(
    box,
    matte("#b5d79b"),
    ground,
    18,
    WORLD.bottom - 0.1,
    0.8,
    groundWidth,
    0.22,
    0.4,
  );
  mesh(
    box,
    matte("#d5e5ad"),
    ground,
    18,
    WORLD.bottom - 0.027,
    1.02,
    groundWidth,
    0.06,
    0.03,
  );
  const groundDashes = new THREE.Group();
  scene.add(groundDashes);
  const dashMaterial = flat("#d2bc92");
  for (let index = 0; index < 48; index += 1) {
    const dash = mesh(
      box,
      dashMaterial,
      groundDashes,
      -10 + index * 1.1,
      -5.89 + (index % 3) * 0.08,
      0.73,
      0.31,
      0.035,
      0.02,
    );
    dash.rotation.z = -0.2;
  }

  const bodyGeometry = geometry(
    new THREE.CylinderGeometry(
      WORLD.pipeWidth * 0.445,
      WORLD.pipeWidth * 0.445,
      1,
      40,
    ),
  );
  const collarGeometry = geometry(
    new THREE.CylinderGeometry(WORLD.pipeWidth / 2, WORLD.pipeWidth / 2, 1, 40),
  );
  const rimGeometry = geometry(
    new THREE.TorusGeometry(WORLD.pipeWidth / 2 - 0.035, 0.035, 10, 40),
  );
  const highlightGeometry = geometry(
    new THREE.CylinderGeometry(0.027, 0.027, 1, 12),
  );
  const pipeMaterial = matte("#65cdaa");
  const collarMaterial = matte("#88e1bc");
  const rimMaterial = matte("#b2edca");
  const highlightMaterial = matte("#a5e6c1");
  const pipePairs = new Map();
  const pipePool = [];
  const presentPipes = new Set();

  function makeSegment(parent) {
    const group = new THREE.Group();
    parent.add(group);
    const body = mesh(bodyGeometry, pipeMaterial, group, 0, 0, 0);
    const collar = mesh(
      collarGeometry,
      collarMaterial,
      group,
      0,
      0,
      0,
      1,
      0.24,
      1,
    );
    const rim = mesh(rimGeometry, rimMaterial, group, 0, 0, 0);
    rim.rotation.x = Math.PI / 2;
    const highlight = mesh(
      highlightGeometry,
      highlightMaterial,
      group,
      -0.3,
      0,
      0.62,
    );
    return { group, body, collar, rim, highlight };
  }

  function setSegment(segment, low, high, openingAtBottom) {
    const height = Math.max(0, high - low);
    segment.group.visible = height > 0;
    segment.body.position.y = (low + high) / 2;
    segment.body.scale.y = height;
    const collarHeight = Math.min(0.24, height);
    segment.collar.scale.y = collarHeight;
    segment.collar.position.y = openingAtBottom
      ? low + collarHeight / 2
      : high - collarHeight / 2;
    segment.rim.visible = height > 0.075;
    segment.rim.position.y = openingAtBottom ? low + 0.036 : high - 0.036;
    segment.highlight.position.y = (low + high) / 2;
    segment.highlight.scale.y = Math.max(0, height - collarHeight * 2);
  }

  function syncPipes(pipes) {
    presentPipes.clear();
    for (const pipe of pipes) {
      presentPipes.add(pipe.id);
      let pair = pipePairs.get(pipe.id);
      if (!pair) {
        pair = pipePool.pop();
        if (!pair) {
          const group = new THREE.Group();
          scene.add(group);
          pair = { group, top: makeSegment(group), bottom: makeSegment(group) };
        }
        pair.group.visible = true;
        pipePairs.set(pipe.id, pair);
      }
      pair.group.position.x = pipe.x;
      setSegment(pair.top, pipe.gapY + pipe.gapHeight / 2, WORLD.top, true);
      setSegment(
        pair.bottom,
        WORLD.bottom,
        pipe.gapY - pipe.gapHeight / 2,
        false,
      );
    }
    for (const [id, pair] of pipePairs) {
      if (!presentPipes.has(id)) {
        pair.group.visible = false;
        pipePairs.delete(id);
        pipePool.push(pair);
      }
    }
  }

  const bird = new THREE.Group();
  bird.position.z = 2;
  scene.add(bird);
  const birdSurfaces = [];
  function birdMaterial(color) {
    const surface = matte(color, { transparent: true });
    birdSurfaces.push({ surface, color: new THREE.Color(color) });
    return surface;
  }
  const yellow = birdMaterial("#ffd25c");
  const belly = birdMaterial("#ffe7a0");
  const orange = birdMaterial("#f6a13c");
  const beakMaterial = birdMaterial("#ed8536");
  const eyeWhite = birdMaterial("#fffef6");
  const ink = birdMaterial("#294c40");
  mesh(sphere, yellow, bird, 0, 0, 0, 0.27, 0.29, 0.24);
  mesh(sphere, belly, bird, 0.056, -0.077, 0.169, 0.18, 0.19, 0.084);
  const tailGeometry = geometry(new THREE.ConeGeometry(0.067, 0.14, 16));
  const tail = mesh(tailGeometry, orange, bird, -0.275, -0.063, 0);
  tail.rotation.z = Math.PI / 2 + 0.24;
  const crest = mesh(
    sphere,
    orange,
    bird,
    -0.08,
    0.264,
    -0.015,
    0.035,
    0.07,
    0.038,
  );
  crest.rotation.z = 0.35;
  const secondCrest = mesh(
    sphere,
    yellow,
    bird,
    -0.022,
    0.278,
    -0.013,
    0.031,
    0.06,
    0.031,
  );
  secondCrest.rotation.z = -0.12;
  const wing = new THREE.Group();
  wing.position.set(-0.12, -0.048, 0.232);
  bird.add(wing);
  mesh(sphere, orange, wing, -0.025, 0, 0, 0.145, 0.086, 0.042);
  const feather = mesh(
    sphere,
    belly,
    wing,
    -0.055,
    -0.018,
    0.034,
    0.071,
    0.021,
    0.014,
  );
  feather.rotation.z = -0.2;
  mesh(sphere, eyeWhite, bird, 0.113, 0.101, 0.197, 0.104, 0.11, 0.058);
  mesh(sphere, ink, bird, 0.144, 0.103, 0.248, 0.041, 0.052, 0.022);
  mesh(sphere, eyeWhite, bird, 0.151, 0.121, 0.268, 0.014, 0.018, 0.009);
  const beakGeometry = geometry(new THREE.ConeGeometry(0.069, 0.14, 20));
  const beak = mesh(
    beakGeometry,
    beakMaterial,
    bird,
    0.27,
    0.005,
    0.079,
    1,
    1,
    0.83,
  );
  beak.rotation.z = -Math.PI / 2;

  const aura = new THREE.Group();
  bird.add(aura);
  const ghostMaterial = flat("#e8e2ff", {
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  const ghostRingMaterial = flat("#f8f0ff", {
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  });
  mesh(sphere, ghostMaterial, aura, 0, 0, -0.08, 0.49, 0.49, 0.28);
  const ghostRing = mesh(ring, ghostRingMaterial, aura, 0, 0, 0.03);
  ghostRing.rotation.x = 0.35;
  const ghostDots = [];
  for (let index = 0; index < 7; index += 1) {
    ghostDots.push(
      mesh(
        sphere,
        ghostRingMaterial,
        aura,
        0,
        0,
        0.06,
        0.025 + (index % 2) * 0.008,
      ),
    );
  }
  const miniAura = new THREE.Group();
  bird.add(miniAura);
  const miniMaterial = flat("#fff7cc", {
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  for (let index = 0; index < 4; index += 1) {
    const spark = mesh(
      box,
      miniMaterial,
      miniAura,
      Math.cos((index * Math.PI) / 2) * 0.48,
      Math.sin((index * Math.PI) / 2) * 0.48,
      0.08,
      0.068,
      0.068,
      0.018,
    );
    spark.rotation.z = Math.PI / 4;
  }

  const slowAura = new THREE.Group();
  bird.add(slowAura);
  const cyanMaterial = flat("#76e9e9", {
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
  });
  mesh(ring, cyanMaterial, slowAura, 0, 0, -0.13, 1.13);
  for (let index = 0; index < 12; index += 1) {
    const angle = (index * Math.PI) / 6;
    const tick = mesh(
      box,
      cyanMaterial,
      slowAura,
      Math.cos(angle) * 0.55,
      Math.sin(angle) * 0.55,
      -0.11,
      0.012,
      0.053,
      0.01,
    );
    tick.rotation.z = angle - Math.PI / 2;
  }

  const slowStreaks = new THREE.Group();
  scene.add(slowStreaks);
  const streakMaterial = flat("#78dfdf", {
    transparent: true,
    opacity: 0.27,
    depthWrite: false,
  });
  const streaks = [];
  for (let index = 0; index < 22; index += 1) {
    const streak = mesh(
      box,
      streakMaterial,
      slowStreaks,
      0,
      -4.4 + ((index * 1.83) % 9.4),
      -1,
      0.22 + (index % 3) * 0.13,
      0.023,
      0.015,
    );
    streaks.push(streak);
  }

  const shadowMaterial = flat("#405b4a", {
    transparent: true,
    opacity: 0.13,
    depthWrite: false,
  });
  const birdShadow = mesh(
    disc,
    shadowMaterial,
    scene,
    WORLD.birdX,
    WORLD.bottom - 0.04,
    1.08,
    0.44,
    0.047,
    1,
  );
  const ghostColor = new THREE.Color("#9670c9");
  let time = 0;
  let right = 5;
  let disposed = false;

  function resize() {
    if (disposed) return right;
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    right = WORLD.left + (WORLD.height * width) / height;
    camera.left = WORLD.left;
    camera.right = right;
    camera.top = WORLD.height / 2;
    camera.bottom = -WORLD.height / 2;
    camera.updateProjectionMatrix();
    sun.position.x = WORLD.left + (right - WORLD.left) * 0.76;
    return right;
  }

  function render(state, dt) {
    if (disposed) return;
    const step =
      state.status === "paused" ? 0 : Math.max(0, Math.min(dt || 0, 0.05));
    time += step;
    const distance = state.distance || 0;
    syncPipes(state.pipes);
    const idle = state.status === "ready";
    bird.position.set(
      WORLD.birdX,
      state.y + (idle ? Math.sin(time * 2.7) * 0.105 : 0),
      2,
    );
    bird.scale.setScalar(state.radius / WORLD.birdRadius);
    bird.rotation.z = idle
      ? Math.sin(time * 2.1) * 0.04
      : THREE.MathUtils.clamp(state.vy * 0.038, -0.48, 0.28);
    wing.rotation.z =
      Math.sin(time * (state.activePower === "slow" ? 9 : 17)) * 0.45 - 0.12;
    const ghost = state.activePower === "ghost";
    for (const { surface, color } of birdSurfaces) {
      surface.color.copy(color);
      if (ghost) surface.color.lerp(ghostColor, 0.68);
      surface.opacity = ghost ? 0.72 : 1;
      surface.emissive.copy(ghostColor);
      surface.emissiveIntensity = ghost ? 0.03 : 0;
      surface.depthWrite = !ghost;
    }
    aura.visible = ghost;
    ghostRing.rotation.z = time * 0.5;
    for (let index = 0; index < ghostDots.length; index += 1) {
      const angle = time * 1.2 + (index * Math.PI * 2) / ghostDots.length;
      ghostDots[index].position.set(
        Math.cos(angle) * 0.46,
        Math.sin(angle) * 0.46,
        0.09,
      );
    }
    miniAura.visible = state.activePower === "mini";
    miniAura.rotation.z = time * 0.65;
    const slow = state.activePower === "slow";
    slowAura.visible = slow;
    slowAura.rotation.z = -time * 0.4;
    slowStreaks.visible = slow;
    for (let index = 0; index < streaks.length; index += 1) {
      const span = right - WORLD.left + 2;
      streaks[index].position.x =
        WORLD.left - 1 + ((index * 1.91 + time * 0.4) % span);
    }
    scene.background.copy(sky).lerp(slowSky, slow ? 0.8 : 0);
    farHills.position.x = -(distance * 0.025) % 12;
    middleHills.position.x = -(distance * 0.05) % 12;
    nearHills.position.x = -(distance * 0.09) % 12;
    shrubs.position.x = -(distance * 0.2) % 1.25;
    groundDashes.position.x = -distance % 1.1;
    for (const cloud of clouds) {
      cloud.object.position.x =
        -10 +
        ((cloud.baseX +
          10 +
          52 -
          ((distance * cloud.speed + time * 0.024) % 52)) %
          52);
      cloud.object.position.y =
        cloud.baseY + Math.sin(time * 0.36 + cloud.phase) * 0.055;
    }
    const altitude = THREE.MathUtils.clamp(
      (bird.position.y - WORLD.bottom) / WORLD.height,
      0,
      1,
    );
    birdShadow.scale.x = 0.4 + altitude * 0.22;
    birdShadow.position.x = WORLD.birdX;
    shadowMaterial.opacity = ghost ? 0.04 : 0.16 - altitude * 0.09;
    const shake = state.shake || 0;
    camera.position.x = Math.sin(time * 61) * shake * 0.09;
    camera.position.y = Math.cos(time * 49) * shake * 0.075;
    renderer.render(scene, camera);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    for (const value of geometries) value.dispose();
    for (const value of materials) value.dispose();
    pipePairs.clear();
    pipePool.length = 0;
    scene.clear();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  }

  resize();
  return { render, resize, dispose };
}
