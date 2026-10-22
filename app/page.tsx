"use client";

import { useEffect, useRef, useState } from "react";
import MusicSearch from "@/app/components/MusicSearch";
import TrackPlayer from "@/app/components/TrackPlayer";
import TrackList from "@/app/components/TrackList";
import TypedText from "@/app/components/TypedText";
import { useMusic } from "@/app/context/MusicContext";
import { Track } from "@/app/types";
import { pickRandomNextTrack } from "@/app/lib/shuffle";

export default function Home() {
  const { tracks, currentTrack, setTracks, setCurrentTrack, setIsPlaying } = useMusic();
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasPerformedSearch, setHasPerformedSearch] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [lastSearchQuery, setLastSearchQuery] = useState<string | null>(null);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const loadMoreSentinelRef = useRef<HTMLElement>(null);
  const loadMoreInFlightRef = useRef(false);
  const loadMoreHandlerRef = useRef<() => Promise<void>>(async () => { });

  const getTimestamp = () => {
    return Date.now();
  };

  // Load user preferences on mount
  useEffect(() => {
    const saved = localStorage.getItem("userPreferences");
    if (saved) {
      setUserPreferences(JSON.parse(saved));
    }
  }, []);

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
      const userPreferences = JSON.parse(localStorage.getItem("userPreferences") || "{}");
      const likedSongs = JSON.parse(localStorage.getItem("likedSongs") || "[]");
      const focusActivity = JSON.parse(localStorage.getItem("focusActivity") || "{}");
      // Number of distinct days with recorded focus activity
      const focusActiveDays = Object.keys(focusActivity).length;

      // Accumulated tracked focus time, in minutes
      const totalFocusMinutes =
        typeof userPreferences.totalFocusTime === "number"
          ? userPreferences.totalFocusTime
          : 0;

      const hasPreferences =
        Boolean(userPreferences.workType) ||
        typeof userPreferences.focusLength === "number" ||
        typeof userPreferences.breakLength === "number";
      if (
        searchHistory.length === 0 &&
        listenHistory.length === 0 &&
        likedSongs.length === 0 &&
        !hasPreferences &&
        focusActiveDays === 0 &&
        totalFocusMinutes === 0
      ) {
        // No history, load default recoammendations
        await loadDefaultRecommendations();
        return;
      }

      // Get AI recommendations based on comprehensive user data
      const res = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchHistory,
          listenHistory,
          userPreferences: {
            workType: userPreferences.workType,
            focusLength: userPreferences.focusLength,
            breakLength: userPreferences.breakLength,
          },
          likedSongsPreview: likedSongs
            .slice(0, 10)
            .map((s: { title: string }) => s.title),
          focusActiveDays,
          totalFocusMinutes,
        }),
      });

      const responseText = await res.text();
      let responseData: { recommendations?: unknown };
      try {
        responseData = JSON.parse(responseText) as { recommendations?: unknown };
      } catch {
        console.error("Recommendation API returned non-JSON response:", {
          status: res.status,
          contentType: res.headers.get("content-type"),
          body: responseText.slice(0, 300),
        });
        throw new Error(`Recommendation API returned invalid JSON (HTTP ${res.status})`);
      }

      if (!res.ok || typeof responseData.recommendations !== "string" || !responseData.recommendations.trim()) {
        console.error("Recommendation API returned an invalid response:", {
          status: res.status,
          response: responseData,
        });
        throw new Error(`Recommendation API failed (HTTP ${res.status})`);
      }

      // Search for music based on first recommendation
      const firstRecommendation = responseData.recommendations.split(",")[0].trim();
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
      const userPreferences = JSON.parse(localStorage.getItem("userPreferences") || "{}");
      const workType = userPreferences.workType || "focus";

      // Create a more personalized search query based on work type
      const searchQueries: Record<string, string> = {
        "programming": "ambient coding music lofi beats focus",
        "writing": "creative writing ambient music lo-fi",
        "studying": "study focus music ambient beats",
        "design": "creative focus music lo-fi beats",
        "default": "ambient focus music lofi beats",
      };

      const searchQuery = searchQueries[workType.toLowerCase()] || searchQueries["default"];

      const res = await fetch(
        `/api/youtube/search?q=${encodeURIComponent(searchQuery)}`
      );
      const { videos, nextPageToken } = await res.json();
      setLastSearchQuery(searchQuery);
      setNextPageToken(nextPageToken || null);

      if (!videos || videos.length === 0) return;

      const classifyRes = await fetch("/api/ai/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tracks: videos,
          mood: `${workType} focus music`,
          workType,
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
      const { videos, nextPageToken } = await ytRes.json();
      setLastSearchQuery(`${query} ambient focus music`);
      setNextPageToken(nextPageToken || null);

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

  function handleShuffle() {
    // if (tracks.length <= 1) return;

    // // Exclude the currently playing track
    // const availableTracks = tracks.filter(
    //   (track) => track.videoId !== currentTrack?.videoId
    // );

    // if (availableTracks.length === 0) return;

    // // Pick a random track
    // const randomIndex = Math.floor(Math.random() * availableTracks.length);
    // const randomTrack = availableTracks[randomIndex];

    // setCurrentTrack(randomTrack);
    // setIsPlaying(true);
    function handleShuffle() {
      const nextTrack = pickRandomNextTrack(tracks, currentTrack);

      if (!nextTrack) return;

      setCurrentTrack(nextTrack);
      setIsPlaying(true);
    }
  }

  async function handleLoadMore() {
    if (!lastSearchQuery || !nextPageToken || loadMoreInFlightRef.current) return;

    loadMoreInFlightRef.current = true;
    setIsLoadingMore(true);

    try {
      const params = new URLSearchParams({
        q: lastSearchQuery,
        pageToken: nextPageToken,
      });
      const ytRes = await fetch(`/api/youtube/search?${params.toString()}`);
      const { videos, nextPageToken: newNextPageToken } = await ytRes.json();
      setNextPageToken(newNextPageToken || null);

      if (!Array.isArray(videos) || videos.length === 0) {
        return;
      }

      const timestamp = getTimestamp();
      const durationMap: Record<string, string> = {};
      videos.forEach((video: any) => {
        if (video.duration) {
          durationMap[video.videoId] = video.duration;
        }
      });

      let moreTracks: Track[] = videos.map((video: any, index: number) => ({
        ...video,
        focusScore: Math.max(7, 8 - index * 0.2),
        genre: "ambient",
        reason: "From additional search results",
        bestFor: "focus",
        duration: video.duration || "0:00",
        timestamp,
      }));

      try {
        const aiRes = await fetch("/api/ai/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mood: lastSearchQuery, tracks: videos }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          if (aiData.result) {
            const classifiedTracks = JSON.parse(aiData.result);
            moreTracks = classifiedTracks.map((track: Track) => ({
              ...track,
              timestamp,
              duration: durationMap[track.videoId] || track.duration,
            }));
          }
        }
      } catch (classifyError) {
        console.warn("Classify API error, using fallback:", classifyError);
      }

      const seenVideoIds = new Set(tracks.map((track) => track.videoId));
      const uniqueTracks = moreTracks.filter((track) => {
        if (seenVideoIds.has(track.videoId)) {
          return false;
        }

        seenVideoIds.add(track.videoId);
        return true;
      });

      setTracks([...tracks, ...uniqueTracks]);
    } catch (error) {
      console.error("Error loading more tracks:", error);
    } finally {
      loadMoreInFlightRef.current = false;
      setIsLoadingMore(false);
    }
  }

  loadMoreHandlerRef.current = handleLoadMore;


  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel || !nextPageToken) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !isLoadingMore) {
          void loadMoreHandlerRef.current();
        }
      },
      {
        root: null,
        rootMargin: "0px 0px 50% 0px",
        threshold: 0,
      }
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [nextPageToken, isLoadingMore, tracks.length]);


  function handleSearch(classifiedTracks: Track[], metadata?: { query: string; nextPageToken: string | null }) {
    setHasPerformedSearch(true);
    setLastSearchQuery(metadata?.query || null);
    setNextPageToken(metadata?.nextPageToken || null);
    setTracks(classifiedTracks);
    if (classifiedTracks.length > 0) {
      // Only set currentTrack if not already set to first result
      if (!currentTrack || currentTrack.videoId !== classifiedTracks[0]?.videoId) {
        setCurrentTrack(classifiedTracks[0]);
      }
    }
  }

  function handleSelectTrack(track: Track) {
    setCurrentTrack(track);
    setIsPlaying(true);
  }

  return (
    <main className="min-h-screen bg-black text-white flex-1 flex flex-col">
      <div className="mx-auto max-w-3xl space-y-8 px-8 py-12 flex-1">
        <section>
          <h2 className="text-3xl font-bold">
            Discover Focus Music {userPreferences?.workType ? `for ${userPreferences.workType}` : "Based on Your Taste"}
          </h2>
          <p className="mt-2 text-gray-400">
            {isLoadingRecommendations ? "Loading personalized recommendations..." : userPreferences?.workType ? `Curated music for productive ${userPreferences.workType.toLowerCase()}` : "Personalized to your listening history"}
          </p>
        </section>

        <MusicSearch onSearch={handleSearch} loading={isLoadingRecommendations} />

        {hasPerformedSearch && (
          <p className="-mt-5 text-xs text-gray-500">
            Looking for a specific song? Try pasting the link of the youtube video
          </p>
        )}

        {hasPerformedSearch && currentTrack && (
          <TrackPlayer track={currentTrack} onNext={handleShuffle} />
        )}
      </div>

      <TrackList
        tracks={tracks}
        currentTrack={currentTrack}
        onSelectTrack={handleSelectTrack}
      />

      {nextPageToken && tracks.length > 0 && (
        <section ref={loadMoreSentinelRef} className="w-full bg-black px-8 pb-12">
          <div className="mx-auto flex max-w-3xl justify-center">
            {isLoadingMore && (
              <button
                type="button"
                disabled
                aria-live="polite"
                className="rounded-lg bg-white px-6 py-3 font-semibold text-black opacity-70"
              >
                Loading more...
              </button>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
