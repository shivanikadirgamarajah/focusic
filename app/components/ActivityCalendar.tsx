"use client";

import { useState, useEffect } from "react";
function formatLocalDate(date: Date) {
  return date.toLocaleDateString("en-CA");
}
interface ActivityData {
  [date: string]: number; // date -> number of focus sessions completed
}

export default function ActivityCalendar() {
  const [activityData, setActivityData] = useState<ActivityData>({});
  const [currentDate] = useState(new Date());

  useEffect(() => {
    const loadActivity = () => {
      const saved = localStorage.getItem("focusActivity");
      if (saved) {
        setActivityData(JSON.parse(saved));
      }
    };

    loadActivity();
    window.addEventListener("focusActivityUpdated", loadActivity);

    return () => {
      window.removeEventListener("focusActivityUpdated", loadActivity);
    };
  }, []);

  // Get the last 52 weeks of data
  function getWeeksData() {
    const weeks = [];
    const startDate = new Date(currentDate);
    startDate.setDate(startDate.getDate() - 364); // 52 weeks back

    for (let week = 0; week < 52; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + week * 7 + day);
        const dateStr = formatLocalDate(date);
        const count = activityData[dateStr] || 0;
        weekDays.push({ date: dateStr, count });
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
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Focus Activity</h3>
        <p className="text-gray-400 mb-4">Your focus minutes over the last year</p>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="inline-block">
          {/* Month labels */}
          <div className="flex mb-2 ml-12 gap-1">
            {monthLabels.map((month) => (
              <div key={month} className="flex-1 text-xs text-gray-500 font-semibold text-center">
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
                      className={`w-3 h-3 rounded-sm ${getIntensityColor(day.count)} cursor-pointer hover:ring-1 hover:ring-white transition`}
                      title={`${day.date}: ${day.count} session${day.count !== 1 ? "s" : ""}`}
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
