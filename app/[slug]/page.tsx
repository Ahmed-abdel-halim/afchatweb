"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSetupBySlug } from "@/lib/api";

type Punchline = {
  id: number;
  text: string;
  views: number;
  laughs: number;
  strength: number;
};

type Setup = {
  id: number;
  text: string;
  slug: string;
  created_at?: string;
  user?: { id: number; name?: string; email?: string };
  tags?: { id: number; name: string }[];
  punchlines?: Punchline[];
};

export default function SetupBySlugPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params?.slug;

  const [loading, setLoading] = useState(true);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [pIndex, setPIndex] = useState(0);

  const punchlines = useMemo(() => setup?.punchlines ?? [], [setup]);
  const current = useMemo(() => punchlines[pIndex] ?? null, [punchlines, pIndex]);

  useEffect(() => {
    if (!slug) return;

    setLoading(true);
    getSetupBySlug(slug)
      .then((res) => {
        const data = res?.data ?? res;
        setSetup(data);
        setPIndex(0);
      })
      .catch((err) => {
        console.error("getSetupBySlug failed:", err);
        setSetup(null);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!setup) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-3">
        <div className="text-xl font-bold">اللينك غير صحيح ❌</div>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 rounded-lg bg-black text-white"
        >
          الرجوع للرئيسية
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 text-white p-6">
      <div className="max-w-3xl mx-auto bg-black/30 rounded-2xl p-6">
        {/* Setup header */}
        <div className="text-sm opacity-80 mb-2">
          {setup.user?.name ?? setup.user?.email ?? "User"}
        </div>

        <div className="text-3xl font-extrabold leading-snug mb-4">
          {setup.text}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {(setup.tags ?? []).map((t) => (
            <span
              key={t.id}
              className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/15"
            >
              {t.name}
            </span>
          ))}
        </div>

        {/* Punchlines */}
        <div className="rounded-2xl bg-black/25 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold">النكت</div>
            <div className="text-xs opacity-70">
              {punchlines.length === 0
                ? "لا يوجد نكت بعد"
                : `نكتة ${pIndex + 1} / ${punchlines.length}`}
            </div>
          </div>

          {punchlines.length === 0 ? (
            <div className="text-sm opacity-70">لسه مفيش ردود للنكتة دي.</div>
          ) : (
            <>
              <div className="text-2xl font-black leading-snug mb-4">
                {current?.text}
              </div>

              <div className="flex items-center gap-4 text-sm opacity-90 mb-4">
                <div>😂 {current?.laughs ?? 0}</div>
                <div>👀 {current?.views ?? 0}</div>
                <div>🔥 {Math.round((current?.strength ?? 0) * 100)}%</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPIndex((i) => Math.max(i - 1, 0))}
                  disabled={pIndex === 0}
                  className="rounded-xl bg-white/15 px-4 py-2 disabled:opacity-50"
                >
                  ← السابق
                </button>
                <button
                  onClick={() =>
                    setPIndex((i) => Math.min(i + 1, punchlines.length - 1))
                  }
                  disabled={pIndex >= punchlines.length - 1}
                  className="rounded-xl bg-white/15 px-4 py-2 disabled:opacity-50"
                >
                  التالي →
                </button>
              </div>
            </>
          )}
        </div>

        {/* Back */}
        <button
          onClick={() => router.push("/")}
          className="mt-6 rounded-xl bg-white/15 border border-white/20 px-4 py-3 font-semibold hover:bg-white/20"
        >
          الرجوع للرئيسية
        </button>
      </div>
    </div>
  );
}
