import { MetadataRoute } from 'next'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://afchat.fun";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sitemapData = await fetch(`${API_BASE}/api/sitemap`, {
    next: { revalidate: 3600 }, 
  })
    .then((res) => (res.ok ? res.json() : { setups: [], tags: [] }))
    .catch(() => ({ setups: [], tags: [] }));

  const SetupsUrls = (sitemapData.setups || []).map((setup: any) => ({
    url: `${BASE_URL}/p/${setup.slug}`,
    lastModified: new Date(setup.updated_at || Date.now()),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const TagsUrls = (sitemapData.tags || []).map((tag: any) => ({
    url: `${BASE_URL}/t/${tag.slug}`,
    lastModified: new Date(tag.updated_at || Date.now()),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1,
    },
    ...TagsUrls,
    ...SetupsUrls,
  ];
}
