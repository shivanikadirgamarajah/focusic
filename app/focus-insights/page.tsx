"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { UserPreferences } from "@/app/components/Onboarding";
import {
  focusActivityUpdatedEvent,
  formatLocalDateKey,
  readFocusActivity,
  type ActivityData,
} from "@/app/utils/focusActivity";



const preferencesUpdatedEvent = "focusic:userPreferencesUpdated";
const emptySnapshot: FocusInsightsSnapshot = { preferences: null, activityData: {} };
let cachedPreferencesJson: string | null = null;
let cachedActivityJson: string | null = null;
let cachedSnapshot: FocusInsightsSnapshot = emptySnapshot;

interface FocusInsightsSnapshot {
  preferences: UserPreferences | null;
  activityData: ActivityData;
}

type ActivityRange = "weekly" | "monthly";

function readPreferences(): UserPreferences | null {
  const saved = window.localStorage.getItem("userPreferences");
  if (!saved) return null;

  try {
    return JSON.parse(saved) as UserPreferences;
  } catch {
    return null;
  }
}

function readInsightsSnapshot(): FocusInsightsSnapshot {
  if (typeof window === "undefined") {
    return emptySnapshot;
  }

  const preferencesJson = window.localStorage.getItem("userPreferences");
  const activityJson = window.localStorage.getItem("focusActivity");

  if (preferencesJson === cachedPreferencesJson && activityJson === cachedActivityJson) {
    return cachedSnapshot;
  }

  cachedPreferencesJson = preferencesJson;
  cachedActivityJson = activityJson;
  cachedSnapshot = {
    preferences: readPreferences(),
    activityData: readFocusActivity(),
  };

  return cachedSnapshot;
}

function subscribeToInsights(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(preferencesUpdatedEvent, onStoreChange);
  window.addEventListener(focusActivityUpdatedEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(preferencesUpdatedEvent, onStoreChange);
    window.removeEventListener(focusActivityUpdatedEvent, onStoreChange);
  };
}

function getRecentDates(days: number) {
  const dates: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let index = days - 1; index >= 0; index--) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    dates.push(formatLocalDateKey(date));
  }

  return dates;
}

function formatHours(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

export default function FocusInsightsPage() {
  const [activityRange, setActivityRange] = useState<ActivityRange>("weekly");
  const { preferences, activityData } = useSyncExternalStore(
    subscribeToInsights,
    readInsightsSnapshot,
    () => emptySnapshot
  );

  const recentDates = getRecentDates(7);
  const recentMinutes = recentDates.map((date) => activityData[date] || 0);
  const chartDays = activityRange === "weekly" ? 7 : 30;
  const chartDates = getRecentDates(chartDays);
  const chartMinutes = chartDates.map((date) => activityData[date] || 0);
  const chartMaxMinutes = Math.max(...chartMinutes, 1);
  const weekTotal = recentMinutes.reduce((total, minutes) => total + minutes, 0);
  const activeDays = recentMinutes.filter((minutes) => minutes > 0).length;
  const averageMinutes = Math.round(weekTotal / recentDates.length);
  const bestEntry = Object.entries(activityData).reduce(
    (best, [date, minutes]) => (minutes > best.minutes ? { date, minutes } : best),
    { date: "", minutes: 0 }
  );

  if (!preferences) {
    return (
      <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <Link href="/profile" className="text-sm font-semibold text-cyan-300 hover:text-cyan-100">
            Back to Profile
          </Link>
          <section className="rounded-lg border border-gray-800 bg-gray-950/80 p-6">
            <h1 className="text-3xl font-bold">Focus Insights</h1>
            <p className="mt-3 text-gray-400">Create a focus profile to see your rhythm and activity insights.</p>
          </section>
        </div>
      </main>
    );
  }
  const totalFocusTime = preferences.totalFocusTime ?? 0;
  const totalFocusHours = Math.floor(totalFocusTime / 60);
  const totalFocusMinutes = totalFocusTime % 60;
  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="flex flex-col justify-between gap-4 border-b border-gray-800 pb-8 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
              Focus insights
            </p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{preferences.name}&apos;s Focus Rhythm</h1>
            <p className="mt-3 max-w-2xl text-gray-400">
              A closer look at your timer balance and recent focus activity.
            </p>
          </div>
          <Link
            href="/profile"
            className="rounded-lg border border-gray-700 px-5 py-3 text-center font-semibold text-gray-200 transition hover:border-emerald-400 hover:text-white"
          >
            Back to Profile
          </Link>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-cyan-900/80 bg-cyan-950/20 p-5">
            <p className="text-sm font-semibold text-cyan-200">Total Focus</p>
            <p className="mt-3 text-3xl font-bold text-cyan-100">
              {totalFocusHours}h {totalFocusMinutes}m
            </p>
          </div>

          <div className="rounded-lg border border-cyan-900/80 bg-cyan-950/20 p-5">
            <p className="text-sm font-semibold text-cyan-200">Last 7 Days</p>
            <p className="mt-3 text-3xl font-bold text-cyan-100">{formatHours(weekTotal)}</p>
            <p className="mt-1 text-sm text-gray-400">{activeDays} active day{activeDays !== 1 ? "s" : ""}</p>
          </div>

          <div className="rounded-lg border border-gray-800 bg-gray-950/80 p-5">
            <p className="text-sm font-semibold text-gray-400">Daily Average</p>
            <p className="mt-3 text-3xl font-bold">{formatHours(averageMinutes)}</p>
            <p className="mt-1 text-sm text-gray-400">over the last week</p>
          </div>

          <div className="rounded-lg border border-gray-800 bg-gray-950/80 p-5">
            <p className="text-sm font-semibold text-gray-400">Best Day</p>
            <p className="mt-3 text-3xl font-bold">{formatHours(bestEntry.minutes)}</p>
            <p className="mt-1 text-sm text-gray-400">{bestEntry.date || "No activity yet"}</p>
          </div>
        </section>

        <section className="rounded-lg border border-gray-800 bg-gray-950/80 p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-xl font-bold">Recent Activity</h2>
              <p className="mt-1 text-sm text-gray-400">
                Focus minutes recorded over the last {chartDays} days.
              </p>
            </div>

            <div className="grid w-full grid-cols-2 rounded-lg border border-gray-800 bg-black p-1 sm:w-auto">
              {(["weekly", "monthly"] as ActivityRange[]).map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setActivityRange(range)}
                  className={`rounded-md px-4 py-2 text-sm font-semibold capitalize transition ${
                    activityRange === range
                      ? "bg-emerald-400 text-black"
                      : "text-gray-400 hover:bg-gray-900 hover:text-white"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 overflow-x-auto pb-2">
            <div
              className="grid min-w-full gap-3"
              style={{ gridTemplateColumns: `repeat(${chartDates.length}, minmax(2.25rem, 1fr))` }}
            >
              {chartDates.map((date, index) => {
                const minutes = chartMinutes[index];
                const height = minutes === 0 ? 8 : Math.max(12, Math.round((minutes / chartMaxMinutes) * 120));
                const showMonthlyLabel = activityRange === "weekly" || index % 5 === 0 || index === chartDates.length - 1;

                return (
                  <div key={date} className="flex min-w-0 flex-col items-center gap-3">
                    <div className="flex h-32 w-full items-end rounded-lg bg-black/70 px-2 py-2">
                      <div
                        className={`w-full rounded ${minutes === 0 ? "bg-gray-800" : "bg-emerald-400"}`}
                        style={{ height }}
                        title={`${date}: ${minutes} minute${minutes !== 1 ? "s" : ""}`}
                      />
                    </div>
                    <div className="min-h-9 text-center">
                      <p className="text-xs font-semibold text-gray-300">{showMonthlyLabel ? date.slice(5) : ""}</p>
                      <p className="mt-1 text-xs text-gray-500">{showMonthlyLabel ? `${minutes}m` : ""}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
