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
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mediaType === "text" && !text.trim()) return;
    if ((mediaType === "image" || mediaType === "video") && !mediaFile) return;

    setLoading(true);
    setError("");
    try {
      const res = await addPunchline(setupId, {
        media_type: mediaType,
        text: mediaType === "text" ? text : undefined,
        media_file: mediaType !== "text" ? mediaFile : null,
      });
      onCreated(res.data);
      setText("");
      setMediaFile(null);
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
            className="absolute inset-0 bg-[#0D0F14]/90 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="relative w-full max-w-lg bg-[#161922] border border-white/10 rounded-[2rem] shadow-[0_40px_100px_rgba(0,0,0,0.6)] overflow-hidden"
          >
            {/* Ambient Background Glows */}
            <div className="absolute -top-24 -right-24 w-60 h-60 bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

            {/* Header Section */}
            <div className="relative p-3 md:p-5 pb-2 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3">
                  <span className="text-xl md:text-3xl filter drop-shadow-md">🎭</span>
                  <div>
                    <h3 className="text-lg md:text-2xl font-black tracking-tight text-white italic">أضف ردك المضحك</h3>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 border border-white/10 transition group"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-90 transition-transform duration-300"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="relative p-3 md:p-5 pt-3 md:pt-4 pb-0 space-y-2 md:space-y-4">

              {/* Custom Segmented Control */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-white/20 px-4">نوع الرد</label>
                <div className="flex p-1.5 bg-black/40 rounded-[1.5rem] border border-white/5 relative">
                  {(["text", "image", "video"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setMediaType(type)}
                      className={`flex-1 relative py-2 md:py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider transition-all duration-300 z-10 ${mediaType === type ? "text-white" : "text-white/30 hover:text-white/50"
                        }`}
                    >
                      {mediaType === type && (
                        <motion.div
                          layoutId="active-pill"
                          className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg ring-1 ring-white/10"
                        />
                      )}
                      <span className="relative z-20 flex items-center justify-center gap-2">
                        {type === "text" && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>}
                        {type === "image" && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>}
                        {type === "video" && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.934a.5.5 0 0 0-.777-.416L16 11" /><rect width="14" height="12" x="2" y="6" rx="2" /></svg>}
                        {type === "text" ? "نص" : type === "image" ? "صورة" : "فيديو"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Input Area */}
              <div className="space-y-3 md:space-y-4">
                {mediaType === "text" ? (
                  <div className="relative group">
                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-white/20 px-4 mb-2 block">نص الرد</label>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="اكتب ردك المضحك هنا..."
                      className="w-full h-12 md:h-24 bg-black/20 border border-white/5 group-hover:border-white/10 focus:border-purple-500/50 rounded-2xl md:rounded-[1.5rem] px-4 py-3 md:px-6 md:py-5 outline-none transition-all text-sm md:text-lg leading-relaxed placeholder:text-white/10 resize-none custom-scrollbar shadow-inner"
                    />
                    <div className="absolute bottom-4 right-6 text-[9px] font-bold text-white/10 uppercase tracking-widest">{text.length} حرف</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-white/20 px-4 mb-1 block">ملف الميديا ({mediaType})</label>
                    <div className="relative group">
                      <input
                        type="file"
                        accept={mediaType === 'image' ? "image/*" : "video/*"}
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setMediaFile(e.target.files[0]);
                          } else {
                            setMediaFile(null);
                          }
                        }}
                        className="w-full rounded-xl file:mr-3 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-[9px] md:file:text-xs file:font-bold file:bg-purple-500 file:text-white px-2 py-2 md:px-4 md:py-4 bg-black/20 border border-white/5 focus:border-purple-500/50 outline-none transition-all placeholder:text-white/10"
                      />
                    </div>
                    {mediaType === "image" && mediaFile && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-xl md:rounded-3xl overflow-hidden border border-white/10 h-24 md:h-48 bg-black/60 relative group"
                      >
                        <img
                          src={URL.createObjectURL(mediaFile)}
                          className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                          alt="Preview"
                          onLoad={() => URL.revokeObjectURL(URL.createObjectURL(mediaFile))} // basic cleanup, not perfect but helps memory
                          onError={(e) => {
                            setError("عذراً، الملف غير صالح");
                            e.currentTarget.src = "https://placehold.co/600x400/1A1D23/FFFFFF?text=%D8%A7%D9%84%D8%B5%D9%88%D8%B1%D8%A9+%D8%BA%D9%8A%D8%B1+%D9%85%D8%AA%D8%A7%D8%AD%D8%A9";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                        <span className="absolute bottom-4 left-4 text-[10px] font-black uppercase text-white/60">Preview</span>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold flex items-center gap-4"
                >
                  <span className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-lg">⚠️</span>
                  {error}
                </motion.div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 md:py-4 bg-gradient-to-r from-[#6366F1] via-[#A855F7] to-[#EC4899] rounded-2xl font-black text-sm md:text-lg shadow-[0_10px_30px_rgba(168,85,247,0.2)] hover:shadow-[0_15px_40px_rgba(168,85,247,0.3)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 overflow-hidden relative group mb-3 md:mb-5"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition duration-300" />
                <div className="relative z-10 flex items-center justify-center gap-4">
                  {loading ? (
                    <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>انشر الرد الآن!</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                    </>
                  )}
                </div>
              </button>
            </form>

            {/* Fine decoration */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
