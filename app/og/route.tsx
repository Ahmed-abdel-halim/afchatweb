import { NextRequest } from "next/server";
import fs from "fs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const fontPath = "/home/afchat/htdocs/afchat.fun/app/og/Cairo-Bold.ttf";
    
    let info = `--- Diagnostic Info ---\n`;
    info += `CWD: ${process.cwd()}\n`;
    info += `Font Path: ${fontPath}\n`;
    info += `Font Exists: ${fs.existsSync(fontPath)}\n`;
    
    if (id) {
       try {
         const res = await fetch(`https://api.afchat.fun/api/setups-by-id/${id}`, { cache: 'no-store' });
         info += `API Status: ${res.status}\n`;
       } catch (e: any) {
         info += `API Error: ${e.message}\n`;
       }
    }

    return new Response(info, { 
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  } catch (err: any) {
    return new Response(`Diagnostic Crash: ${err.message}`, { status: 500 });
  }
}
