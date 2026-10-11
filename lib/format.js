/** 125 → "2:05" */
export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** 125 → "2m 5s", 45 → "45s" */
export function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  return m ? `${m}m ${s % 60}s` : `${s}s`;
}

/** Same labels as the original results page. */
export function scoreLabel(score) {
  if (score >= 80) return { text: "Excellent", tone: "success" };
  if (score >= 50) return { text: "Good job", tone: "warning" };
  return { text: "Keep practicing", tone: "error" };
}

export const optionLetter = (index) => String.fromCharCode(65 + index);
