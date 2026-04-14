import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

// Fetch the Cairo font once at the top level
const fontPromise = fetch(
  new URL("https://fonts.gstatic.com/s/cairo/v28/slnF-2En_p445JvXDBW3ZzE.ttf")
).then((res) => res.arrayBuffer());

export async function GET(request: NextRequest) {
  try {
    const fontData = await fontPromise;
    const { searchParams } = new URL(request.url);
    
    let setup = searchParams.get("setup") || "أفشات - Afchat.fun";
    let punchline = searchParams.get("punchline") || "أقوى قفشات وبانشلاين الردود العربية";
    const id = searchParams.get("id");

    // Try to fetch data if ID is provided
    if (id) {
      try {
        const API_BASE = "https://api.afchat.fun/api";
        const res = await fetch(`${API_BASE}/setups-by-id/${id}`, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          const data = json.data ?? json;
          if (data.text) setup = data.text;
          if (data.punchlines && data.punchlines.length > 0) {
            const sorted = [...data.punchlines].sort((a, b) => (b.laughs || 0) - (a.laughs || 0));
            punchline = sorted[0].text;
          }
        }
      } catch (e) {
        console.error("OG Data Fetch Error:", e);
      }
    }

    // Truncate long strings
    setup = setup.length > 80 ? setup.slice(0, 80) + "..." : setup;
    punchline = punchline.length > 80 ? punchline.slice(0, 80) + "..." : punchline;

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0d0216",
            backgroundImage: "radial-gradient(circle at center, #4b1088 0%, #0d0216 100%)",
            padding: "50px",
            color: "white",
            textAlign: "center",
            fontFamily: "Cairo",
          }}
        >
          {/* Top Brand */}
          <div
            style={{
              position: "absolute",
              top: 50,
              right: 60,
              fontSize: 36,
              fontWeight: 900,
              color: "#ffca28",
              display: "flex",
            }}
          >
            Afchat.fun
          </div>

          {/* Main Card */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255,255,255,0.06)",
              border: "2px solid rgba(255,255,255,0.12)",
              padding: "60px",
              borderRadius: "40px",
              width: "1000px",
            }}
          >
            {/* Setup */}
            <div
              style={{
                fontSize: 54,
                fontWeight: 800,
                color: "white",
                marginBottom: 40,
                direction: "rtl",
                display: "flex",
                lineHeight: 1.2,
              }}
            >
              "{setup}"
            </div>
            
            {/* Punchline */}
            <div
              style={{
                fontSize: 44,
                fontWeight: 600,
                color: "#ffca28",
                background: "rgba(255, 202, 40, 0.15)",
                padding: "20px 50px",
                borderRadius: "24px",
                direction: "rtl",
                display: "flex",
              }}
            >
              {punchline}
            </div>
          </div>

          {/* Slogan */}
          <div
            style={{
              position: "absolute",
              bottom: 50,
              fontSize: 26,
              color: "rgba(255,255,255,0.4)",
              display: "flex",
            }}
          >
             اكتشف وشارك أقوى الردود العربية الساخرة
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "Cairo",
            data: fontData,
            weight: 700,
            style: "normal",
          },
        ],
      }
    );
  } catch (err) {
    return new Response(`Failed to generate image`, { status: 500 });
  }
}
