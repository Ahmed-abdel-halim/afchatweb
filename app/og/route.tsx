import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    let setup = searchParams.get("setup") || "أفشات - Afchat.fun";
    let punchline = searchParams.get("punchline") || "أكبر تجمع للكوميديا والردود الساخرة";
    const id = searchParams.get("id");

    // 1. Fetch from unpkg (Highly reliable CDN that rarely blocks VPS IPs)
    let fontData: ArrayBuffer | null = null;
    try {
      const fontRes = await fetch("https://unpkg.com/@fontsource/cairo@5.0.8/files/cairo-arabic-700-normal.woff", { cache: "force-cache" });
      if (fontRes.ok) {
        const buf = await fontRes.arrayBuffer();
        if (buf.byteLength > 10000) { // Verify it's actually a font, not a 1KB HTML block page
          fontData = buf;
        }
      }
    } catch (e: any) {
      console.error("Unpkg CDN Font Fetch Error:", e.message);
    }

    // 2. Fetch Data
    if (id) {
      const urls = [
        `https://api.afchat.fun/api/setups-by-id/${id}`,
        `https://api.afchat.fun/setups-by-id/${id}`
      ];
      
      for (const url of urls) {
        try {
          const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(3000) });
          if (res.ok) {
            const json = await res.json();
            const data = json.data ?? json;
            if (data && data.text) {
              setup = data.text;
              if (data.punchlines && data.punchlines.length > 0) {
                const sorted = [...data.punchlines].sort((a, b) => (b.laughs || 0) - (a.laughs || 0));
                punchline = sorted[0].text;
              }
              break; 
            }
          }
        } catch (e) {}
      }
    }

    setup = setup.length > 120 ? setup.slice(0, 117) + "..." : setup;
    punchline = punchline.length > 120 ? punchline.slice(0, 117) + "..." : punchline;

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
            fontFamily: fontData ? "Cairo" : undefined,
          }}
        >
          <div style={{ fontSize: 48, fontWeight: 800, marginBottom: 35, display: "flex", direction: "rtl", lineHeight: 1.3 }}>
            "{setup}"
          </div>
          <div style={{ fontSize: 38, color: "#ffca28", backgroundColor: "rgba(255,202,40,0.15)", padding: "20px 50px", borderRadius: "24px", display: "flex", direction: "rtl", lineHeight: 1.3 }}>
            {punchline}
          </div>
          <div style={{ position: "absolute", bottom: 40, right: 60, color: "#ffca28", fontSize: 24, fontWeight: 900, opacity: 0.8 }}>
            Afchat.fun
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        ...(fontData ? {
          fonts: [
            {
              name: "Cairo",
              data: fontData,
              style: "normal",
              weight: 700,
            },
          ]
        } : {})
      }
    );
  } catch (err: any) {
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
}
