"use client";

import { useState } from "react";
import { login } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await login(email, password);
      setToken(res.token);
      router.push("/");
    } catch (e: any) {
      setErr(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function loginWithGoogle() {
    window.location.href = `${API}/api/auth/google/redirect`;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md bg-black/25 p-6 rounded-2xl text-white"
      >
        <h1 className="text-2xl font-extrabold mb-4">تسجيل الدخول</h1>

        {/* Google Login */}
        <button
          type="button"
          onClick={loginWithGoogle}
          className="w-full mb-4 rounded-xl bg-white text-black font-bold px-4 py-3 hover:bg-white/90"
        >
          الدخول بجوجل 🔑
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-[1px] flex-1 bg-white/20" />
          <div className="text-xs opacity-70">أو</div>
          <div className="h-[1px] flex-1 bg-white/20" />
        </div>

        <label className="block text-sm mb-1">Email</label>
        <input
          className="w-full mb-3 rounded-xl px-4 py-3 bg-white/15 border border-white/20 outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />

        <label className="block text-sm mb-1">Password</label>
        <input
          className="w-full mb-3 rounded-xl px-4 py-3 bg-white/15 border border-white/20 outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
        />

        {err && <div className="text-red-200 text-sm mb-3">{err}</div>}

        <button
          disabled={loading}
          className="w-full rounded-xl bg-yellow-400 text-black font-bold px-4 py-3 disabled:opacity-70"
        >
          {loading ? "..." : "دخول"}
        </button>

        <div className="flex items-center justify-between mt-4 text-sm opacity-90">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="underline"
          >
            رجوع للرئيسية
          </button>
        </div>
      </form>
    </div>
  );
}
