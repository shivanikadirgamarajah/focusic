"use client";

import { Track } from "@/app/types";
import { useState, useEffect } from "react";

interface TrackListProps {
  tracks: Track[];
  currentTrack: Track | null;
  onSelectTrack: (track: Track) => void;
}

const getRelativeTime = (timestamp?: number) => {
  if (!timestamp) return "";

  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
};

export default function TrackList({
  tracks,
  currentTrack,
  onSelectTrack,
}: TrackListProps) {
  const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set());

  // Load liked songs from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("likedSongs");
      if (saved) {
        const songs = JSON.parse(saved);
        setLikedSongs(new Set(songs.map((s: any) => s.videoId)));
      }
    } catch (error) {
      console.error("Error loading liked songs:", error);
    }
  }, []);

  const toggleLike = (e: React.MouseEvent<HTMLButtonElement>, track: Track) => {
    e.stopPropagation();

    try {
      let saved = localStorage.getItem("likedSongs");
      let likedTracks = saved ? JSON.parse(saved) : [];

      const index = likedTracks.findIndex((t: any) => t.videoId === track.videoId);

      if (index > -1) {
        // Remove if already liked
        likedTracks.splice(index, 1);
        setLikedSongs((prev) => {
          const updated = new Set(prev);
          updated.delete(track.videoId);
          return updated;
        });
      } else {
        // Add if not liked
        likedTracks.push(track);
        setLikedSongs((prev) => new Set([...prev, track.videoId]));
      }

      localStorage.setItem("likedSongs", JSON.stringify(likedTracks));
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  if (tracks.length === 0) return null;

  return (
    <section className="w-full bg-black py-12">
      <h3 className="mb-8 text-3xl font-bold sticky top-0 pt-8 bg-black z-10 px-4">Recommendations</h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-3 2xl:grid-cols-7 gap-4 auto-rows-fr">
        {tracks.map((track) => (
          <div
            key={track.videoId}
            className={`rounded-lg overflow-hidden border-2 transition transform hover:scale-105 flex flex-col h-full relative group ${
              currentTrack?.videoId === track.videoId
                ? "border-blue-500 shadow-lg shadow-blue-500"
                : "border-gray-700 hover:border-gray-500"
            }`}
          >
            <button
              onClick={() => onSelectTrack(track)}
              className="absolute inset-0 z-10"
            />
            <div className="relative bg-gray-800 w-full aspect-video">
              {track.thumbnail ? (
                <img
                  src={track.thumbnail}
                  alt={track.title}
                  className="w-full h-full object-contain bg-gray-800"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                  <span className="text-gray-500 text-2xl">🎵</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition" />
              
              {/* Like button */}
              <button
                onClick={(e) => toggleLike(e, track)}
                className="absolute top-2 right-2 z-20 p-2 rounded-full bg-black/50 hover:bg-black/75 transition"
                title={likedSongs.has(track.videoId) ? "Unlike" : "Like"}
              >
                <svg
                  className={`w-5 h-5 transition ${
                    likedSongs.has(track.videoId)
                      ? "fill-red-500 text-red-500"
                      : "text-white"
                  }`}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill={likedSongs.has(track.videoId) ? "currentColor" : "none"}
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>
            <div className="p-3 bg-gray-900 flex-1">
              <p className="font-semibold text-xs line-clamp-2">{track.title}</p>
              <p className="text-xs text-gray-400 mt-1">
                {track.genre}
              </p>
              <p className="text-xs text-blue-400 mt-1">
                Score: {track.focusScore}/10
              </p>
              {track.duration && (
                <p className="text-[15px] font-bold text-white mt-2">
                  Duration: {track.duration}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
