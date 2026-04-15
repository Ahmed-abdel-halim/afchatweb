import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

function shapeText(str: string): string {
  const map: Record<string, string[]> = {
    'ا':['ا','ا','ﺎ','ﺎ'],'أ':['أ','أ','ﺄ','ﺄ'],'إ':['إ','إ','ﺈ','ﺈ'],'آ':['آ','آ','ﺂ','ﺂ'],
    'ب':['ب','ﺑ','ﺒ','ﺐ'],'ت':['ت','ﺗ','ﺘ','ﺖ'],'ث':['ث','ﺛ','ﺜ','ﺚ'],
    'ج':['ج','ﺟ','ﺠ','ﺞ'],'ح':['ح','ﺣ','ﺤ','ﺢ'],'خ':['خ','ﺧ','ﺨ','ﺦ'],
    'د':['د','د','ﺪ','ﺪ'],'ذ':['ذ','ذ','ﺬ','ﺬ'],'ر':['ر','ر','ﺮ','ﺮ'],'ز':['ز','ز','ﺰ','ﺰ'],
    'س':['س','ﺳ','ﺴ','ﺲ'],'ش':['ش','ﺷ','ﺸ','ﺶ'],'ص':['ص','ﺻ','ﺼ','ﺺ'],'ض':['ض','ﺿ','ﻀ','ﺾ'],
    'ط':['ط','ﻃ','ﻄ','ﻂ'],'ظ':['ظ','ﻇ','ﻈ','ﻆ'],'ع':['ع','ﻋ','ﻌ','ﻊ'],'غ':['غ','ﻏ','ﻐ','ﻎ'],
    'ف':['ف','ﻓ','ﻔ','ﻒ'],'ق':['ق','ﻗ','ﻘ','ﻖ'],'ك':['ك','ﻛ','ﻜ','ﻚ'],'ل':['ل','ﻟ','ﻠ','ﻞ'],
    'م':['م','ﻣ','ﻤ','ﻢ'],'ن':['ن','ﻧ','ﻨ','ﻦ'],'ه':['ه','ﻫ','ﻬ','ﻪ'],'و':['و','و','ﻮ','ﻮ'],
    'ي':['ي','ﻳ','ﻴ','ﻲ'],'ى':['ى','ى','ﻰ','ﻰ'],'ة':['ة','ة','ﺔ','ﺔ'],'ؤ':['ؤ','ؤ','ﺆ','ﺆ'],
    'ئ':['ئ','ﺋ','ﺌ','ﺊ'],'لا':['لا','لا','ﻼ','ﻼ'],'لأ':['لأ','لأ','ﻸ','ﻸ'],'لإ':['لإ','لإ','ﻺ','ﻺ'],'لآ':['لآ','لآ','ﻶ','ﻶ']
  };
  const nc = ["د","ذ","ر","ز","و","ا","أ","إ","آ","ؤ","ى","ة"];
  
  let shaped = "";
  for(let i=0; i<str.length; i++) {
    const c = str[i], n = str[i+1], p = str[i-1];
    if(!map[c]) { shaped+=c; continue; }
    
    const cP = p && map[p] && !nc.includes(p);
    const cN = n && map[n] && !nc.includes(c);
    
    if(c==='ل' && n && ['ا','أ','إ','آ'].includes(n)) {
      const lig = 'ل'+n;
      shaped += cP ? map[lig][2] : map[lig][0];
      i++; continue;
    }
    
    let f = 0;
    if(!cP && cN) f=1; else if(cP && cN) f=2; else if(cP && !cN) f=3;
    shaped += map[c][f];
  }
  
  const parts = shaped.split(/([a-zA-Z0-9.\-_]+)/);
  let res = "";
  for(let i=parts.length-1; i>=0; i--) {
    if(/^[a-zA-Z0-9.\-_]+$/.test(parts[i])) res += parts[i];
    else res += parts[i].split('').reverse().join('');
  }
  return res;
}

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
        if (buf.byteLength > 10000) {
          fontData = buf;
        }
      }
    } catch (e: any) {
      console.error("Unpkg CDN Font Fetch Error");
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
    
    // Apply Arabic Shaping and RTL Text Magic
    const displaySetup = shapeText(`"${setup}"`);
    const displayPunchline = shapeText(punchline);

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
            fontFamily: fontData ? '"Cairo"' : "sans-serif",
          }}
        >
          <div style={{ fontSize: 48, fontWeight: 800, marginBottom: 35, display: "flex", lineHeight: 1.3 }}>
            {displaySetup}
          </div>
          <div style={{ fontSize: 38, color: "#ffca28", backgroundColor: "rgba(255,202,40,0.15)", padding: "20px 50px", borderRadius: "24px", display: "flex", lineHeight: 1.3 }}>
            {displayPunchline}
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
