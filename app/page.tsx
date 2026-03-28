"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getFeed, postLaugh, postView, getMe } from "@/lib/api";
import { getToken, clearToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import CreateSetupModal from "@/components/CreateSetupModal";
import AddPunchlineModal from "@/components/AddPunchlineModal";

// --- Types ---
interface User {
  id: number;
  name: string;
  avatar?: string;
  email?: string;
}

interface Tag {
  id: number;
  name: string;
}

interface Punchline {
  id: number;
  text: string;
  views: number;
  laughs: number;
  strength: number;
  user_name?: string;
  user_avatar?: string;
  user?: User;
  media_type?: "text" | "image" | "video";
  media_url?: string;
}

interface Setup {
  id: number;
  text: string;
  slug: string;
  user: User;
  tags: Tag[];
  media_type?: "text" | "image" | "video";
  media_url?: string;
}

interface HistoryItem {
  setup: Setup;
  punchlines: Punchline[];
  cursor: number | null;
  pIndex: number;
}

export default function Home() {
  const router = useRouter();

  // --- States ---
  const [allSetups, setAllSetups] = useState<HistoryItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [punchlines, setPunchlines] = useState<Punchline[]>([]);
  const [pIndex, setPIndex] = useState(0);
  const [cursor, setCursor] = useState<number | null>(null);
  
  const [loadingSetup, setLoadingSetup] = useState(false);
  const [prefetching, setPrefetching] = useState(false);
  const [endReached, setEndReached] = useState(false);
  const [buffer, setBuffer] = useState<Array<{ setup: Setup; punchlines: Punchline[]; cursor: number | null }>>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [laughing, setLaughing] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [openAddPunchline, setOpenAddPunchline] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // --- Derived ---
  const current = useMemo(() => punchlines[pIndex] ?? null, [punchlines, pIndex]);

  // --- Navigation Logic ---
  const nextP = useCallback(() => {
    if (punchlines.length > 0) {
      setPIndex(prev => (prev + 1) % punchlines.length);
    }
  }, [punchlines.length]);

  const prevP = useCallback(() => {
    if (punchlines.length > 0) {
      setPIndex(prev => (prev - 1 + punchlines.length) % punchlines.length);
    }
  }, [punchlines.length]);

  const loadNext = useCallback(async () => {
    if (activeIndex < allSetups.length - 1) {
      setActiveIndex(prev => prev + 1);
      return;
    }
    if (buffer.length > 0) {
      const nextItem = buffer[0];
      setBuffer(prev => prev.slice(1));
      const newItem: HistoryItem = { ...nextItem, pIndex: 0 };
      setAllSetups(prev => [...prev, newItem]);
      setActiveIndex(prev => prev + 1);
      return;
    }
    if (loadingSetup) return;
    if (endReached) {
      if (allSetups.length > 0) setActiveIndex(0);
      return;
    }
    setLoadingSetup(true);
    try {
      const json = await getFeed(nextCursor ?? undefined);
      if (json?.data) {
        const newItem: HistoryItem = {
          setup: json.data.setup,
          punchlines: json.data.punchlines ?? [],
          cursor: json.next_cursor ?? null,
          pIndex: 0
        };
        setAllSetups(prev => [...prev, newItem]);
        setActiveIndex(prev => prev + 1);
        setNextCursor(json.next_cursor ?? null);
      } else {
        setEndReached(true);
        if (allSetups.length > 0) setActiveIndex(0);
      }
    } catch (e) {
      console.error("Direct fetch failed", e);
    } finally {
      setLoadingSetup(false);
    }
  }, [activeIndex, allSetups, buffer, endReached, loadingSetup, nextCursor]);

  const loadPrev = useCallback(() => {
    if (activeIndex > 0) {
      setActiveIndex(prev => prev - 1);
    } else if (allSetups.length > 0) {
      setActiveIndex(allSetups.length - 1);
    }
  }, [activeIndex, allSetups.length]);

  // --- Effects ---
  useEffect(() => {
    if (activeIndex >= 0 && allSetups[activeIndex]) {
      const item = allSetups[activeIndex];
      setSetup(item.setup);
      setPunchlines(item.punchlines);
      setCursor(item.cursor);
      setPIndex(item.pIndex || 0);
    }
  }, [activeIndex, allSetups]);

  useEffect(() => {
    loadNext();
    const token = getToken();
    if (token) {
      setLoggedIn(true);
      getMe().then(res => {
        if (res && (res as any).user) setUser((res as any).user);
        else if (res) setUser(res as any);
      }).catch(() => {});
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    if (current?.id) {
      postView(current.id);
    }
  }, [current?.id]);

  useEffect(() => {
    if (buffer.length >= 3 || prefetching || loadingSetup || endReached) return;
    const fillBuffer = async () => {
      setPrefetching(true);
      try {
        const json = await getFeed(nextCursor ?? undefined);
        if (json?.data) {
          const newItem = {
            setup: json.data.setup,
            punchlines: json.data.punchlines ?? [],
            cursor: json.next_cursor ?? null
          };
          setBuffer(prev => [...prev, newItem]);
          setNextCursor(json.next_cursor ?? null);
        } else {
          setEndReached(true);
        }
      } catch (e) {
        // failed
      } finally {
        setPrefetching(false);
      }
    };
    fillBuffer();
  }, [buffer.length, nextCursor, prefetching, loadingSetup, endReached]);

  // --- Actions ---
  async function laugh() {
    if (!current?.id) return;
    setLaughing(true);
    setTimeout(() => setLaughing(false), 300);
    setPunchlines(prev => prev.map(p => {
      if (p.id === current.id) {
        const newLaughs = (p.laughs || 0) + 1;
        const newViews = Math.max(p.views || 1, 1);
        return { ...p, laughs: newLaughs, strength: newLaughs / newViews };
      }
      return p;
    }));
    try { await postLaugh(current.id); } catch (e) {}
  }

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col font-[family-name:var(--font-cairo)] selection:bg-purple-500/30 overflow-hidden relative">
      <div className="mesh-bg pointer-events-none">
        <div className="mesh-blob blob-1" />
        <div className="mesh-blob blob-2" />
        <div className="mesh-blob blob-3" />
      </div>

      <header className="flex items-center justify-between px-6 md:px-12 py-4 md:py-6 z-[100] sticky top-0 bg-white/5 backdrop-blur-3xl border-b border-white/5">
        <div className="flex items-center gap-2 md:gap-4 w-1/3 md:w-1/4">
          <div className="w-8 h-8 md:w-11 md:h-11 bg-gradient-to-tr from-orange-500 to-yellow-500 rounded-lg md:rounded-xl flex items-center justify-center text-lg md:text-2xl font-black text-white shadow-lg transform -rotate-3 hover:rotate-0 transition-transform">أ</div>
          <h1 className="text-xl md:text-4xl font-black tracking-tighter text-white italic">فشات</h1>
        </div>

        <div className="hidden md:flex relative w-1/2 max-w-[500px] group">
          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          </div>
          <input
            type="text"
            placeholder="ابحث عن مواقف، تريندات، أو أشخاص..."
            className="w-full bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl pr-12 pl-4 py-3 outline-none focus:border-white/20 focus:bg-white/15 transition-all text-right text-[13px] text-white placeholder:text-white/50"
          />
        </div>

        <div className="flex items-center gap-3 md:gap-6 w-1/3 md:w-1/4 justify-end pr-4 md:pr-10">
          {loggedIn ? (
            <>
              <button className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all relative group">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white transition-transform group-hover:scale-110"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                <div className="absolute top-[7px] right-[7px] w-2.5 h-2.5 bg-[#FF0000]/80 rounded-full border-2 border-[#1A1D23] shadow-lg animate-pulse" />
              </button>

              <div className="relative">
                <div
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="h-10 md:h-11 pl-0 md:pl-4 pr-0 md:pr-2 bg-transparent md:bg-white/10 border-none md:border md:border-white/10 rounded-full flex items-center md:gap-3 cursor-pointer hover:bg-white/5 md:hover:bg-white/20 transition-all select-none group"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-20 group-hover:opacity-100 transition-opacity hidden md:inline"><path d="m6 9 6 6 6-6" /></svg>
                  <div className="flex flex-col text-right hidden md:flex">
                    <span className="text-[11px] font-black leading-tight text-white">{user?.name || "المستخدم"}</span>
                    <span className="text-[8px] opacity-40 font-black uppercase tracking-tighter">عضو جديد</span>
                  </div>
                  <div className="w-9 h-9 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-0.5 relative">
                    <img
                      src={user?.avatar || `https://api.dicebear.com/9.x/bottts/svg?seed=${user?.email || 'afshat'}`}
                      className="w-full h-full rounded-full object-cover bg-[#0D0F14]"
                    />
                    <div className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-[#0D0F14] rounded-full" />
                  </div>
                </div>

                <AnimatePresence>
                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-[105]" onClick={() => setShowUserMenu(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full right-0 mt-2 w-28 md:w-48 bg-[#1A1D23] border border-white/10 rounded-2xl shadow-2xl p-1 md:p-2 z-[110] backdrop-blur-xl"
                      >
                        <button
                          onClick={() => {
                            clearToken();
                            setLoggedIn(false);
                            setUser(null);
                            setShowUserMenu(false);
                            router.push("/login");
                          }}
                          className="w-full px-4 py-3 rounded-xl flex items-center justify-between hover:bg-red-500/10 text-red-500 transition font-bold text-sm"
                        >
                          <span>تسجيل الخروج</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="px-4 md:px-6 py-2 md:py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 active:scale-95 transition rounded-xl text-[10px] md:text-sm font-bold shadow-lg shadow-purple-500/20"
            >
              دخول
            </button>
          )}
        </div>
      </header>

      <main className="flex grow items-stretch md:items-center justify-center px-4 md:px-6 py-0 md:py-4 relative">
        <div className="relative w-full max-w-[1750px] flex flex-col md:flex-row items-stretch md:items-center justify-center">
          <motion.div
            onPanEnd={(_, info) => {
              const { offset, velocity } = info;
              const threshold = 40;
              const vThreshold = 100;

              if (Math.abs(offset.x) > threshold || Math.abs(velocity.x) > vThreshold) {
                if (offset.x > 0) prevP();
                else nextP();
              }
              if (Math.abs(offset.y) > threshold || Math.abs(velocity.y) > vThreshold) {
                if (offset.y > 0) loadPrev();
                else loadNext();
              }
            }}
            className="w-full flex-1 md:h-[82vh] flex flex-col md:grid md:grid-cols-2 gap-0 overflow-hidden md:rounded-[2.5rem] md:border md:border-white/60 md:shadow-2xl relative bg-transparent touch-none"
          >
            {/* PUNCHLINE PANE */}
            <div id="punchline-container" className="bg-transparent relative flex flex-col justify-center px-6 md:px-12 pt-10 md:pt-16 pb-20 md:pb-24 overflow-hidden order-2 md:order-1 md:border-r md:border-white/60 flex-1">
              {/* Vibrant Spotlight Glows for Punchline */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/40 blur-[120px] rounded-full pointer-events-none z-0" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-purple-400/30 blur-[80px] rounded-full pointer-events-none z-0" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.25),_transparent_75%)] pointer-events-none z-0" />

              <div className="absolute top-6 md:top-10 left-6 md:left-10 z-30 flex items-center gap-2">
                <div className="px-3 md:px-4 py-1.5 bg-black/20 backdrop-blur-md rounded-xl text-[10px] md:text-[11px] font-bold border border-white/5 text-white/40 h-10 md:h-11 flex items-center uppercase tracking-widest">
                  الرد {pIndex + 1}/{punchlines.length || 1}
                </div>
                <button
                  onClick={() => (loggedIn || getToken()) ? setOpenAddPunchline(true) : router.push("/login")}
                  className="w-10 h-10 md:w-auto md:px-5 md:py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md rounded-xl flex items-center justify-center md:gap-2 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 md:w-4 md:h-4"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                  <span className="hidden md:inline text-xs font-bold">أضف رد مضحك</span>
                </button>
              </div>

              <div className="absolute right-2 md:right-6 top-[42%] md:top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 md:gap-5 z-[60]">
                <div className="flex flex-col items-center group">
                  <motion.div animate={laughing ? { scale: [1, 1.3, 1] } : {}} whileTap={{ scale: 0.8 }} onClick={laugh} className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center text-3xl md:text-4xl cursor-pointer relative">
                    <span className="filter drop-shadow-lg select-none">😂</span>
                  </motion.div>
                  <span className="text-[11px] md:text-sm font-black text-white -mt-1">{current?.laughs || 0}</span>
                </div>
                <div className="flex flex-col items-center group">
                  <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center text-3xl md:text-4xl">
                    <span className="filter drop-shadow-lg select-none">🔥</span>
                  </div>
                  <span className="text-[11px] md:text-sm font-black text-white -mt-1">{Math.floor((current?.laughs || 0) / 10)}%</span>
                </div>

                {/* Share - Mobile Only */}
                <div className="flex flex-col items-center md:hidden">
                  <button className="w-12 h-12 flex items-center justify-center text-white drop-shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
                  </button>
                </div>

                {/* Comments - Mobile Only */}
                <div className="flex flex-col items-center md:hidden">
                  <button className="w-12 h-12 flex items-center justify-center text-white drop-shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={current?.id || 'loading'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 text-center flex flex-col items-center px-6 md:px-24">
                  {current && (
                    <div className="flex items-center gap-3 mb-4 opacity-30">
                      <span className="text-xs font-black uppercase tracking-tight">الرد من: {current?.user?.name || current?.user_name || "Unknown"}</span>
                      <img src={current?.user_avatar || current?.user?.avatar || `https://api.dicebear.com/9.x/bottts/svg?seed=${current?.id}`} className="w-5 h-5 rounded-full" alt="avatar" />
                    </div>
                  )}
                  {current?.media_type === "image" && current?.media_url && (
                    <div className="mb-6 w-full max-w-sm rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl bg-black/40 min-h-[100px] flex items-center justify-center">
                      <img src={current.media_url} className="w-full h-auto object-cover max-h-[30vh]" alt="media" />
                    </div>
                  )}
                  {current?.text ? (
                    <h2 className="text-2xl md:text-3xl font-black leading-tight text-white mb-2 max-w-lg neon-text">{current.text}</h2>
                  ) : <h2 className="text-2xl md:text-3xl font-bold leading-tight text-white opacity-20">لا توجد ردود بعد</h2>}

                  {/* Desktop Only: Rodoud Navigation Arrows */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-[-80px] hidden md:flex items-center gap-4 z-40">
                    <button onClick={prevP} className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white hover:bg-white/15 transition-all backdrop-blur-md">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="rotate-180"><path d="m9 18 6-6-6-6" /></svg>
                    </button>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">تصفح الردود</span>
                    <button onClick={nextP} className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white hover:bg-white/15 transition-all backdrop-blur-md">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* SETUP PANE */}
            <div id="setup-container" className="bg-gradient-to-b from-[#4b1088] via-[#240b4a] to-[#0d0216] relative flex flex-col justify-center px-6 md:px-12 pt-10 md:pt-16 pb-12 md:pb-24 overflow-hidden order-1 md:order-2 md:border-l md:border-white/60 flex-1">
              {/* Intense Central Glow for Setup */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/40 blur-[140px] rounded-full pointer-events-none z-0" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-500/30 blur-[100px] rounded-full pointer-events-none z-0" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(139,92,246,0.3),_transparent_75%)] pointer-events-none z-0" />
              <button onClick={() => (loggedIn || getToken()) ? setOpenCreate(true) : router.push("/login")} className="absolute top-6 md:top-10 left-6 md:left-10 bg-gradient-to-r from-[#FF0080] to-[#E91E63] hover:scale-105 active:scale-95 transition shadow-xl px-4 md:px-6 py-2 md:py-2.5 rounded-full md:rounded-2xl flex items-center gap-2 font-black text-[10px] md:text-sm z-30 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
                <span className="hidden md:inline">عندك أفشة؟</span>
                <span className="md:hidden">أضف</span>
              </button>

              <div className="absolute top-6 md:top-10 right-6 md:right-10 flex flex-col items-end gap-2 z-30">
                {setup?.tags && setup.tags.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {setup.tags.map((tag: any, idx: number) => {
                      const colors = [
                        "bg-blue-600/30 border-blue-400/20 text-blue-100",
                        "bg-rose-600/30 border-rose-400/20 text-rose-100",
                        "bg-purple-600/30 border-purple-400/20 text-purple-100",
                        "bg-orange-600/30 border-orange-400/20 text-orange-100",
                        "bg-emerald-600/30 border-emerald-400/20 text-emerald-100"
                      ];
                      const colorClass = colors[idx % colors.length];
                      const tagName = typeof tag === 'string' ? tag : (tag.name || "tag");
                      return (
                        <div key={idx} className={`px-2 py-1 backdrop-blur-md rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-wider border shadow-sm ${colorClass}`}>
                          <span className="opacity-50">#</span> {tagName}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="absolute left-1/2 -translate-x-1/2 bottom-0 md:left-auto md:translate-x-0 md:right-10 md:top-1/2 md:bottom-auto md:-translate-y-1/2 hidden md:flex md:flex-col gap-4 z-40">
                <button onClick={(e) => { e.stopPropagation(); loadPrev(); }} className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white hover:bg-white/20 transition-all backdrop-blur-md">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="md:w-6 md:h-6"><path d="m18 15-6-6-6 6" /></svg>
                </button>
                <button onClick={(e) => { e.stopPropagation(); loadNext(); }} className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white hover:bg-white/20 transition-all backdrop-blur-md">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="md:w-6 md:h-6"><path d="m6 9 6 6 6-6" /></svg>
                </button>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={setup?.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 text-center flex flex-col items-center">
                  <div className="flex items-center gap-3 opacity-40 mb-3 md:mb-8">
                    <img src={setup?.user?.avatar || `https://api.dicebear.com/9.x/bottts/svg?seed=${setup?.user?.id}`} className="w-5 h-5 rounded-full" alt="avatar" />
                    <span className="text-xs font-black tracking-tight">{setup?.user?.name || "Unknown"}</span>
                  </div>
                  {setup?.media_type === "image" && setup?.media_url && (
                    <div className="mb-4 md:mb-6 w-full max-w-[200px] md:max-w-sm rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl bg-black/40 flex items-center justify-center min-h-[80px]">
                      <img src={setup.media_url} className="w-full h-auto object-cover max-h-[20vh] md:max-h-[40vh]" alt="media" />
                    </div>
                  )}
                  {setup?.text ? (
                    <h2 className="text-2xl md:text-3xl font-black leading-tight text-white max-w-lg neon-text">{setup.text}</h2>
                  ) : <h2 className="text-2xl md:text-3xl font-bold leading-tight text-white opacity-20">...جاري التحميل</h2>}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          <div className="hidden md:flex fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-[1750px] justify-center pointer-events-none">
            <div className="relative flex items-center bg-black/60 backdrop-blur-2xl px-2 h-16 rounded-full border border-white/10 shadow-2xl min-w-[240px] pointer-events-auto">
              <div className="flex-1 flex justify-center">
                <button className="w-11 h-11 rounded-full border border-white/5 flex items-center justify-center text-white/20 hover:text-white/60 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                </button>
              </div>
              <div className="relative flex justify-center w-20">
                <motion.div animate={laughing ? { scale: [1, 1.2, 1] } : {}} onClick={laugh} className="absolute -top-11 w-20 h-20 bg-[#1A1D23] rounded-full p-1.5 shadow-2xl cursor-pointer">
                  <div className="w-full h-full bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full flex flex-col items-center justify-center border-4 border-[#1A1D23]">
                    <span className="text-3xl filter drop-shadow-md select-none">😂</span>
                  </div>
                </motion.div>
              </div>
              <div className="flex-1 flex justify-center">
                <button className="w-11 h-11 rounded-full border border-white/5 flex items-center justify-center text-white/20 hover:text-white/60 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <CreateSetupModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreated={(newSetup) => {
          setOpenCreate(false);
          setAllSetups(prev => [{ setup: newSetup, punchlines: [], cursor: null, pIndex: 0 }, ...prev]);
          setActiveIndex(0);
        }}
      />
      <AddPunchlineModal
        open={openAddPunchline}
        setupId={setup?.id || 0}
        onClose={() => setOpenAddPunchline(false)}
        onCreated={(newP) => {
          setAllSetups(prev => {
            const next = [...prev];
            if (next[activeIndex]) {
              next[activeIndex] = {
                ...next[activeIndex],
                punchlines: [...next[activeIndex].punchlines, newP],
                pIndex: next[activeIndex].punchlines.length
              };
            }
            return next;
          });
          setOpenAddPunchline(false);
        }}
      />
    </div>
  );
}
