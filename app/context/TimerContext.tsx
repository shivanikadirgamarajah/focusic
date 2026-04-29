"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface TimerContextType {
  timerSeconds: number;
  isRunning: boolean;
  sessionType: "work" | "break";
  setTimerSeconds: (seconds: number) => void;
  setIsRunning: (running: boolean) => void;
  setSessionType: (type: "work" | "break") => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function TimerProvider({ children }: { children: ReactNode }) {
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState<"work" | "break">("work");
  const [initialized, setInitialized] = useState(false);

  // Load timer state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("timerState");
    if (saved) {
      const timerState = JSON.parse(saved);
      const lastUpdated = timerState.lastUpdated;
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - lastUpdated) / 1000);

      setSessionType(timerState.sessionType);

      // If timer was running, subtract elapsed time
      if (timerState.isRunning) {
        const newSeconds = Math.max(0, timerState.timerSeconds - elapsedSeconds);
        setTimerSeconds(newSeconds);
        setIsRunning(newSeconds > 0); // Stop if timer would have gone to 0
      } else {
        setTimerSeconds(timerState.timerSeconds);
        setIsRunning(false);
      }
    }
    setInitialized(true);
  }, []);

  // Save timer state to localStorage whenever it changes
  useEffect(() => {
    if (initialized) {
      localStorage.setItem(
        "timerState",
        JSON.stringify({
          timerSeconds,
          isRunning,
          sessionType,
          lastUpdated: Date.now(),
        })
      );
    }
  }, [timerSeconds, isRunning, sessionType, initialized]);

  return (
    <TimerContext.Provider
      value={{
        timerSeconds,
        isRunning,
        sessionType,
        setTimerSeconds,
        setIsRunning,
        setSessionType,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error("useTimer must be used within TimerProvider");
  }
  return context;
}
