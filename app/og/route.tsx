import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    let setup = searchParams.get("setup") || "أفشات";
    let punchline = searchParams.get("punchline") || "Afchat.fun";
    const id = searchParams.get("id");

    console.log(`OG Request for ID: ${id}`); // Debug

    if (id) {
      try {
        // Increase timeout to 5 seconds
        const res = await fetch(`https://api.afchat.fun/api/setups-by-id/${id}`, {
          next: { revalidate: 60 },
          signal: AbortSignal.timeout(5000), 
        });
        
        if (res.ok) {
          const json = await res.json();
          const data = json.data ?? json;
          if (data && data.text) {
            setup = data.text;
            if (data.punchlines && data.punchlines.length > 0) {
              const sorted = [...data.punchlines].sort((a, b) => (b.laughs || 0) - (a.laughs || 0));
              punchline = sorted[0].text;
            }
            console.log("Successfully fetched data for OG image");
          }
        } else {
          console.error(`API Fetch failed with status: ${res.status}`);
        }
      } catch (e: any) {
        console.error("OG Data Fetch Error:", e.message);
      }
    }

    // Truncate text if too long
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
            direction: "rtl",
          }}
        >
          <div style={{ fontSize: 52, fontWeight: 800, marginBottom: 35, display: "flex", lineHeight: 1.2 }}>
            "{setup}"
          </div>
          <div style={{ fontSize: 42, color: "#ffca28", backgroundColor: "rgba(255,202,40,0.15)", padding: "20px 50px", borderRadius: "24px", display: "flex" }}>
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
      }
    );
  } catch (err: any) {
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
}
