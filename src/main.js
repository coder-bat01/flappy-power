import "./style.css";
import { createGame, POWERS } from "./game.js";
import { createScene } from "./scene.js";

const $ = (id) => document.getElementById(id);
const stage = $("game-stage");
const overlay = $("game-overlay");
const help = $("help-dialog");
const powers = POWERS.map((power) => ({
  ...power,
  button: $(`power-${power.id}`),
  label: $(`status-${power.id}`),
}));
const powerById = Object.fromEntries(powers.map((power) => [power.id, power]));

function loadPreference(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}
function savePreference(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* Play remains available when storage is blocked. */
  }
}

let muted = loadPreference("flappy-power-muted", "0") === "1";
let audio;
let toastTimeout;
let lastStatus;
let lastScore = -1;
let lastBest = -1;
let helpWasPlaying = false;

function unlockAudio() {
  if (muted) return;
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return;
  audio ??= new Audio();
  if (audio.state === "suspended") audio.resume().catch(() => {});
}

function note(
  frequency,
  length,
  type = "sine",
  delay = 0,
  endFrequency = frequency,
  volume = 0.045,
) {
  if (muted || !audio || audio.state !== "running") return;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  const start = audio.currentTime + delay;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(
    endFrequency,
    start + length,
  );
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.001, start + length);
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(start + length + 0.01);
  oscillator.onended = () => {
    oscillator.disconnect();
    gain.disconnect();
  };
}

function announce(message) {
  $("announcements").textContent = message;
}
function toast(message) {
  clearTimeout(toastTimeout);
  $("toast").textContent = message;
  $("toast").hidden = false;
  toastTimeout = setTimeout(() => {
    $("toast").hidden = true;
  }, 2300);
}

const game = createGame({
  best: Number(loadPreference("flappy-power-best", "0")),
  onEvent(type, detail) {
    if (type === "flap") note(430, 0.08, "sine", 0, 730, 0.025);
    if (type === "score") {
      note(880, 0.12, "sine");
      note(1174, 0.16, "sine", 0.07);
      savePreference("flappy-power-best", game.state.best);
    }
    if (type === "power") {
      note(523, 0.15, "triangle");
      note(659, 0.15, "triangle", 0.07);
      note(784, 0.2, "triangle", 0.14);
      announce(`${powerById[detail].name} activated.`);
    }
    if (type === "power-end") announce(`${powerById[detail].name} ended.`);
    if (type === "end") {
      note(230, 0.35, "triangle", 0, 75, 0.07);
      savePreference("flappy-power-best", game.state.best);
      announce(
        `Flight over. Score ${game.state.score}. Best ${game.state.best}. Press Space to fly again.`,
      );
    }
    if (type === "pause")
      announce("Game paused. Press P or select Resume flight.");
    if (type === "resume") announce("Flight resumed.");
  },
});

let scene;
try {
  scene = createScene($("world"));
} catch (error) {
  $("loading-error").textContent =
    "This flight needs WebGL. Enable hardware acceleration in your browser, then reload to play.";
  $("loading-error").hidden = false;
  $("start-button").disabled = true;
  console.error("Unable to initialize the Three.js scene:", error);
}

function syncSoundButton() {
  $("sound-icon").setAttribute("href", muted ? "#icon-muted" : "#icon-sound");
  $("sound-button").setAttribute("aria-pressed", String(muted));
  $("sound-button").setAttribute(
    "aria-label",
    muted ? "Unmute sound" : "Mute sound",
  );
  $("sound-button").title = muted ? "Unmute sound" : "Mute sound";
}

function renderUI() {
  const state = game.state;
  if (state.score !== lastScore) {
    $("score").textContent = String(state.score).padStart(2, "0");
    lastScore = state.score;
  }
  if (state.best !== lastBest) {
    $("best").textContent = String(state.best).padStart(2, "0");
    lastBest = state.best;
  }
  if (state.status !== lastStatus) {
    lastStatus = state.status;
    stage.dataset.state = state.status;
    overlay.hidden = state.status === "playing";
    $("pause-button").disabled = !["playing", "paused"].includes(state.status);
    $("pause-button").setAttribute(
      "aria-label",
      state.status === "paused" ? "Resume game" : "Pause game",
    );
    $("pause-button").title =
      state.status === "paused" ? "Resume (P)" : "Pause (P)";
    $("pause-icon").setAttribute(
      "href",
      state.status === "paused" ? "#icon-play" : "#icon-pause",
    );
    $("result-stats").hidden = state.status !== "over";
    $("overlay-symbol").hidden = state.status === "over";
    if (state.status === "ready") {
      $("overlay-eyebrow").textContent = "A LITTLE BIRD. A BIG UPGRADE.";
      $("overlay-title").textContent = "Ready to take flight?";
      $("overlay-description").textContent =
        "Same tiny wings. A few new tricks.";
      $("start-label").textContent = "Let's fly";
    } else if (state.status === "over") {
      $("overlay-eyebrow").textContent =
        state.score > 0 && state.score === state.best
          ? "YOUR BEST FLIGHT YET"
          : "EVERY FLIGHT IS A FRESH START";
      $("overlay-title").textContent = "One more?";
      $("overlay-description").textContent =
        state.reason === "pipe"
          ? "Those pipes are tougher than they look."
          : state.reason === "ceiling"
            ? "The sky has a limit. Your next score doesn’t."
            : "A little more flap, a little less gravity.";
      $("result-score").textContent = state.score;
      $("result-best").textContent = state.best;
      $("start-label").textContent = "Fly again";
    } else if (state.status === "paused") {
      $("overlay-eyebrow").textContent = "A MOMENT TO CATCH YOUR BREATH";
      $("overlay-title").textContent = "Just winging it?";
      $("overlay-description").textContent =
        "Your flight and power timers are on hold.";
      $("start-label").textContent = "Resume flight";
    }
    $("overlay-hint").hidden = state.status === "paused";
    $("flight-status-text").textContent =
      state.status === "paused"
        ? "ON A BREAK"
        : state.status === "over"
          ? "FLIGHT COMPLETE"
          : "CLEAR SKIES";
  }

  for (const power of powers) {
    const active = state.activePower === power.id;
    const cooldown = state.cooldowns[power.id];
    power.button.classList.toggle("active", active);
    power.button.disabled =
      state.status === "paused" ||
      state.status === "over" ||
      (state.status === "playing" && !game.powerReady(power.id));
    power.button.style.setProperty(
      "--charge",
      active ? state.powerLeft / power.duration : 1 - cooldown / power.cooldown,
    );
    const text = active
      ? `${state.powerLeft.toFixed(1)}s`
      : cooldown > 0
        ? `${Math.ceil(cooldown)}s`
        : state.activePower
          ? "WAIT"
          : "READY";
    if (power.label.textContent !== text) power.label.textContent = text;
  }
  $("active-power").hidden =
    state.activePower === null || state.status === "over";
  if (state.activePower) {
    const power = powerById[state.activePower];
    $("active-power-name").textContent = power.name;
    $("active-power-timer").textContent = `${state.powerLeft.toFixed(1)}s`;
    $("active-power").style.setProperty("--power-color", power.color);
    $("active-meter-fill").style.transform =
      `scaleX(${state.powerLeft / power.duration})`;
    if (state.status === "playing")
      $("flight-status-text").textContent = "POWERED UP";
  } else if (state.status === "playing")
    $("flight-status-text").textContent = "CLEAR SKIES";
}

function flap() {
  if (!scene) return;
  unlockAudio();
  game.flap();
  renderUI();
}
function activate(id) {
  if (!scene) return;
  unlockAudio();
  if (game.state.status === "ready") {
    toast("Take flight first. Your powers are ready when you are.");
    return;
  }
  if (!game.activatePower(id) && game.state.status === "playing") {
    toast(
      game.state.activePower
        ? "One superpower at a time. Let this one finish."
        : "That power is recharging. Try another.",
    );
  }
  renderUI();
}
function pause() {
  game.togglePause();
  renderUI();
}
function restart() {
  if (!scene) return;
  game.start();
  announce("New flight. All powers ready.");
  renderUI();
}

$("start-button").addEventListener("click", () => {
  if (game.state.status === "paused") pause();
  else flap();
  stage.focus({ preventScroll: true });
});
$("pause-button").addEventListener("click", pause);
for (const power of powers)
  power.button.addEventListener("click", () => activate(power.id));
stage.addEventListener("pointerdown", (event) => {
  if (
    event.button !== 0 ||
    event.target.closest("button, .overlay-card, .loading-error")
  )
    return;
  event.preventDefault();
  stage.focus({ preventScroll: true });
  flap();
});
$("sound-button").addEventListener("click", () => {
  muted = !muted;
  savePreference("flappy-power-muted", muted ? "1" : "0");
  syncSoundButton();
  unlockAudio();
  if (!muted) note(660, 0.12);
});

$("help-button").addEventListener("click", () => {
  helpWasPlaying = game.state.status === "playing";
  if (helpWasPlaying) pause();
  help.showModal();
});
$("close-help").addEventListener("click", () => help.close());
$("help-done").addEventListener("click", () => help.close());
help.addEventListener("close", () => {
  if (helpWasPlaying && game.state.status === "paused") pause();
  helpWasPlaying = false;
});
help.addEventListener("click", (event) => {
  const bounds = help.getBoundingClientRect();
  if (
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom
  )
    help.close();
});

window.addEventListener("keydown", (event) => {
  if (
    help.open ||
    event.repeat ||
    event.ctrlKey ||
    event.altKey ||
    event.metaKey ||
    /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)
  )
    return;
  if (event.code === "Space" || event.code === "ArrowUp") {
    if (event.code === "Space" && event.target.closest("button")) return;
    event.preventDefault();
    flap();
  } else if (
    ["Digit1", "Digit2", "Digit3", "Numpad1", "Numpad2", "Numpad3"].includes(
      event.code,
    )
  ) {
    event.preventDefault();
    activate(powers[Number(event.code.slice(-1)) - 1].id);
  } else if (event.code === "KeyP" || event.code === "Escape") {
    event.preventDefault();
    pause();
  } else if (event.code === "KeyR") {
    event.preventDefault();
    restart();
  }
});
function pauseWhenAway() {
  if (game.state.status === "playing") pause();
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pauseWhenAway();
});
window.addEventListener("blur", pauseWhenAway);

syncSoundButton();
renderUI();
if (scene) {
  const resizeObserver = new ResizeObserver(() =>
    game.setViewport(scene.resize()),
  );
  resizeObserver.observe($("world"));
  game.setViewport(scene.resize());
  let previous = performance.now();
  let frameId;
  function frame(now) {
    const dt = Math.min((now - previous) / 1000, 0.05);
    previous = now;
    game.update(dt);
    scene.render(game.state, game.state.status === "paused" ? 0 : dt);
    renderUI();
    frameId = requestAnimationFrame(frame);
  }
  frameId = requestAnimationFrame(frame);
  if (import.meta.hot)
    import.meta.hot.dispose(() => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      scene.dispose();
      audio?.close();
    });
}
