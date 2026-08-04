import { createGameTimer, elapsedGameMs, finishGameTimer, formatGameTime, normalizeGameTimer, pauseGameTimer, resumeGameTimer, type GameTimer } from "./scoring";

interface PerformanceState {
  complete: boolean;
  timer?: GameTimer;
  points?: number | null;
}

interface PerformanceOptions {
  getState: () => PerformanceState;
  save: () => void;
  calculatePoints: (elapsedMs: number) => number;
  showLivePoints?: boolean;
  timeSelector?: string;
  pointsSelector?: string;
}

export function attachGamePerformance(root: ParentNode, options: PerformanceOptions) {
  const timeNode = root.querySelector(options.timeSelector || "[data-game-time]");
  const pointsNode = root.querySelector(options.pointsSelector || "[data-game-points]");

  function ensureTimer() {
    const state = options.getState();
    state.timer = normalizeGameTimer(state.timer, state.complete);
    return state.timer;
  }

  function render() {
    const state = options.getState();
    const timer = ensureTimer();
    const elapsed = elapsedGameMs(timer);
    const timeText = timer.eligible ? formatGameTime(elapsed) : "—";
    if (timeNode && timeNode.textContent !== timeText) timeNode.textContent = timeText;
    if (pointsNode) {
      const value = state.complete ? state.points : options.showLivePoints ? options.calculatePoints(elapsed) : null;
      const pointsText = Number.isFinite(value) ? Math.max(0, Math.floor(value as number)).toLocaleString() : "—";
      if (pointsNode.textContent !== pointsText) pointsNode.textContent = pointsText;
    }
  }

  function reset(now = Date.now()) {
    const state = options.getState();
    state.timer = createGameTimer(now);
    state.points = null;
    render();
    options.save();
  }

  function finish(now = Date.now()) {
    const state = options.getState();
    const timer = ensureTimer();
    finishGameTimer(timer, now);
    state.points = timer.eligible ? options.calculatePoints(elapsedGameMs(timer, now)) : null;
    render();
    options.save();
    return state.points;
  }

  function pause(now = Date.now()) {
    pauseGameTimer(ensureTimer(), now);
    options.save();
    render();
  }

  function resume(now = Date.now()) {
    if (!options.getState().complete) resumeGameTimer(ensureTimer(), now);
    options.save();
    render();
  }

  const onVisibility = () => document.hidden ? pause() : resume();
  const onPageHide = () => pause();
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", onPageHide);
  const interval = window.setInterval(render, 1000);
  ensureTimer();
  render();
  options.save();

  return {
    finish,
    pause,
    render,
    reset,
    resume,
    destroy() {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    }
  };
}
