// Flowchart Quest - Learning Time Analytics & Stage Duration Engine

const TIME_STORAGE_KEY = 'flowchart_stage_times';

/**
 * Get current recorded stage times from LocalStorage
 * @returns {Record<string, number>} Seconds spent per stage
 */
export function getStoredStageTimes() {
  try {
    const raw = localStorage.getItem(TIME_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {
      pretest: 0,
      learning: 0,
      m1: 0,
      m2: 0,
      m3: 0,
      m4: 0,
      final: 0,
      posttest: 0,
      sessionTotal: 0
    };
  } catch {
    return {
      pretest: 0,
      learning: 0,
      m1: 0,
      m2: 0,
      m3: 0,
      m4: 0,
      final: 0,
      posttest: 0,
      sessionTotal: 0
    };
  }
}

/**
 * Increment time spent on a specific stage
 * @param {string} stage 
 * @param {number} secondsToAdd 
 */
export function recordStageTime(stage, secondsToAdd = 1) {
  try {
    const times = getStoredStageTimes();
    const current = times[stage] || 0;
    times[stage] = current + secondsToAdd;
    times.sessionTotal = (times.sessionTotal || 0) + secondsToAdd;
    localStorage.setItem(TIME_STORAGE_KEY, JSON.stringify(times));
    return times;
  } catch {
    return null;
  }
}

/**
 * Format seconds into mm:ss format (e.g. 04:21) or hh:mm:ss
 * @param {number} totalSeconds 
 * @returns {string} Formatted duration string
 */
export function formatDuration(totalSeconds = 0) {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const remainingSeconds = sec % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(remainingSeconds).padStart(2, '0');

  if (hours > 0) {
    const hh = String(hours).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/**
 * Reset stage times (e.g. on new student or session reset)
 */
export function resetStageTimes() {
  try {
    localStorage.removeItem(TIME_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to reset stage times:', err);
  }
}
