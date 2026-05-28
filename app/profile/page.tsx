"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import ActivityCalendar from "@/app/components/ActivityCalendar";
import { UserPreferences } from "@/app/components/Onboarding";

const preferencesUpdatedEvent = "focusic:userPreferencesUpdated";
let cachedPreferencesJson: string | null = null;
let cachedPreferences: UserPreferences | null = null;

function isUserPreferences(value: unknown): value is UserPreferences {
  if (!value || typeof value !== "object") {
    return false;
  }

  const preferences = value as Partial<UserPreferences>;
  return (
    preferences.completed === true &&
    typeof preferences.name === "string" &&
    preferences.name.trim().length > 0 &&
    typeof preferences.workType === "string" &&
    preferences.workType.trim().length > 0
  );
}

function readStoredPreferences(): UserPreferences | null {
  if (typeof window === "undefined") {
    return null;
  }

  const saved = window.localStorage.getItem("userPreferences");
  if (!saved) {
    cachedPreferencesJson = null;
    cachedPreferences = null;
    return null;
  }

  if (saved === cachedPreferencesJson) {
    return cachedPreferences;
  }

  try {
    const parsed = JSON.parse(saved);
    if (isUserPreferences(parsed)) {
      cachedPreferencesJson = saved;
      cachedPreferences = {
        ...parsed,
        focusLength: typeof parsed.focusLength === "number" ? parsed.focusLength : 25,
        breakLength: typeof parsed.breakLength === "number" ? parsed.breakLength : 5,
        totalFocusTime: typeof parsed.totalFocusTime === "number" ? parsed.totalFocusTime : 0,
      };
      return cachedPreferences;
    }
  } catch {
    // Fall through and clear the unusable value below.
  }

  window.localStorage.removeItem("userPreferences");
  cachedPreferencesJson = null;
  cachedPreferences = null;
  return null;
}

function subscribeToStoredPreferences(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(preferencesUpdatedEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(preferencesUpdatedEvent, onStoreChange);
  };
}

function notifyPreferencesUpdated() {
  window.dispatchEvent(new Event(preferencesUpdatedEvent));
}

export default function ProfilePage() {
  const preferences = useSyncExternalStore(
    subscribeToStoredPreferences,
    readStoredPreferences,
    () => null
  );
  const [name, setName] = useState("");
  const [workType, setWorkType] = useState("");
  const [focusLength, setFocusLength] = useState(25);
  const [breakLength, setBreakLength] = useState(5);

  function handleCreateProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const submittedName = formData.get("name");
    const submittedWorkType = formData.get("workType");
    const trimmedName = typeof submittedName === "string" ? submittedName.trim() : "";
    const selectedWorkType = typeof submittedWorkType === "string" ? submittedWorkType : "";

    if (!trimmedName || !selectedWorkType) {
      alert("Please fill in all fields");
      return;
    }

    const newPreferences: UserPreferences = {
      name: trimmedName,
      workType: selectedWorkType,
      focusLength,
      breakLength,
      totalFocusTime: preferences?.totalFocusTime ?? 0,
      completed: true,
    };

    window.localStorage.setItem("userPreferences", JSON.stringify(newPreferences));
    notifyPreferencesUpdated();
  }

  function handleClearAll() {
    if (confirm("Are you sure you want to reset all preferences?")) {
      window.localStorage.removeItem("userPreferences");
      notifyPreferencesUpdated();
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
          
          <form onSubmit={handleCreateProfile} className="rounded-lg border border-gray-700 p-8 space-y-6">
            {/* Name Input */}
            <div>
              <label htmlFor="profile-name" className="block text-white font-semibold mb-2">Your Name</label>
              <input
                id="profile-name"
                name="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg bg-gray-700 text-white px-4 py-3 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {/* Work Type Selection */}
            <div>
              <fieldset>
                <legend className="block text-white font-semibold mb-2">What do you work on?</legend>
                <div className="space-y-2">
                {["Coding", "Studying", "Writing", "Design", "Other"].map((type) => (
                  <label
                    key={type}
                    htmlFor={`work-type-${type.toLowerCase()}`}
                    onClick={() => setWorkType(type)}
                    className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 font-semibold transition ${
                      workType === type
                        ? "bg-blue-500 text-white"
                        : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                    }`}
                  >
                    <input
                      id={`work-type-${type.toLowerCase()}`}
                      type="radio"
                      name="workType"
                      value={type}
                      checked={workType === type}
                      onChange={() => setWorkType(type)}
                      className="h-4 w-4 accent-blue-500"
                      required
                    />
                    {type}
                  </label>
                ))}
                </div>
              </fieldset>
            </div>

            {/* Focus Length */}
            

            {/* Create Button */}
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-3 font-semibold text-white transition"
            >
              Create Profile
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <h1 className="text-4xl font-bold">{preferences.name}&apos;s Ambience</h1>

        <div className="rounded-lg border border-gray-700 p-6 space-y-6">
          <div>
            <p className="text-gray-400 text-sm mb-1">Name</p>
            <p className="text-2xl font-bold">{preferences.name}</p>
          </div>

          <div>
            <p className="text-gray-400 text-sm mb-1">Work Type</p>
            <p className="text-2xl font-bold">{preferences.workType}</p>
          </div>

         

          <div className="rounded-lg bg-blue-950 border border-blue-700 p-4">
            <p className="text-gray-400 text-sm mb-1">Total Focus Time</p>
            <p className="text-3xl font-bold text-blue-400">
              {Math.floor((preferences.totalFocusTime ?? 0) / 60)}h {(preferences.totalFocusTime ?? 0) % 60}m
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
