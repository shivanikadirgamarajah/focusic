"use client";

import { useEffect, useState } from "react";
import MusicSearch from "@/app/components/MusicSearch";
import TrackPlayer from "@/app/components/TrackPlayer";
import TrackList from "@/app/components/TrackList";
import TypedText from "@/app/components/TypedText";
import { useMusic } from "@/app/context/MusicContext";
import { Track } from "@/app/types";

export default function Home() {
  const { tracks, currentTrack, setTracks, setCurrentTrack, setIsPlaying, playNext } = useMusic();
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [hasPerformedSearch, setHasPerformedSearch] = useState(false);

  const getTimestamp = () => {
    return Date.now();
  };

  useEffect(() => {
    // Only load recommendations if we haven't performed a search yet AND there are no tracks loaded
    // This prevents overriding the current track when navigating back to home
    if (!hasPerformedSearch && tracks.length === 0) {
      loadRecommendations();
    }
  }, [hasPerformedSearch, tracks.length]);

  async function loadRecommendations() {
    try {
      setIsLoadingRecommendations(true);
      const searchHistory = JSON.parse(localStorage.getItem("searchHistory") || "[]");
      const listenHistory = JSON.parse(localStorage.getItem("listenHistory") || "[]");

      if (searchHistory.length === 0 && listenHistory.length === 0) {
        // No history, load default recommendations
        await loadDefaultRecommendations();
        return;
      }

      // Get AI recommendations based on history
      const res = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchHistory, listenHistory }),
      });

      const { recommendations } = await res.json();
      
      // Search for music based on first recommendation
      const firstRecommendation = recommendations.split(",")[0].trim();
      await performSearch(firstRecommendation, false);
    } catch (error) {
      console.error("Error loading recommendations:", error);
      await loadDefaultRecommendations();
    } finally {
      setIsLoadingRecommendations(false);
    }
  }

  async function loadDefaultRecommendations() {
    try {
      const res = await fetch(
        `/api/youtube/search?q=${encodeURIComponent("ambient focus music lofi beats")}`
      );
      const { videos } = await res.json();

      if (!videos || videos.length === 0) return;

      const classifyRes = await fetch("/api/ai/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tracks: videos,
          mood: "ambient focus music",
        }),
      });

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
          setCurrentTrack(sorted[0]);
        }
      }
    } catch (error) {
      console.error("Error loading default recommendations:", error);
    } finally {
      setIsLoadingRecommendations(false);
    }
  }

  async function performSearch(query: string, autoPlay: boolean = false) {
    try {
      const ytRes = await fetch(
        `/api/youtube/search?q=${encodeURIComponent(query + " ambient focus music")}`
      );
      const { videos } = await ytRes.json();

      if (!Array.isArray(videos) || videos.length === 0) {
        await loadDefaultRecommendations();
        return;
      }

      // Try to classify with AI
      try {
        const aiRes = await fetch("/api/ai/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mood: query, tracks: videos }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          if (aiData.result) {
            const classifiedTracks = JSON.parse(aiData.result);
            const timestamp = getTimestamp();
            
            // Create a map of video IDs to durations from original videos
            const durationMap: Record<string, string> = {};
            videos.forEach((video: any) => {
              if (video.duration) {
                durationMap[video.videoId] = video.duration;
              }
            });
            
            const withTimestamp = classifiedTracks.map((track: Track) => ({
              ...track,
              timestamp,
              duration: durationMap[track.videoId] || track.duration,
            }));
            const sorted = withTimestamp.sort((a: Track, b: Track) => (b.focusScore || 0) - (a.focusScore || 0));
            setTracks(sorted);
            if (sorted.length > 0) {
              // Only set currentTrack if not already set to first result
              if (!currentTrack || currentTrack.videoId !== sorted[0]?.videoId) {
                setCurrentTrack(sorted[0]);
                if (autoPlay) {
                  setIsPlaying(true);
                }
              }
            }
            return;
          }
        } else {
          console.warn(`Classify API returned ${aiRes.status}`);
        }
      } catch (classifyError) {
        console.warn("Classify API error, using fallback:", classifyError);
      }

      // Fallback: Use raw videos with default focus scores
      const timestamp = getTimestamp();
      const fallbackTracks = videos.map((video: any, index: number) => ({
        ...video,
        focusScore: 7 - (index * 0.5),
        genre: "ambient",
        reason: "From search results",
        bestFor: "focus",
        duration: video.duration || "0:00",
        timestamp,
      }));
      
      setTracks(fallbackTracks);
      if (fallbackTracks.length > 0) {
        // Only set currentTrack if not already set to first result
        if (!currentTrack || currentTrack.videoId !== fallbackTracks[0]?.videoId) {
          setCurrentTrack(fallbackTracks[0]);
          if (autoPlay) {
            setIsPlaying(true);
          }
        }
      }
    } catch (error) {
      console.error("Error performing search:", error);
      await loadDefaultRecommendations();
    }
  }

  function handleSearch(classifiedTracks: Track[]) {
    setHasPerformedSearch(true);
    setTracks(classifiedTracks);
    if (classifiedTracks.length > 0) {
      // Only set currentTrack if not already set to first result
      if (!currentTrack || currentTrack.videoId !== classifiedTracks[0]?.videoId) {
        setCurrentTrack(classifiedTracks[0]);
      }
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex-1 flex flex-col">
      <div className="mx-auto max-w-3xl space-y-8 px-8 py-12 flex-1">
        <section>
          <h2 className="text-3xl font-bold">Discover Focus Music Based on</h2>
          <p className="mt-2 text-gray-400">
            {isLoadingRecommendations && "Loading personalized recommendations..."}
          </p>
        </section>

        <MusicSearch onSearch={handleSearch} loading={isLoadingRecommendations} />

        {hasPerformedSearch && currentTrack && (
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
