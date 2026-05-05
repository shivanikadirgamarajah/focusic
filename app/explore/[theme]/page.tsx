"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import MusicSearch from "@/app/components/MusicSearch";
import TrackPlayer from "@/app/components/TrackPlayer";
import TrackList from "@/app/components/TrackList";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useMusic } from "@/app/context/MusicContext";
import { Track } from "@/app/types";

const themeDescriptions: Record<string, string> = {
  rain: "relaxing rain sounds and rainfall ambience",
  minecraft: "minecraft soundtrack and peaceful gaming music",
  airplane: "airplane cabin and flight sounds",
  nature: "nature sounds forest birds and outdoor ambience",
  liminal: "liminal spaces and eerie ambient music",
  lofi: "lofi hip hop beats and chillhop music",
  fantasy: "fantasy adventure magical music",
  paris: "parisian cafe and french music",
  medieval: "medieval tavern and fantasy realm music",
  Oneheart: "Oneheart",
  dramatic: "intense dramatic orchestral and cinematic music",
  mario: "super mario and retro game music",
  
};

const themeColors: Record<string, string> = {
  rain: "from-slate-900 to-slate-800",
  minecraft: "from-green-900 to-green-800",
  airplane: "from-sky-900 to-sky-800",
  nature: "from-emerald-900 to-emerald-800",
  liminal: "from-gray-900 to-gray-800",
  lofi: "from-pink-900 to-pink-800",
  fantasy: "from-purple-900 to-purple-800",
  paris: "from-rose-900 to-rose-800",
  medieval: "from-amber-900 to-amber-800",
  oneheart: "from-indigo-900 to-indigo-800",
  dramatic: "from-red-900 to-red-800",
  mario: "from-red-900 to-red-800",
};

const headingColors: Record<string, string> = {
  rain: "from-amber-400 to-orange-400",
  minecraft: "from-pink-400 to-rose-400",
  airplane: "from-orange-400 to-amber-400",
  nature: "from-pink-400 to-fuchsia-400",
  fantasy: "from-yellow-300 to-lime-400",
  paris: "from-teal-400 to-cyan-400",
  medieval: "from-blue-400 to-indigo-400",
  oneheart: "from-yellow-400 to-orange-400",
  dramatic: "from-cyan-400 to-teal-400",
  mario: "from-cyan-400 to-blue-400",
};

export default function ThemePage() {
  const params = useParams();
  const theme = decodeURIComponent(params.theme as string);
  const { tracks, currentTrack, setTracks, setCurrentTrack, setIsPlaying } = useMusic();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getTimestamp = () => {
    return Date.now();
  };

  useEffect(() => {
    // Auto-search when the page loads
    const description = themeDescriptions[theme] || theme;
    handleSearch(description);
  }, [theme]);

  async function handleSearch(query: string) {
    setIsLoading(true);
    setError(null);
    try {
      // Search for music
      const searchRes = await fetch(
        `/api/youtube/search?q=${encodeURIComponent(query)}`
      );
      
      if (!searchRes.ok) {
        // Get detailed error info
        let errorDetails = "";
        try {
          const errorData = await searchRes.json();
          errorDetails = errorData.error || errorData.details || JSON.stringify(errorData);
        } catch (e) {
          errorDetails = await searchRes.text();
        }
        
        console.error(`Search API error (${searchRes.status}):`, errorDetails);
        throw new Error(`Search API failed: ${searchRes.status} - ${errorDetails || searchRes.statusText}`);
      }
      
      const { videos } = await searchRes.json();

      if (!Array.isArray(videos) || videos.length === 0) {
        setError("No tracks found for this theme");
        setIsLoading(false);
        return;
      }

      // Try to classify with AI
      try {
        const classifyRes = await fetch("/api/ai/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tracks: videos, mood: theme }),
        });
        
        if (classifyRes.ok) {
          const classifyData = await classifyRes.json();
          
          if (classifyData.result) {
            const classified = JSON.parse(classifyData.result);
            const timestamp = getTimestamp();
            
            // Create a map of video IDs to durations from original videos
            const durationMap: Record<string, string> = {};
            videos.forEach((video: any) => {
              if (video.duration) {
                durationMap[video.videoId] = video.duration;
              }
            });
            
            const withTimestamp = classified.map((track: Track) => ({
              ...track,
              timestamp,
              duration: durationMap[track.videoId] || track.duration,
            }));
            const sorted = withTimestamp.sort((a: Track, b: Track) => (b.focusScore || 0) - (a.focusScore || 0));
            
            // Only update if tracks actually changed
            const isSame = tracks.length === sorted.length && tracks.every((t, i) => t.videoId === sorted[i].videoId);
            if (!isSame) {
              setTracks(sorted);
            }
            // Only set currentTrack if not already set to first result
            if (!currentTrack || currentTrack.videoId !== sorted[0]?.videoId) {
              setCurrentTrack(sorted[0] || null);
              setIsPlaying(true);
            }
            setIsLoading(false);
            return;
          }
        } else {
          // Log error details but don't throw - use fallback instead
          const errorText = await classifyRes.text().catch(() => "");
          console.warn(`Classify API returned ${classifyRes.status}: ${errorText}`);
        }
      } catch (classifyError) {
        console.warn("Classify API error, using fallback:", classifyError);
      }

      // Fallback: Use raw videos with default focus scores
      console.log("Using fallback: returning unclassified tracks");
      const timestamp = getTimestamp();
      const fallbackTracks = videos.map((video: any, index: number) => ({
        ...video,
        focusScore: 7 - (index * 0.5),
        genre: "ambient",
        reason: "From theme search results",
        bestFor: "focus",
        duration: video.duration || "0:00",
        timestamp,
      }));
      
      const isSameFallback = tracks.length === fallbackTracks.length && tracks.every((t, i) => t.videoId === fallbackTracks[i].videoId);
      if (!isSameFallback) {
        setTracks(fallbackTracks);
      }
      if (!currentTrack || currentTrack.videoId !== fallbackTracks[0]?.videoId) {
        setCurrentTrack(fallbackTracks[0] || null);
        setIsPlaying(true);
      }
      setError("AI classification unavailable, showing search results");
    } catch (error) {
      console.error("Error:", error);
      setError(error instanceof Error ? error.message : "Unknown error occurred");
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
    setIsPlaying(true);
  }

  function handleSelectTrack(track: Track) {
    setCurrentTrack(track);
    setIsPlaying(true);
  }

  return (
    <main className={`min-h-screen text-white flex-1 flex flex-col bg-gradient-to-b ${themeColors[theme.toLowerCase()] || "from-gray-900 to-gray-800"}`}>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="mx-auto max-w-3xl space-y-8 px-8 py-12 flex-1 w-full">
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r ${headingColors[theme.toLowerCase()] || "from-blue-400 to-purple-400"} capitalize`}>{theme} Ambience</h2>
                <p className="text-gray-400 mt-2">Curated tracks to enhance your focus</p>
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

            {error && (
              <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-4 text-amber-200">
                <p className="text-sm">{error}</p>
              </div>
            )}

            {!isLoading && tracks.length === 0 && !error && (
              <div className="text-center py-12">
                <p className="text-gray-400">No tracks found for this theme</p>
              </div>
            )}
          </div>

          {tracks.length > 0 && (
            <TrackList
              tracks={tracks}
              currentTrack={currentTrack}
              onSelectTrack={handleSelectTrack}
            />
          )}
        </>
      )}
    </main>
  );
}
