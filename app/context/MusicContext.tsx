"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Track } from "@/app/types";

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
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

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
