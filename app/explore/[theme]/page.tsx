"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import MusicSearch from "@/app/components/MusicSearch";
import TrackPlayer from "@/app/components/TrackPlayer";
import TrackList from "@/app/components/TrackList";
import { Track } from "@/app/types";

const themeDescriptions: Record<string, string> = {
  rain: "relaxing rain sounds and rainfall ambience",
  minecraft: "minecraft soundtrack and peaceful gaming music",
  airplane: "airplane cabin and flight sounds",
  nature: "nature sounds forest birds and outdoor ambience",
  fantasy: "fantasy adventure magical music",
  paris: "parisian cafe and french music",
  medieval: "medieval tavern and fantasy realm music",
  Øneheart: "Øneheart",
  dramatic: "intense dramatic orchestral and cinematic music",
  mario: "super mario and retro game music",
  
};

export default function ThemePage() {
  const params = useParams();
  const theme = params.theme as string;
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Auto-search when the page loads
    const description = themeDescriptions[theme] || theme;
    handleSearch(description);
  }, [theme]);

  async function handleSearch(query: string) {
    setIsLoading(true);
    try {
      // Search for music
      const searchRes = await fetch(
        `/api/youtube/search?q=${encodeURIComponent(query)}`
      );
      if (!searchRes.ok) {
        throw new Error(`Search API failed: ${searchRes.statusText}`);
      }
      const { videos } = await searchRes.json();

      if (!Array.isArray(videos) || videos.length === 0) {
        throw new Error("No tracks found");
      }

      // Classify with AI
      const classifyRes = await fetch("/api/ai/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracks: videos, mood: theme }),
      });
      
      if (!classifyRes.ok) {
        throw new Error(`Classify API failed: ${classifyRes.statusText}`);
      }

      const classifyData = await classifyRes.json();
      
      if (!classifyData.result) {
        throw new Error("No result from AI classification");
      }

      const classified = JSON.parse(classifyData.result);
      
      // Sort by focusScore highest first
      const sorted = classified.sort((a: Track, b: Track) => (b.focusScore || 0) - (a.focusScore || 0));

      setTracks(sorted);
      setCurrentTrack(sorted[0] || null);
    } catch (error) {
      console.error("Error:", error);
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
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
    <main className="min-h-screen bg-black text-white flex-1 flex flex-col">
      <div className="mx-auto max-w-3xl space-y-8 px-8 py-12 flex-1 w-full">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold capitalize">{theme} Ambience</h2>
            <p className="mt-2 text-gray-400">
              {isLoading ? "Loading..." : `${tracks.length} tracks found`}
            </p>
          </div>
          <Link
            href="/explore"
            className="rounded-lg bg-gray-700 px-5 py-3 font-semibold hover:bg-gray-600 transition"
          >
            ← Back
          </Link>
        </div>

        {currentTrack && (
          <TrackPlayer track={currentTrack} onNext={handlePlayNext} />
        )}

        {!isLoading && tracks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No tracks found for this theme</p>
          </div>
        )}
      </div>

      {tracks.length > 0 && (
        <TrackList
          tracks={tracks}
          currentTrack={currentTrack}
          onSelectTrack={setCurrentTrack}
        />
      )}
    </main>
  );
}
