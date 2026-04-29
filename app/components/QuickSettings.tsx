"use client";

import { useState } from "react";
import { UserPreferences } from "./Onboarding";

interface QuickSettingsProps {
  preferences: UserPreferences | null;
  onSave: (preferences: UserPreferences) => void;
  onClose: () => void;
}

export default function QuickSettings({ preferences, onSave, onClose }: QuickSettingsProps) {
  const [focusLength, setFocusLength] = useState(preferences?.focusLength || 25);
  const [breakLength, setBreakLength] = useState(preferences?.breakLength || 5);

  function handleSave() {
    if (preferences) {
      const updated = {
        ...preferences,
        focusLength,
        breakLength,
      };
      localStorage.setItem("userPreferences", JSON.stringify(updated));
      onSave(updated);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-6">Adjust Timer ⏱️</h2>

        {/* Focus Length */}
        <div className="space-y-4 mb-8">
          <div>
            <label className="text-white font-semibold block mb-2">Focus Time</label>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-white">{focusLength} min</span>
              <input
                type="range"
                min="10"
                max="60"
                value={focusLength}
                onChange={(e) => setFocusLength(parseInt(e.target.value))}
                className="w-32 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Break Length */}
        <div className="space-y-4 mb-8">
          <div>
            <label className="text-white font-semibold block mb-2">Break Time</label>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-white">{breakLength} min</span>
              <input
                type="range"
                min="1"
                max="15"
                value={breakLength}
                onChange={(e) => setBreakLength(parseInt(e.target.value))}
                className="w-32 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg bg-gray-700 hover:bg-gray-600 px-4 py-2 font-semibold text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 font-semibold text-white transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
