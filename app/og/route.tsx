import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

// Fetch the Cairo font for Arabic support
const fontPromise = fetch(
  new URL("https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/cairo/Cairo%5Bslnt%2Cwght%5D.ttf")
).then((res) => res.arrayBuffer());

export async function GET(request: NextRequest) {
  const fontData = await fontPromise;
  
  try {
    const { searchParams } = new URL(request.url);
    
    let setup = searchParams.get("setup") || "";
    let punchline = searchParams.get("punchline") || "أفضل المواقف والقفشات";
    const slug = searchParams.get("slug");
    const id = searchParams.get("id");

    if (id || slug) {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://api.afchat.fun";
        const fetchUrl = id 
          ? `${API_BASE}/api/setups-by-id/${id}` 
          : `${API_BASE}/api/setups/${encodeURIComponent(slug || "")}`;
          
        const res = await fetch(fetchUrl, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const json = await res.json();
          const data = json.data ?? json;
          setup = data.text || setup;
          if (data.punchlines && Array.isArray(data.punchlines) && data.punchlines.length > 0) {
            const sorted = [...data.punchlines].sort((a, b) => (b.laughs || 0) - (a.laughs || 0));
            punchline = sorted[0].text || punchline;
          }
        }
      } catch (e) {
        console.error("OG API Fetch failed", e);
      }
    }

    setup = setup.length > 100 ? setup.slice(0, 100) + "..." : setup || "أفشات - Afchat.fun";
    punchline = punchline.length > 100 ? punchline.slice(0, 100) + "..." : punchline;

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
            padding: "60px",
            color: "white",
            textAlign: "center",
            fontFamily: "Cairo",
          }}
        >
          {/* Logo Tag */}
          <div
            style={{
              position: "absolute",
              top: 40,
              right: 60,
              fontSize: 32,
              fontWeight: 900,
              color: "#ffca28",
              display: "flex",
            }}
          >
            Afchat.fun
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255,255,255,0.05)",
              border: "2px solid rgba(255,255,255,0.1)",
              padding: "50px",
              borderRadius: "40px",
              width: "100%",
              maxWidth: "1000px",
            }}
          >
            {/* Setup Text */}
            <div
              style={{
                fontSize: 52,
                fontWeight: 800,
                color: "white",
                marginBottom: 30,
                direction: "rtl",
                display: "flex",
                lineHeight: 1.2,
              }}
            >
              "{setup}"
            </div>
            
            {/* Divider */}
            <div style={{ width: "100px", height: "4px", backgroundColor: "#ffca28", marginBottom: 30, borderRadius: "2px" }} />

            {/* Punchline Text */}
            <div
              style={{
                fontSize: 42,
                fontWeight: 600,
                color: "#ffca28",
                background: "rgba(255, 202, 40, 0.1)",
                padding: "15px 40px",
                borderRadius: "20px",
                direction: "rtl",
                display: "flex",
                lineHeight: 1.4,
              }}
            >
              {punchline}
            </div>
          </div>

          {/* Bottom Footer */}
          <div
            style={{
              position: "absolute",
              bottom: 40,
              fontSize: 24,
              color: "rgba(255,255,255,0.5)",
              display: "flex",
            }}
          >
             أقوى قفشات وبانشلاين الردود العربية
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
            style: "normal",
            weight: 700,
          },
        ],
      }
    );
  } catch (e: any) {
    return new Response(`Error: ${e.message}`, { status: 500 });
  }
}
