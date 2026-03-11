// const BASE = process.env.NEXT_PUBLIC_API_BASE;
// export async function getFeed(cursor?: number) {
//   const url = new URL(`${BASE}/api/feed`);
//   if (cursor) url.searchParams.set("cursor", String(cursor));
//   const res = await fetch(url.toString(), { cache: "no-store" });
//   return res.json();
// }

// export async function postView(punchlineId: number) {
//   await fetch(`${BASE}/api/punchlines/${punchlineId}/view`, { method: "POST" });
// }

// export async function postLaugh(punchlineId: number) {
//   await fetch(`${BASE}/api/punchlines/${punchlineId}/laugh`, { method: "POST" });
// }

// src/lib/api.ts
// const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";




// lib/api.ts

// const BASE =
//   process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

// async function request<T>(
//   path: string,
//   options: RequestInit = {}
// ): Promise<T> {
//   const token =
//     typeof window !== "undefined"
//       ? localStorage.getItem("token")
//       : null;

//   const res = await fetch(`${BASE}${path}`, {
//     ...options,
//     headers: {
//       "Content-Type": "application/json",
//       ...(token ? { Authorization: `Bearer ${token}` } : {}),
//       ...(options.headers || {}),
//     },
//   });

//   if (!res.ok) {
//     const text = await res.text().catch(() => "");
//     throw new Error(text || `Request failed: ${res.status}`);
//   }

//   return res.json();
// }

// /* ------------------ Feed ------------------ */

// export function getFeed(cursor?: number) {
//   const qs = cursor ? `?cursor=${cursor}` : "";
//   return request<any>(`/api/feed${qs}`);
// }

// export function postView(punchlineId: number) {
//   return request<any>(`/api/punchlines/${punchlineId}/view`, {
//     method: "POST",
//   });
// }

// export function postLaugh(punchlineId: number) {
//   return request<any>(`/api/punchlines/${punchlineId}/laugh`, {
//     method: "POST",
//   });
// }

// /* ------------------ Auth ------------------ */

// export function login(email: string, password: string) {
//   return request<{ token: string; user: any }>(`/api/auth/login`, {
//     method: "POST",
//     body: JSON.stringify({ email, password }),
//   });
// }

// export function register(
//   name: string,
//   email: string,
//   password: string
// ) {
//   return request<{ token: string; user: any }>(
//     `/api/auth/register`,
//     {
//       method: "POST",
//       body: JSON.stringify({ name, email, password }),
//     }
//   );
// }

// export function getMe() {
//   return request<{ user: any }>(`/api/auth/me`);
// }

// export function logout() {
//   return request<any>(`/api/auth/logout`, {
//     method: "POST",
//   });
// }

// /* ------------------ Comments ------------------ */

// export function listComments(punchlineId: number) {
//   return request<{ data: any[] }>(
//     `/api/punchlines/${punchlineId}/comments`
//   );
// }

// export function addComment(
//   punchlineId: number,
//   body: string
// ) {
//   return request<{ data: any }>(
//     `/api/punchlines/${punchlineId}/comments`,
//     {
//       method: "POST",
//       body: JSON.stringify({ body }),
//     }
//   );
// }

// lib/api.ts
const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }

  // لو response فاضي
  if (res.status === 204) return {} as T;

  return res.json();
}

/* ------------------ Feed ------------------ */

export function getFeed(cursor?: number) {
  const qs = cursor ? `?cursor=${cursor}` : "";
  return request<any>(`/api/feed${qs}`);
}

export function postView(punchlineId: number) {
  return request<any>(`/api/punchlines/${punchlineId}/view`, {
    method: "POST",
  });
}

export function postLaugh(punchlineId: number) {
  return request<any>(`/api/punchlines/${punchlineId}/laugh`, {
    method: "POST",
  });
}

/* ------------------ Auth ------------------ */

export function login(email: string, password: string) {
  return request<{ token: string; user: any }>(`/api/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(name: string, email: string, password: string) {
  return request<{ token: string; user: any }>(`/api/auth/register`, {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function getMe() {
  return request<{ user: any }>(`/api/auth/profile`);
}

export function logout() {
  return request<any>(`/api/auth/logout`, { method: "POST" });
}

/* ------------------ Comments ------------------ */

export function listComments(punchlineId: number) {
  return request<{ data: any[] }>(`/api/punchlines/${punchlineId}/comments`);
}

export function addComment(punchlineId: number, body: string) {
  return request<{ data: any }>(`/api/punchlines/${punchlineId}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export function createSetup(payload: {
  text: string;
  media_type?: "text" | "image" | "video";
  media_url?: string | null;
  tags?: string[];
}) {
  return request<{ data: any }>(`/api/setups`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getSetupBySlug(slug: string) {
  // نفس request بتاعك + نفس /api
  return request<any>(`/api/setups/${encodeURIComponent(slug)}`);
}

export function addPunchline(setupId: number, payload: {
  media_type: "text" | "image" | "video";
  text?: string;
  media_url?: string | null;
}) {
  return request<{ data: any }>(`/api/setups/${setupId}/punchlines`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}








