"use client";

import MusicSearch from "@/app/components/MusicSearch";
import TrackPlayer from "@/app/components/TrackPlayer";
import TrackList from "@/app/components/TrackList";
import { useMusic } from "@/app/context/MusicContext";
import { Track } from "@/app/types";

export default function Home() {
  const { tracks, currentTrack, setTracks, setCurrentTrack, setIsPlaying, playNext } = useMusic();

  function handleSearch(classifiedTracks: Track[]) {
    setTracks(classifiedTracks);
    if (classifiedTracks.length > 0) {
      setCurrentTrack(classifiedTracks[0]);
      setIsPlaying(true);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex-1 flex flex-col">
      <div className="mx-auto max-w-3xl space-y-8 px-8 py-12 flex-1">
        <section>
          <h2 className="text-3xl font-bold">Discover Focus Music</h2>
          <p className="mt-2 text-gray-400">
            Tell the app what you're doing, and it will recommend focus music.
          </p>
        </section>

        <MusicSearch onSearch={handleSearch} />

        {currentTrack && (
          <TrackPlayer track={currentTrack} onNext={playNext} />
        )}
      </div>

      <TrackList
        tracks={tracks}
        currentTrack={currentTrack}
        onSelectTrack={setCurrentTrack}
      />
    </main>
  );
}
