"use client";

import { useMusic } from "@/app/context/MusicContext";
import { useState, useEffect } from "react";

export default function PersistentMusicBar() {
  const { currentTrack, tracks, isPlaying, setIsPlaying, playNext } = useMusic();
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Simulate progress while playing
  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime((prev) => {
        const newTime = prev + 1;
        // Estimate duration as ~10 minutes (600 seconds) to allow longer videos
        const estimatedDuration = 600;
        const newProgress = Math.min((newTime / estimatedDuration) * 100, 100);
        setProgress(newProgress);

        // Reset when track completes (only after substantial playback to avoid cutting off songs)
        if (newProgress >= 99) {
          playNext();
          setProgress(0);
          setElapsedTime(0);
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, playNext]);

  // Reset progress when track changes
  useEffect(() => {
    setProgress(0);
    setElapsedTime(0);
  }, [currentTrack?.videoId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!currentTrack) return null;

  return (
    <>
      {/* Hidden iframe for audio playback */}
      {isPlaying && (
        <iframe
          key={currentTrack.videoId}
          width="0"
          height="0"
          src={`https://www.youtube.com/embed/${currentTrack.videoId}?autoplay=1&mute=0&loop=0&controls=0&modestbranding=1`}
          title={currentTrack.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          className="hidden"
        />
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 z-50">
        {/* Progress bar */}
        <div className="w-full h-1 bg-gray-800 relative z-50">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full shadow-lg shadow-purple-500/50" />
          </div>
        </div>

        <div className="p-4">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            {/* Thumbnail */}
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
              {currentTrack.thumbnail ? (
                <img
                  src={currentTrack.thumbnail}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                  <span className="text-2xl">🎵</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{currentTrack.title}</p>
              <p className="text-sm text-gray-400">{currentTrack.channel}</p>
              <p className="text-xs text-gray-500 mt-1">{formatTime(elapsedTime)}</p>
            </div>

            {/* Controls */}
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition"
              >
                {isPlaying ? "⏸ Pause" : "▶ Play"}
              </button>
              {tracks.length > 1 && (
                <button
                  onClick={playNext}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
                >
                  Skip →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
