import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get parameters
    let setup = searchParams.get("setup") || "";
    let punchline = searchParams.get("punchline") || "أفضل المواقف والقفشات";
    const slug = searchParams.get("slug");
    const id = searchParams.get("id");

    // Fetch from API with Timeout
    if (id || slug) {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://afchat.fun";
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

    setup = setup.slice(0, 100) || "أفشات - Afchat.fun";
    punchline = punchline.slice(0, 100);

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
            padding: "80px",
            color: "white",
            textAlign: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 40,
              left: 40,
              fontSize: 32,
              fontWeight: 900,
              color: "#ffca28",
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
              padding: "40px 60px",
              borderRadius: "48px",
              width: "100%",
              maxWidth: "1000px",
            }}
          >
           <div style={{ fontSize: 56, fontWeight: 900, color: "white", marginBottom: 30, direction: "rtl", display: "flex" }}>
              "{setup}"
            </div>
            <div style={{ fontSize: 42, fontWeight: 700, color: "#ffca28", background: "rgba(255, 202, 40, 0.1)", padding: "20px 40px", borderRadius: "24px", direction: "rtl", display: "flex" }}>
              {punchline}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response(`Error: ${e.message}`, { status: 500 });
  }
}
