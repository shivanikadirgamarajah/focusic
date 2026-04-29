"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PomodoroTimer from "@/app/components/PomodoroTimer";
import Onboarding, { UserPreferences } from "@/app/components/Onboarding";
import QuickSettings from "@/app/components/QuickSettings";
import { useMusic } from "@/app/context/MusicContext";

export default function TimerPage() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showQuickSettings, setShowQuickSettings] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("userPreferences");
    if (saved) {
      setPreferences(JSON.parse(saved));
    } else {
      setShowOnboarding(true);
    }
  }, []);

  function handleOnboardingComplete(prefs: UserPreferences) {
    setPreferences(prefs);
    setShowOnboarding(false);
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      {showQuickSettings && (
        <QuickSettings
          preferences={preferences}
          onSave={setPreferences}
          onClose={() => setShowQuickSettings(false)}
        />
      )}

      <div className="mx-auto max-w-3xl space-y-8">
        <section>
          <h1 className="text-4xl font-bold">
            Pomodoro Timer
          </h1>
          <p className="mt-2 text-gray-400">
            {preferences?.workType && `Working on: ${preferences.workType}`}
          </p>
        </section>

        <PomodoroTimer preferences={preferences} />

        <div className="flex gap-3 justify-center pt-8">
          <Link
            href="/"
            className="rounded-lg border border-gray-700 px-5 py-3 font-semibold hover:bg-gray-900 transition"
          >
            ← Back to Home
          </Link>
          <button
            onClick={() => setShowQuickSettings(true)}
            className="rounded-lg border border-gray-700 px-5 py-3 font-semibold hover:bg-gray-900 transition"
          >
            ⏱️ Adjust Timer
          </button>
        </div>
      </div>
    </main>
  );
}

