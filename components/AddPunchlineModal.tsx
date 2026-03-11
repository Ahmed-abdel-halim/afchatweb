"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { addPunchline } from "@/lib/api";

interface AddPunchlineModalProps {
  open: boolean;
  onClose: () => void;
  setupId: number;
  onCreated: (newPunchline: any) => void;
}

export default function AddPunchlineModal({ open, onClose, setupId, onCreated }: AddPunchlineModalProps) {
  const [text, setText] = useState("");
  const [mediaType, setMediaType] = useState<"text" | "image" | "video">("text");
  const [mediaUrl, setMediaUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mediaType === "text" && !text.trim()) return;
    if ((mediaType === "image" || mediaType === "video") && !mediaUrl.trim()) return;

    setLoading(true);
    setError("");
    try {
      const res = await addPunchline(setupId, {
        media_type: mediaType,
        text: mediaType === "text" ? text : undefined,
        media_url: mediaType !== "text" ? mediaUrl : null,
      });
      onCreated(res.data);
      setText("");
      setMediaUrl("");
      onClose();
    } catch (err: any) {
      setError(err.message || "حدث خطأ ما أثناء إضافة الرد");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-[#11141D] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden shadow-purple-500/10"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-purple-600/10 to-transparent">
              <div>
                <h3 className="text-2xl font-black italic">أضف ردك المضحك 🎭</h3>
                <p className="text-xs text-white/40 mt-1 uppercase tracking-widest font-bold">خلّينا نضحك معاك!</p>
              </div>
              <button 
                onClick={onClose}
                className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition group"
              >
                <span className="group-hover:rotate-90 transition-transform duration-300">✕</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Media Type Switcher */}
              <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5">
                {(["text", "image", "video"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setMediaType(type)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      mediaType === type ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30" : "text-white/40 hover:text-white/60"
                    }`}
                  >
                    {type === "text" ? "نص 📝" : type === "image" ? "صورة 🖼️" : "فيديو 🎥"}
                  </button>
                ))}
              </div>

              {mediaType === "text" ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 px-2">نص الرد</label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="اكتب القفشة هنا..."
                    className="w-full h-32 bg-white/5 border border-white/10 rounded-[2rem] px-6 py-5 outline-none focus:border-purple-500/50 focus:bg-white/10 transition text-lg resize-none custom-scrollbar"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 px-2">رابط الميديا ({mediaType})</label>
                  <input
                    type="url"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-purple-500/50 focus:bg-white/10 transition"
                  />
                  {mediaType === "image" && mediaUrl && (
                    <div className="mt-4 rounded-2xl overflow-hidden border border-white/10 h-40 bg-black/40">
                      <img src={mediaUrl} className="w-full h-full object-contain" alt="Preview" onError={() => setError("عذراً، الرابط غير صالح أو لا يدعم العرض")} />
                    </div>
                  )}
                </div>
              )}

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold flex items-center gap-3"
                >
                  <span>⚠️</span>
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-[2rem] font-black text-lg shadow-xl shadow-purple-500/20 active:scale-[0.98] transition hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
              >
                {loading ? (
                  <span className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>انشر الرد الآن! 🚀</>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
