"use client";

import { useState } from "react";
import MusicSearch from "@/app/components/MusicSearch";
import TrackPlayer from "@/app/components/TrackPlayer";
import TrackList from "@/app/components/TrackList";
import { Track } from "@/app/types";

export default function Home() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);

  function handleSearch(classifiedTracks: Track[]) {
    setTracks(classifiedTracks);
    setCurrentTrack(classifiedTracks[0]);
  }

  function handlePlayNext() {
    if (!currentTrack || tracks.length === 0) return;

    const currentIndex = tracks.findIndex(
      (track) => track.videoId === currentTrack.videoId
    );

    const nextIndex = (currentIndex + 1) % tracks.length;
    setCurrentTrack(tracks[nextIndex]);
  }

  return (
    <main className="min-h-screen bg-black text-white p-8 flex-1">
      <div className="mx-auto max-w-3xl space-y-8">
        <section>
          <h2 className="text-3xl font-bold">Discover Focus Music</h2>
          <p className="mt-2 text-gray-400">
            Tell the app what you're doing, and it will recommend focus music.
          </p>
        </section>

        <MusicSearch onSearch={handleSearch} />

        {currentTrack && (
          <TrackPlayer track={currentTrack} onNext={handlePlayNext} />
        )}

        <TrackList
          tracks={tracks}
          currentTrack={currentTrack}
          onSelectTrack={setCurrentTrack}
        />
      </div>
    </main>
  );
}
