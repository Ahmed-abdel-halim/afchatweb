"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { addComment } from "@/lib/api";

export default function CommentsModal({ open, onClose, punchlineId, comments, onCommentAdded, loggedIn }: any) {
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [comments, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedIn || !body.trim() || loading) return;
    
    setLoading(true);
    setError("");
    try {
      const res = await addComment(punchlineId, body);
      onCommentAdded(res.data);
      setBody("");
    } catch (err: any) { 
      setError(err.message || "حدث خطأ ما");
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[250] flex items-end md:items-center justify-center p-0 md:p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-[#0D0F14]/90 backdrop-blur-md" />
          <motion.div initial={{ y: "100%", scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: "100%", scale: 0.95 }} className="relative w-full max-w-xl bg-[#161922] border-t md:border border-white/10 rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-[0_-20px_80px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col h-[80vh] md:h-[550px]">
            {/* Ambient Ambient Glows */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-600/10 blur-[80px] pointer-events-none rounded-full" />
            
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5 z-10">
              <div>
                <h3 className="font-black text-xl italic text-white tracking-widest uppercase">المناقشة الجارية ({comments.length})</h3>
                <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-white/30 font-black uppercase tracking-widest">هنا الضحك الحقيقي</span>
                </div>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40 hover:text-white transition group"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-90 transition-transform duration-300"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg></button>
            </div>
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-black/20 z-10 scroll-smooth">
              {comments.map((c: any) => (
                <div key={c.id} className="flex gap-3 justify-end group">
                  <div className="flex flex-col items-end max-w-[85%]">
                    <span className="text-[10px] font-black opacity-30 mb-1.5 mr-1 uppercase tracking-tighter">{c.user?.name || "عضو أفشاتي"}</span>
                    <div className="bg-white/5 p-4 rounded-2xl rounded-tr-none text-sm text-white/95 leading-relaxed group-hover:bg-white/10 transition border border-white/5 shadow-sm">{c.body}</div>
                  </div>
                  <div className="w-9 h-9 rounded-full p-0.5 bg-gradient-to-tr from-purple-500 to-pink-500 flex-shrink-0 shadow-lg ring-2 ring-white/5">
                    <img src={c.user?.avatar || `https://api.dicebear.com/9.x/bottts/svg?seed=${c.id}`} className="w-full h-full rounded-full object-cover bg-black/80" />
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-10 space-y-4">
                   <div className="text-6xl">💬</div>
                   <p className="font-bold text-sm tracking-widest italic leading-loose">محدش لسه فرقع ضحك هناا..<br/>كن أول واحد واكتب قفشتك!</p>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-[#0D0F14] border-t border-white/5 z-20">
              <form onSubmit={handleSubmit} className="flex gap-3 items-end">
                <input value={body} onChange={e => setBody(e.target.value)} placeholder={loggedIn ? "اكتب تعليقك الساخر..." : "سجل دخول للمناقشة"} disabled={!loggedIn || loading} className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:border-purple-500/50 outline-none transition placeholder:text-white/10" />
                <button type="submit" disabled={!loggedIn || loading || !body.trim()} className="h-14 w-14 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center font-black shadow-lg hover:shadow-purple-500/20 active:scale-95 transition disabled:opacity-50 group">
                  {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 group-hover:-translate-y-1 transition duration-300"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
