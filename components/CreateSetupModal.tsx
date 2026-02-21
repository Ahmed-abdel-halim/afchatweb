"use client";

import { useState } from "react";
import { createSetup } from "@/lib/api";

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

  if (!open) return null;

  async function submit() {
    setErr("");
    const tags = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (mediaType === "text" && !text.trim()) {
      setErr("اكتبي نص الأفشة.");
      return;
    }
    if ((mediaType === "image" || mediaType === "video") && !mediaUrl.trim()) {
      setErr("لازم تحطي رابط للصورة/الفيديو.");
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
      setErr(e?.message || "حصل خطأ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-lg rounded-2xl bg-[#1b1b1b] text-white p-5 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="font-extrabold text-xl">إضافة أفشة ✍️</div>
          <button onClick={onClose} className="opacity-70 hover:opacity-100">✖</button>
        </div>

        <label className="block text-sm mb-1">النوع</label>
        <select
          value={mediaType}
          onChange={(e) => setMediaType(e.target.value as any)}
          className="w-full mb-3 rounded-xl px-4 py-3 bg-white/10 border border-white/15 outline-none"
        >
          <option value="text">نص</option>
          <option value="image">صورة (رابط)</option>
          <option value="video">فيديو (رابط)</option>
        </select>

        <label className="block text-sm mb-1">نص الأفشة</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full mb-3 rounded-xl px-4 py-3 bg-white/10 border border-white/15 outline-none min-h-[110px]"
          placeholder="اكتب/ي الموقف..."
        />

        {(mediaType === "image" || mediaType === "video") && (
          <>
            <label className="block text-sm mb-1">رابط الميديا</label>
            <input
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              className="w-full mb-3 rounded-xl px-4 py-3 bg-white/10 border border-white/15 outline-none"
              placeholder={mediaType === "image" ? "https://...jpg/png" : "https://...mp4 أو رابط"}
            />
          </>
        )}

        <label className="block text-sm mb-1">التاجات (افصلي بينهم بفاصلة ,)</label>
        <input
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          className="w-full mb-3 rounded-xl px-4 py-3 bg-white/10 border border-white/15 outline-none"
          placeholder="جامعة, شغل, مواصلات"
        />

        {err && <div className="mb-3 text-sm text-red-300">{err}</div>}

        <button
          onClick={submit}
          disabled={loading}
          className="w-full rounded-xl bg-yellow-400 text-black font-bold px-4 py-3 disabled:opacity-70"
        >
          {loading ? "..." : "نشر"}
        </button>
      </div>
    </div>
  );
}
