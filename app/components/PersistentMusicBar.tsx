"use client";

import { useMusic } from "@/app/context/MusicContext";

export default function PersistentMusicBar() {
  const { currentTrack, tracks, isPlaying, setIsPlaying, playNext } = useMusic();

  if (!currentTrack) return null;

  return (
    <>
      {/* Hidden iframe for audio playback */}
      {isPlaying && (
        <iframe
          key={currentTrack.videoId}
          width="0"
          height="0"
          src={`https://www.youtube.com/embed/${currentTrack.videoId}?autoplay=1`}
          title={currentTrack.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          className="hidden"
        />
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-4 z-40">
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
    </>
  );
}
