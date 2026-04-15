import { Metadata } from "next";
import { notFound } from "next/navigation";
import SetupInteractive from "@/components/SetupInteractive";

type Punchline = {
  id: number;
  setup_id: number;
  text: string;
  views: number;
  laughs: number;
  strength?: number;
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

// Assuming your backend is running on process.env.NEXT_PUBLIC_API_BASE or localhost:8000
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

async function getSetup(slug: string): Promise<Setup | null> {
  const res = await fetch(`${API_BASE}/api/setups/${encodeURIComponent(slug)}`, {
    next: { revalidate: 60 }, // Revalidate every 60 seconds
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? json;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const setup = await getSetup(slug);
  if (!setup) return { title: "الموقف غير موجود | أفشات" };

  const topPunchline = setup.punchlines?.sort((a, b) => b.laughs - a.laughs)[0];
  const description = topPunchline ? topPunchline.text : "أفضل قفشات ومواقف أفشات";
  const title = `${setup.text} | أفشات`;
  
  // v=3.0 to force Twitter to re-crawl after the design fix
  const ogImageUrl = `https://afchat.fun/og?id=${setup.id}&v=3.0&t=${Date.now()}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://afchat.fun/p/${setup.slug}`,
      siteName: "أفشات",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
    alternates: {
      canonical: `https://afchat.fun/p/${setup.slug}`,
    },
  };
}

export default async function SetupPageSSR({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const setup = await getSetup(slug);
  
  if (!setup) {
    notFound();
  }

  // Find top punchline for Schema
  const topPunchline = setup.punchlines?.sort((a, b) => b.laughs - a.laughs)[0];

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    "mainEntity": {
      "@type": "Question",
      "name": setup.text,
      "text": setup.text,
      "answerCount": setup.punchlines?.length || 0,
      "author": {
        "@type": "Person",
        "name": setup.user?.name || setup.user?.email || "User"
      },
      "acceptedAnswer": topPunchline ? {
        "@type": "Answer",
        "text": topPunchline.text,
        "upvoteCount": topPunchline.laughs,
        "url": `${process.env.NEXT_PUBLIC_APP_URL || "https://afchat.fun"}/p/${setup.slug}#answer-${topPunchline.id}`
      } : undefined,
      "suggestedAnswer": setup.punchlines?.filter(p => p.id !== topPunchline?.id).map(p => ({
        "@type": "Answer",
        "text": p.text,
        "upvoteCount": p.laughs,
        "url": `${process.env.NEXT_PUBLIC_APP_URL || "https://afchat.fun"}/p/${setup.slug}#answer-${p.id}`
      }))
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <SetupInteractive setup={setup} />
    </>
  );
}
