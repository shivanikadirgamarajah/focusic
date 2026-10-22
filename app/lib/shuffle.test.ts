
import { describe, it, expect } from "vitest";
import { pickRandomNextTrack } from "./shuffle";

const tracks = [
  { videoId: "song1" },
  { videoId: "song2" },
  { videoId: "song3" },
];

describe("Music shuffle", () => {
  it("returns null when the playlist is empty", () => {
    expect(pickRandomNextTrack([], null)).toBeNull();
  });

  it("does not shuffle a single-track playlist", () => {
    expect(
      pickRandomNextTrack([tracks[0]], tracks[0])
    ).toBeNull();
  });

  it("does not select the currently playing song", () => {
    const result = pickRandomNextTrack(
      tracks,
      tracks[0],
      () => 0
    );

    expect(result?.videoId).toBe("song2");
  });

  it("can select the last available song", () => {
    const result = pickRandomNextTrack(
      tracks,
      tracks[0],
      () => 0.99
    );

    expect(result?.videoId).toBe("song3");
  });

  it("returns null when every track has the current ID", () => {
    const duplicates = [
      { videoId: "song1" },
      { videoId: "song1" },
    ];

    expect(
      pickRandomNextTrack(duplicates, duplicates[0])
    ).toBeNull();
  });

  it("does not modify the original playlist", () => {
    const original = [...tracks];

    pickRandomNextTrack(tracks, tracks[0], () => 0.5);

    expect(tracks).toEqual(original);
  });
});
