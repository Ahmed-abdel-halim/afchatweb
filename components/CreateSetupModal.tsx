"use client";

import { useState } from "react";
import { createSetup } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export default function CreateSetupModal({ open, onClose, onCreated }: Props) {
  const [mediaType, setMediaType] = useState<"text" | "image" | "video">("text");
  const [text, setText] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setErr("");
    const tags = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (mediaType === "text" && !text.trim()) {
      setErr("اكتب نص الأفشة أولاً.");
      return;
    }
    
    setLoading(true);
    try {
      await createSetup({
        text: text.trim(),
        media_type: mediaType,
        media_url: mediaType === "text" ? null : mediaUrl.trim(),
        tags,
      });
      setText("");
      setMediaUrl("");
      setTagsText("");
      onClose();
      onCreated?.();
    } catch (e: any) {
      setErr(e?.message || "حصل خطأ أثناء النشر");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg rounded-[2.5rem] bg-[#0D0F14] border border-white/10 p-8 shadow-2xl overflow-hidden"
          >
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-500/10 blur-3xl rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black italic tracking-tight">إضافة أفشة جديدة 🎙️</h2>
              <button 
                onClick={onClose} 
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-3 ml-2">نوع المحتوى</label>
                <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
                  {(['text', 'image', 'video'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setMediaType(type)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        mediaType === type 
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' 
                        : 'text-white/40 hover:text-white/60'
                      }`}
                    >
                      {type === 'text' ? 'نص' : type === 'image' ? 'صورة' : 'فيديو'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-3 ml-2">الموقف / الأفشة</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full rounded-2xl px-5 py-4 bg-white/5 border border-white/10 outline-none focus:border-purple-500/50 focus:bg-white/10 transition min-h-[140px] text-lg leading-relaxed placeholder:text-white/20"
                  placeholder="اكتب الموقف اللي حصل..."
                />
              </div>

              {mediaType !== 'text' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-3 ml-2">رابط الميديا (URL)</label>
                  <input
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    className="w-full rounded-2xl px-5 py-4 bg-white/5 border border-white/10 outline-none focus:border-purple-500/50 focus:bg-white/10 transition"
                    placeholder="https://example.com/image.jpg"
                  />
                </motion.div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-3 ml-2">التاجات (افصل بفاصلة)</label>
                <input
                  value={tagsText}
                  onChange={(e) => setTagsText(e.target.value)}
                  className="w-full rounded-2xl px-5 py-4 bg-white/5 border border-white/10 outline-none focus:border-purple-500/50 focus:bg-white/10 transition text-sm"
                  placeholder="جامعة, شغل, خروج..."
                />
              </div>

              {err && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                  ⚠️ {err}
                </div>
              )}

              <button
                onClick={submit}
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black py-5 shadow-2xl shadow-purple-600/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 relative overflow-hidden group"
              >
                <span className="relative z-10">{loading ? "جاري النشر..." : "نشر الأفشة الآن 🚀"}</span>
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition ease-in-out" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
