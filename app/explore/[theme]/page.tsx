"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import TrackPlayer from "@/app/components/TrackPlayer";
import TrackList from "@/app/components/TrackList";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useMusic } from "@/app/context/MusicContext";
import { Track } from "@/app/types";

type YoutubeVideo = Pick<Track, "videoId" | "title" | "channel" | "thumbnail" | "duration">;

type YoutubeSearchResponse = {
  videos?: YoutubeVideo[];
  nextPageToken?: string | null;
  error?: string;
  details?: string;
};

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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getTimestamp = () => {
    return Date.now();
  };

  async function fetchThemeVideos(query: string, pageToken?: string | null) {
    const params = new URLSearchParams({ q: query });
    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const searchRes = await fetch(`/api/youtube/search?${params.toString()}`);

    if (!searchRes.ok) {
      let errorDetails = "";
      try {
        const errorData = (await searchRes.json()) as YoutubeSearchResponse;
        errorDetails = errorData.error || errorData.details || JSON.stringify(errorData);
      } catch {
        errorDetails = await searchRes.text();
      }

      console.error(`Search API error (${searchRes.status}):`, errorDetails);
      throw new Error(`Search API failed: ${searchRes.status} - ${errorDetails || searchRes.statusText}`);
    }

    const data = (await searchRes.json()) as YoutubeSearchResponse;

    return {
      videos: Array.isArray(data.videos) ? data.videos : [],
      nextPageToken: data.nextPageToken || null,
    };
  }

  async function classifyOrFallback(
    videos: YoutubeVideo[],
    mood: string,
    fallbackReason: string
  ) {
    try {
      const classifyRes = await fetch("/api/ai/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracks: videos, mood }),
      });

      if (!classifyRes.ok) {
        const errorText = await classifyRes.text().catch(() => "");
        console.warn(`Classify API returned ${classifyRes.status}: ${errorText}`);
        throw new Error("Classify API unavailable");
      }

      const classifyData = await classifyRes.json();

      if (!classifyData.result) {
        throw new Error("No classification result");
      }

      const classified = JSON.parse(classifyData.result) as Track[];
      const timestamp = getTimestamp();
      const durationMap: Record<string, string> = {};
      videos.forEach((video) => {
        if (video.duration) {
          durationMap[video.videoId] = video.duration;
        }
      });

      const withTimestamp = classified.map((track) => ({
        ...track,
        timestamp,
        duration: durationMap[track.videoId] || track.duration,
      }));

      return {
        tracks: withTimestamp.sort((a, b) => (b.focusScore || 0) - (a.focusScore || 0)),
        usedFallback: false,
      };
    } catch (classifyError) {
      console.warn("Classify API error, using fallback:", classifyError);
      const timestamp = getTimestamp();
      const fallbackTracks = videos.map((video, index) => ({
        ...video,
        focusScore: 7 - (index * 0.5),
        genre: "ambient",
        reason: fallbackReason,
        bestFor: "focus",
        duration: video.duration || "0:00",
        timestamp,
      }));

      return {
        tracks: fallbackTracks,
        usedFallback: true,
      };
    }
  }

  function mergeUniqueTracks(existingTracks: Track[], newTracks: Track[]) {
    const seenVideoIds = new Set(existingTracks.map((track) => track.videoId));
    const uniqueTracks = newTracks.filter((track) => {
      if (seenVideoIds.has(track.videoId)) {
        return false;
      }

      seenVideoIds.add(track.videoId);
      return true;
    });

    return [...existingTracks, ...uniqueTracks];
  }

  async function handleSearch(query: string) {
    setIsLoading(true);
    setError(null);
    setNextPageToken(null);
    try {
      const { videos, nextPageToken: newNextPageToken } = await fetchThemeVideos(query);
      setNextPageToken(newNextPageToken);

      if (!Array.isArray(videos) || videos.length === 0) {
        setError("No tracks found for this theme");
        setIsLoading(false);
        return;
      }

      const { tracks: themeTracks, usedFallback } = await classifyOrFallback(
        videos,
        theme,
        "From theme search results"
      );

      const isSame = tracks.length === themeTracks.length && tracks.every((t, i) => t.videoId === themeTracks[i].videoId);
      if (!isSame) {
        setTracks(themeTracks);
      }
      if (!currentTrack || currentTrack.videoId !== themeTracks[0]?.videoId) {
        setCurrentTrack(themeTracks[0] || null);
        setIsPlaying(true);
      }
      if (usedFallback) {
        setError("AI classification unavailable, showing search results");
      }
    } catch (error) {
      console.error("Error:", error);
      setError(error instanceof Error ? error.message : "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    const description = themeDescriptions[theme] || theme;
    void Promise.resolve().then(() => {
      if (!cancelled) {
        void handleSearch(description);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  async function handleLoadMore() {
    if (!nextPageToken || isLoadingMore) return;

    setIsLoadingMore(true);
    setError(null);

    try {
      const description = themeDescriptions[theme] || theme;
      const { videos, nextPageToken: newNextPageToken } = await fetchThemeVideos(description, nextPageToken);
      setNextPageToken(newNextPageToken);

      if (videos.length === 0) {
        return;
      }

      const { tracks: moreTracks, usedFallback } = await classifyOrFallback(
        videos,
        theme,
        "From additional theme search results"
      );
      const mergedTracks = mergeUniqueTracks(tracks, moreTracks);
      setTracks(mergedTracks);

      if (usedFallback) {
        setError("AI classification unavailable for the new songs, showing search results");
      }
    } catch (error) {
      console.error("Error loading more tracks:", error);
      setError(error instanceof Error ? error.message : "Unable to load more tracks");
    } finally {
      setIsLoadingMore(false);
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
            <>
              <TrackList
                tracks={tracks}
                currentTrack={currentTrack}
                onSelectTrack={handleSelectTrack}
              />
              {nextPageToken && (
                <section className="w-full bg-black px-8 pb-12">
                  <div className="mx-auto flex max-w-3xl justify-center">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="rounded-lg bg-white px-6 py-3 font-semibold text-black transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isLoadingMore ? "Loading more..." : "Load more songs"}
                    </button>
                  </div>
                </section>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}
