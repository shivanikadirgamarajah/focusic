"use client";

import { useEffect, useState } from "react";
import { Track } from "@/app/types";
import { useMusic } from "@/app/context/MusicContext";

interface TrackPlayerProps {
  track: Track;
  onNext: () => void;
}

export default function TrackPlayer({ track, onNext }: TrackPlayerProps) {

  const [showInsights, setShowInsights] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const { setIsPlaying, setCurrentTrack, isPlaying, currentTrack } = useMusic();
  const isCurrentTrack = currentTrack?.videoId === track.videoId;
  const shouldPlayPreview = isCurrentTrack && isPlaying;

  useEffect(() => {
    try {
      const saved = localStorage.getItem("likedSongs");
      const likedSongs = saved ? (JSON.parse(saved) as Track[]) : [];
      setIsLiked(likedSongs.some((likedTrack) => likedTrack.videoId === track.videoId));
    } catch (error) {
      console.error("Error loading liked songs:", error);
    }
  }, [track.videoId]);

  function handlePlayPause() {
    if (isCurrentTrack) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  }

  function handleToggleLike() {
    try {
      const saved = localStorage.getItem("likedSongs");
      const likedSongs = saved ? (JSON.parse(saved) as Track[]) : [];
      const existingIndex = likedSongs.findIndex((likedTrack) => likedTrack.videoId === track.videoId);
      const nextIsLiked = existingIndex === -1;

      if (existingIndex > -1) {
        likedSongs.splice(existingIndex, 1);
      } else {
        likedSongs.push(track);
      }

      localStorage.setItem("likedSongs", JSON.stringify(likedSongs));
      setIsLiked(nextIsLiked);
      window.dispatchEvent(new CustomEvent("likedSongsChanged"));
      window.dispatchEvent(new Event("focusic:likedSongsUpdated"));
    } catch (error) {
      console.error("Error toggling like:", error);
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
          {shouldPlayPreview ? "⏸" : "▶"}
        </button>
        <button
          onClick={() => setShowInsights(!showInsights)}
          className={`rounded-lg px-4 py-2 font-serif text-lg font-bold italic transition ${
            showInsights
              ? "bg-purple-600 text-white hover:bg-purple-700"
              : "bg-gray-700 text-purple-200 hover:bg-gray-600"
          }`}
          title="Insights"
          aria-label="Insights"
        >
          i
        </button>
        <button
          onClick={onNext}
          className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 transition"
        >
          Shuffle
        </button>
        <button
          onClick={handleToggleLike}
          className={`rounded-lg px-4 py-2 font-semibold transition ${
            isLiked ? "bg-red-600 hover:bg-red-700" : "bg-gray-700 hover:bg-gray-600"
          }`}
          title={isLiked ? "Unlike" : "Like"}
          aria-label={isLiked ? "Unlike" : "Like"}
        >
          <svg
            className={`h-5 w-5 transition ${isLiked ? "fill-white text-white" : "text-white"}`}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            fill={isLiked ? "currentColor" : "none"}
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
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
