const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  try {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        "Accept": "application/json",
        ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      let errorMessage = `Error ${res.status}: ${res.statusText}`;
      try {
        const json = JSON.parse(text);
        if (json.message) errorMessage = json.message;
        else if (json.error) errorMessage = json.error;
      } catch {
        if (text) errorMessage = text;
      }
      throw new Error(errorMessage);
    }

    if (res.status === 204) return {} as T;
    return res.json();
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      throw new Error(`تعذر الاتصال بالخادم (${BASE}). تأكد من إعدادات الـ API URL.`);
    }
    throw err;
  }
}

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
  media_file?: File | null;
  tags?: string[];
}) {
  const formData = new FormData();
  formData.append("text", payload.text);
  if (payload.media_type) formData.append("media_type", payload.media_type);
  if (payload.media_file) formData.append("media_file", payload.media_file);
  if (payload.tags && payload.tags.length > 0) {
    formData.append("tags", payload.tags.join(","));
  }

  return request<{ data: any }>(`/api/setups`, {
    method: "POST",
    body: formData,
  });
}

export function getSetupBySlug(slug: string) {
  return request<any>(`/api/setups/${encodeURIComponent(slug)}`);
}

export function addPunchline(setupId: number, payload: {
  media_type: "text" | "image" | "video";
  text?: string;
  media_file?: File | null;
}) {
  const formData = new FormData();
  formData.append("media_type", payload.media_type);
  if (payload.text) formData.append("text", payload.text);
  if (payload.media_file) formData.append("media_file", payload.media_file);

  return request<{ data: any }>(`/api/setups/${setupId}/punchlines`, {
    method: "POST",
    body: formData,
  });
}
