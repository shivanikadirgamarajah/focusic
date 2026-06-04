"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import ActivityCalendar from "@/app/components/ActivityCalendar";
import { UserPreferences } from "@/app/components/Onboarding";

const preferencesUpdatedEvent = "focusic:userPreferencesUpdated";
let cachedPreferencesJson: string | null = null;
let cachedPreferences: UserPreferences | null = null;
const workTypes = ["Coding", "Studying", "Writing", "Design", "Other"];

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
      <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <section className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Profile setup
            </p>
            <h1 className="max-w-2xl text-4xl font-bold sm:text-5xl">Create your focus profile</h1>
            <p className="max-w-2xl text-base text-gray-400">
              Personalize your timer and recommendations around the kind of work you do most.
            </p>
          </section>

          <form
            onSubmit={handleCreateProfile}
            className="rounded-lg border border-gray-800 bg-gray-950/80 p-5 shadow-2xl shadow-black/30 sm:p-8"
          >
            <div className="grid gap-8 lg:grid-cols-[1fr_1.05fr]">
              <section className="space-y-5">
                <div>
                  <label htmlFor="profile-name" className="block text-sm font-semibold text-gray-200">
                    Your Name
                  </label>
                  <input
                    id="profile-name"
                    name="name"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-2 w-full rounded-lg border border-gray-700 bg-black px-4 py-3 text-white placeholder-gray-500 transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  <label className="rounded-lg border border-gray-800 bg-black/60 p-4">
                    <span className="block text-sm font-semibold text-gray-300">Focus Time</span>
                    <span className="mt-2 block text-3xl font-bold text-white">{focusLength} min</span>
                    <input
                      type="range"
                      min="10"
                      max="60"
                      value={focusLength}
                      onChange={(e) => setFocusLength(parseInt(e.target.value))}
                      className="mt-4 w-full accent-cyan-400"
                    />
                  </label>

                  <label className="rounded-lg border border-gray-800 bg-black/60 p-4">
                    <span className="block text-sm font-semibold text-gray-300">Break Time</span>
                    <span className="mt-2 block text-3xl font-bold text-white">{breakLength} min</span>
                    <input
                      type="range"
                      min="1"
                      max="15"
                      value={breakLength}
                      onChange={(e) => setBreakLength(parseInt(e.target.value))}
                      className="mt-4 w-full accent-emerald-400"
                    />
                  </label>
                </div>
              </section>

              <section className="space-y-5">
                <fieldset>
                  <legend className="text-sm font-semibold text-gray-200">What do you work on?</legend>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    {workTypes.map((type) => (
                      <label
                        key={type}
                        htmlFor={`work-type-${type.toLowerCase()}`}
                        onClick={() => setWorkType(type)}
                        className={`flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 font-semibold transition ${
                          workType === type
                            ? "border-cyan-300 bg-cyan-400/15 text-white shadow-lg shadow-cyan-950/30"
                            : "border-gray-800 bg-black/60 text-gray-300 hover:border-gray-600 hover:bg-gray-900"
                        }`}
                      >
                        <input
                          id={`work-type-${type.toLowerCase()}`}
                          type="radio"
                          name="workType"
                          value={type}
                          checked={workType === type}
                          onChange={() => setWorkType(type)}
                          className="h-4 w-4 accent-cyan-400"
                          required
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="rounded-lg border border-gray-800 bg-black/60 p-4">
                  <p className="text-sm font-semibold text-gray-300">Starting Settings</p>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Mode</p>
                      <p className="mt-1 font-semibold text-white">{workType || "Choose one"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Focus</p>
                      <p className="mt-1 font-semibold text-white">{focusLength} min</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Break</p>
                      <p className="mt-1 font-semibold text-white">{breakLength} min</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                className="w-full rounded-lg bg-white px-5 py-3 font-semibold text-black transition hover:bg-cyan-100 sm:w-auto"
              >
                Create Profile
              </button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  const totalFocusTime = preferences.totalFocusTime ?? 0;
  

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="flex flex-col justify-between gap-6 border-b border-gray-800 pb-8 lg:flex-row lg:items-end">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Focus profile
            </p>
            <h1 className="text-3xl font-bold sm:text-3xl">{preferences.name}&apos;s Ambience</h1>
            <p className="max-w-2xl text-gray-400">
              Your focus setup, session history, and timer preferences in one place.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/timer"
              className="rounded-lg border border-gray-700 px-5 py-3 text-center font-semibold text-gray-200 transition hover:border-cyan-400 hover:text-white"
            >
              Back to Timer
            </Link>
            <button
              onClick={handleClearAll}
              className="rounded-lg border border-red-900/80 px-5 py-3 font-semibold text-red-200 transition hover:border-red-500 hover:bg-red-950/40"
            >
              Reset Profile
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          

          

          <Link
            href="/focus-insights"
            className="flex w-full min-h-28 items-center justify-center rounded-lg border border-emerald-900/80 bg-emerald-950/20 p-5 text-center text-2xl font-bold text-emerald-100 transition hover:border-emerald-400 hover:bg-emerald-950/35 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-black"
          >
            Focus Insights
          </Link>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
          

          <div className="rounded-lg border border-gray-800 bg-gray-950/80 p-6">
            <ActivityCalendar />
          </div>
        </section>
      </div>
    </main>
  );
}
