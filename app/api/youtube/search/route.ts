import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "ambient focus music";

  try {
    if (!process.env.YOUTUBE_API_KEY) {
      console.error("YOUTUBE_API_KEY is not set");
      return NextResponse.json(
        { error: "YouTube API key is not configured" },
        { status: 500 }
      );
    }

    const youtubeUrl = new URL("https://www.googleapis.com/youtube/v3/search");

    youtubeUrl.searchParams.set("part", "snippet");
    youtubeUrl.searchParams.set("q", q);
    youtubeUrl.searchParams.set("type", "video");
    youtubeUrl.searchParams.set("maxResults", "10");
    youtubeUrl.searchParams.set("key", process.env.YOUTUBE_API_KEY);

    const response = await fetch(youtubeUrl);

    if (!response.ok) {
      const errorData = await response.text();
      console.error("YouTube API error:", response.status, errorData);
      return NextResponse.json(
        { error: "Failed to fetch YouTube videos", details: errorData },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      console.warn("No items returned from YouTube API");
      return NextResponse.json({
        videos: [],
        nextPageToken: null
      });
    }

    const videos = data.items.map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.medium?.url,
    }));

    return NextResponse.json({
      videos,
      nextPageToken: data.nextPageToken || null
    });
  } catch (error) {
    console.error("YouTube search error:", error);
    return NextResponse.json(
      { error: "Failed to search YouTube", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}