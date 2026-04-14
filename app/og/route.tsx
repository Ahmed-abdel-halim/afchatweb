import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

// VPS stability test - No external fetches
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const setup = searchParams.get("setup") || "أفشات";
    const punchline = searchParams.get("punchline") || "Afchat.fun";

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
            color: "white",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 60, marginBottom: 20 }}>{setup}</div>
          <div style={{ fontSize: 40, color: "#ffca28" }}>{punchline}</div>
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
