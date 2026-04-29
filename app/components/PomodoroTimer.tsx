"use client";

import { useEffect, useRef } from "react";
import { UserPreferences } from "./Onboarding";
import { useTimer } from "@/app/context/TimerContext";

interface PomodoroTimerProps {
  preferences?: UserPreferences | null;
}

export default function PomodoroTimer({ preferences }: PomodoroTimerProps) {
  const focusMinutes = preferences?.focusLength || 25;
  const breakMinutes = preferences?.breakLength || 5;
  
  // Use global timer context instead of local state
  const {
    timerSeconds,
    setTimerSeconds,
    isRunning,
    setIsRunning,
    sessionType,
    setSessionType,
  } = useTimer();
  
  const previousSessionTypeRef = useRef<"work" | "break">("work");

  const totalSeconds = sessionType === "work" ? focusMinutes * 60 : breakMinutes * 60;
  const progress = ((totalSeconds - timerSeconds) / totalSeconds) * 100;
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Track when work session completes
  useEffect(() => {
    if (previousSessionTypeRef.current === "work" && sessionType === "break" && preferences) {
      // Work session just completed, update total focus time
      const updatedPreferences = {
        ...preferences,
        totalFocusTime: preferences.totalFocusTime + focusMinutes,
      };
      localStorage.setItem("userPreferences", JSON.stringify(updatedPreferences));
    }
    previousSessionTypeRef.current = sessionType;
  }, [sessionType, preferences, focusMinutes]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            const newType = sessionType === "work" ? "break" : "work";
            setSessionType(newType);
            setIsRunning(false);
            alert(`${sessionType} session complete! Time for a ${newType}!`);
            return newType === "work" ? focusMinutes * 60 : breakMinutes * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timerSeconds, sessionType, focusMinutes, breakMinutes]);



  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  function resetTimer() {
    setIsRunning(false);
    setTimerSeconds(sessionType === "work" ? focusMinutes * 60 : breakMinutes * 60);
  }

  function switchSession() {
    setIsRunning(false);
    const newType = sessionType === "work" ? "break" : "work";
    setSessionType(newType);
    setTimerSeconds(newType === "work" ? focusMinutes * 60 : breakMinutes * 60);
  }

  const isWork = sessionType === "work";
  const circleColor = isWork ? "from-blue-400 to-blue-600" : "from-purple-400 to-purple-600";

  return (
    <section className="rounded-2xl border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-950 p-8 space-y-8 shadow-2xl">
      <div className="text-center space-y-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
          {isWork ? "⚡ Focus Session" : "☕ Break Time"}
        </p>

        {/* Circular Timer */}
        <div className="flex justify-center py-8">
          <div className="relative w-100 h-100">
            {/* Background circle */}
            <svg
              className="w-full h-full transform -rotate-90"
              viewBox="0 0 200 200"
            >
              {/* Outer track */}
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="#374151"
                strokeWidth="8"
              />
              
              {/* Progress circle */}
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.3s ease" }}
                className={`${
                  isRunning
                    ? isWork
                      ? "timer-progress-work"
                      : "timer-progress-break"
                    : isWork
                    ? "drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]"
                    : "drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]"
                }`}
              />
            </svg>

            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className={`text-7xl font-black font-mono ${
                isRunning
                  ? isWork
                    ? "timer-text-work"
                    : "timer-text-break"
                  : "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400"
              }`}>
                {formatTime(timerSeconds)}
              </p>
              <p className="text-lg text-gray-400 mt-2">
                {Math.round(progress)}%
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-3 gap-3 pt-4">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`rounded-lg px-4 py-3 font-semibold transition transform hover:scale-105 active:scale-95 ${
              isRunning
                ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/50"
                : "bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/50"
            }`}
          >
            {isRunning ? "⏸ Pause" : "▶ Start"}
          </button>
          <button
            onClick={resetTimer}
            className="rounded-lg bg-gray-700 hover:bg-gray-600 px-4 py-3 font-semibold text-white transition transform hover:scale-105 active:scale-95 shadow-lg"
          >
            ↺ Reset
          </button>
          <button
            onClick={switchSession}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-3 font-semibold text-white transition transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-600/50"
          >
            {isWork ? "☕ Break" : "⚡ Work"}
          </button>
        </div>
      </div>

      
    </section>
  );
}
