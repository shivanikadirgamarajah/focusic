"use client";

import { useMusic } from "@/app/context/MusicContext";
import TrackList from "@/app/components/TrackList";
import TrackPlayer from "@/app/components/TrackPlayer";
import { useEffect, useState } from "react";

export default function LikedSongsPage() {
  const { currentTrack, setCurrentTrack, isPlaying, setIsPlaying, tracks, setTracks } = useMusic();
  const [likedSongs, setLikedSongs] = useState<any[]>([]);

  // Load liked songs from localStorage
  useEffect(() => {
    const loadLikedSongs = () => {
      try {
        const saved = localStorage.getItem("likedSongs");
        if (saved) {
          setLikedSongs(JSON.parse(saved));
        }
      } catch (error) {
        console.error("Error loading liked songs:", error);
      }
    };

    loadLikedSongs();

    // Listen for storage changes (when unliking from TrackList)
    window.addEventListener("storage", loadLikedSongs);
    window.addEventListener("likedSongsChanged", loadLikedSongs);

    return () => {
      window.removeEventListener("storage", loadLikedSongs);
      window.removeEventListener("likedSongsChanged", loadLikedSongs);
    };
  }, []);

  const handleSelectTrack = (track: any) => {
    setCurrentTrack(track);
    setTracks(likedSongs);
    setIsPlaying(true);
  };

  const handlePlayNext = () => {
    if (!currentTrack || likedSongs.length === 0) return;

    const currentIndex = likedSongs.findIndex(
      (track) => track.videoId === currentTrack.videoId
    );

    // If current track was removed, clear it
    if (currentIndex === -1) {
      setCurrentTrack(null);
      return;
    }

    const nextIndex = (currentIndex + 1) % likedSongs.length;
    setCurrentTrack(likedSongs[nextIndex]);
    setIsPlaying(true);
  };

  // Clear current track if it's no longer in liked songs
  useEffect(() => {
    if (currentTrack && likedSongs.length > 0) {
      const trackExists = likedSongs.some(t => t.videoId === currentTrack.videoId);
      if (!trackExists) {
        setCurrentTrack(null);
      }
    }
  }, [likedSongs, currentTrack, setCurrentTrack]);

  return (
    <main className="min-h-screen bg-black text-white pb-32">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-5xl font-bold mb-2">Liked Songs</h1>
        <p className="text-gray-400 mb-8">{likedSongs.length} songs</p>

        {likedSongs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">No liked songs yet</p>
            <p className="text-gray-500 text-sm mt-2">Songs you like will appear here</p>
          </div>
        ) : (
          <TrackList
            tracks={likedSongs}
            currentTrack={currentTrack}
            onSelectTrack={handleSelectTrack}
          />
        )}
      </div>

      {currentTrack && <TrackPlayer track={currentTrack} onNext={handlePlayNext} />}
    </main>
  );
}
