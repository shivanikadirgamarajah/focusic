"use client";

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-gray-700"></div>
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-purple-500 animate-spin"
          ></div>
        </div>
        
        {/* Loading text */}
        <p className="text-white font-semibold">Loading tracks...</p>
        <p className="text-gray-400 text-sm">This may take a few seconds</p>
      </div>
    </div>
  );
}
