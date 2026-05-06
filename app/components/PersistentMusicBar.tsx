"use client";

import { useMusic } from "@/app/context/MusicContext";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function PersistentMusicBar() {
  const { currentTrack, tracks, isPlaying, setIsPlaying, playNext } = useMusic();
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const playNextRef = useRef(playNext);
  const isNavigatingRef = useRef(false);

  // Keep ref in sync with playNext
  useEffect(() => {
    playNextRef.current = playNext;
  }, [playNext]);

  // Detect navigation and safely cleanup player
  useEffect(() => {
    const handleRouteChange = () => {
      isNavigatingRef.current = true;

      // Safely pause player before navigation
      if (playerRef.current) {
        try {
          playerRef.current.pauseVideo?.();
        } catch (e) {
          // Ignore errors during navigation cleanup
        }
      }
    };

    // Listen for route changes
    window.addEventListener("beforeunload", handleRouteChange);

    return () => {
      window.removeEventListener("beforeunload", handleRouteChange);
    };
  }, []);

  // Check if current track is liked
  useEffect(() => {
    if (!currentTrack) return;

    try {
      const saved = localStorage.getItem("likedSongs");
      if (saved) {
        const songs = JSON.parse(saved);
        setIsLiked(songs.some((s: any) => s.videoId === currentTrack.videoId));
      }
    } catch (error) {
      console.error("Error checking liked status:", error);
    }
  }, [currentTrack?.videoId]);

  const toggleLike = () => {
    if (!currentTrack) return;

    try {
      let saved = localStorage.getItem("likedSongs");
      let likedTracks = saved ? JSON.parse(saved) : [];

      const index = likedTracks.findIndex((t: any) => t.videoId === currentTrack.videoId);

      if (index > -1) {
        likedTracks.splice(index, 1);
        setIsLiked(false);
      } else {
        likedTracks.push(currentTrack);
        setIsLiked(true);
      }

      localStorage.setItem("likedSongs", JSON.stringify(likedTracks));
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  // Initialize player on demand
  const initializePlayer = useCallback(() => {
    if (playerRef.current) return; // Already initialized

    // Wait for YouTube API to be available
    const checkAndInit = () => {
      if (!window.YT?.Player) {
        setTimeout(checkAndInit, 100); // Retry after 100ms
        return;
      }

      const container = document.getElementById('youtube-player-container');
      if (!container) return;

      try {
        playerRef.current = new window.YT.Player('youtube-player-container', {
          height: '0',
          width: '0',
          videoId: 'dQw4w9WgXcQ',
          events: {
            onReady: () => {
              if (playerRef.current && currentTrack?.videoId && !isNavigatingRef.current) {
                try {
                  playerRef.current.loadVideoById(currentTrack.videoId);
                } catch (e) {
                  console.warn("Load on ready error:", e);
                }
              }
            },
            onStateChange: (e: any) => {
              if (!isNavigatingRef.current && e.data === window.YT.PlayerState.ENDED && playerRef.current) {
                try {
                  playNextRef.current();
                } catch (e) {
                  console.warn("State change error:", e);
                }
              }
            },
            onError: (e: any) => {
              if (!isNavigatingRef.current) {
                console.error("Player error:", e.data);
              }
            }
          }
        });
        console.log("✅ Player initialized on demand");
      } catch (error) {
        console.error("Player init error:", error);
        playerRef.current = null;
      }
    };

    checkAndInit();
  }, [currentTrack?.videoId]);

  // Load YouTube script and create player container outside React tree
  useEffect(() => {
    // Create container outside React tree to avoid reconciliation conflicts
    let container = document.getElementById('youtube-player-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'youtube-player-container';
      container.style.cssText = 'position: absolute; width: 1px; height: 1px; left: -9999px; visibility: hidden;';
      document.body.appendChild(container);
    }

    // Load YouTube script
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.head.appendChild(script);
    }

    // Try initialization after a short delay to let script load
    const timer = setTimeout(() => {
      initializePlayer();
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [initializePlayer]);

  // Load video when track changes
  useEffect(() => {
    if (!currentTrack?.videoId || !playerRef.current) return;

    try {
      console.log("Loading:", currentTrack.videoId);
      playerRef.current.loadVideoById?.(currentTrack.videoId);
    } catch (e) {
      console.warn("Load error:", e);
    }
  }, [currentTrack?.videoId]);

  // Control playback
  useEffect(() => {
    if (!playerRef.current) return;

    try {
      if (isPlaying) {
        playerRef.current.playVideo?.();
      } else {
        playerRef.current.pauseVideo?.();
      }
    } catch (e) {
      console.warn("Play/pause error:", e);
    }
  }, [isPlaying]);

  // Update progress and duration
  useEffect(() => {
    if (!isPlaying || isDragging || !playerRef.current) return;

    const interval = setInterval(() => {
      try {
        if (!playerRef.current?.getCurrentTime) return;

        const currentTime = playerRef.current.getCurrentTime?.() || 0;
        const videoDuration = playerRef.current.getDuration?.() || 0;

        if (videoDuration > 0) {
          setElapsedTime(Math.floor(currentTime));
          setProgress((currentTime / videoDuration) * 100);
          setDuration(Math.floor(videoDuration));
        }
      } catch (error) {
        // Player methods may not be ready or player destroyed
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, isDragging]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.stopVideo?.();
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
      playerRef.current = null;
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || !duration) return;

    try {
      const progressBar = e.currentTarget;
      const rect = progressBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = (clickX / rect.width) * 100;

      const seekTime = (percentage / 100) * duration;
      playerRef.current.seekTo?.(seekTime);

      setElapsedTime(Math.floor(seekTime));
      setProgress(percentage);
    } catch (error) {
      console.warn("Click seek error:", error);
    }
  };

  const handleBubbleMouseDown = () => {
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging || !playerRef.current || !duration) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!progressBarRef.current || !playerRef.current) return;

      const rect = progressBarRef.current.getBoundingClientRect();
      const moveX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (moveX / rect.width) * 100));

      const seekTime = (percentage / 100) * duration;
      try {
        playerRef.current.seekTo?.(seekTime);
      } catch (error) {
        console.warn("Seek during drag error:", error);
      }

      setElapsedTime(Math.floor(seekTime));
      setProgress(percentage);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, duration]);

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 z-50">
      <div
        ref={progressBarRef}
        onClick={handleProgressClick}
        className="w-full h-1 bg-gray-800 relative z-50 cursor-pointer group"
      >
        <div
          className={`h-full bg-gradient-to-r from-blue-500 to-purple-500 relative ${
            !isDragging ? "transition-all duration-300" : ""
          }`}
          style={{ width: `${progress}%` }}
        >
          <div
            onMouseDown={handleBubbleMouseDown}
            className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full shadow-lg shadow-purple-500/50 cursor-grab active:cursor-grabbing hover:scale-125 transition-transform"
          />
        </div>
      </div>

      <div className="p-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
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

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white truncate">{currentTrack.title}</p>
            <p className="text-sm text-gray-400">{currentTrack.channel}</p>
            <p className="text-xs text-gray-500 mt-1">{formatTime(elapsedTime)}</p>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={toggleLike}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                isLiked
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
              title={isLiked ? "Unlike" : "Like"}
            >
              <span className="hidden sm:inline">{isLiked ? "❤️ Liked" : "🤍 Like"}</span>
              <span className="sm:hidden">{isLiked ? "❤️" : "🤍"}</span>
            </button>
            <button
              onClick={() => {
                initializePlayer();
                if (!playerRef.current) {
                  console.warn("⚠️ Player initializing, try again in a moment");
                  return;
                }
                setIsPlaying(!isPlaying);
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition"
            >
              
              <span className="hidden sm:inline">{isPlaying ? "⏸ Pause" : "▶ Play"}</span>
              <span className="sm:hidden">{isPlaying ? "⏸" : "▶"}</span>
            </button>
            {tracks.length > 1 && (
              <button
                onClick={playNext}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
              >
                
                <span className="hidden sm:inline">Skip →</span>
                <span className="sm:hidden">→</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
