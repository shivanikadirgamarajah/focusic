"use client";

import { createContext, useContext, useRef, useState, ReactNode } from "react";
import { filterVisibleFocusTracks, isVisibleFocusTrack, Track } from "@/app/types";

interface MusicContextType {
  currentTrack: Track | null;
  tracks: Track[];
  isPlaying: boolean;
  setCurrentTrack: (track: Track | null) => void;
  setTracks: (tracks: Track[]) => void;
  setIsPlaying: (playing: boolean) => void;
  playNext: () => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrackState] = useState<Track | null>(null);
  const [tracks, setTracksState] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const tracksRef = useRef<Track[]>([]);

  function setTracks(nextTracks: Track[]) {
    const visibleTracks = filterVisibleFocusTracks(nextTracks);
    tracksRef.current = visibleTracks;
    setTracksState(visibleTracks);
    setCurrentTrackState((previousTrack) => {
      if (!previousTrack) return previousTrack;
      const currentTrackIsVisible = visibleTracks.some(
        (track) => track.videoId === previousTrack.videoId
      );
      return currentTrackIsVisible ? previousTrack : visibleTracks[0] || null;
    });
  }

  function setCurrentTrack(track: Track | null) {
    if (!track) {
      setCurrentTrackState(null);
      return;
    }

    const visibleTrack = isVisibleFocusTrack(track) ? track : tracksRef.current[0] || null;

    setCurrentTrackState(visibleTrack);
    // Track listen in history when a track is played
    if (visibleTrack) {
      const listenHistory = JSON.parse(localStorage.getItem("listenHistory") || "[]");
      listenHistory.push(visibleTrack.title);
      localStorage.setItem("listenHistory", JSON.stringify(listenHistory.slice(-20))); // Keep last 20
    }
  }

  function playNext() {
    if (!currentTrack || tracks.length === 0) return;
    const currentIdx = tracks.findIndex(t => t.videoId === currentTrack.videoId);
    const nextIdx = (currentIdx + 1) % tracks.length;
    setCurrentTrack(tracks[nextIdx]);
  }

  return (
    <MusicContext.Provider value={{ currentTrack, tracks, isPlaying, setCurrentTrack, setTracks, setIsPlaying, playNext }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error("useMusic must be used within MusicProvider");
  }
  return context;
}
