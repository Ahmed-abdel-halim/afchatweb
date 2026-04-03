import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

// Fetch Cairo font for professional Arabic rendering
const fontCairo = fetch(
  new URL("https://fonts.gstatic.com/s/cairo/v28/SLX31Luwp5n1-6Gf-v_n.split.3.woff2", "https://fonts.googleapis.com")
).then((res) => res.arrayBuffer());

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Optional Font Data with silent fail
    let fontData: ArrayBuffer | null = null;
    try {
      fontData = await fontCairo;
    } catch (e) {
      console.warn("Font loading failed, falling back to system font");
    }

    // Get parameters
    const hasSetup = searchParams.has("setup");
    const setup = hasSetup
      ? searchParams.get("setup")?.slice(0, 100)
      : "الموقف غير متوفر";
      
    const punchline = searchParams.get("punchline")?.slice(0, 100) || "أفضل المواقف والقفشات";

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
            fontFamily: "Cairo",
          }}
        >
          {/* Logo / Brand Name */}
          <div
            style={{
              position: "absolute",
              top: 40,
              left: 40,
              fontSize: 32,
              fontWeight: 900,
              color: "#ffca28",
              display: "flex",
              alignItems: "center",
            }}
          >
            أفشات - Afchat.fun
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
            {/* The Setup */}
            <div
              style={{
                fontSize: 56,
                fontWeight: 900,
                color: "white",
                lineHeight: 1.3,
                marginBottom: 30,
                direction: "rtl",
              }}
            >
              "{setup}"
            </div>

            {/* The Punchline Highlighter */}
            <div
              style={{
                fontSize: 42,
                fontWeight: 700,
                color: "#ffca28",
                lineHeight: 1.3,
                background: "rgba(255, 202, 40, 0.1)",
                padding: "20px 40px",
                borderRadius: "24px",
                border: "2px solid rgba(255,202,40,0.3)",
                direction: "rtl",
              }}
            >
              {punchline}
            </div>
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
          },
        ] : [],
      }
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
