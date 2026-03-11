"use client";

import { useState } from "react";
import { login } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

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
      setErr(e?.message || "فشل تسجيل الدخول. تأكد من صحة البيانات.");
    } finally {
      setLoading(false);
    }
  }

  function loginWithGoogle() {
    window.location.href = `${API}/api/auth/google/redirect`;
  }

  return (
    <div className="min-h-screen bg-[#0D0F14] text-white flex items-center justify-center p-6 font-[family-name:var(--font-almarai)] relative overflow-hidden">
      {/* Background Gradients */}
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 blur-[120px] rounded-full" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-pink-600/20 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black italic tracking-tighter mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">أفشات</h1>
          <p className="text-white/50 font-bold uppercase tracking-widest text-sm">أهلاً بك مجدداً في عالم الضحك</p>
        </div>

        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 shadow-2xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full" />
          
          <form onSubmit={onSubmit} className="relative z-10 space-y-6">
            <h2 className="text-2xl font-black mb-8 text-center">تسجيل الدخول</h2>

            {/* Google Login */}
            <button
              type="button"
              onClick={loginWithGoogle}
              className="w-full h-14 rounded-2xl bg-white text-black font-black flex items-center justify-center gap-3 hover:scale-[1.02] transition shadow-xl active:scale-[0.98]"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="google" />
              <span>الدخول بـ Google</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 py-2">
              <div className="h-[1px] flex-1 bg-white/10" />
              <span className="text-xs font-bold text-white/30 uppercase tracking-widest">أو</span>
              <div className="h-[1px] flex-1 bg-white/10" />
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 ml-2">الإيميل</label>
                <input
                  type="email"
                  className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-6 outline-none focus:border-purple-500/50 focus:bg-white/10 transition"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 ml-2">الباسورد</label>
                <input
                  type="password"
                  className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-6 outline-none focus:border-purple-500/50 focus:bg-white/10 transition"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {err && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium text-center"
              >
                ⚠️ {err}
              </motion.div>
            )}

            <button
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 font-black shadow-2xl shadow-purple-600/20 hover:scale-[1.02] transition active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "جاري الدخول..." : "دخول 🚀"}
            </button>
          </form>
        </div>

        <div className="mt-8 flex items-center justify-center gap-8 text-xs font-bold uppercase tracking-widest">
           <button onClick={() => router.push("/register")} className="text-white/40 hover:text-white transition underline underline-offset-8">حساب جديد</button>
           <button onClick={() => router.push("/")} className="text-white/40 hover:text-white transition">الرئيسية</button>
        </div>
      </motion.div>
    </div>
  );
}
