"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ActivityCalendar from "@/app/components/ActivityCalendar";
import { UserPreferences } from "@/app/components/Onboarding";

export default function ProfilePage() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [name, setName] = useState("");
  const [workType, setWorkType] = useState("");
  const [focusLength, setFocusLength] = useState(25);
  const [breakLength, setBreakLength] = useState(5);

  useEffect(() => {
    const saved = localStorage.getItem("userPreferences");
    if (saved) {
      setPreferences(JSON.parse(saved));
    }
  }, []);

  function handleCreateProfile() {
    if (!name || !workType) {
      alert("Please fill in all fields");
      return;
    }

    const newPreferences: UserPreferences = {
      name,
      workType,
      focusLength,
      breakLength,
      totalFocusTime: preferences?.totalFocusTime || 0,
      completed: true,
    };
    localStorage.setItem("userPreferences", JSON.stringify(newPreferences));
    setPreferences(newPreferences);
  }

  function handleClearAll() {
    if (confirm("Are you sure you want to reset all preferences?")) {
      localStorage.removeItem("userPreferences");
      setPreferences(null);
      setName("");
      setWorkType("");
      setFocusLength(25);
      setBreakLength(5);
    }
  }

  if (!preferences) {
    return (
      <main className="min-h-screen bg-black text-white p-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-bold mb-8">Create Your Profile </h1>
          
          <div className="rounded-lg border border-gray-700 p-8 space-y-6">
            {/* Name Input */}
            <div>
              <label className="block text-white font-semibold mb-2">Your Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg bg-gray-700 text-white px-4 py-3 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {/* Work Type Selection */}
            <div>
              <label className="block text-white font-semibold mb-2">What do you work on?</label>
              <div className="space-y-2">
                {["Coding", "Studying", "Writing", "Design", "Other"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setWorkType(type)}
                    className={`w-full rounded-lg px-4 py-3 font-semibold transition ${
                      workType === type
                        ? "bg-blue-500 text-white"
                        : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Focus Length */}
            <div>
              <label className="block text-white font-semibold mb-2">Focus Duration: {focusLength} min</label>
              <input
                type="range"
                min="10"
                max="60"
                value={focusLength}
                onChange={(e) => setFocusLength(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Break Length */}
            <div>
              <label className="block text-white font-semibold mb-2">Break Duration: {breakLength} min</label>
              <input
                type="range"
                min="1"
                max="15"
                value={breakLength}
                onChange={(e) => setBreakLength(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreateProfile}
              disabled={!name || !workType}
              className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 font-semibold text-white transition"
            >
              Create Profile 🚀
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <h1 className="text-4xl font-bold">{preferences.name}'s Ambience</h1>

        <div className="rounded-lg border border-gray-700 p-6 space-y-6">
          <div>
            <p className="text-gray-400 text-sm mb-1">Name</p>
            <p className="text-2xl font-bold">{preferences.name}</p>
          </div>

          <div>
            <p className="text-gray-400 text-sm mb-1">Work Type</p>
            <p className="text-2xl font-bold">{preferences.workType}</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-gray-400 text-sm mb-1">Focus Duration</p>
              <p className="text-2xl font-bold">{preferences.focusLength} min</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Break Duration</p>
              <p className="text-2xl font-bold">{preferences.breakLength} min</p>
            </div>
          </div>

          <div className="rounded-lg bg-blue-950 border border-blue-700 p-4">
            <p className="text-gray-400 text-sm mb-1">Total Focus Time</p>
            <p className="text-3xl font-bold text-blue-400">
              {Math.floor(preferences.totalFocusTime / 60)}h {preferences.totalFocusTime % 60}m
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-gray-700 p-6">
          <ActivityCalendar />
        </div>

        <div className="flex gap-3">
          <Link
            href="/timer"
            className="flex-1 rounded-lg border border-gray-700 px-5 py-3 font-semibold hover:bg-gray-900 transition text-center"
          >
            ← Back to Timer
          </Link>
          <button
            onClick={handleClearAll}
            className="flex-1 rounded-lg border border-red-700 px-5 py-3 font-semibold hover:bg-red-950 transition"
          >
            🔄 Reset Profile
          </button>
        </div>
      </div>
    </main>
  );
}
