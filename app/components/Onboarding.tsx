"use client";

import { useState } from "react";

interface OnboardingProps {
  onComplete: (preferences: UserPreferences) => void;
}

export interface UserPreferences {
  workType: string;
  focusLength: number;
  breakLength: number;
  completed: boolean;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [workType, setWorkType] = useState("");
  const [focusLength, setFocusLength] = useState(25);
  const [breakLength, setBreakLength] = useState(5);

  function handleNext() {
    if (step < 3) {
      setStep(step + 1);
    } else {
      const preferences: UserPreferences = {
        workType,
        focusLength,
        breakLength,
        completed: true,
      };
      localStorage.setItem("userPreferences", JSON.stringify(preferences));
      onComplete(preferences);
    }
  }

  function handlePrev() {
    if (step > 1) setStep(step - 1);
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* Step 1: Work Type */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">What do you do? 💼</h2>
              <p className="text-gray-400">Tell us about your work</p>
            </div>
            <div className="space-y-3">
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
        )}

        {/* Step 2: Focus Length */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Focus Time ⏱️</h2>
              <p className="text-gray-400">How long do you want to focus?</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold text-2xl">{focusLength} min</span>
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={focusLength}
                  onChange={(e) => setFocusLength(parseInt(e.target.value))}
                  className="w-32 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
              <p className="text-sm text-gray-400">Adjust the slider to set your focus duration</p>
            </div>
          </div>
        )}

        {/* Step 3: Break Length */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Break Time ☕</h2>
              <p className="text-gray-400">How long for your breaks?</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold text-2xl">{breakLength} min</span>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={breakLength}
                  onChange={(e) => setBreakLength(parseInt(e.target.value))}
                  className="w-32 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
              <p className="text-sm text-gray-400">Adjust the slider to set your break duration</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex gap-3">
          {step > 1 && (
            <button
              onClick={handlePrev}
              className="flex-1 rounded-lg bg-gray-700 hover:bg-gray-600 px-4 py-2 font-semibold text-white transition"
            >
              ← Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={
              (step === 1 && !name) ||
              (step === 2 && !workType)
            }
            className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 font-semibold text-white transition"
          >
            {step === 4 ? "Get Started 🚀" : "Next →"}
          </button>
        </div>

        {/* Progress */}
        <div className="mt-6 flex gap-2 justify-center">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 w-2 rounded-full transition ${
                s <= step ? "bg-blue-500 w-6" : "bg-gray-700"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
