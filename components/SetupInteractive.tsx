"use client";
import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { postLaugh, postView, addComment } from "@/lib/api";
import { getToken } from "@/lib/auth";

type Comment = {
  id: number;
  body: string;
  user?: { id: number; name: string; avatar?: string };
};

type Punchline = {
  id: number;
  setup_id: number;
  text: string;
  views: number;
  laughs: number;
  strength?: number;
  comments?: Comment[];
  user?: { id: number; name: string; avatar?: string };
};

type Setup = {
  id: number;
  text: string;
  slug: string;
  created_at?: string;
  user?: { id: number; name?: string; avatar?: string };
  tags?: { id: number; name: string; slug?: string }[];
  punchlines?: Punchline[];
};

export default function SetupInteractive({ setup: serverSetup }: { setup: Setup }) {
  const router = useRouter();
  const [setup, setSetup] = useState<Setup>(serverSetup);
  const [pIndex, setPIndex] = useState(0);
  const [laughing, setLaughing] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoggedIn(!!getToken());
  }, []);

  const punchlines = useMemo(() => setup.punchlines ?? [], [setup]);
  const current = useMemo(() => punchlines[pIndex] ?? null, [punchlines, pIndex]);

  useEffect(() => {
    if (current?.id) postView(current.id);
  }, [current?.id]);

  const laugh = async () => {
    if (!current?.id) return;
    setLaughing(true);
    setTimeout(() => setLaughing(false), 300);
    setSetup((prev) => {
      const next = { ...prev };
      if (next.punchlines?.[pIndex]) {
        const p = next.punchlines[pIndex];
        p.laughs++;
        p.strength = p.laughs / Math.max(p.views, 1);
      }
      return next;
    });
    try { await postLaugh(current.id); } catch (e) { }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedIn || !commentBody.trim() || !current?.id || submitting) return;
    setSubmitting(true);
    try {
      const res = await addComment(current.id, commentBody);
      setSetup(prev => {
        const next = { ...prev };
        if (next.punchlines?.[pIndex]) {
          next.punchlines[pIndex].comments = [res.data, ...(next.punchlines[pIndex].comments || [])];
        }
        return next;
      });
      setCommentBody("");
    } catch (err) { }
    finally { setSubmitting(false); }
  };

  return (
    <div className="w-full min-h-screen bg-transparent text-white font-cairo selection:bg-purple-500/30 relative py-1 md:py-4">
      <div className="mesh-bg pointer-events-none fixed inset-0 z-0 h-screen w-screen overflow-hidden">
        <div className="mesh-blob blob-1" />
        <div className="mesh-blob blob-2" />
        <div className="mesh-blob blob-3" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto space-y-6 px-4 md:px-0">
        <header className="flex items-center justify-between py-4 border-b border-white/5">
          <div className="flex items-center gap-2 md:gap-3">
            <div onClick={() => router.push("/")} className="cursor-pointer w-9 h-9 md:w-10 md:h-10 bg-gradient-to-tr from-orange-500 to-yellow-500 rounded-lg md:rounded-xl flex items-center justify-center text-lg md:text-xl font-black text-white shadow-lg transform -rotate-3 hover:rotate-0 transition-transform">أ</div>
            <h1 onClick={() => router.push("/")} className="cursor-pointer text-xl md:text-3xl font-black tracking-tighter text-white italic">فشات</h1>
          </div>
        </header>

        <main className="space-y-6 pb-16 text-right">
          <div className="w-full bg-[#161922]/70 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 md:p-10 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/10 blur-[80px] rounded-full pointer-events-none" />

            <div className="flex items-center gap-3 mb-6 opacity-30">
              <img src={setup?.user?.avatar || `https://api.dicebear.com/9.x/bottts/svg?seed=${setup?.user?.id}`} className="w-5 h-5 rounded-full" />
              <span className="text-[10px] font-black tracking-tight">{setup?.user?.name || "المستخدم الأصلي"}</span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black leading-snug text-white mb-6 neon-text">{setup.text}</h2>

            <div className="flex flex-wrap gap-2">
              {(setup.tags ?? []).map((t) => (
                <button key={t.id} onClick={() => router.push(`/t/${t.slug || t.name}`)} className="px-2 py-1 bg-white/5 border border-white/5 rounded-lg text-[9px] font-black uppercase tracking-widest text-white/30 hover:bg-white/10 hover:text-white transition"># {t.name}</button>
              ))}
            </div>
          </div>

          <div className="w-full bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 md:p-10 relative shadow-2xl">
            <div className="absolute top-0 left-0 w-32 h-32 bg-orange-600/10 blur-[60px] rounded-full pointer-events-none" />

            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/20">أقوى الردود ({pIndex + 1}/{punchlines.length})</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-[11px] font-black text-white/40"><span>😂</span> <span>{current?.laughs || 0}</span></div>
                <div className="flex items-center gap-1 text-[11px] font-black text-white/40"><span>👀</span> <span>{current?.views || 0}</span></div>
              </div>
            </div>

            {current ? (
              <>
                <h3 className="text-xl md:text-2xl font-black text-white leading-relaxed mb-6 italic tracking-tight select-text text-center md:text-right">{current.text}</h3>

                <div className="flex items-center justify-center md:justify-end gap-3 mb-6">
                  <button onClick={laugh} className="w-12 h-12 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center text-2xl shadow-lg hover:scale-105 active:scale-95 transition-transform"><motion.span animate={laughing ? { scale: [1, 1.4, 1] } : {}}>😂</motion.span></button>
                  <div className="flex gap-2">
                    <button onClick={() => setPIndex(i => Math.max(i - 1, 0))} disabled={pIndex === 0} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 hover:text-white disabled:opacity-10 transition"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="rotate-180"><path d="m9 18 6-6-6-6" /></svg></button>
                    <button onClick={() => setPIndex(i => Math.min(i + 1, punchlines.length - 1))} disabled={pIndex >= punchlines.length - 1} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 hover:text-white disabled:opacity-10 transition"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg></button>
                  </div>
                </div>

                <div className="mt-12 pt-8 border-t border-white/5 space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-sm uppercase tracking-widest text-white">المناقشة</h4>
                    <span className="text-[10px] opacity-20">{current.comments?.length || 0} تعليق</span>
                  </div>

                  <form onSubmit={handleComment} className="flex gap-3">
                    <input value={commentBody} onChange={e => setCommentBody(e.target.value)} placeholder={loggedIn ? "اكتب تعليقك الساخر..." : "سجل دخول للمشاركة"} disabled={!loggedIn || submitting} className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:border-purple-500/50 outline-none transition" />
                    <button type="submit" disabled={!loggedIn || submitting || !commentBody.trim()} className="h-12 w-12 bg-purple-600 rounded-xl flex items-center justify-center font-black shadow-lg hover:bg-purple-500 active:scale-95 transition disabled:opacity-50">
                      {submitting ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>}
                    </button>
                  </form>

                  <div className="space-y-4 pt-4 pr-2">
                    {current.comments?.map(c => (
                      <div key={c.id} className="flex gap-3 justify-end group">
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-black opacity-30 mb-1.5 mr-1 uppercase tracking-tighter">{c.user?.name || "عضو أفشاتي"}</span>
                          <div className="bg-white/5 p-4 rounded-2xl rounded-tr-none text-sm text-white/95 leading-relaxed group-hover:bg-white/10 transition border border-white/5 shadow-sm">{c.body}</div>
                        </div>
                        <div className="w-9 h-9 rounded-full p-0.5 bg-gradient-to-tr from-purple-500 to-pink-500 flex-shrink-0">
                          <img src={c.user?.avatar || `https://api.dicebear.com/9.x/bottts/svg?seed=${c.id}`} className="w-full h-full rounded-full object-cover bg-black/80" />
                        </div>
                      </div>
                    ))}
                    {(!current.comments || current.comments.length === 0) && (
                      <p className="text-center py-10 text-[11px] opacity-20 italic">محدش لسه نطق بالضحك هنا.. كن أول واحد!</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-20 text-center opacity-20 italic">لا توجد ردود حالياً.. استكشف الصفحة الرئيسية</div>
            )}
          </div>

          <div className="flex justify-center pt-8">
            <button onClick={() => router.push("/")} className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all text-white/50 hover:text-white">الرجوع للرئيسية</button>
          </div>
        </main>
      </div>
    </div>
  );
}
