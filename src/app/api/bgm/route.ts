import { NextResponse } from "next/server";

// Proxy163 music to avoid CORS issues
export async function GET() {
  try {
    const res = await fetch(
      "https://music.163.com/song/media/outer/url?id=3380907905.mp3",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Referer: "https://music.163.com/",
        },
        redirect: "follow",
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `163 returned ${res.status}` },
        { status: 502 }
      );
    }

    const body = await res.arrayBuffer();
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    console.error("BGM proxy error:", err);
    return NextResponse.json({ error: "Proxy failed" }, { status: 500 });
  }
}
