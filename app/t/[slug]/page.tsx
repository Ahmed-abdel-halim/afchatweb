import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import React from 'react';

// Assuming your backend is running on process.env.NEXT_PUBLIC_API_BASE or localhost:8000
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

async function getTag(slug: string) {
  const res = await fetch(`${API_BASE}/api/tags/${encodeURIComponent(slug)}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? json;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const tag = await getTag(decodedSlug);
  
  if (!tag) return { title: "القسم غير موجود | أفشات" };

  const title = `أفضل ${tag.name} ومواقف طريفة مجنونة 2026 | أفشات`;
  const description = `تصفح أجدد وأفضل ${tag.name}. قفشات، نكت، ومواقف مسخرة وحصرية على أفشات.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_APP_URL || "https://afchat.fun"}/t/${tag.slug}`,
    },
  };
}

export default async function TagPageSSR({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const tag = await getTag(decodedSlug);
  
  if (!tag) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">
            أفضل {tag.name}
          </h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            مجموعة من أجدد القفشات والمواقف الخاصة بـ "{tag.name}". تقدر تتصفح وتشارك أقوى الردود!
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tag.setups && tag.setups.length > 0 ? (
            tag.setups.map((setup: any) => {
              const topPunchline = setup.punchlines?.[0]; // already sorted in backend

              return (
                <Link key={setup.id} href={`/p/${setup.slug}`} className="block">
                  <article className="bg-black/30 hover:bg-black/40 transition-colors rounded-2xl p-6 h-full flex flex-col border border-white/10">
                    <div className="text-sm opacity-70 mb-2">
                       {setup.user?.name ?? "مستخدم"}
                    </div>
                    <blockquote className="text-xl font-bold mb-4 flex-grow">
                      "{setup.text}"
                    </blockquote>
                    
                    {topPunchline && (
                      <div className="bg-white/10 rounded-xl p-4 mt-auto border-t-2 border-yellow-400">
                        <span className="text-xs text-yellow-400 font-bold mb-1 block">أقوى رد:</span>
                        <q className="block text-lg font-bold">{topPunchline.text}</q>
                        <div className="text-xs opacity-70 mt-2 flex gap-3">
                          <span>😂 {topPunchline.laughs} ضحكة</span>
                        </div>
                      </div>
                    )}
                  </article>
                </Link>
              );
            })
          ) : (
            <div className="col-span-1 md:col-span-2 text-center p-10 bg-black/20 rounded-2xl">
              <p className="text-2xl font-bold opacity-80">لسه مفيش مواقف في القسم ده!</p>
            </div>
          )}
        </div>
        
        <div className="mt-10 text-center">
            <Link href="/" className="inline-block px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold transition-colors border border-white/20">
                استكشف كل الأقسام
            </Link>
        </div>
      </div>
    </div>
  );
}
