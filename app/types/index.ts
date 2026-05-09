export type Track = {
  videoId: string;
  title: string;
  channel?: string;
  genre: string;
  focusScore: number;
  reason?: string;
  bestFor: string;
  thumbnail?: string;
  duration?: string;
  timestamp?: number;
};

export const MIN_VISIBLE_FOCUS_SCORE = 6;

export function isVisibleFocusTrack(track: Pick<Track, "focusScore">) {
  return typeof track.focusScore === "number" && track.focusScore > MIN_VISIBLE_FOCUS_SCORE;
}

export function filterVisibleFocusTracks<T extends Pick<Track, "focusScore">>(tracks: T[]) {
  return tracks.filter(isVisibleFocusTrack);
}
