import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

// دالة لشبك الحروف العربية
function shapeArabic(str: string): string {
  const map: Record<string, string[]> = {
    'ا':['ا','ا','ﺎ','ﺎ'],'أ':['أ','أ','ﺄ','ﺄ'],'إ':['إ','إ','ﺈ','ﺈ'],'آ':['آ','آ','ﺂ','ﺂ'],
    'ب':['ب','ﺑ','ﺒ','ﺐ'],'ت':['ت','ﺗ','ﺘ','ﺖ'],'ث':['ث','ﺛ','ﺜ','ﺚ'],
    'ج':['ج','ﺟ','ﺠ','ﺞ'],'ح':['ح','ﺣ','ﺤ','ﺢ'],'خ':['خ','ﺧ','ﺨ','ﺦ'],
    'د':['د','د','ﺪ','ﺪ'],'ذ':['ذ','ذ','ﺬ','ﺬ'],'ر':['ر','ر','ﺮ','ﺮ'],'ز':['ز','ز','ﺰ','ﺰ'],
    'س':['س','ﺳ','ﺴ','ﺲ'],'ش':['ش','ﺷ','ﺶ','ﺸ','ﺶ'],'ص':['ص','ﺻ','ﺼ','ﺺ'],'ض':['ض','ﺿ','ﻀ','ﺾ'],
    'ط':['ط','ﻃ','ﻄ','ﻂ'],'ظ':['ظ','ﻇ','ﻈ','ﻆ'],'ع':['ع','ﻋ','ﻌ','ﻊ'],'غ':['غ','ﻏ','ﻐ','ﻎ'],
    'ف':['ف','ﻓ','ﻔ','ﻒ'],'ق':['ق','ﻗ','ﻘ','ﻖ'],'ك':['ك','ﻛ','ﻜ','ﻚ'],'ل':['ل','ﻟ','ﻠ','ﻞ'],
    'م':['م','ﻣ','ﻤ','ﻢ'],'ن':['ن','ﻧ','ﻨ','ﻦ'],'ه':['ه','ﻫ','ﻬ','ﻪ'],'و':['و','و','ﻮ','ﻮ'],
    'ي':['ي','ﻳ','ﻴ','ﻲ'],'ى':['ى','ى','ﻰ','ﻰ'],'ة':['ة','ة','ﺔ','ﺔ'],'ؤ':['ؤ','ؤ','ﺆ','ﺆ'],
    'ئ':['ئ','ﺋ','ﺌ',''],'لا':['لا','لا','ﻼ','ﻼ'],'لأ':['لأ','لأ','ﻸ','ﻸ'],'لإ':['لإ','لإ','ﻺ','ﻺ'],'لآ':['لآ','لآ','ﻶ','ﻶ']
  };
  const nc = ["د","ذ","ر","ز","و","ا","أ","إ","آ","ؤ","ى","ة"];
  let res = "";
  for(let i=0; i<str.length; i++){
    const c = str[i], n = str[i+1], p = str[i-1];
    if(!map[c]){ res+=c; continue; }
    const cP = p && map[p] && !nc.includes(p);
    const cN = n && map[n] && !nc.includes(c);
    if(c==='ل' && n && ['ا','أ','إ','آ'].includes(n)){
      const lig = 'ل'+n; res += cP ? map[lig][2] : map[lig][0]; i++; continue;
    }
    let f = 0; if(!cP && cN) f=1; else if(cP && cN) f=2; else if(cP && !cN) f=3;
    res += map[c][f];
  }
  return res;
}

function wrapAndReverse(text: string, charsPerLine = 45) {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  words.forEach(word => {
    if ((currentLine + word).length > charsPerLine) {
      lines.push(currentLine.trim());
      currentLine = word + " ";
    } else {
      currentLine += word + " ";
    }
  });
  lines.push(currentLine.trim());
  return lines.map(line => {
    const shaped = shapeArabic(line);
    return shaped.split(/(\s+)/).map(w => {
      if (/^[a-zA-Z0-9.\-_]+$/.test(w)) return w;
      return w.split('').reverse().join('');
    }).reverse().join('');
  });
}

function shapeText(s: string) { 
  const shaped = shapeArabic(s);
  return shaped.split('').reverse().join(''); 
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    let setup = "أفشات - أقوى الكوميديا والردود الساخرة";
    let punchline = "تصفح وشارك أقوى الردود والقفشات العربية";
    let setupImage = ""; 

    const fontData = await fetch(new URL("https://unpkg.com/@fontsource/cairo@5.0.8/files/cairo-arabic-700-normal.woff")).then(res => res.arrayBuffer());

    if (id) {
       try {
          const res = await fetch(`https://api.afchat.fun/api/setups-by-id/${id}`, { cache: 'no-store' });
          if (res.ok) {
            const json = await res.json(); const data = json.data ?? json;
            if (data) {
              setup = data.text || setup;
              setupImage = data.image_url || data.image || ""; // دعم الصور إذا وجدت
              if (data.punchlines?.length) punchline = [...data.punchlines].sort((a,b) => b.laughs - a.laughs)[0].text;
            }
          }
       } catch (e) {}
    }

    const setupLines = wrapAndReverse(setup, 48);
    const punchlineLines = wrapAndReverse(punchline, 55);

    return new ImageResponse(
      (
        <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", backgroundColor: "#0d0216", fontFamily: '"Cairo"', color: "white" }}>
          {/* Navbar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 40px", width: "100%", background: "linear-gradient(90deg, #7c3aed 0%, #a855f7 100%)", boxShadow: "0 4px 15px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
               <div style={{ backgroundColor: "#312e81", borderRadius: "50%", width: "40px", height: "40px", border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: "18px" }}>G</div>
               <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.15)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" /></svg>
                  <div style={{ position: "absolute", top: "8px", right: "8px", width: "10px", height: "10px", backgroundColor: "#ef4444", borderRadius: "50%", border: "1.5px solid #7c3aed" }} />
               </div>
               <div style={{ backgroundColor: "#ff0099", padding: "8px 22px", borderRadius: "20px", fontSize: "16px", fontWeight: "900", marginLeft: "10px", display: "flex", boxShadow: "0 4px 10px rgba(0,0,0,0.2)" }}>
                  {shapeText("أضف")}
               </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "30px", fontWeight: "900" }}>{shapeText("أفشات")}</span>
              <div style={{ backgroundColor: "#ffca28", borderRadius: "10px", width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center", color: "black", fontWeight: "900", fontSize: "22px" }}>{shapeText("أ")}</div>
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "30px 80px", position: "relative", backgroundImage: "radial-gradient(circle at center, #2e1065 0%, #0d0216 100%)", overflow: "hidden" }}>
             {setupImage && <img src={setupImage} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.4 }} />}
             <div style={{ display: "flex", gap: "10px", marginBottom: "20px", alignSelf: "flex-end", position: "relative" }}>
                <div style={{ backgroundColor: "#4f46e5", padding: "5px 15px", borderRadius: "8px", fontSize: "14px" }}>{shapeText("#أفشات")}</div>
                <div style={{ backgroundColor: "rgba(49, 46, 129, 0.8)", border: "1px solid #4f46e5", padding: "5px 15px", borderRadius: "8px", fontSize: "14px" }}>{shapeText("#كوميديا")}</div>
             </div>
             {setupLines.map((line, i) => (
               <div key={i} style={{ fontSize: "40px", fontWeight: "900", lineHeight: "1.3", marginBottom: "5px", display: "flex", position: "relative", textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>{line}</div>
             ))}
          </div>

          <div style={{ flex: 1.2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "30px 80px", background: "linear-gradient(135deg, #9333ea, #db2777)", position: "relative" }}>
             {punchlineLines.map((line, i) => (
               <div key={i} style={{ fontSize: "36px", fontWeight: "800", lineHeight: "1.4", display: "flex", color: "white", textShadow: "0 2px 5px rgba(0,0,0,0.3)" }}>{line}</div>
             ))}
             <div style={{ position: "absolute", bottom: "40px", right: "60px", display: "flex", gap: "25px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}><span style={{ fontSize: "30px" }}>🔥</span><span style={{ fontSize: "16px", fontWeight: "bold" }}>%4</span></div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}><span style={{ fontSize: "30px" }}>😂</span><span style={{ fontSize: "16px", fontWeight: "bold" }}>41</span></div>
             </div>
             <div style={{ position: "absolute", bottom: "40px", left: "60px", fontSize: "22px", fontWeight: "900", opacity: 0.8 }}>afchat.fun</div>
          </div>
        </div>
      ),
      { width: 1200, height: 630, fonts: [{ name: "Cairo", data: fontData, style: "normal", weight: 700 }] }
    );
  } catch (err: any) { return new Response(`Error: ${err.message}`, { status: 500 }); }
}

