import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import fs from "fs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    let setup = searchParams.get("setup") || "أفشات - Afchat.fun";
    let punchline = searchParams.get("punchline") || "أكبر تجمع للكوميديا والردود الساخرة";
    const id = searchParams.get("id");

    // 1. Load Font Safely
    let fontData: ArrayBuffer | null = null;
    try {
      const fontPath = "/home/afchat/htdocs/afchat.fun/app/og/Cairo-Bold.ttf";
      if (fs.existsSync(fontPath)) {
        fontData = fs.readFileSync(fontPath).buffer as ArrayBuffer;
      }
    } catch (e) {
      console.error("Font Load Error");
    }

    // 2. Fetch Data with Path Fallbacks (Fixed 404 issue)
    if (id) {
      try {
        // Try multiple URL variations because of server config
        const urls = [
          `https://api.afchat.fun/api/setups-by-id/${id}`,
          `https://api.afchat.fun/setups-by-id/${id}`
        ];
        
        let dataFound = false;
        for (const url of urls) {
          if (dataFound) break;
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
              dataFound = true;
            }
          }
        }
      } catch (e) {
        console.error("API Fetch Error");
      }
    }

    // 3. Render Image
    setup = setup.length > 100 ? setup.slice(0, 100) + "..." : setup;
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
            fontFamily: fontData ? "Cairo" : "sans-serif",
          }}
        >
          <div style={{ fontSize: 52, fontWeight: 800, marginBottom: 35, display: "flex", direction: "rtl", lineHeight: 1.2 }}>
            "{setup}"
          </div>
          <div style={{ fontSize: 42, color: "#ffca28", backgroundColor: "rgba(255,202,40,0.15)", padding: "20px 50px", borderRadius: "24px", display: "flex", direction: "rtl" }}>
            {punchline}
          </div>
          <div style={{ position: "absolute", top: 40, right: 60, color: "#ffca28", fontSize: 26, fontWeight: 900 }}>
            Afchat.fun
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: fontData ? [
          {
            name: "Cairo",
            data: fontData,
            style: "normal",
            weight: 700,
          },
        ] : [],
      }
    );
  } catch (err: any) {
    return new Response(`Final Crash: ${err.message}`, { status: 500 });
  }
}
