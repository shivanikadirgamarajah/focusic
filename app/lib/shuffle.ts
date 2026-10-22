
export function pickRandomNextTrack<T extends { videoId: string }>(
  tracks: readonly T[],
  currentTrack: T | null | undefined,
  random: () => number = Math.random
): T | null {
  if (tracks.length <= 1) return null;

  const availableTracks = tracks.filter(
    (track) => track.videoId !== currentTrack?.videoId
  );

  if (availableTracks.length === 0) return null;

  const randomIndex = Math.floor(random() * availableTracks.length);

  return availableTracks[randomIndex] ?? null;
}
