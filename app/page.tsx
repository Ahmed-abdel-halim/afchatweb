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
}

interface Setup {
  id: number;
  text: string;
  slug: string;
  user: User;
  tags: Tag[];
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
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [laughing, setLaughing] = useState(false);
  const [openAddPunchline, setOpenAddPunchline] = useState(false);

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
    if (loadingSetup) return;

    if (buffer.length === 0) {
      if (endReached) return;
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
      return;
    }

    const nextItem = buffer[0];
    setBuffer(prev => prev.slice(1));

    if (setup) {
      setHistory((h) => [...h, { setup, punchlines, cursor, pIndex }]);
    }

    setSetup(nextItem.setup);
    setPunchlines(nextItem.punchlines);
    setPIndex(0);
    setCursor(nextItem.cursor);
  }

  function loadPrev() {
    if (history.length === 0) return;
    const last = history[history.length - 1];

    if (setup) {
      setBuffer(prev => [{
        setup,
        punchlines,
        cursor
      }, ...prev]);
    }

    setHistory((h) => h.slice(0, -1));
    setSetup(last.setup);
    setPunchlines(last.punchlines ?? []);
    setPIndex(last.pIndex);
    setCursor(last.cursor);
    setEndReached(false);
  }

  useEffect(() => {
    let lastScroll = 0;
    const handleWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (now - lastScroll < 1000) return;

      if (e.deltaY > 50) {
        loadNext();
        lastScroll = now;
      } else if (e.deltaY < -50) {
        loadPrev();
        lastScroll = now;
      }
    };
    window.addEventListener('wheel', handleWheel);
    return () => window.removeEventListener('wheel', handleWheel);
  }, [buffer, setup, history, loadingSetup, endReached]);

  useEffect(() => {
    if (!setup && buffer.length > 0) {
      loadNext();
    }
  }, [buffer, setup]);

  useEffect(() => {
    // Check for token on mount and fetch user if not already fetched
    const token = getToken();
    if (token && !user) {
      setLoggedIn(true);
      getMe()
        .then((res) => {
          if (res?.user) {
            setUser(res.user);
          }
        })
        .catch(() => {
          clearToken();
          setLoggedIn(false);
          setUser(null);
        });
    }
  }, [user]);

  const laugh = async () => {
    if (!current) {
      console.log("No punchline yet, cannot laugh.");
      return;
    }

    setLaughing(true);
    setTimeout(() => setLaughing(false), 600);

    const oldPunchlines = [...punchlines];
    const target = { ...oldPunchlines[pIndex] };
    target.laughs += 1;
    target.strength = target.views > 0 ? target.laughs / target.views : 0;
    oldPunchlines[pIndex] = target;
    setPunchlines(oldPunchlines);

    try {
      await postLaugh(current.id);
    } catch (e) {
      console.error("Laugh failed", e);
    }
  };

  useEffect(() => {
    if (current?.id) {
      postView(current.id).catch(() => { });
    }
  }, [current?.id]);

  const nextP = () => setPIndex(i => Math.min(punchlines.length - 1, i + 1));
  const prevP = () => setPIndex(i => Math.max(0, i - 1));

  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <div className="min-h-screen bg-[#0D0F14] text-white flex flex-col font-[family-name:var(--font-almarai)] selection:bg-purple-500/30 overflow-hidden">
      {/* HEADER */}
      <header className="flex items-center justify-between px-12 py-6 border-b border-white/5 bg-[#0D0F14]/80 backdrop-blur-xl z-[100] sticky top-0">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 bg-orange-400 rounded-xl flex items-center justify-center text-2xl font-black shadow-[0_0_20px_rgba(251,146,60,0.4)]">أ</div>
          <h1 className="text-4xl font-black italic tracking-tighter bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent whitespace-nowrap">فشات</h1>
        </div>

        {/* Search */}
        <div className="hidden md:flex relative w-1/3 group">
          <input
            type="text"
            placeholder="ابحث عن مواقف، تريندات، أو أشخاص..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-3.5 outline-none focus:border-purple-500/50 focus:bg-white/10 transition text-center backdrop-blur-md"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-purple-400 transition">🔍</span>
        </div>

        {/* User Actions (Reversed as requested) */}
        <div className="flex items-center gap-4 relative">
          {/* Notifications Circular Button */}
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition group relative">
            <span className="text-xl opacity-60 group-hover:opacity-100 transition">🔔</span>
            <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-[#E91E63] rounded-full border-2 border-[#0D0F14]" />
          </div>

          {loggedIn ? (
            <div className="relative">
              {/* User Pill Badge */}
              <div
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="h-12 pl-4 pr-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-3 cursor-pointer hover:bg-white/10 transition select-none group"
              >
                {/* Chevron */}
                <span className={`text-[10px] text-white/20 group-hover:text-white/40 transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`}>▼</span>

                {/* Info */}
                <div className="flex flex-col text-left">
                  <span className="text-sm font-black tracking-tight leading-tight">
                    {user?.name || user?.email?.split('@')[0] || "مستخدم جديد"}
                  </span>
                  <div className="flex items-center gap-1 opacity-40">
                    <span className="text-[9px] font-bold uppercase tracking-wider">Level 5 Joker</span>
                    <span className="text-[10px]">🃏</span>
                  </div>
                </div>

                {/* Avatar with Blue Border */}
                <div className="relative">
                  <img
                    src={user?.avatar || `https://api.dicebear.com/9.x/bottts/svg?seed=${user?.email || 'afshat'}`}
                    className="w-9 h-9 rounded-full border-2 border-blue-500 bg-white/10 p-0.5 object-cover"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#0D0F14] rounded-full" />
                </div>
              </div>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-14 left-0 w-48 bg-[#1A1D23] border border-white/10 rounded-2xl shadow-2xl p-2 z-[110] backdrop-blur-xl"
                  >
                    <button
                      onClick={() => {
                        clearToken();
                        setLoggedIn(false);
                        setUser(null);
                        setShowUserMenu(false);
                        router.refresh();
                      }}
                      className="w-full px-4 py-3 rounded-xl flex items-center gap-3 hover:bg-red-500/10 text-red-500 transition font-bold text-sm"
                    >
                      <span className="text-lg">تسجيل الخروج</span>
                      <span className="text-base text-red-500">🚪</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-black text-sm shadow-lg shadow-purple-500/20 active:scale-95 transition"
            >
              تسجيل الدخول
            </button>
          )}
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex flex-col px-8 pb-40 pt-4 relative">
        <div className="relative w-full max-w-[1400px] mx-auto">
          {/* THE BIG BOX */}
          <div className="w-full h-[78vh] grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden rounded-[40px] border border-white/10 shadow-2xl relative">

            {/* FIRST CHILD (Right in RTL): THE PUNCHLINE */}
            <div className="relative bg-gradient-to-br from-[#7B42F6] via-[#B068F9] to-[#E91E63] flex flex-col justify-center px-12 pt-16 pb-24 overflow-hidden border-r border-white/5 group">
              {/* Shine effect */}
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_5s_infinite] pointer-events-none" />

              {/* Status Bar */}
              <div className="absolute top-8 left-8 right-8 flex items-center justify-between z-30">
                <button
                  onClick={() => loggedIn ? setOpenAddPunchline(true) : router.push("/login")}
                  className="px-4 py-1.5 bg-white/10 hover:bg-[#E91E63] border border-white/10 backdrop-blur-md rounded-xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center gap-2 group/btn"
                >
                  <span className="group-hover/btn:rotate-90 transition-transform">➕</span>
                  أضف رد مضحك
                </button>
                <div className="px-4 py-1.5 bg-black/20 backdrop-blur-md rounded-xl text-[10px] font-black tracking-widest uppercase border border-white/10">
                  الرد {pIndex + 1}/{punchlines.length || 1}
                </div>
              </div>

              {/* Reactions Right (Floating) */}
              <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-10 z-40">
                <button onClick={laugh} className="flex flex-col items-center group/react active:scale-95 transition">
                  <motion.div
                    animate={laughing ? { scale: [1, 1.4, 1], rotate: [0, 15, -15, 0] } : {}}
                    className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl group-hover/react:scale-125 transition"
                  >
                    😂
                  </motion.div>
                  <span className="text-xs font-black mt-2 opacity-80">{current?.laughs?.toLocaleString() || 0}</span>
                </button>

                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-3xl shadow-[0_10px_20px_rgba(249,115,22,0.4)]">🔥</div>
                  <span className="text-xs font-black mt-2 opacity-80">{current ? Math.round((current.strength ?? 0) * 100) : 0}%</span>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={current?.id || 'loading'}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="relative z-10 text-center flex flex-col items-center px-24"
                >
                  <div className="flex items-center gap-3 mb-6 opacity-60">
                    <span className="w-6 h-[1px] bg-white/20" />
                    <div className="flex items-center gap-2">
                      <img
                        src={current?.user_avatar || current?.user?.avatar || `https://api.dicebear.com/9.x/bottts/svg?seed=${current?.id || 'punch'}`}
                        className="w-5 h-5 rounded-full bg-white/10"
                        alt="avatar"
                      />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                        الرد من: {current?.user_name || current?.user?.name || current?.user?.email?.split('@')[0] || "مجهول"}
                      </span>
                    </div>
                    <span className="w-6 h-[1px] bg-white/20" />
                  </div>
                  <h2 className="text-5xl font-black leading-[1.3] text-white drop-shadow-2xl">
                    {current?.text || "اسحب يمين أو شمال للمزيد..."}
                  </h2>

                  {/* Local Nav Arrows */}
                  <div className="flex items-center gap-8 mt-24 bg-white/10 backdrop-blur-xl p-2.5 rounded-full border border-white/20 shadow-2xl">
                    <button onClick={prevP} className="w-14 h-14 rounded-full flex items-center justify-center bg-black/30 hover:bg-black/50 transition group/arr shadow-lg">
                      <span className="text-2xl text-white transition group-hover/arr:-translate-x-1">→</span>
                    </button>
                    <span className="text-sm font-black text-white px-2 tracking-tight">تصفح الردود</span>
                    <button onClick={nextP} className="w-14 h-14 rounded-full flex items-center justify-center bg-black/30 hover:bg-black/50 transition group/arr shadow-lg">
                      <span className="text-2xl text-white transition group-hover/arr:translate-x-1">←</span>
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* SECOND CHILD (Left in RTL): THE SETUP */}
            <div className="bg-[#0A1A3B] relative flex flex-col justify-center px-12 pt-16 pb-24 overflow-hidden border-l border-white/5 group">
              <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,#3b82f6_0,transparent_50%)]" />

              {/* Dynamic Tag Badges */}
              <div className="absolute top-8 right-8 flex flex-col items-end gap-2 z-30">
                {setup?.tags?.map((tag: any) => (
                  <motion.span
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={tag.id}
                    className="px-3 py-1.5 bg-white/5 text-white/70 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 backdrop-blur-md shadow-lg"
                  >
                    <span className="w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
                    {tag.name}
                  </motion.span>
                ))}
              </div>

              {/* Float Button: Create */}
              <button
                onClick={() => loggedIn ? setOpenCreate(true) : router.push("/login")}
                className="absolute top-8 left-8 bg-[#E91E63] hover:scale-105 active:scale-95 transition shadow-[0_8px_20px_rgba(233,30,99,0.4)] px-5 py-2.5 rounded-2xl flex items-center gap-2 font-black text-sm z-30"
              >
                عندك أفشة؟ 🎙️
              </button>

              {/* Vertical Arrows */}
              <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-5 z-[60] group-hover:opacity-100 transition-all">
                <button
                  onClick={(e) => { e.stopPropagation(); loadPrev(); }}
                  disabled={history.length === 0}
                  className={`w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center transition-all shadow-xl backdrop-blur-md active:scale-95 ${history.length === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#E91E63] hover:border-[#E91E63]/50'}`}
                  title={history.length === 0 ? "أنت في أول قفشة" : "السابق"}
                >
                  <span className="text-2xl transition-all duration-300">
                    {history.length === 0 ? "🔝" : "↑"}
                  </span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); loadNext(); }}
                  disabled={loadingSetup || (endReached && buffer.length === 0)}
                  className={`w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center transition-all shadow-xl backdrop-blur-md active:scale-95 ${(endReached && buffer.length === 0) ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#E91E63] hover:border-[#E91E63]/50'}`}
                  title={(endReached && buffer.length === 0) ? "وصلت للنهاية" : "التالي"}
                >
                  <span className="text-2xl transition-all duration-300">
                    {loadingSetup ? "..." : (endReached && buffer.length === 0) ? "🔚" : "↓"}
                  </span>
                </button>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={setup?.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="relative z-10 text-center"
                >
                  <div className="flex items-center justify-center gap-3 mb-6 opacity-60">
                    <span className="w-8 h-[1px] bg-white/20" />
                    <div className="flex items-center gap-2">
                      <img
                        src={setup?.user?.avatar || `https://api.dicebear.com/9.x/bottts/svg?seed=${setup?.user?.email || 'user'}`}
                        className="w-5 h-5 rounded-full bg-white/10"
                        alt="avatar"
                      />
                      <span className="text-sm font-bold tracking-tight">
                        {setup?.user?.name || setup?.user?.email?.split('@')[0] || "مجهول"}
                      </span>
                    </div>
                    <span className="w-8 h-[1px] bg-white/20" />
                  </div>
                  <h2 className="text-5xl font-black leading-[1.3] text-white drop-shadow-lg px-4">
                    {setup?.text || "جاري التحميل..."}
                  </h2>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* BOTTOM ACTION BAR */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 flex items-center gap-6 z-50">
            <div className="flex items-center gap-4 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <button className="w-14 h-14 flex items-center justify-center hover:bg-white/5 rounded-full text-2xl transition">💬</button>
              <div className="relative group">
                <div className="absolute -inset-2 bg-yellow-400/20 blur-xl opacity-0 group-hover:opacity-100 transition rounded-full" />
                <button
                  onClick={laugh}
                  className="w-20 h-20 bg-gradient-to-tr from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center shadow-[0_12px_40px_rgba(234,179,8,0.5)] active:scale-95 transition-transform duration-100 border-4 border-[#0D0F14] relative z-10"
                >
                  <motion.span
                    animate={laughing ? { scale: [1, 1.6, 1], rotate: [0, 20, -20, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    className="text-5xl"
                  >
                    😂
                  </motion.span>
                </button>
              </div>
              <button className="w-14 h-14 flex items-center justify-center hover:bg-white/5 rounded-full text-2xl transition">🔗</button>
            </div>
          </div>
        </div>
      </main>

      <CreateSetupModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreated={() => { setOpenCreate(false); loadNext(); }}
      />

      <AddPunchlineModal
        open={openAddPunchline}
        setupId={setup?.id || 0}
        onClose={() => setOpenAddPunchline(false)}
        onCreated={(newP) => {
          setPunchlines(prev => [...prev, newP]);
          setPIndex(punchlines.length);
        }}
      />

      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
