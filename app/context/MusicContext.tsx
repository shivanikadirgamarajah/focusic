"use client";

import { createContext, useContext, useRef, useState, ReactNode, useEffect } from "react";
import { filterVisibleFocusTracks, isVisibleFocusTrack, Track } from "@/app/types";

interface MusicContextType {
  currentTrack: Track | null;
  tracks: Track[];
  isPlaying: boolean;
  setCurrentTrack: (track: Track | null) => void;
  setTracks: (tracks: Track[]) => void;
  setIsPlaying: (playing: boolean) => void;
  playNext: () => void;
  musicListeningSeconds: number;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

function formatLocalDate(date: Date) {
  return date.toLocaleDateString("en-CA");
}

export function MusicProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrackState] = useState<Track | null>(null);
  const [tracks, setTracksState] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [musicListeningSeconds, setMusicListeningSeconds] = useState(0);
  const tracksRef = useRef<Track[]>([]);
  const lastSaveTimeRef = useRef(Date.now());
  const hasLoggedTodayRef = useRef(false);

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

  // Track music listening time and update focus time every minute
  useEffect(() => {
    if (!isPlaying) return;

    // Log initial activity for the day when user starts playing
    if (!hasLoggedTodayRef.current) {
      try {
        const today = formatLocalDate(new Date());
        const activityData = JSON.parse(localStorage.getItem("focusActivity") || "{}") as Record<string, number>;
        
        // Only initialize if there's no entry for today yet
        if (!activityData[today]) {
          activityData[today] = 1; // Initialize with 1 minute so it shows up in calendar
          localStorage.setItem("focusActivity", JSON.stringify(activityData));
          // Dispatch event asynchronously to avoid render conflicts
          setTimeout(() => {
            window.dispatchEvent(new Event("focusActivityUpdated"));
          }, 0);
        }
        hasLoggedTodayRef.current = true;
      } catch (error) {
        console.error("Error initializing daily activity:", error);
      }
    }

    const interval = setInterval(() => {
      setMusicListeningSeconds((prev) => {
        const newSeconds = prev + 1;
        
        // Every 60 seconds (1 minute), save to total focus time
        if (newSeconds % 60 === 0) {
          try {
            const saved = localStorage.getItem("userPreferences");
            if (saved) {
              const preferences = JSON.parse(saved);
              const updatedPreferences = {
                ...preferences,
                totalFocusTime: (preferences.totalFocusTime || 0) + 1, // Add 1 minute
              };
              localStorage.setItem("userPreferences", JSON.stringify(updatedPreferences));
              // Dispatch event asynchronously to avoid render conflicts
              setTimeout(() => {
                window.dispatchEvent(new Event("focusic:userPreferencesUpdated"));
              }, 0);

              // Update activity calendar every hour (60 minutes)
              if (newSeconds % 3600 === 0) {
                const today = formatLocalDate(new Date());
                const activityData = JSON.parse(localStorage.getItem("focusActivity") || "{}") as Record<string, number>;
                activityData[today] = (activityData[today] || 0) + 60; // Add 60 minutes (1 hour)
                localStorage.setItem("focusActivity", JSON.stringify(activityData));
                // Dispatch event asynchronously to avoid render conflicts
                setTimeout(() => {
                  window.dispatchEvent(new Event("focusActivityUpdated"));
                }, 0);
              }
            }
          } catch (error) {
            console.error("Error updating focus time from music:", error);
          }
        }
        
        return newSeconds;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Reset daily log flag at midnight
  useEffect(() => {
    const checkMidnight = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        hasLoggedTodayRef.current = false;
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkMidnight);
  }, []);

  return (
    <MusicContext.Provider value={{ currentTrack, tracks, isPlaying, setCurrentTrack, setTracks, setIsPlaying, playNext, musicListeningSeconds }}>
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
