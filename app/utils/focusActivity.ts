export const focusActivityUpdatedEvent = "focusActivityUpdated";

export type ActivityData = Record<string, number>;

export function formatLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function readFocusActivity(): ActivityData {
  const saved = window.localStorage.getItem("focusActivity");
  if (!saved) return {};

  try {
    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return parsed as ActivityData;
  } catch {
    return {};
  }
}

export function addFocusActivityMinutes(minutes: number, date = new Date()) {
  const today = formatLocalDateKey(date);
  const activityData = readFocusActivity();

  activityData[today] = (activityData[today] || 0) + minutes;
  window.localStorage.setItem("focusActivity", JSON.stringify(activityData));
  window.dispatchEvent(new Event(focusActivityUpdatedEvent));
}
