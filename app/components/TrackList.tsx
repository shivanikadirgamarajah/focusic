"use client";

import { Track } from "@/app/types";

interface TrackListProps {
  tracks: Track[];
  currentTrack: Track | null;
  onSelectTrack: (track: Track) => void;
}

export default function TrackList({
  tracks,
  currentTrack,
  onSelectTrack,
}: TrackListProps) {
  if (tracks.length === 0) return null;

  return (
    <section className="w-full min-h-screen bg-black px-8 py-12">
      <h3 className="mb-8 text-3xl font-bold sticky top-0 pt-8 bg-black z-10">Recommendations</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
        {tracks.map((track) => (
          <button
            key={track.videoId}
            onClick={() => onSelectTrack(track)}
            className={`rounded-lg overflow-hidden border-2 transition transform hover:scale-105 flex flex-col ${
              currentTrack?.videoId === track.videoId
                ? "border-blue-500 shadow-lg shadow-blue-500"
                : "border-gray-700 hover:border-gray-500"
            }`}
          >
            <div className="relative bg-gray-800 flex-1 min-h-60">
              {track.thumbnail ? (
                <img
                  src={track.thumbnail}
                  alt={track.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                  <span className="text-gray-500">🎵</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition" />
            </div>
            <div className="p-4 bg-gray-900">
              <p className="font-semibold text-sm line-clamp-2">{track.title}</p>
              <p className="text-xs text-gray-400 mt-2">
                {track.genre}
              </p>
              <p className="text-xs text-blue-400 mt-1">
                Score: {track.focusScore}/10
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
