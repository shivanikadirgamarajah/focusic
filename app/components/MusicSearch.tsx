"use client";

import { useState } from "react";
import { Track } from "@/app/types";

interface MusicSearchProps {
  onSearch: (tracks: Track[]) => void;
  loading?: boolean;
}

export default function MusicSearch({ onSearch, loading = false }: MusicSearchProps) {
  const [mood, setMood] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSearch() {
    if (!mood) return;
    
    // Track search in history
    const searchHistory = JSON.parse(localStorage.getItem("searchHistory") || "[]");
    searchHistory.push(mood);
    localStorage.setItem("searchHistory", JSON.stringify(searchHistory.slice(-20))); // Keep last 20
    
    setIsLoading(true);
    try {
      const ytRes = await fetch(
        `/api/youtube/search?q=${encodeURIComponent(mood + " ambient focus music")}`
      );
      const { videos } = await ytRes.json();

      if (!Array.isArray(videos) || videos.length === 0) {
        throw new Error("No tracks found");
      }

      const aiRes = await fetch("/api/ai/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood, tracks: videos }),
      });

      console.log("AI response status:", aiRes.status);
      
      const aiData = await aiRes.json();
      console.log("AI response data:", aiData);
      
      if (!aiData.result) {
        throw new Error("No result in AI response");
      }
      
      const classifiedTracks = JSON.parse(aiData.result);
      console.log("Classified tracks:", classifiedTracks);
      
      onSearch(classifiedTracks);
    } catch (error) {
      console.error(error);
      alert("Something went wrong getting recommendations.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="flex gap-3">
      <input
        value={mood}
        onChange={(e) => setMood(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        placeholder="coding, studying, deep work..."
        className="flex-1 rounded-lg px-4 py-3 text-black bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={handleSearch}
        disabled={isLoading || !mood || loading}
        className="rounded-lg bg-white px-5 py-3 font-semibold text-black disabled:opacity-50 hover:bg-gray-100 transition"
      >
        {isLoading ? "Loading..." : "Start"}
      </button>
    </section>
  );
}
