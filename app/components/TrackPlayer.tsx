"use client";

import { useState } from "react";
import { Track } from "@/app/types";
import { useMusic } from "@/app/context/MusicContext";

interface TrackPlayerProps {
  track: Track;
  onNext: () => void;
}

export default function TrackPlayer({ track, onNext }: TrackPlayerProps) {
  const [showInsights, setShowInsights] = useState(false);
  const { setIsPlaying, setCurrentTrack, isPlaying, currentTrack } = useMusic();
  const isCurrentTrack = currentTrack?.videoId === track.videoId;
  const shouldPlayPreview = isCurrentTrack && isPlaying;

  function handlePlayPause() {
    if (isCurrentTrack) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">{track.title}</h2>

      <div 
        className="relative aspect-video bg-black rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition"
        onClick={handlePlayPause}
      >
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${track.videoId}?autoplay=${shouldPlayPreview ? "1" : "0"}&mute=1&controls=0&disablekb=1&fs=0&iv_load_policy=3&modestbranding=1&playsinline=1&rel=0`}
          title={track.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="border-0"
          style={{ pointerEvents: 'none' }}
        ></iframe>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handlePlayPause}
          className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 transition"
        >
          {shouldPlayPreview ? "Pause" : "Play"}
        </button>
        <button
          onClick={() => setShowInsights(!showInsights)}
          className="rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700 transition"
        >
           Insights
        </button>
        <button
          onClick={onNext}
          className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 transition"
        >
          Shuffle
        </button>
      </div>

      {showInsights && (
        <div className="space-y-2 text-sm bg-gray-900 rounded-lg p-4 border border-gray-700">
          {track.genre && (
            <p>
              <strong>Genre:</strong> {track.genre}
            </p>
          )}
          {track.focusScore && (
            <p>
              <strong>Focus score:</strong> {track.focusScore}/10
            </p>
          )}
          {track.bestFor && (
            <p>
              <strong>Best for:</strong> {track.bestFor}
            </p>
          )}
          {track.reason && (
            <p>
              <strong>Why:</strong> {track.reason}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
