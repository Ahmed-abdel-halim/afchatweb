"use client";

import { useEffect, useState, useMemo } from "react";
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
  const [setup, setSetup] = useState<Setup | null>(null);
  const [punchlines, setPunchlines] = useState<Punchline[]>([]);
  const [pIndex, setPIndex] = useState(0);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loadingSetup, setLoadingSetup] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false); // We'll sync this in useEffect to avoid SSR mismatches
  const [user, setUser] = useState<User | null>(null);
  const [laughing, setLaughing] = useState(false);
  const [openAddPunchline, setOpenAddPunchline] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const current = useMemo(() => punchlines[pIndex] ?? null, [punchlines, pIndex]);

  // --- Logic Functions ---
  const [buffer, setBuffer] = useState<Array<{ setup: Setup; punchlines: Punchline[]; cursor: number | null }>>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [endReached, setEndReached] = useState(false);

  // Hydrate buffer in background
  useEffect(() => {
    if (buffer.length >= 3 || loadingSetup || endReached) return;

    const fillBuffer = async () => {
      setLoadingSetup(true);
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
        console.error("Buffer prefetch failed", e);
      } finally {
        setLoadingSetup(false);
      }
    };

    fillBuffer();
  }, [buffer.length, nextCursor, loadingSetup, endReached]);

  async function loadNext() {
    if (buffer.length > 0) {
      const nextItem = buffer[0];
      setBuffer(prev => prev.slice(1));

      if (setup) {
        setHistory((h) => [...h, { setup, punchlines, cursor, pIndex }]);
      }

      setSetup(nextItem.setup);
      setPunchlines(nextItem.punchlines);
      setPIndex(0);
      setCursor(nextItem.cursor);
      return;
    }

    if (loadingSetup || endReached) return;

    setLoadingSetup(true);
    try {
      const json = await getFeed(nextCursor ?? undefined);
      if (json?.data) {
        if (setup) setHistory(h => [...h, { setup, punchlines, cursor, pIndex }]);
        setSetup(json.data.setup);
        setPunchlines(json.data.punchlines ?? []);
        setPIndex(0);
        setCursor(json.next_cursor ?? null);
        setNextCursor(json.next_cursor ?? null);
      } else {
        setEndReached(true);
      }
    } catch (e) {
      console.error("Direct fetch failed", e);
    } finally {
      setLoadingSetup(false);
    }
  }

  function loadPrev() {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory(h => h.slice(0, -1));

    setSetup(last.setup);
    setPunchlines(last.punchlines);
    setCursor(last.cursor);
    setPIndex(last.pIndex);
  }

  useEffect(() => {
    loadNext();
    const token = getToken();
    if (token) {
      setLoggedIn(true); // Optimistically set to true if token exists
      getMe().then(res => {
        if (res && (res as any).user) {
          setUser((res as any).user);
        } else if (res) {
          setUser(res as any);
        }
      }).catch(() => {
        // Only clear if it's a real auth error, but for now let's be safe
        // clearToken();
        // setLoggedIn(false);
      });
    }
  }, []);

  useEffect(() => {
    if (current?.id) {
      postView(current.id);
    }
  }, [current?.id]);

  async function laugh() {
    if (!current?.id) return;
    setLaughing(true);

    // End animation quickly so it can bounce again easily
    setTimeout(() => setLaughing(false), 300);

    // Optimistic Update
    setPunchlines(prev => prev.map(p => {
      if (p.id === current.id) {
        const newLaughs = (p.laughs || 0) + 1;
        const newViews = Math.max(p.views || 1, 1);
        return {
          ...p,
          laughs: newLaughs,
          strength: newLaughs / newViews
        };
      }
      return p;
    }));

    try {
      await postLaugh(current.id);
    } catch (e) {
      // Could rollback here, but we'll ignore for likes
    }
  }

  const nextP = () => setPIndex(prev => (prev + 1) % (punchlines.length || 1));
  const prevP = () => setPIndex(prev => (prev - 1 + (punchlines.length || 1)) % (punchlines.length || 1));

  return (
    <div className="min-h-screen bg-[#0D0F14] text-white flex flex-col font-[family-name:var(--font-almarai)] selection:bg-purple-500/30 overflow-hidden relative">
      {/* HEADER */}
      <header className="flex items-center justify-between px-12 py-6 z-[100] sticky top-0 bg-black/5 backdrop-blur-2xl border-b border-white/5">

        {/* Left Side: Logo */}
        <div className="flex items-center gap-4 w-1/4">
          <div className="w-11 h-11 bg-gradient-to-tr from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center text-2xl font-black text-white shadow-[0_10px_30px_rgba(249,115,22,0.2)] transform -rotate-3 hover:rotate-0 transition-transform">أ</div>
          <h1 className="text-4xl font-black tracking-tighter text-white italic">فشات</h1>
        </div>

        {/* Center: Search Bar */}
        <div className="hidden md:flex relative w-1/2 max-w-[500px] group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-base opacity-20 pointer-events-none group-focus-within:opacity-40 transition-opacity">
            🔍
          </div>
          <input
            type="text"
            placeholder="ابحث عن مواقف، تريندات، أو أشخاص..."
            className="w-full bg-[#161922] border border-white/5 rounded-2xl px-12 py-3 outline-none focus:border-white/10 transition-all text-center text-[13px] text-white/80 placeholder:text-white/20"
          />
        </div>

        {/* Right Side: Profile & Notifications */}
        <div className="flex items-center gap-6 w-1/4 justify-end">
          {loggedIn ? (
            <>
              <div className="w-11 h-11 rounded-full bg-[#1A1D23]/40 border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition text-xl relative shadow-sm">
                🔔
                <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-pink-500 rounded-full border-2 border-[#0D0F14]" />
              </div>

              <div className="relative">
                <div
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="h-11 pl-4 pr-2 bg-[#1A1D23]/40 border border-white/10 rounded-full flex items-center gap-3 cursor-pointer hover:bg-white/10 transition-all select-none group"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-20 group-hover:opacity-100 transition-opacity"><path d="m6 9 6 6 6-6" /></svg>
                  <div className="flex flex-col text-right">
                    <span className="text-[11px] font-black leading-tight text-white">{user?.name || "المستخدم"}</span>
                    <span className="text-[8px] opacity-40 font-black uppercase tracking-tighter">عضو جديد</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-0.5 relative">
                    <img
                      src={user?.avatar || `https://api.dicebear.com/9.x/bottts/svg?seed=${user?.email || 'afshat'}`}
                      className="w-full h-full rounded-full object-cover bg-[#0D0F14]"
                    />
                    <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 bg-green-500 border-2 border-[#0D0F14] rounded-full" />
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
                        className="absolute top-full right-0 mt-4 w-48 bg-[#1A1D23] border border-white/10 rounded-2xl shadow-2xl p-2 z-[110] backdrop-blur-xl"
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
                          <span dir="rtl">تسجيل الخروج</span>
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
              className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 active:scale-95 transition rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20"
            >
              تسجيل الدخول
            </button>
          )}
        </div>
      </header>

      <main className="flex grow items-center justify-center px-8 relative">
        <div className="relative w-full max-w-[1400px]">
          <div className="w-full h-[78vh] grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden rounded-[3rem] border border-white/5 shadow-2xl relative">

            {/* PUNCHLINE PANE (Left Side) */}
            <div className="bg-gradient-to-br from-[#7B42F6] to-[#E91E63] relative flex flex-col justify-center px-12 pt-16 pb-24 overflow-hidden order-1 border-r border-white/5">
              <div className="absolute top-10 left-10 z-30">
                <div className="px-4 py-1.5 bg-black/20 backdrop-blur-md rounded-xl text-[11px] font-bold border border-white/5 text-white/60 uppercase tracking-widest">
                  الرد {pIndex + 1}/{punchlines.length || 1}
                </div>
              </div>

              <div className="absolute top-10 right-10 z-30">
                <button
                  onClick={() => (loggedIn || getToken()) ? setOpenAddPunchline(true) : router.push("/login")}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md rounded-2xl text-xs font-bold transition-all flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                  أضف رد مضحك
                </button>
              </div>

              {/* Reactions */}
              <div className="absolute right-10 top-1/2 -translate-y-2/3 flex flex-col items-center gap-10 z-40">
                <div className="flex flex-col items-center gap-1 group">
                  <div
                    onClick={laugh}
                    className="w-14 h-14 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center text-3xl cursor-pointer hover:bg-white/20 hover:scale-110 active:scale-95 transition-all select-none shadow-xl"
                  >
                    😂
                  </div>
                  <span className="text-xs font-bold opacity-60 tracking-wider mt-1">{current?.laughs || 0}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-3xl shadow-lg">🔥</div>
                  <span className="text-xs font-bold opacity-60 tracking-wider mt-1">{current ? Math.round((current.strength ?? 0) * 100) : 0}%</span>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={current?.id || 'loading'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative z-10 text-center flex flex-col items-center px-24"
                >
                  <div className="flex items-center gap-3 mb-6 opacity-40">
                    <span className="w-8 h-[1px] bg-white" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold tracking-tight">
                        الرد من: {current?.user?.name || current?.user_name || "Ahmed abdelhalim"}
                      </span>
                      <img
                        src={current?.user_avatar || current?.user?.avatar || `https://api.dicebear.com/9.x/bottts/svg?seed=${current?.id || 'punch'}`}
                        className="w-5 h-5 rounded-full bg-white/10 object-cover"
                        alt="avatar"
                      />
                    </div>
                    <span className="w-8 h-[1px] bg-white" />
                  </div>
                  {current?.media_type === "image" && current?.media_url && (
                    <div className="mb-6 w-full max-w-sm rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black/40 flex items-center justify-center min-h-[100px]">
                      <img
                        src={current.media_url}
                        className="w-full h-auto object-cover max-h-[30vh]"
                        alt="punchline media"
                        onError={(e) => {
                          e.currentTarget.src = "https://placehold.co/600x400/1A1D23/FFFFFF?text=%D8%A7%D9%84%D8%B5%D9%88%D8%B1%D8%A9+%D8%BA%D9%8A%D8%B1+%D9%85%D8%AA%D8%A7%D8%AD%D8%A9";
                        }}
                      />
                    </div>
                  )}

                  {current?.text ? (
                    <h2 className="text-5xl font-bold leading-tight text-white mb-20">
                      {current.text}
                    </h2>
                  ) : current?.media_type !== 'image' ? (
                    <h2 className="text-5xl font-bold leading-tight text-white mb-20 opacity-50">
                      اسحب يمين أو شمال للمزيد...
                    </h2>
                  ) : null}

                  <div className="absolute bottom-[-100px] flex items-center gap-8 glass px-8 py-3 rounded-full border border-white/10 shadow-xl backdrop-blur-xl">
                    <button onClick={prevP} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition">
                      <span className="text-xl">→</span>
                    </button>
                    <span className="text-sm font-bold tracking-tight">تصفح الردود</span>
                    <button onClick={nextP} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition">
                      <span className="text-xl">←</span>
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* SETUP PANE (Right Side) */}
            <div className="bg-gradient-to-br from-[#0EA5E9] to-[#0284C7] relative flex flex-col justify-center px-12 pt-16 pb-24 overflow-hidden order-2 group">
              <button
                onClick={() => (loggedIn || getToken()) ? setOpenCreate(true) : router.push("/login")}
                className="absolute top-10 left-10 bg-gradient-to-r from-[#FF0080] to-[#E91E63] hover:scale-105 active:scale-95 transition shadow-[0_0_20px_rgba(233,30,99,0.3)] px-6 py-2.5 rounded-2xl flex items-center gap-2 font-bold text-sm z-30 text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
                عندك أفشة؟
              </button>

              <div className="absolute top-10 right-10 flex flex-col items-end gap-2 z-30">
                {setup?.tags && setup.tags.length > 0 ? (
                  setup.tags.map((tag, i) => (
                    <span key={tag.id} className="px-4 py-1.5 bg-white/20 text-white font-bold border border-white/20 rounded-full text-[11px] flex items-center gap-2 backdrop-blur-md shadow-sm drop-shadow-md">
                      {tag.name}
                      <span className={`w-2 h-2 rounded-full ${['bg-purple-500', 'bg-blue-500', 'bg-pink-500', 'bg-yellow-500', 'bg-green-500'][i % 5]}`} />
                    </span>
                  ))
                ) : (
                  <>
                    <span className="px-4 py-1.5 bg-white/20 text-white font-bold border border-white/20 rounded-full text-[11px] flex items-center gap-2 backdrop-blur-md shadow-sm drop-shadow-md">
                      الشغل
                      <span className="w-2 h-2 bg-purple-500 rounded-full" />
                    </span>
                    <span className="px-4 py-1.5 bg-white/20 text-white font-bold border border-white/20 rounded-full text-[11px] flex items-center gap-2 backdrop-blur-md shadow-sm drop-shadow-md">
                      الشركة
                      <span className="w-2 h-2 bg-blue-500 rounded-full" />
                    </span>
                  </>
                )}
              </div>

              {/* Navigation Arrows */}
              <div className="absolute right-10 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-40">
                <button
                  onClick={(e) => { e.stopPropagation(); loadPrev(); }}
                  disabled={history.length === 0}
                  className="w-12 h-12 bg-white/10 border border-white/5 rounded-xl flex items-center justify-center hover:bg-white/20 transition disabled:opacity-20 backdrop-blur-md"
                >
                  <span className="text-xl shadow-sm">↑</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); loadNext(); }}
                  disabled={(loadingSetup && buffer.length === 0) || (endReached && buffer.length === 0)}
                  className="w-12 h-12 bg-white/10 border border-white/5 rounded-xl flex items-center justify-center hover:bg-white/20 transition disabled:opacity-20 backdrop-blur-md"
                >
                  <span className="text-xl shadow-sm">↓</span>
                </button>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={setup?.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative z-10 text-center flex flex-col items-center"
                >
                  <div className="flex flex-col items-center gap-2 mb-8">
                    <div className="flex items-center gap-3 opacity-40">
                      <span className="w-8 h-[1px] bg-white" />
                      <img
                        src={setup?.user?.avatar || `https://api.dicebear.com/9.x/bottts/svg?seed=${setup?.user?.id || 'admin'}`}
                        className="w-5 h-5 rounded-full bg-white/10"
                      />
                      <span className="text-xs font-bold tracking-tight">{setup?.user?.name || "Ahmed abdelhalim"}</span>
                      <span className="w-8 h-[1px] bg-white" />
                    </div>
                  </div>

                  {setup?.media_type === "image" && setup?.media_url && (
                    <div className="mb-6 w-full max-w-sm rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black/40 flex items-center justify-center min-h-[100px]">
                      <img
                        src={setup.media_url}
                        className="w-full h-auto object-cover max-h-[40vh]"
                        alt="setup media"
                        onError={(e) => {
                          e.currentTarget.src = "https://placehold.co/600x400/1A1D23/FFFFFF?text=%D8%A7%D9%84%D8%B5%D9%88%D8%B1%D8%A9+%D8%BA%D9%8A%D8%B1+%D9%85%D8%AA%D8%A7%D8%AD%D8%A9";
                        }}
                      />
                    </div>
                  )}

                  {setup?.text ? (
                    <h2 className="text-5xl font-bold leading-tight text-white mb-6">
                      {setup.text}
                    </h2>
                  ) : !setup ? (
                    <h2 className="text-5xl font-bold leading-tight text-white mb-6 opacity-50">
                      ...جاري التحميل
                    </h2>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </div>

          </div>

          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[150]">
            <div className="relative group">
              {/* Background Glow */}
              <div className="absolute inset-0 bg-yellow-500/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition duration-1000" />

              <div className="relative flex items-center gap-8 bg-[#0D0F14]/80 backdrop-blur-2xl px-8 py-2.5 rounded-[2rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-w-[280px] justify-between transition-all duration-500 group-hover:border-white/20">

                {/* Link Option */}
                <button className="relative flex flex-col items-center gap-1 text-white/40 hover:text-white transition group/btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                </button>

                {/* Main Laughter Button */}
                <div className="relative">
                  <motion.div
                    animate={laughing ? { scale: [1, 1.3, 1] } : {}}
                    onClick={laugh}
                    className="w-14 h-14 bg-gradient-to-tr from-[#FFD600] to-[#FFE500] rounded-full flex items-center justify-center text-3xl shadow-[0_8px_20px_rgba(255,214,0,0.3)] border-[3px] border-[#0D0F14] cursor-pointer hover:scale-110 active:scale-90 transition-all duration-300 z-10 relative"
                  >
                    😂
                    {laughing && (
                      <motion.div
                        initial={{ opacity: 1, scale: 0.5 }}
                        animate={{ opacity: 0, scale: 2 }}
                        className="absolute inset-0 bg-yellow-400 rounded-full"
                      />
                    )}
                  </motion.div>
                </div>

                {/* Comment Option */}
                <button className="relative flex flex-col items-center gap-1 text-white/40 hover:text-white transition group/btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                </button>

              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <CreateSetupModal open={openCreate} onClose={() => setOpenCreate(false)} onCreated={() => { setOpenCreate(false); loadNext(); }} />
      <AddPunchlineModal open={openAddPunchline} setupId={setup?.id || 0} onClose={() => setOpenAddPunchline(false)} onCreated={(newP) => { setPunchlines(prev => [...prev, newP]); setPIndex(punchlines.length); }} />
    </div>
  );
}
