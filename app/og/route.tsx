import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

// دالة متطورة لمعالجة النصوص العربية وعكسها لتعمل 100% في تويتر
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
    'ئ':['ئ','ﺋ','ﺌ',''],'لا':['لا','لا','ﻼ','ﻼ'],'لأ':['لأ','لأ','ﻸ','ﻸ'],'لإ':['لإ','لإ','ﻺ','ﻺ'],'لآ':['لآ','لآ','ﻶ','ﻶ']
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
  return shaped.split(/(\s+)/).map(word => {
    if (/^[a-zA-Z0-9.\-_]+$/.test(word)) return word;
    return word.split('').reverse().join('');
  }).reverse().join('');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    let setup = "قفشة من أفشات الموقع";
    let punchline = "أروع الردود الكوميدية تجدها هنا";

    // جلب الخط (باستخدام رابط مباشر سريع جداً)
    const fontData = await fetch(
      new URL("https://unpkg.com/@fontsource/cairo@5.0.8/files/cairo-arabic-700-normal.woff")
    ).then((res) => res.arrayBuffer());

    if (id) {
       try {
          const res = await fetch(`https://api.afchat.fun/api/setups-by-id/${id}`, { cache: 'no-store' });
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
       } catch (e) {}
    }

    const displaySetup = shapeText(setup.length > 100 ? setup.slice(0, 97) + "..." : setup);
    const displayPunchline = shapeText(punchline.length > 150 ? punchline.slice(0, 147) + "..." : punchline);
    const logoName = shapeText("أفشات");

    return new ImageResponse(
      (
        <div style={{
          height: "100%", width: "100%", display: "flex", flexDirection: "column", backgroundColor: "#0d0216", fontFamily: '"Cairo"', color: "white"
        }}>
          {/* Navbar (Matched Website) */}
          <div style={{ 
            display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 50px", width: "100%",
            background: "linear-gradient(90deg, #7c3aed 0%, #a855f7 100%)", boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
          }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ backgroundColor: "#ff0099", borderRadius: "50%", width: "35px", height: "35px", border: "2px solid white" }} />
              <div style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: "50%", width: "35px", height: "35px" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "30px", fontWeight: "900", color: "white" }}>{logoName}</span>
              <div style={{ backgroundColor: "#ffca28", borderRadius: "10px", width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center", color: "black", fontWeight: "900", fontSize: "22px" }}>
                {shapeText("أ")}
              </div>
            </div>
          </div>

          {/* Setup Part */}
          <div style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 100px", textAlign: "center",
            backgroundImage: "radial-gradient(circle at center, #2e1065 0%, #0d0216 100%)"
          }}>
            <div style={{ display: "flex", gap: "12px", marginBottom: "30px", alignSelf: "flex-end" }}>
               <div style={{ backgroundColor: "#4f46e5", padding: "5px 18px", borderRadius: "10px", fontSize: "16px", fontWeight: "bold" }}>{shapeText("#أفشات")}</div>
               <div style={{ backgroundColor: "#1e1b4b", border: "1px solid #4f46e5", padding: "5px 18px", borderRadius: "10px", fontSize: "16px" }}>{shapeText("#كوميديا")}</div>
            </div>
            <div style={{ fontSize: "44px", fontWeight: "900", lineHeight: "1.4", display: "flex", textShadow: "0 4px 10px rgba(0,0,0,0.5)" }}>
              {displaySetup}
            </div>
          </div>

          {/* Punchline Part */}
          <div style={{
            flex: 1.2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 100px", textAlign: "center",
            background: "linear-gradient(135deg, #9333ea, #db2777)", position: "relative", boxShadow: "inset 0 10px 40px rgba(0,0,0,0.1)"
          }}>
             <div style={{ fontSize: "40px", fontWeight: "800", lineHeight: "1.6", display: "flex", color: "white", textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
               {displayPunchline}
             </div>
             
             {/* Interaction UI */}
             <div style={{ position: "absolute", bottom: "40px", right: "60px", display: "flex", gap: "30px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
                   <span style={{ fontSize: "32px" }}>🔥</span>
                   <span style={{ fontSize: "16px", fontWeight: "bold" }}>%4</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
                   <span style={{ fontSize: "32px" }}>😂</span>
                   <span style={{ fontSize: "16px", fontWeight: "bold" }}>41</span>
                </div>
             </div>
             <div style={{ position: "absolute", bottom: "40px", left: "60px", fontSize: "22px", fontWeight: "900", color: "white", opacity: 0.8 }}>
                afchat.fun
             </div>
          </div>
        </div>
      ),
      {
        width: 1200, height: 630,
        fonts: [{ name: "Cairo", data: fontData, style: "normal", weight: 700 }]
      }
    );
  } catch (err: any) {
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
}
