import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get params with fallbacks
    let setup = searchParams.get("setup") || "أفشات - Afchat.fun";
    let punchline = searchParams.get("punchline") || "أقوى قفشات وبانشلاين الردود العربية";
    const id = searchParams.get("id");

    // Fetch font within the request to handle edge cases
    let fontData: ArrayBuffer | null = null;
    try {
      const fontRes = await fetch(
        new URL("https://fonts.gstatic.com/s/cairo/v28/slnF-2En_p445JvXDBW3ZzE.ttf")
      );
      if (fontRes.ok) fontData = await fontRes.arrayBuffer();
    } catch (e) {
      console.error("Font loading failed", e);
    }

    // Try to fetch data if ID is provided
    if (id) {
      try {
        const res = await fetch(`https://api.afchat.fun/api/setups-by-id/${id}`, {
          cache: 'no-store',
          signal: AbortSignal.timeout(2000) // Don't wait too long
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
          }
        }
      } catch (e) {
        console.error("Data fetch failed", e);
      }
    }

    // Clean up text
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
            padding: "50px",
            color: "white",
            textAlign: "center",
            fontFamily: fontData ? "Cairo" : "sans-serif",
          }}
        >
          {/* Top Navbar Style */}
          <div
            style={{
              position: "absolute",
              top: 50,
              right: 60,
              fontSize: 32,
              fontWeight: 900,
              color: "#ffca28",
              display: "flex",
            }}
          >
            Afchat.fun
          </div>

          {/* Card */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255,255,255,0.08)",
              border: "2px solid rgba(255,255,255,0.15)",
              padding: "60px",
              borderRadius: "40px",
              width: "1040px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                fontSize: 54,
                fontWeight: 800,
                color: "white",
                marginBottom: 35,
                direction: "rtl",
                display: "flex",
                lineHeight: 1.2,
              }}
            >
              "{setup}"
            </div>

            <div
              style={{
                fontSize: 46,
                fontWeight: 600,
                color: "#ffca28",
                background: "rgba(255, 202, 40, 0.12)",
                padding: "20px 50px",
                borderRadius: "24px",
                direction: "rtl",
                display: "flex",
              }}
            >
              {punchline}
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              bottom: 50,
              fontSize: 24,
              color: "rgba(255,255,255,0.4)",
              display: "flex",
              fontWeight: 400,
            }}
          >
            أفشات - أكبر تجمع للكوميديا والردود الساخرة
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
            weight: 700,
            style: "normal",
          },
        ] : [],
      }
    );
  } catch (err: any) {
    return new Response(`Failed to generate image: ${err.message}`, { status: 500 });
  }
}
if (data && data.text) {
  setup = data.text;
  if (data.punchlines?.length > 0) {
    const sorted = [...data.punchlines].sort((a, b) => (b.laughs || 0) - (a.laughs || 0));
    punchline = sorted[0].text;
  }
}
        }
      } catch (e) {
  console.log("Data fetch skipped or failed");
}
    }

// 4. Final text cleanup
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
        fontFamily: fontData ? "Cairo" : "sans-serif",
      }}
    >
      <div style={{ position: "absolute", top: 50, right: 60, fontSize: 32, fontWeight: 900, color: "#ffca28", display: "flex" }}>
        Afchat.fun
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.08)", border: "2px solid rgba(255,255,255,0.15)", padding: "50px", borderRadius: "30px", width: "1000px" }}>
        <div style={{ fontSize: 54, fontWeight: 800, marginBottom: 30, direction: "rtl", display: "flex", lineHeight: 1.2 }}>
          "{setup}"
        </div>
        <div style={{ fontSize: 44, fontWeight: 600, color: "#ffca28", background: "rgba(255, 202, 40, 0.12)", padding: "15px 40px", borderRadius: "20px", direction: "rtl", display: "flex" }}>
          {punchline}
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 50, fontSize: 24, color: "rgba(255,255,255,0.4)", display: "flex" }}>
        أفشات - أكبر تجمع للكوميديا والردود الساخرة
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
        weight: 700,
        style: "normal",
      },
    ] : [],
  }
);
  } catch (err: any) {
  return new Response(`Error: ${err.message}`, { status: 500 });
}
}
