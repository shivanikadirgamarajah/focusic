import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "ambient focus music";

  try {
    const youtubeUrl = new URL("https://www.googleapis.com/youtube/v3/search");

    youtubeUrl.searchParams.set("part", "snippet");
    youtubeUrl.searchParams.set("q", q);
    youtubeUrl.searchParams.set("type", "video");
    youtubeUrl.searchParams.set("maxResults", "10");
    youtubeUrl.searchParams.set("key", process.env.YOUTUBE_API_KEY!);

    const response = await fetch(youtubeUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch YouTube videos" },
        { status: 500 }
      );
    }

    const data = await response.json();

    const videos = data.items.map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.medium?.url,
    }));

    return NextResponse.json(videos);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to search YouTube" },
      { status: 500 }
    );
  }
}