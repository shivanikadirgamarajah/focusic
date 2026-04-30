"use client";

import { useMusic } from "@/app/context/MusicContext";
import { useState, useEffect, useRef, useCallback } from "react";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function PersistentMusicBar() {
  const { currentTrack, tracks, isPlaying, setIsPlaying, playNext } = useMusic();
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const apiLoadedRef = useRef(false);
  const playNextRef = useRef(playNext);

  // Keep ref in sync with playNext
  useEffect(() => {
    playNextRef.current = playNext;
  }, [playNext]);

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

  // Load YouTube IFrame API - only on first call
  const loadYouTubeAPI = useCallback(() => {
    if (apiLoadedRef.current) return;

    try {
      // Check if already loaded
      if (window.YT && window.YT.Player) {
        apiLoadedRef.current = true;
        return;
      }

      // Only load if not already in DOM
      const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
      if (existingScript) {
        apiLoadedRef.current = true;
        return;
      }

      // Set up callback BEFORE loading script - this is critical
      let apiReadyTimeout: NodeJS.Timeout;
      window.onYouTubeIframeAPIReady = () => {
        apiLoadedRef.current = true;
        clearTimeout(apiReadyTimeout);
      };

      // Fallback: if API doesn't call ready in reasonable time, mark as attempted
      apiReadyTimeout = setTimeout(() => {
        if (window.YT && window.YT.Player) {
          apiLoadedRef.current = true;
        }
      }, 5000);

      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      
      script.onerror = () => {
        console.warn("Failed to load YouTube API script");
        clearTimeout(apiReadyTimeout);
      };

      // Append to head for better script loading order
      if (document.head) {
        document.head.appendChild(script);
      } else {
        document.body.appendChild(script);
      }
    } catch (error) {
      console.warn("Error loading YouTube IFrame API:", error);
      apiLoadedRef.current = false;
    }
  }, []);

  // Load YouTube API only when we have a track
  useEffect(() => {
    if (currentTrack && !apiLoadedRef.current && typeof window !== "undefined") {
      loadYouTubeAPI();
    }
  }, [currentTrack, loadYouTubeAPI]);

  // Initialize or update player when track changes
  useEffect(() => {
    if (!currentTrack || !window.YT || !window.YT.Player) return;

    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const createPlayer = () => {
      if (!isMounted || !playerContainerRef.current) return;

      try {
        // If player exists, just load new video
        if (playerRef.current?.loadVideoById) {
          playerRef.current.loadVideoById(currentTrack.videoId);
          return;
        }

        // Create new player
        playerRef.current = new window.YT.Player(playerContainerRef.current, {
          height: "0",
          width: "0",
          videoId: currentTrack.videoId,
          events: {
            onStateChange: (event: any) => {
              if (event.data === window.YT.PlayerState.ENDED) {
                playNextRef.current();
              }
            },
            onError: (event: any) => {
              console.error("YouTube player error:", event.data);
              playerRef.current = null;
            },
          },
        });
      } catch (error) {
        console.warn("Player creation error:", error);
        // Don't retry - let it be
      }
    };

    // Wait for DOM to settle then create player
    timeoutId = setTimeout(createPlayer, 100);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [currentTrack?.videoId]);

  // Handle play/pause
  useEffect(() => {
    if (!playerRef.current || !playerRef.current.playVideo) return;

    if (isPlaying) {
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  }, [isPlaying]);

  // Update progress and duration
  useEffect(() => {
    if (!isPlaying || isDragging || !playerRef.current || !playerRef.current.getCurrentTime) return;

    const interval = setInterval(() => {
      try {
        const currentTime = playerRef.current?.getCurrentTime?.() || 0;
        const videoDuration = playerRef.current?.getDuration?.() || 0;

        if (videoDuration > 0) {
          setElapsedTime(Math.floor(currentTime));
          setProgress((currentTime / videoDuration) * 100);
          setDuration(Math.floor(videoDuration));
        }
      } catch (error) {
        // Player methods may not be ready yet
        console.warn("Player methods not ready:", error);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, isDragging]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
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

    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = (clickX / rect.width) * 100;
    
    const seekTime = (percentage / 100) * duration;
    playerRef.current.seekTo(seekTime);
    
    setElapsedTime(Math.floor(seekTime));
    setProgress(percentage);
  };

  const handleBubbleMouseDown = () => {
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging || !playerRef.current || !duration) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!progressBarRef.current) return;

      const rect = progressBarRef.current.getBoundingClientRect();
      const moveX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (moveX / rect.width) * 100));

      const seekTime = (percentage / 100) * duration;
      playerRef.current.seekTo(seekTime);

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
    <>
      {/* YouTube Player Container - must exist in DOM and be accessible */}
      <div 
        id="youtube-player-container" 
        ref={playerContainerRef} 
        style={{ 
          position: "absolute",
          width: "1px",
          height: "1px",
          left: "-9999px",
          visibility: "hidden",
          pointerEvents: "none"
        }} 
      />

      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 z-50">
        {/* Progress bar */}
        <div 
          ref={progressBarRef}
          onClick={handleProgressClick}
          className="w-full h-1 bg-gray-800 relative z-50 cursor-pointer group"
        >
          <div
            className={`h-full bg-gradient-to-r from-blue-500 to-purple-500 relative ${!isDragging ? 'transition-all duration-300' : ''}`}
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
            {/* Thumbnail */}
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

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{currentTrack.title}</p>
              <p className="text-sm text-gray-400">{currentTrack.channel}</p>
              <p className="text-xs text-gray-500 mt-1">{formatTime(elapsedTime)}</p>
            </div>

            {/* Controls */}
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
                {isLiked ? "❤️ Liked" : "🤍 Like"}
              </button>
              <button
                onClick={() => {
                  if (!playerRef.current) return;
                  if (isPlaying) {
                    playerRef.current.pauseVideo();
                  } else {
                    playerRef.current.playVideo();
                  }
                  setIsPlaying(!isPlaying);
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition"
              >
                {isPlaying ? "⏸ Pause" : "▶ Play"}
              </button>
              {tracks.length > 1 && (
                <button
                  onClick={playNext}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
                >
                  Skip →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
