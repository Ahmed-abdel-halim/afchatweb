"use client";

import { useState } from "react";
import { register } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [name, setName] = useState("");
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
      const res = await register(name, email, password);
      if (res.token) {
        setToken(res.token);
        router.push("/");
      }
    } catch (e: any) {
      setErr(e?.message || "فشل التسجيل");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md bg-black/25 p-8 rounded-2xl text-white backdrop-blur-xl border border-white/10"
      >
        <h1 className="text-3xl font-extrabold mb-6 text-center">إنشاء حساب جديد</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1 opacity-80">الاسم</label>
            <input
              className="w-full rounded-xl px-4 py-3 bg-white/15 border border-white/20 outline-none focus:bg-white/20 transition"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اسمه إيه؟"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1 opacity-80">البريد الإلكتروني</label>
            <input
              className="w-full rounded-xl px-4 py-3 bg-white/15 border border-white/20 outline-none focus:bg-white/20 transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="example@mail.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1 opacity-80">كلمة السر</label>
            <input
              className="w-full rounded-xl px-4 py-3 bg-white/15 border border-white/20 outline-none focus:bg-white/20 transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="كلمة سر قوية"
              required
            />
          </div>
        </div>

        {err && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
            {err}
          </div>
        )}

        <button
          disabled={loading}
          className="w-full mt-8 rounded-xl bg-yellow-400 text-black font-bold px-4 py-3 hover:bg-yellow-500 transition disabled:opacity-70 shadow-lg"
        >
          {loading ? "جاري التحميل..." : "إنشاء حساب"}
        </button>

        <div className="flex items-center justify-center mt-6 text-sm">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="text-white/70 hover:text-white transition"
          >
            عندك حساب أصلاً؟ <span className="font-bold underline">سجل دخول</span>
          </button>
        </div>
      </form>
    </div>
  );
}
