"use client";

import { useState, useEffect } from "react";
import {
  focusActivityUpdatedEvent,
  formatLocalDateKey,
  readFocusActivity,
  type ActivityData,
} from "@/app/utils/focusActivity";

interface CalendarDay {
  date: string;
  label: string;
  count: number;
  isFuture: boolean;
  isToday: boolean;
}

const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });
const dayFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default function ActivityCalendar() {
  const [activityData, setActivityData] = useState<ActivityData>({});
  const [currentDate, setCurrentDate] = useState(() => new Date());

  useEffect(() => {
    const loadActivity = () => {
      setActivityData(readFocusActivity());
      setCurrentDate(new Date());
    };

    loadActivity();
    window.addEventListener(focusActivityUpdatedEvent, loadActivity);
    window.addEventListener("focus", loadActivity);

    const refreshToday = window.setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);

    return () => {
      window.removeEventListener(focusActivityUpdatedEvent, loadActivity);
      window.removeEventListener("focus", loadActivity);
      window.clearInterval(refreshToday);
    };
  }, []);

  // Get the last 52 weeks of data
  function getWeeksData() {
    const weeks: CalendarDay[][] = [];
    const startDate = new Date(currentDate);
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - startDate.getDay() - 51 * 7);
    const today = new Date(currentDate);
    today.setHours(0, 0, 0, 0);
    const todayKey = formatLocalDateKey(today);

    for (let week = 0; week < 52; week++) {
      const weekDays: CalendarDay[] = [];
      for (let day = 0; day < 7; day++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + week * 7 + day);
        const dateStr = formatLocalDateKey(date);
        const isFuture = date.getTime() > today.getTime();
        const isToday = dateStr === todayKey;
        const count = isFuture ? 0 : activityData[dateStr] || 0;
        weekDays.push({
          date: dateStr,
          label: dayFormatter.format(date),
          count,
          isFuture,
          isToday,
        });
      }
      weeks.push(weekDays);
    }
    return weeks;
  }

  function getIntensityColor(count: number): string {
    if (count === 0) return "bg-gray-800";
    if (count <= 15) return "bg-green-900";
    if (count <= 30) return "bg-green-700";
    if (count <= 60) return "bg-green-500";
    return "bg-green-400";
  }

  const weeks = getWeeksData();
  const monthLabels = weeks.map((weekDays, index) => {
    const firstDay = new Date(`${weekDays[0].date}T00:00:00`);
    const previousWeek = weeks[index - 1];
    const previousMonth = previousWeek ? previousWeek[0].date.slice(5, 7) : null;
    const currentMonth = weekDays[0].date.slice(5, 7);

    return index === 0 || currentMonth !== previousMonth
      ? monthFormatter.format(firstDay)
      : "";
  });
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayKey = formatLocalDateKey(currentDate);
  const todayMinutes = activityData[todayKey] || 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Focus Activity</h3>
        <p className="text-gray-400 mb-4">
          Today is {dayFormatter.format(currentDate)} · {todayMinutes} minute{todayMinutes !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="inline-block">
          {/* Month labels */}
          <div className="mb-2 ml-12 grid grid-cols-[repeat(52,0.75rem)] gap-1">
            {monthLabels.map((month, index) => (
              <div key={`${month || "empty"}-${index}`} className="h-4 text-xs font-semibold text-gray-500">
                {month}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col gap-1 text-xs text-gray-500 font-semibold">
              {dayLabels.map((day) => (
                <div key={day} className="w-10 h-3 flex items-center">
                  {day.charAt(0)}
                </div>
              ))}
            </div>

            {/* Week columns */}
            <div className="flex gap-1">
              {weeks.map((weekDays, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {weekDays.map((day, dayIndex) => (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`w-3 h-3 rounded-sm ${
                        day.isFuture ? "bg-transparent" : getIntensityColor(day.count)
                      } cursor-pointer transition hover:ring-1 hover:ring-white ${
                        day.isToday ? "ring-2 ring-cyan-300 ring-offset-2 ring-offset-black" : ""
                      }`}
                      title={
                        day.isFuture
                          ? day.label
                          : `${day.isToday ? "Today, " : ""}${day.label}: ${day.count} minute${day.count !== 1 ? "s" : ""}`
                      }
                      aria-label={
                        day.isFuture
                          ? day.label
                          : `${day.isToday ? "Today, " : ""}${day.label}: ${day.count} minute${day.count !== 1 ? "s" : ""}`
                      }
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-gray-800"></div>
          <div className="w-3 h-3 rounded-sm bg-green-900"></div>
          <div className="w-3 h-3 rounded-sm bg-green-700"></div>
          <div className="w-3 h-3 rounded-sm bg-green-500"></div>
          <div className="w-3 h-3 rounded-sm bg-green-400"></div>
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
