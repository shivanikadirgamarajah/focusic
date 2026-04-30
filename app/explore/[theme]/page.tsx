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
  Oneheart: "Oneheart",
  dramatic: "intense dramatic orchestral and cinematic music",
  mario: "super mario and retro game music",
  
};

const themeColors: Record<string, string> = {
  rain: "from-slate-900 to-slate-800",
  minecraft: "from-green-900 to-green-800",
  airplane: "from-sky-900 to-sky-800",
  nature: "from-emerald-900 to-emerald-800",
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
        const contentType = classifyRes.headers.get("content-type");
        let errorData = { 
          error: `HTTP ${classifyRes.status}`,
          details: classifyRes.statusText 
        };
        
        if (contentType && contentType.includes("application/json")) {
          try {
            const parsed = await classifyRes.json();
            errorData = { ...errorData, ...parsed };
          } catch (e) {
            console.error("Failed to parse error response as JSON:", e);
          }
        } else if (contentType && contentType.includes("text")) {
          try {
            const text = await classifyRes.text();
            if (text) {
              errorData.details = text;
            }
          } catch (e) {
            console.error("Failed to read error response as text:", e);
          }
        }
        
        console.error("Classify API error response:", {
          status: classifyRes.status,
          statusText: classifyRes.statusText,
          contentType,
          errorData,
        });
        
        const detailedError = errorData?.type === "auth_error" 
          ? "Invalid or expired Groq API key"
          : errorData?.type === "rate_limit"
          ? "Rate limited by API. Please try again later"
          : errorData?.details || classifyRes.statusText || "Unknown error";
        
        throw new Error(`Classify API failed (${classifyRes.status}): ${detailedError}`);
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
      
      // If AI classification fails, try with a simpler approach using just YouTube results
      if (error instanceof Error && error.message.includes("Classify API failed")) {
        console.log("Falling back to unclassified tracks...");
        // Try to load the raw videos without AI classification
        try {
          const description = themeDescriptions[theme] || theme;
          const searchRes = await fetch(
            `/api/youtube/search?q=${encodeURIComponent(description)}`
          );
          if (searchRes.ok) {
            const { videos } = await searchRes.json();
            if (videos && videos.length > 0) {
              // Use videos as-is with default focus scores
              const fallbackTracks = videos.map((video: any, index: number) => ({
                ...video,
                focusScore: 7 - (index * 0.5), // Decrease score for each track
                genre: "ambient",
                reason: "From theme search results",
                bestFor: "focus",
              }));
              setTracks(fallbackTracks);
              setCurrentTrack(fallbackTracks[0]);
              return;
            }
          }
        } catch (fallbackError) {
          console.error("Fallback search also failed:", fallbackError);
        }
      }
      
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
    <main className={`min-h-screen text-white flex-1 flex flex-col bg-gradient-to-b ${themeColors[theme.toLowerCase()] || "from-gray-900 to-gray-800"}`}>
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
