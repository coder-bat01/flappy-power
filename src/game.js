export const WORLD = {
  height: 14,
  left: -3.9,
  top: 6.8,
  bottom: -5.4,
  birdX: -1.4,
  birdRadius: 0.35,
  pipeWidth: 1.55,
};

export const POWERS = [
  {
    id: "ghost",
    name: "Ghost Mode",
    duration: 3,
    cooldown: 14,
    color: "#a78bfa",
  },
  {
    id: "mini",
    name: "Mini Bird",
    duration: 5,
    cooldown: 12,
    color: "#f4b942",
  },
  {
    id: "slow",
    name: "Slow Time",
    duration: 4,
    cooldown: 16,
    color: "#45c6d4",
  },
];

const POWER_BY_ID = Object.fromEntries(
  POWERS.map((power) => [power.id, power]),
);
const GRAVITY = -18.5;
const FLAP_VELOCITY = 6.6;
const PIPE_SPACING = 5.4;
const FIRST_PIPE_X = 4.4;
const MAX_FRAME_TIME = 0.25;
const MAX_STEP = 1 / 120;
const TIMER_EPSILON = 1e-9;

function circleHitsRectangle(y, radius, left, right, bottom, top) {
  const closestX = Math.max(left, Math.min(WORLD.birdX, right));
  const closestY = Math.max(bottom, Math.min(y, top));
  const dx = WORLD.birdX - closestX;
  const dy = y - closestY;
  return dx * dx + dy * dy <= radius * radius;
}

export function createGame({
  random = Math.random,
  onEvent = () => {},
  best = 0,
} = {}) {
  const state = {
    status: "ready",
    y: 0.2,
    vy: 0,
    radius: WORLD.birdRadius,
    score: 0,
    best: Number.isFinite(best) ? Math.max(0, Math.floor(best)) : 0,
    elapsed: 0,
    distance: 0,
    pipes: [],
    activePower: null,
    powerLeft: 0,
    cooldowns: { ghost: 0, mini: 0, slow: 0 },
    shake: 0,
    reason: null,
  };

  let viewportRight = 8;
  let nextPipeId = 1;
  let lastGapY = 0.2;

  function addPipe(x) {
    const gapHeight = 3.9 - Math.min(state.score, 40) * 0.015;
    const margin = 0.8;
    const lowest = WORLD.bottom + gapHeight / 2 + margin;
    const highest = WORLD.top - gapHeight / 2 - margin;
    const low = Math.max(lowest, lastGapY - 1.5);
    const high = Math.min(highest, lastGapY + 1.5);
    const gapY = nextPipeId === 1 ? 0.3 : low + random() * (high - low);
    state.pipes.push({ id: nextPipeId++, x, gapY, gapHeight, passed: false });
    lastGapY = gapY;
  }

  function fillPipes() {
    if (state.pipes.length === 0) addPipe(FIRST_PIPE_X);
    while (
      state.pipes[state.pipes.length - 1].x <
      viewportRight + PIPE_SPACING
    ) {
      addPipe(state.pipes[state.pipes.length - 1].x + PIPE_SPACING);
    }
  }

  function reset() {
    state.status = "ready";
    state.y = 0.2;
    state.vy = 0;
    state.radius = WORLD.birdRadius;
    state.score = 0;
    state.elapsed = 0;
    state.distance = 0;
    state.pipes.length = 0;
    state.activePower = null;
    state.powerLeft = 0;
    state.cooldowns.ghost = 0;
    state.cooldowns.mini = 0;
    state.cooldowns.slow = 0;
    state.shake = 0;
    state.reason = null;
    nextPipeId = 1;
    lastGapY = 0.2;
    fillPipes();
  }

  function start() {
    reset();
    state.status = "playing";
    state.vy = FLAP_VELOCITY;
    onEvent("start");
    return true;
  }

  function flap() {
    if (state.status === "ready" || state.status === "over") {
      start();
    } else if (state.status === "playing") {
      state.vy = FLAP_VELOCITY;
    } else {
      return false;
    }
    onEvent("flap");
    return true;
  }

  function powerReady(id) {
    return (
      Object.hasOwn(POWER_BY_ID, id) &&
      state.status === "playing" &&
      state.activePower === null &&
      state.cooldowns[id] === 0
    );
  }

  function activatePower(id) {
    if (!powerReady(id)) return false;
    const power = POWER_BY_ID[id];
    state.activePower = id;
    state.powerLeft = power.duration;
    state.cooldowns[id] = power.cooldown;
    state.radius = id === "mini" ? WORLD.birdRadius * 0.52 : WORLD.birdRadius;
    onEvent("power", id);
    return true;
  }

  function togglePause() {
    if (state.status === "playing") {
      state.status = "paused";
      onEvent("pause");
      return true;
    }
    if (state.status === "paused") {
      state.status = "playing";
      onEvent("resume");
      return true;
    }
    return false;
  }

  function restart() {
    reset();
  }

  function setViewport(right) {
    if (!Number.isFinite(right)) return;
    viewportRight = right;
    fillPipes();
  }

  function end(reason) {
    state.status = "over";
    state.reason = reason;
    state.shake = 1;
    state.best = Math.max(state.best, state.score);
    onEvent("end", reason);
  }

  function checkCollision() {
    if (state.y - state.radius <= WORLD.bottom) {
      state.y = WORLD.bottom + state.radius;
      end("floor");
      return true;
    }
    if (state.y + state.radius >= WORLD.top) {
      state.y = WORLD.top - state.radius;
      end("ceiling");
      return true;
    }
    if (state.activePower === "ghost") return false;
    const halfWidth = WORLD.pipeWidth / 2;
    for (const pipe of state.pipes) {
      const left = pipe.x - halfWidth;
      const right = pipe.x + halfWidth;
      if (
        right < WORLD.birdX - state.radius ||
        left > WORLD.birdX + state.radius
      )
        continue;
      const gapBottom = pipe.gapY - pipe.gapHeight / 2;
      const gapTop = pipe.gapY + pipe.gapHeight / 2;
      if (
        circleHitsRectangle(
          state.y,
          state.radius,
          left,
          right,
          WORLD.bottom,
          gapBottom,
        ) ||
        circleHitsRectangle(
          state.y,
          state.radius,
          left,
          right,
          gapTop,
          WORLD.top,
        )
      ) {
        end("pipe");
        return true;
      }
    }
    return false;
  }

  function advanceTimers(dt) {
    state.elapsed += dt;
    for (const power of POWERS) {
      const remaining = state.cooldowns[power.id] - dt;
      state.cooldowns[power.id] = remaining > TIMER_EPSILON ? remaining : 0;
    }
    if (state.activePower !== null) {
      state.powerLeft = Math.max(0, state.powerLeft - dt);
      if (state.powerLeft <= TIMER_EPSILON) {
        const endedPower = state.activePower;
        state.activePower = null;
        state.powerLeft = 0;
        state.radius = WORLD.birdRadius;
        onEvent("power-end", endedPower);
      }
    }
  }

  function update(dt) {
    if (!Number.isFinite(dt) || dt <= 0 || state.status === "paused") return;
    let remaining = Math.min(dt, MAX_FRAME_TIME);
    if (state.status !== "playing") {
      state.shake = Math.max(0, state.shake - remaining * 3);
      return;
    }
    while (remaining > TIMER_EPSILON && state.status === "playing") {
      const step = Math.min(
        remaining,
        MAX_STEP,
        state.activePower ? state.powerLeft : MAX_STEP,
      );
      const physicsTime = step * (state.activePower === "slow" ? 0.58 : 1);
      state.y +=
        state.vy * physicsTime + (GRAVITY * physicsTime * physicsTime) / 2;
      state.vy += GRAVITY * physicsTime;
      const motion = (3.4 + Math.min(state.score, 40) * 0.025) * physicsTime;
      state.distance += motion;
      for (const pipe of state.pipes) pipe.x -= motion;
      advanceTimers(step);
      remaining -= step;
      if (state.status !== "playing" || checkCollision()) break;
      for (const pipe of state.pipes) {
        if (
          !pipe.passed &&
          pipe.x + WORLD.pipeWidth / 2 < WORLD.birdX - state.radius
        ) {
          pipe.passed = true;
          state.score += 1;
          state.best = Math.max(state.best, state.score);
          onEvent("score", state.score);
        }
      }
      let expiredCount = 0;
      while (
        expiredCount < state.pipes.length &&
        state.pipes[expiredCount].x + WORLD.pipeWidth / 2 < WORLD.left - 1
      ) {
        expiredCount += 1;
      }
      if (expiredCount > 0) state.pipes.splice(0, expiredCount);
      fillPipes();
    }
  }

  reset();
  return {
    state,
    start,
    flap,
    activatePower,
    togglePause,
    restart,
    update,
    setViewport,
    powerReady,
  };
}
