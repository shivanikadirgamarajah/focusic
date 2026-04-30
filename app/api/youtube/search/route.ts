import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "ambient focus music";

  try {
    if (!process.env.YOUTUBE_API_KEY) {
      console.error("YOUTUBE_API_KEY is not set");
      return NextResponse.json(
        { error: "YouTube API key is not configured", details: "YOUTUBE_API_KEY environment variable is missing" },
        { status: 500 }
      );
    }

    console.log("Searching YouTube for:", q);

    const youtubeUrl = new URL("https://www.googleapis.com/youtube/v3/search");

    youtubeUrl.searchParams.set("part", "snippet");
    youtubeUrl.searchParams.set("q", q);
    youtubeUrl.searchParams.set("type", "video");
    youtubeUrl.searchParams.set("maxResults", "10");
    youtubeUrl.searchParams.set("key", process.env.YOUTUBE_API_KEY);

    const response = await fetch(youtubeUrl);

    if (!response.ok) {
      const errorData = await response.text();
      console.error("YouTube API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorData.slice(0, 500),
      });
      
      let errorDetails = errorData;
      try {
        const parsed = JSON.parse(errorData);
        errorDetails = parsed.error?.message || errorData;
      } catch (e) {
        // Keep errorData as-is if not JSON
      }
      
      return NextResponse.json(
        { 
          error: "Failed to fetch YouTube videos", 
          details: errorDetails,
          type: response.status === 403 ? "invalid_api_key" : response.status === 401 ? "auth_error" : "unknown"
        },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      console.warn("No items returned from YouTube API for query:", q);
      return NextResponse.json({
        videos: [],
        nextPageToken: null
      });
    }

    // Extract video IDs for the second API call to get durations
    const videoIds = data.items.map((item: any) => item.id.videoId).join(",");

    // Fetch video durations
    const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    videosUrl.searchParams.set("part", "contentDetails");
    videosUrl.searchParams.set("id", videoIds);
    videosUrl.searchParams.set("key", process.env.YOUTUBE_API_KEY);

    const videosResponse = await fetch(videosUrl);
    const videosData = videosResponse.ok ? await videosResponse.json() : { items: [] };

    // Map duration data by videoId for quick lookup
    const durationMap: Record<string, string> = {};
    if (videosData.items) {
      videosData.items.forEach((item: any) => {
        if (item.contentDetails?.duration) {
          // Convert ISO 8601 duration to MM:SS or H:MM:SS
          const match = item.contentDetails.duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
          const hours = parseInt(match?.[1] || 0);
          const minutes = parseInt(match?.[2] || 0);
          const seconds = parseInt(match?.[3] || 0);
          const totalSeconds = hours * 3600 + minutes * 60 + seconds;
          const displayHours = Math.floor(totalSeconds / 3600);
          const displayMinutes = Math.floor((totalSeconds % 3600) / 60);
          const displaySeconds = totalSeconds % 60;
          
          if (displayHours > 0) {
            durationMap[item.id] = `${displayHours}:${displayMinutes.toString().padStart(2, "0")}:${displaySeconds.toString().padStart(2, "0")}`;
          } else {
            durationMap[item.id] = `${displayMinutes}:${displaySeconds.toString().padStart(2, "0")}`;
          }
        }
      });
    }

    const videos = data.items.map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.medium?.url,
      duration: durationMap[item.id.videoId] || "0:00",
    }));

    return NextResponse.json({
      videos,
      nextPageToken: data.nextPageToken || null
    });
  } catch (error) {
    console.error("YouTube search error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        error: "Failed to search YouTube", 
        details: errorMessage,
        type: errorMessage.includes("API") ? "api_error" : errorMessage.includes("network") ? "network_error" : "unknown"
      },
      { status: 500 }
    );
  }
}