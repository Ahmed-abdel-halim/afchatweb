
// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { motion } from "framer-motion";
// import { addComment, getFeed, getMe, listComments, logout, postLaugh, postView } from "@/lib/api";
// import { clearToken, getToken } from "@/lib/auth";
// import { useRouter } from "next/navigation";
// import CreateSetupModal from "@/components/CreateSetupModal";

// type Punchline = { id: number; text: string; views: number; laughs: number; strength: number };
// type Setup = {
//   id: number;
//   text: string;
//   slug: string;
//   created_at?: string;
//   user?: { id: number; name?: string; email?: string };
//   tags?: { id: number; name: string }[];
//   media_type?: string;
//   media_url?: string;
// };

// export default function Home() {
//   const [setup, setSetup] = useState<Setup | null>(null);
//   const [punchlines, setPunchlines] = useState<Punchline[]>([]);
//   const [pIndex, setPIndex] = useState(0);
//   const [cursor, setCursor] = useState<number | null>(null);

//   const [me, setMe] = useState<any | null>(null);
//   const [openCreate, setOpenCreate] = useState(false);
//   const [history, setHistory] = useState<Array<{ setup: any; punchlines: any[]; cursor: number | null }>>([]);
//   const [loadingSetup, setLoadingSetup] = useState(false);

  

//   const [comments, setComments] = useState<any[]>([]);
//   const [commentText, setCommentText] = useState("");
//   const [commentLoading, setCommentLoading] = useState(false);
//   const [commentGateMsg, setCommentGateMsg] = useState<string>("");

//   const router = useRouter();

// const [mounted, setMounted] = useState(false);

// useEffect(() => {
//   setMounted(true);
// }, []);

// const loggedIn = mounted && !!getToken();


//   const current = useMemo(() => punchlines[pIndex] ?? null, [punchlines, pIndex]);

// async function loadNext() {
//   if (loadingSetup) return;
//   setLoadingSetup(true);

//   try {
//     // خزّني الحالي في history قبل ما تبدّلي
//     if (setup) {
//       setHistory((h) => [
//         ...h,
//         { setup, punchlines, cursor },
//       ]);
//     }

//     const json = await getFeed(cursor ?? undefined);
//     if (!json?.data) return;

//     setSetup(json.data.setup);
//     setPunchlines(json.data.punchlines ?? []);
//     setPIndex(0);
//     setCursor(json.next_cursor ?? null);
//   } finally {
//     setLoadingSetup(false);
//   }
// }

// function loadPrev() {
//   setHistory((h) => {
//     if (h.length === 0) return h;

//     const last = h[h.length - 1];
//     setSetup(last.setup);
//     setPunchlines(last.punchlines ?? []);
//     setPIndex(0);
//     setCursor(last.cursor ?? null);

//     return h.slice(0, -1);
//   });
// }


//   // أول تحميل
//   useEffect(() => {
//     loadNext();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // جلب بيانات المستخدم لو مسجل
//   useEffect(() => {
//     if (!loggedIn) {
//       setMe(null);
//       return;
//     }

//     getMe()
//       .then((r) => setMe(r.user))
//       .catch(() => setMe(null));
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [loggedIn]);

//   // سجل view لما punchline تتغير
//   useEffect(() => {
//     if (current?.id) postView(current.id);
//   }, [current?.id]);

//   // تحميل التعليقات عند تغيير punchline
//   useEffect(() => {
//     if (!current?.id) return;

//     listComments(current.id)
//       .then((r) => setComments(r.data ?? []))
//       .catch(() => setComments([]));
//   }, [current?.id]);

//   function onDragEnd(_: any, info: any) {
//     const { offset } = info;
//     const x = offset.x;
//     const y = offset.y;
//     const absX = Math.abs(x);
//     const absY = Math.abs(y);

//     // up/down => setup جديد
//     if (absY > absX && absY > 60) {
//       loadNext();
//       return;
//     }

//     // left/right => punchline داخل نفس setup
//     if (absX > absY && absX > 60) {
//       if (x < 0) setPIndex((i) => Math.min(i + 1, punchlines.length - 1));
//       else setPIndex((i) => Math.max(i - 1, 0));
//     }
//   }

//   async function laugh() {
//     if (!current) return;
//     await postLaugh(current.id);
//     setPunchlines((arr) => arr.map((p) => (p.id === current.id ? { ...p, laughs: p.laughs + 1 } : p)));
//   }

//   async function submitComment() {
//     setCommentGateMsg("");

//     if (!current?.id) return;

//     if (!loggedIn) {
//       setCommentGateMsg("لازم تسجل دخول الأول علشان تقدر تكتب تعليق.");
//       return;
//     }

//     const body = commentText.trim();
//     if (!body) return;

//     setCommentLoading(true);
//     try {
//       const res = await addComment(current.id, body);
//       setComments((arr) => [res.data, ...arr]);
//       setCommentText("");
//     } catch (e: any) {
//       setCommentGateMsg(e?.message || "حصل خطأ أثناء إضافة التعليق");
//     } finally {
//       setCommentLoading(false);
//     }
//   }

//   async function handleLogout() {
//     try {
//       await logout();
//     } catch (_) {
//       // حتى لو backend فشل، امسح توكن محليًا
//     }
//     clearToken();
//     setMe(null);
  
//     setComments([]);
//     setCommentText("");
//     setCommentGateMsg("");

//     if (current?.id) {
//     listComments(current.id)
//       .then((r) => setComments(r.data ?? []))
//       .catch(() => setComments([]));
//   }
//     // router.refresh?.();
//     // window.location.href = "/";
//   }

// return (
//   <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 text-white">
//     <header className="p-4 flex items-center justify-between">
//       {/* Left: User pill + bell */}
//       <div className="flex items-center gap-3">
//         {/* User pill */}
//         <button
//           onClick={() => {
//             if (!loggedIn) router.push("/login");
//           }}
//           className="
//             flex items-center gap-3
//             rounded-full px-3 py-2
//             bg-white/10 border border-white/15
//             backdrop-blur-xl shadow-sm
//             hover:bg-white/15 transition
//           "
//         >
//           <span className="text-white/70 text-sm">▼</span>

//           <div className="text-right leading-tight">
//             <div className="text-white font-semibold text-sm">
//               {me ? (me.name ?? me.email) : "تسجيل الدخول"}
//             </div>
//             <div className="flex items-center gap-2 text-white/70 text-xs">
//               <span className="inline-block w-3 h-3 rounded-sm bg-white/15 border border-white/15" />
//               <span>{me ? "Level 5 Joker" : "اضغط للتسجيل"}</span>
//             </div>
//           </div>

//           <div className="relative">
//             <img
//               src="https://api.dicebear.com/9.x/bottts/svg?seed=afshat"
//               alt="avatar"
//               className="w-9 h-9 rounded-full bg-white/10 border border-white/20"
//             />
//             <span
//               className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${
//                 me ? "bg-green-400" : "bg-white/30"
//               } border-2 border-black/30`}
//             />
//           </div>
//         </button>

//         {/* Login/Logout small button */}
//         {!loggedIn ? (
//           <button
//             onClick={() => router.push("/login")}
//             className="rounded-full bg-yellow-400 text-black font-bold px-4 py-2"
//           >
//             تسجيل الدخول
//           </button>
//         ) : (
//           <button
//             onClick={handleLogout}
//             className="rounded-full bg-white/15 border border-white/20 px-4 py-2 font-semibold hover:bg-white/20"
//           >
//             تسجيل الخروج
//           </button>
//         )}

//         {/* Bell */}
//         <button
//           className="
//             w-11 h-11 rounded-full
//             bg-white/10 border border-white/15
//             backdrop-blur-xl
//             flex items-center justify-center
//             hover:bg-white/15 transition
//             relative
//           "
//           aria-label="notifications"
//         >
//           <span className="text-lg">🔔</span>
//           <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-500" />
//         </button>
//       </div>

//       {/* Center: search */}
//       <input
//         className="
//           w-[50%] max-w-xl
//           rounded-full px-5 py-2.5
//           bg-white/15 border border-white/20
//           text-white placeholder:text-white/60
//           outline-none
//           focus:bg-white/20 focus:border-white/30
//           backdrop-blur-xl
//         "
//         placeholder="ابحث عن مواقف، تريندات، أو أشخاص..."
//       />

//       {/* Right: brand */}
//       <div className="font-extrabold text-2xl tracking-wide">أفشات</div>
//     </header>

//     <div className="mx-auto max-w-6xl grid grid-cols-12 gap-4 p-4">
//       {/* Left panel */}
//       <aside className="col-span-4 hidden md:block">
//         <div className="rounded-2xl bg-black/20 p-4 h-[70vh] flex flex-col justify-between">
//           <button
//             onClick={() => {
//               if (!loggedIn) {
//                 router.push("/login");
//                 return;
//               }
//               setOpenCreate(true);
//             }}
//             className="bg-pink-500 hover:bg-pink-600 rounded-xl px-4 py-3 font-bold"
//           >
//             عندك أفشة؟
//           </button>

//           <div className="mt-6">
//             <div className="text-sm opacity-80 mb-2">الموقف</div>
//             <div className="text-3xl font-extrabold leading-snug">
//               {setup?.text ?? "..."}
//             </div>
//           </div>

// <div className="flex flex-col gap-3">
//   <button
//     onClick={loadPrev}
//     disabled={history.length === 0}
//     className="w-12 h-12 rounded-full bg-white/10 border border-white/15 flex items-center justify-center disabled:opacity-40"
//     title="الأفشة السابقة"
//   >
//     ↑
//   </button>

//   <button
//     onClick={loadNext}
//     disabled={loadingSetup}
//     className="w-12 h-12 rounded-full bg-white/10 border border-white/15 flex items-center justify-center disabled:opacity-40"
//     title="الأفشة التالية"
//   >
//     ↓
//   </button>
// </div>

//         </div>
//       </aside>

//       {/* Stage + Comments */}
//       <main className="col-span-12 md:col-span-8">
//         {/* Stage */}
//         <motion.div
//           className="rounded-2xl bg-black/25 h-[70vh] relative overflow-hidden"
//           drag
//           dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
//           dragElastic={0.18}
//           onDragEnd={onDragEnd}
//         >
//           {/* Setup meta bar */}
//         <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-3">
//           <div className="flex items-center gap-2">
//             <div className="font-bold">
//               {setup?.user?.name ?? setup?.user?.email ?? "User"}
//             </div>

//             <div className="flex flex-wrap gap-1">
//               {(setup?.tags ?? []).map((t: any) => (
//                 <span
//                   key={t.id}
//                   className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/15"
//                 >
//                   #{t.name}
//                 </span>
//               ))}
//             </div>
//           </div>

//           <div className="text-xs opacity-70 whitespace-nowrap">
//             {setup?.created_at ? `🕒 ${new Date(setup.created_at).toLocaleString("ar-EG")}` : ""}
//           </div>
//         </div>
        

//           {/* Content */}
//           <div className="absolute inset-0 flex items-center justify-center p-10">
//             <div className="text-center">
//               <div className="text-xs opacity-70 mb-2">الرد</div>
//               <div className="text-4xl font-black leading-snug">
//                 {current?.text ?? "اسحب يمين/شمال عشان تشوف الردود…"}
//               </div>
//             </div>
//           </div>

//           {/* Right reactions */}
//           <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-6">
//             <div className="text-center">
//               <div className="text-3xl">😂</div>
//               <div className="text-sm">{current?.laughs ?? 0}</div>
//             </div>
//             <div className="text-center">
//               <div className="text-3xl">🔥</div>
//               <div className="text-sm">
//                 {current ? Math.round((current.strength ?? 0) * 100) : 0}%
//               </div>
//             </div>
//           </div>

//           {/* Bottom dock */}
//           <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
//             <button
//               onClick={() => setPIndex((i) => Math.max(i - 1, 0))}
//               className="rounded-full bg-white/15 px-4 py-3"
//             >
//               ←
//             </button>

//             <button
//               onClick={laugh}
//               className="rounded-full bg-yellow-400 text-black font-bold px-6 py-3"
//             >
//               😂 أضحكني
//             </button>

//             <button
//               onClick={() =>
//                 setPIndex((i) => Math.min(i + 1, punchlines.length - 1))
//               }
//               className="rounded-full bg-white/15 px-4 py-3"
//             >
//               →
//             </button>

//             <button className="rounded-full bg-white/15 px-4 py-3">🔗</button>
//           </div>
//         </motion.div>

//         <div className="mt-3 text-sm opacity-80">
//           الرد {pIndex + 1}/{Math.max(punchlines.length, 1)}
//         </div>

//         {/* Comments (برا الـ Stage) */}
//         <div className="mt-6 rounded-2xl bg-black/20 p-4">
//           <div className="flex justify-between items-center mb-3">
//             <div className="font-bold text-lg">التعليقات</div>
//             <div className="text-xs opacity-70">
//               {me ? `مسجل: ${me.name ?? me.email}` : "غير مسجل"}
//             </div>
//           </div>

//           {/* gate message */}
//           {commentGateMsg && (
//             <div className="mb-3 rounded-xl bg-white/10 border border-white/15 p-3 text-sm">
//               {commentGateMsg}{" "}
//               {!loggedIn && (
//                 <button
//                   onClick={() => router.push("/login")}
//                   className="underline font-bold"
//                 >
//                   تسجيل الدخول
//                 </button>
//               )}
//             </div>
//           )}

//           <div className="flex gap-2 mb-4">
//             <input
//               value={commentText}
//               onChange={(e) => setCommentText(e.target.value)}
//               disabled={!loggedIn}
//               placeholder={loggedIn ? "اكتب تعليق..." : "سجل دخول عشان تقدر تعلق"}
//               className="flex-1 rounded-xl px-4 py-3 bg-white/15 border border-white/20 outline-none disabled:opacity-60"
//             />

//             {loggedIn ? (
//               <button
//                 onClick={submitComment}
//                 disabled={commentLoading}
//                 className="rounded-xl bg-yellow-400 text-black font-bold px-4 py-3 disabled:opacity-70"
//               >
//                 {commentLoading ? "..." : "إرسال"}
//               </button>
//             ) : (
//               <button
//                 onClick={() => router.push("/login")}
//                 className="rounded-xl bg-yellow-400 text-black font-bold px-4 py-3"
//               >
//                 تسجيل الدخول
//               </button>
//             )}
//           </div>

//           <div className="space-y-2 max-h-64 overflow-auto">
//             {comments.length === 0 ? (
//               <div className="text-sm opacity-70">لا يوجد تعليقات بعد</div>
//             ) : (
//               comments.map((c) => (
//                 <div key={c.id} className="bg-white/10 rounded-xl p-3">
//                   <div className="text-xs opacity-70 mb-1">
//                     {c.user?.name ?? c.user?.email ?? "User"}
//                   </div>
//                   <div className="text-sm">{c.body}</div>
//                 </div>
//               ))
//             )}
//           </div>
//         </div>
//       </main>
//     </div>

//     {/* ✅ CreateSetupModal هنا (آخر الصفحة) */}
//     <CreateSetupModal
//       open={openCreate}
//       onClose={() => setOpenCreate(false)}
//       onCreated={() => {
//         setOpenCreate(false);
//         loadNext();
//       }}
//     />
//   </div>
// );

// }

// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { motion } from "framer-motion";
// import {
//   addComment,
//   getFeed,
//   getMe,
//   listComments,
//   logout,
//   postLaugh,
//   postView,
// } from "@/lib/api";
// import { clearToken, getToken } from "@/lib/auth";
// import { useRouter } from "next/navigation";
// import CreateSetupModal from "@/components/CreateSetupModal";

// type Punchline = {
//   id: number;
//   text: string;
//   views: number;
//   laughs: number;
//   strength: number;
// };

// type Setup = {
//   id: number;
//   text: string;
//   slug: string;
//   created_at?: string;
//   user?: { id: number; name?: string; email?: string };
//   tags?: { id: number; name: string }[];
//   media_type?: string;
//   media_url?: string;
// };

// export default function Home() {
//   const [setup, setSetup] = useState<Setup | null>(null);
//   const [punchlines, setPunchlines] = useState<Punchline[]>([]);
//   const [pIndex, setPIndex] = useState(0);
//   const [cursor, setCursor] = useState<number | null>(null);

//   const [me, setMe] = useState<any | null>(null);
//   const [openCreate, setOpenCreate] = useState(false);

//   const [history, setHistory] = useState<
//     Array<{ setup: Setup; punchlines: Punchline[]; cursor: number | null }>
//   >([]);
//   const [loadingSetup, setLoadingSetup] = useState(false);

//   const [comments, setComments] = useState<any[]>([]);
//   const [commentText, setCommentText] = useState("");
//   const [commentLoading, setCommentLoading] = useState(false);
//   const [commentGateMsg, setCommentGateMsg] = useState<string>("");

//   const router = useRouter();

//   const [mounted, setMounted] = useState(false);
//   useEffect(() => setMounted(true), []);
//   const loggedIn = mounted && !!getToken();

//   const current = useMemo(() => punchlines[pIndex] ?? null, [punchlines, pIndex]);

//   async function loadNext() {
//     if (loadingSetup) return;
//     setLoadingSetup(true);

//     try {
//       // خزني الحالي قبل ما تبدّلي
//       if (setup) {
//         setHistory((h) => [...h, { setup, punchlines, cursor }]);
//       }

//       const json = await getFeed(cursor ?? undefined);
//       if (!json?.data) return;

//       setSetup(json.data.setup);
//       setPunchlines(json.data.punchlines ?? []);
//       setPIndex(0);
//       setCursor(json.next_cursor ?? null);
//     } finally {
//       setLoadingSetup(false);
//     }
//   }

//   function loadPrev() {
//     setHistory((h) => {
//       if (h.length === 0) return h;
//       const last = h[h.length - 1];

//       setSetup(last.setup);
//       setPunchlines(last.punchlines ?? []);
//       setPIndex(0);
//       setCursor(last.cursor ?? null);

//       return h.slice(0, -1);
//     });
//   }

//   // أول تحميل
//   useEffect(() => {
//     loadNext();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // جلب بيانات المستخدم لو مسجل
//   useEffect(() => {
//     if (!loggedIn) {
//       setMe(null);
//       return;
//     }

//     getMe()
//       .then((r) => setMe(r.user))
//       .catch(() => setMe(null));
//   }, [loggedIn]);

//   // سجل view لما punchline تتغير
//   useEffect(() => {
//     if (current?.id) postView(current.id);
//   }, [current?.id]);

//   // تحميل التعليقات عند تغيير punchline
//   useEffect(() => {
//     if (!current?.id) return;

//     listComments(current.id)
//       .then((r) => setComments(r.data ?? []))
//       .catch(() => setComments([]));
//   }, [current?.id]);

//   function onDragEnd(_: any, info: any) {
//     const { offset } = info;
//     const x = offset.x;
//     const y = offset.y;
//     const absX = Math.abs(x);
//     const absY = Math.abs(y);

//     // up/down => setup جديد
//     if (absY > absX && absY > 60) {
//       loadNext();
//       return;
//     }

//     // left/right => punchline داخل نفس setup
//     if (absX > absY && absX > 60) {
//       if (x < 0) setPIndex((i) => Math.min(i + 1, punchlines.length - 1));
//       else setPIndex((i) => Math.max(i - 1, 0));
//     }
//   }

//   async function laugh() {
//     if (!current) return;
//     await postLaugh(current.id);
//     setPunchlines((arr) =>
//       arr.map((p) => (p.id === current.id ? { ...p, laughs: p.laughs + 1 } : p))
//     );
//   }

//   async function submitComment() {
//     setCommentGateMsg("");

//     if (!current?.id) return;

//     if (!loggedIn) {
//       setCommentGateMsg("لازم تسجل دخول الأول علشان تقدر تكتب تعليق.");
//       return;
//     }

//     const body = commentText.trim();
//     if (!body) return;

//     setCommentLoading(true);
//     try {
//       const res = await addComment(current.id, body);
//       setComments((arr) => [res.data, ...arr]);
//       setCommentText("");
//     } catch (e: any) {
//       setCommentGateMsg(e?.message || "حصل خطأ أثناء إضافة التعليق");
//     } finally {
//       setCommentLoading(false);
//     }
//   }

//   async function handleLogout() {
//     try {
//       await logout();
//     } catch (_) {
//       // حتى لو backend فشل، امسح توكن محليًا
//     }

//     clearToken();
//     setMe(null);
//     setComments([]);
//     setCommentText("");
//     setCommentGateMsg("");

//     if (current?.id) {
//       listComments(current.id)
//         .then((r) => setComments(r.data ?? []))
//         .catch(() => setComments([]));
//     }
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 text-white">
//       <header className="p-4 flex items-center justify-between">
//         {/* Left: User pill + bell */}
//         <div className="flex items-center gap-3">
//           {/* User pill */}
//           <button
//             type="button"
//             onClick={() => {
//               if (!loggedIn) router.push("/login");
//             }}
//             className="
//               flex items-center gap-3
//               rounded-full px-3 py-2
//               bg-white/10 border border-white/15
//               backdrop-blur-xl shadow-sm
//               hover:bg-white/15 transition
//             "
//           >
//             <span className="text-white/70 text-sm">▼</span>

//             <div className="text-right leading-tight">
//               <div className="text-white font-semibold text-sm">
//                 {me ? (me.name ?? me.email) : "تسجيل الدخول"}
//               </div>
//               <div className="flex items-center gap-2 text-white/70 text-xs">
//                 <span className="inline-block w-3 h-3 rounded-sm bg-white/15 border border-white/15" />
//                 <span>{me ? "Level 5 Joker" : "اضغط للتسجيل"}</span>
//               </div>
//             </div>

//             <div className="relative">
//               <img
//                 src="https://api.dicebear.com/9.x/bottts/svg?seed=afshat"
//                 alt="avatar"
//                 className="w-9 h-9 rounded-full bg-white/10 border border-white/20"
//               />
//               <span
//                 className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${
//                   me ? "bg-green-400" : "bg-white/30"
//                 } border-2 border-black/30`}
//               />
//             </div>
//           </button>

//           {/* Login/Logout */}
//           {!loggedIn ? (
//             <button
//               type="button"
//               onClick={() => router.push("/login")}
//               className="rounded-full bg-yellow-400 text-black font-bold px-4 py-2"
//             >
//               تسجيل الدخول
//             </button>
//           ) : (
//             <button
//               type="button"
//               onClick={handleLogout}
//               className="rounded-full bg-white/15 border border-white/20 px-4 py-2 font-semibold hover:bg-white/20"
//             >
//               تسجيل الخروج
//             </button>
//           )}

//           {/* Bell */}
//           <button
//             type="button"
//             className="
//               w-11 h-11 rounded-full
//               bg-white/10 border border-white/15
//               backdrop-blur-xl
//               flex items-center justify-center
//               hover:bg-white/15 transition
//               relative
//             "
//             aria-label="notifications"
//           >
//             <span className="text-lg">🔔</span>
//             <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-500" />
//           </button>
//         </div>

//         {/* Center: search */}
//         <input
//           className="
//             w-[50%] max-w-xl
//             rounded-full px-5 py-2.5
//             bg-white/15 border border-white/20
//             text-white placeholder:text-white/60
//             outline-none
//             focus:bg-white/20 focus:border-white/30
//             backdrop-blur-xl
//           "
//           placeholder="ابحث عن مواقف، تريندات، أو أشخاص..."
//         />

//         {/* Right: brand */}
//         <div className="font-extrabold text-2xl tracking-wide">أفشات</div>
//       </header>

//       <div className="mx-auto max-w-6xl grid grid-cols-12 gap-4 p-4">
//         {/* Left panel */}
//         <aside className="col-span-4 hidden md:block">
//           <div className="rounded-2xl bg-black/20 p-4 h-[70vh] flex flex-col justify-between relative">
//             <button
//               type="button"
//               onClick={() => {
//                 if (!loggedIn) {
//                   router.push("/login");
//                   return;
//                 }
//                 setOpenCreate(true);
//               }}
//               className="bg-pink-500 hover:bg-pink-600 rounded-xl px-4 py-3 font-bold"
//             >
//               عندك أفشة؟
//             </button>

//             <div className="mt-6">
//               <div className="text-sm opacity-80 mb-2">الموقف</div>
//               <div className="text-3xl font-extrabold leading-snug">
//                 {setup?.text ?? "..."}
//               </div>
//             </div>

//             {/* ✅ Navigation arrows (fixed) */}
//             <div className="flex flex-col gap-3 relative z-50">
//               <button
//                 type="button"
//                 onClick={(e) => {
//                   e.preventDefault();
//                   e.stopPropagation();
//                   loadPrev();
//                 }}
//                 disabled={history.length === 0}
//                 className="w-12 h-12 rounded-full bg-white/10 border border-white/15 flex items-center justify-center disabled:opacity-40"
//                 title="الأفشة السابقة"
//               >
//                 ↑
//               </button>

//               <button
//                 type="button"
//                 onClick={(e) => {
//                   e.preventDefault();
//                   e.stopPropagation();
//                   loadNext();
//                 }}
//                 disabled={loadingSetup}
//                 className="w-12 h-12 rounded-full bg-white/10 border border-white/15 flex items-center justify-center disabled:opacity-40"
//                 title="الأفشة التالية"
//               >
//                 ↓
//               </button>
//             </div>
//           </div>
//         </aside>

//         {/* Stage + Comments */}
//         <main className="col-span-12 md:col-span-8">
//           <motion.div
//             className="rounded-2xl bg-black/25 h-[70vh] relative overflow-hidden"
//             drag
//             dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
//             dragElastic={0.18}
//             onDragEnd={onDragEnd}
//             // ✅ prevent drag from capturing clicks on buttons/inputs
//             // onPointerDownCapture={(e) => {
//             //   const el = e.target as HTMLElement;
//             //   if (el.closest("button") || el.closest("input") || el.closest("a")) {
//             //     e.stopPropagation();
//             //   }
//             // }}
//           >
//             {/* Setup meta bar */}
//             <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-3">
//               <div className="flex items-center gap-2">
//                 <div className="font-bold">
//                   {setup?.user?.name ?? setup?.user?.email ?? "User"}
//                 </div>

//                 <div className="flex flex-wrap gap-1">
//                   {(setup?.tags ?? []).map((t) => (
//                     <span
//                       key={t.id}
//                       className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/15"
//                     >
//                       #{t.name}
//                     </span>
//                   ))}
//                 </div>
//               </div>

//               <div className="text-xs opacity-70 whitespace-nowrap">
//                 {setup?.created_at
//                   ? `🕒 ${new Date(setup.created_at).toLocaleString("ar-EG")}`
//                   : ""}
//               </div>
//             </div>

//             {/* Content */}
//             <div className="absolute inset-0 flex items-center justify-center p-10">
//               <div className="text-center">
//                 <div className="text-xs opacity-70 mb-2">الرد</div>
//                 <div className="text-4xl font-black leading-snug">
//                   {current?.text ?? "اسحب يمين/شمال عشان تشوف الردود…"}
//                 </div>
//               </div>
//             </div>

//             {/* Right reactions */}
//             <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-6">
//               <div className="text-center">
//                 <div className="text-3xl">😂</div>
//                 <div className="text-sm">{current?.laughs ?? 0}</div>
//               </div>
//               <div className="text-center">
//                 <div className="text-3xl">🔥</div>
//                 <div className="text-sm">
//                   {current ? Math.round((current.strength ?? 0) * 100) : 0}%
//                 </div>
//               </div>
//             </div>

//             {/* Bottom dock */}
//             <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
//               <button
//                 type="button"
//                 onClick={() => setPIndex((i) => Math.max(i - 1, 0))}
//                 className="rounded-full bg-white/15 px-4 py-3"
//               >
//                 ←
//               </button>

//               <button
//                 type="button"
//                 onClick={laugh}
//                 className="rounded-full bg-yellow-400 text-black font-bold px-6 py-3"
//               >
//                 😂 أضحكني
//               </button>

//               <button
//                 type="button"
//                 onClick={() =>
//                   setPIndex((i) => Math.min(i + 1, punchlines.length - 1))
//                 }
//                 className="rounded-full bg-white/15 px-4 py-3"
//               >
//                 →
//               </button>

//               <button type="button" className="rounded-full bg-white/15 px-4 py-3">
//                 🔗
//               </button>
//             </div>
//           </motion.div>

//           <div className="mt-3 text-sm opacity-80">
//             الرد {pIndex + 1}/{Math.max(punchlines.length, 1)}
//           </div>

//           {/* Comments */}
//           <div className="mt-6 rounded-2xl bg-black/20 p-4">
//             <div className="flex justify-between items-center mb-3">
//               <div className="font-bold text-lg">التعليقات</div>
//               <div className="text-xs opacity-70">
//                 {me ? `مسجل: ${me.name ?? me.email}` : "غير مسجل"}
//               </div>
//             </div>

//             {commentGateMsg && (
//               <div className="mb-3 rounded-xl bg-white/10 border border-white/15 p-3 text-sm">
//                 {commentGateMsg}{" "}
//                 {!loggedIn && (
//                   <button
//                     type="button"
//                     onClick={() => router.push("/login")}
//                     className="underline font-bold"
//                   >
//                     تسجيل الدخول
//                   </button>
//                 )}
//               </div>
//             )}

//             <div className="flex gap-2 mb-4">
//               <input
//                 value={commentText}
//                 onChange={(e) => setCommentText(e.target.value)}
//                 disabled={!loggedIn}
//                 placeholder={loggedIn ? "اكتب تعليق..." : "سجل دخول عشان تقدر تعلق"}
//                 className="flex-1 rounded-xl px-4 py-3 bg-white/15 border border-white/20 outline-none disabled:opacity-60"
//               />

//               {loggedIn ? (
//                 <button
//                   type="button"
//                   onClick={submitComment}
//                   disabled={commentLoading}
//                   className="rounded-xl bg-yellow-400 text-black font-bold px-4 py-3 disabled:opacity-70"
//                 >
//                   {commentLoading ? "..." : "إرسال"}
//                 </button>
//               ) : (
//                 <button
//                   type="button"
//                   onClick={() => router.push("/login")}
//                   className="rounded-xl bg-yellow-400 text-black font-bold px-4 py-3"
//                 >
//                   تسجيل الدخول
//                 </button>
//               )}
//             </div>

//             <div className="space-y-2 max-h-64 overflow-auto">
//               {comments.length === 0 ? (
//                 <div className="text-sm opacity-70">لا يوجد تعليقات بعد</div>
//               ) : (
//                 comments.map((c) => (
//                   <div key={c.id} className="bg-white/10 rounded-xl p-3">
//                     <div className="text-xs opacity-70 mb-1">
//                       {c.user?.name ?? c.user?.email ?? "User"}
//                     </div>
//                     <div className="text-sm">{c.body}</div>
//                   </div>
//                 ))
//               )}
//             </div>
//           </div>
//         </main>
//       </div>

//       {/* Create Setup Modal */}
//       <CreateSetupModal
//         open={openCreate}
//         onClose={() => setOpenCreate(false)}
//         onCreated={() => {
//           setOpenCreate(false);
//           // بعد الإضافة نبدأ من feed جديد (اختياري)
//           setHistory([]);
//           setCursor(null);
//           loadNext();
//         }}
//       />
//     </div>
//   );
// }

  "use client";

  import { useEffect, useMemo, useState } from "react";
  import { motion } from "framer-motion";
  import {
    addComment,
    getFeed,
    getMe,
    listComments,
    logout,
    postLaugh,
    postView,
  } from "@/lib/api";
  import { clearToken, getToken } from "@/lib/auth";
  import { useRouter } from "next/navigation";
  import CreateSetupModal from "@/components/CreateSetupModal";

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
    media_type?: string;
    media_url?: string;
  };

  export default function Home() {
    const [setup, setSetup] = useState<Setup | null>(null);
    const [punchlines, setPunchlines] = useState<Punchline[]>([]);
    const [pIndex, setPIndex] = useState(0);
    const [cursor, setCursor] = useState<number | null>(null);
    const [me, setMe] = useState<any | null>(null);
    const [openCreate, setOpenCreate] = useState(false);

    const [history, setHistory] = useState<
      Array<{ setup: Setup; punchlines: Punchline[]; cursor: number | null }>
    >([]);

    const [loadingSetup, setLoadingSetup] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [shareMsg, setShareMsg] = useState("");
    const [shareUrl, setShareUrl] = useState<string>("");
    const [shareOpen, setShareOpen] = useState(false);
    const [copied, setCopied] = useState(false);



    const [comments, setComments] = useState<any[]>([]);
    const [commentText, setCommentText] = useState("");
    const [commentLoading, setCommentLoading] = useState(false);
    const [commentGateMsg, setCommentGateMsg] = useState<string>("");

    const router = useRouter();

    // avoid hydration mismatch when reading token from localStorage
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
      setMounted(true);
    }, []);

    const loggedIn = mounted && !!getToken();

    const current = useMemo(
      () => punchlines[pIndex] ?? null,
      [punchlines, pIndex]
    );

    async function loadNext() {
      if (loadingSetup) return;
      setLoadingSetup(true);

      try {
        // خزّني الحالي في history قبل ما تبدّلي
        if (setup) {
          setHistory((h) => [...h, { setup, punchlines, cursor }]);
        }

        const json = await getFeed(cursor ?? undefined);
        if (!json?.data) return;

        setSetup(json.data.setup);
        setPunchlines(json.data.punchlines ?? []);
        setPIndex(0);
        setCursor(json.next_cursor ?? null);
      } finally {
        setLoadingSetup(false);
      }
    }

async function handleShare() {
  if (!setup?.slug) return;

  // 👇 ده اللينك الجديد بدون كلمة setup
  const url = `${window.location.origin}/${setup.slug}`;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
    } else {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }

    setShareMsg("✅ تم نسخ الرابط بنجاح");
    setTimeout(() => setShareMsg(""), 2000);
  } catch (e) {
    console.error(e);
    setShareMsg("❌ حصل خطأ أثناء النسخ");
    setTimeout(() => setShareMsg(""), 2000);
  }
}



    async function copyShareUrl() {
      if (!shareUrl) return;
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        setShareMsg("مش قادر أنسخ تلقائيًا—انسخي يدويًا 🙃");
        setTimeout(() => setShareMsg(""), 1500);
      }
          }

    function openShareUrl() {
        if (!shareUrl) return;
        window.open(shareUrl, "_blank", "noopener,noreferrer");
      }





    function loadPrev() {
      setHistory((h) => {
        if (h.length === 0) return h;

        const last = h[h.length - 1];
        setSetup(last.setup);
        setPunchlines(last.punchlines ?? []);
        setPIndex(0);
        setCursor(last.cursor ?? null);

        return h.slice(0, -1);
      });
    }

    // أول تحميل
    useEffect(() => {
      loadNext();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // جلب بيانات المستخدم لو مسجل
    useEffect(() => {
      if (!loggedIn) {
        setMe(null);
        return;
      }

      getMe()
        .then((r) => setMe(r.user))
        .catch(() => setMe(null));

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loggedIn]);

    // سجل view لما punchline تتغير
    useEffect(() => {
      if (current?.id) postView(current.id);
    }, [current?.id]);

    // تحميل التعليقات عند تغيير punchline
    useEffect(() => {
      if (!current?.id) return;

      listComments(current.id)
        .then((r) => setComments(r.data ?? []))
        .catch(() => setComments([]));
    }, [current?.id]);

    function onDragEnd(_: any, info: any) {
      const { offset } = info;
      const x = offset.x;
      const y = offset.y;
      const absX = Math.abs(x);
      const absY = Math.abs(y);

      // up/down => setup جديد
      if (absY > absX && absY > 60) {
        loadNext();
        return;
      }

      // left/right => punchline داخل نفس setup
      if (absX > absY && absX > 60) {
        if (x < 0) setPIndex((i) => Math.min(i + 1, punchlines.length - 1));
        else setPIndex((i) => Math.max(i - 1, 0));
      }
    }

    async function laugh() {
      if (!current) return;

      await postLaugh(current.id);
      setPunchlines((arr) =>
        arr.map((p) => (p.id === current.id ? { ...p, laughs: p.laughs + 1 } : p))
      );
    }

    async function submitComment() {
      setCommentGateMsg("");

      if (!current?.id) return;

      if (!loggedIn) {
        setCommentGateMsg("لازم تسجل دخول الأول علشان تقدر تكتب تعليق.");
        return;
      }

      const body = commentText.trim();
      if (!body) return;

      setCommentLoading(true);
      try {
        const res = await addComment(current.id, body);
        setComments((arr) => [res.data, ...arr]);
        setCommentText("");
      } catch (e: any) {
        setCommentGateMsg(e?.message || "حصل خطأ أثناء إضافة التعليق");
      } finally {
        setCommentLoading(false);
      }
    }

    async function handleLogout() {
      try {
        await logout();
      } catch (_) {
        // حتى لو backend فشل، امسح توكن محليًا
      }

      clearToken();
      setMe(null);
      setComments([]);
      setCommentText("");
      setCommentGateMsg("");

      if (current?.id) {
        listComments(current.id)
          .then((r) => setComments(r.data ?? []))
          .catch(() => setComments([]));
      }
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 text-white">
        <header className="p-4 flex items-center justify-between">
          {/* Left: User pill + bell */}
          <div className="flex items-center gap-3">
            {/* User pill */}
            <button
              onClick={() => {
                if (!loggedIn) router.push("/login");
              }}
              className="flex items-center gap-3 rounded-full px-3 py-2 bg-white/10 border border-white/15 backdrop-blur-xl shadow-sm hover:bg-white/15 transition"
            >
              <span className="text-white/70 text-sm">▼</span>

              <div className="text-right leading-tight">
                <div className="text-white font-semibold text-sm">
                  {me ? me.name ?? me.email : "تسجيل الدخول"}
                </div>

                <div className="flex items-center gap-2 text-white/70 text-xs">
                  <span className="inline-block w-3 h-3 rounded-sm bg-white/15 border border-white/15" />
                  <span>{me ? "Level 5 Joker" : "اضغط للتسجيل"}</span>
                </div>
              </div>

              <div className="relative">
                <img
                  src="https://api.dicebear.com/9.x/bottts/svg?seed=afshat"
                  alt="avatar"
                  className="w-9 h-9 rounded-full bg-white/10 border border-white/20"
                />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${
                    me ? "bg-green-400" : "bg-white/30"
                  } border-2 border-black/30`}
                />
              </div>
            </button>

            {/* Login/Logout small button */}
            {!loggedIn ? (
              <button
                onClick={() => router.push("/login")}
                className="rounded-full bg-yellow-400 text-black font-bold px-4 py-2"
              >
                تسجيل الدخول
              </button>
            ) : (
              <button
                onClick={handleLogout}
                className="rounded-full bg-white/15 border border-white/20 px-4 py-2 font-semibold hover:bg-white/20"
              >
                تسجيل الخروج
              </button>
            )}

            {/* Bell */}
            <button
              className="w-11 h-11 rounded-full bg-white/10 border border-white/15 backdrop-blur-xl flex items-center justify-center hover:bg-white/15 transition relative"
              aria-label="notifications"
            >
              <span className="text-lg">🔔</span>
              <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-500" />
            </button>
          </div>

          {/* Center: search */}
          <input
            className="w-[50%] max-w-xl rounded-full px-5 py-2.5 bg-white/15 border border-white/20 text-white placeholder:text-white/60 outline-none focus:bg-white/20 focus:border-white/30 backdrop-blur-xl"
            placeholder="ابحث عن مواقف، تريندات، أو أشخاص..."
          />

          {/* Right: brand */}
          <div className="font-extrabold text-2xl tracking-wide">أفشات</div>
        </header>

        <div className="mx-auto max-w-6xl grid grid-cols-12 gap-4 p-4">
          {/* Left panel */}
          <aside className="col-span-4 hidden md:block">
            <div className="rounded-2xl bg-black/20 p-4 h-[70vh] flex flex-col justify-between">
              <button
                onClick={() => {
                  if (!loggedIn) {
                    router.push("/login");
                    return;
                  }
                  setOpenCreate(true);
                }}
                className="bg-pink-500 hover:bg-pink-600 rounded-xl px-4 py-3 font-bold"
              >
                عندك أفشة؟
              </button>
                                <div className="flex flex-wrap gap-1">
                    {(setup?.tags ?? []).map((t: any) => (
                      <span
                        key={t.id}
                        className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/15"
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>

              <div className="mt-6">
                <div className="text-sm opacity-80 mb-2">{setup?.user?.name ?? setup?.user?.email ?? "User"}</div>
                <div className="text-3xl font-extrabold leading-snug">
                  {setup?.text ?? "..."}
                </div>
              </div>

                <div className="text-xs opacity-70 whitespace-nowrap">
                  {setup?.created_at
                    ? ` ${new Date(setup.created_at).toLocaleString("en")}`
                    : ""}
                </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={loadPrev}
                  disabled={history.length === 0}
                  className="w-12 h-12 rounded-full bg-white/10 border border-white/15 flex items-center justify-center disabled:opacity-40"
                  title="الأفشة السابقة"
                >
                  ↑
                </button>
                <button
                  onClick={loadNext}
                  disabled={loadingSetup}
                  className="w-12 h-12 rounded-full bg-white/10 border border-white/15 flex items-center justify-center disabled:opacity-40"
                  title="الأفشة التالية"
                >
                  ↓
                </button>
              </div>
            </div>
          </aside>

          {/* Stage + Comments */}
          <main className="col-span-12 md:col-span-8">
            {/* Stage */}
            <motion.div
              className="rounded-2xl bg-black/25 h-[70vh] relative overflow-hidden"
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.18}
              onDragEnd={onDragEnd}
            >
            {shareMsg && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-2 rounded-xl text-sm">
                {shareMsg}
              </div>
            )}
            {shareOpen && shareUrl && (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[92%] max-w-xl bg-black/70 border border-white/15 backdrop-blur-xl rounded-2xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-sm">🔗 رابط المشاركة</div>
                    <button
                      onClick={() => setShareOpen(false)}
                      className="text-white/80 hover:text-white text-sm"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input
                      value={shareUrl}
                      readOnly
                      className="flex-1 rounded-xl px-3 py-2 bg-white/10 border border-white/15 outline-none text-sm"
                      onFocus={(e) => e.currentTarget.select()}
                    />

                    <button
                      onClick={copyShareUrl}
                      className="rounded-xl bg-yellow-400 text-black font-bold px-4 py-2 text-sm"
                    >
                      {copied ? "✅ تم" : "Copy"}
                    </button>

                    <button
                      onClick={openShareUrl}
                      className="rounded-xl bg-white/15 border border-white/20 px-4 py-2 font-semibold text-sm hover:bg-white/20"
                    >
                      Open
                    </button>
                  </div>

                  <div className="mt-2 text-xs text-white/70">
                    {current?.text ? `الرد الحالي: ${current.text.slice(0, 70)}${current.text.length > 70 ? "..." : ""}` : ""}
                  </div>
                </div>
              )}


              {/* Setup meta bar */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {/* <div className="font-bold">
                    {setup?.user?.name ?? setup?.user?.email ?? "User"}
                  </div> */}

                  {/* <div className="flex flex-wrap gap-1">
                    {(setup?.tags ?? []).map((t: any) => (
                      <span
                        key={t.id}
                        className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/15"
                      >
                        #{t.name}
                      </span>
                    ))}
                  </div> */}
                </div>

                {/* <div className="text-xs opacity-70 whitespace-nowrap">
                  {setup?.created_at
                    ? `🕒 ${new Date(setup.created_at).toLocaleString("ar-EG")}`
                    : ""}
                </div> */}
              </div>

              {/* Content */}
              <div className="absolute inset-0 flex items-center justify-center p-10">
                <div className="text-center">
                  <div className="text-xs opacity-70 mb-2">الرد</div>
                  <div className="text-4xl font-black leading-snug">
                    {current?.text ??
                      "اسحب يمين/شمال عشان تشوف الردود…"}
                  </div>
                </div>
              </div>

              {/* Right reactions */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-6">
                <div className="text-center">
                  <div className="text-3xl">😂</div>
                  <div className="text-sm">{current?.laughs ?? 0}</div>
                </div>

                <div className="text-center">
                  <div className="text-3xl">🔥</div>
                  <div className="text-sm">
                    {current ? Math.round((current.strength ?? 0) * 100) : 0}%
                  </div>
                </div>
              </div>

              {/* Bottom dock */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <button
                  onClick={() => setPIndex((i) => Math.max(i - 1, 0))}
                  className="rounded-full bg-white/15 px-4 py-3"
                >
                  ←
                </button>

                <button
                  onClick={laugh}
                  className="rounded-full bg-yellow-400 text-black font-bold px-6 py-3"
                >
                  😂 أضحكني
                </button>

                <button
                  onClick={() =>
                    setPIndex((i) => Math.min(i + 1, punchlines.length - 1))
                  }
                  className="rounded-full bg-white/15 px-4 py-3"
                >
                  →
                </button>

                <button
                  onClick={handleShare}
                  disabled={sharing}
                  className="rounded-full bg-white/15 px-4 py-3 hover:bg-white/25 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sharing ? "..." : "🔗 مشاركة"}
                </button>


              </div>
            </motion.div>

            <div className="mt-3 text-sm opacity-80">
              الرد {pIndex + 1}/{Math.max(punchlines.length, 1)}
            </div>

            {/* Comments (برا الـ Stage) */}
            {/* <div className="mt-6 rounded-2xl bg-black/20 p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="font-bold text-lg">التعليقات</div>
                <div className="text-xs opacity-70">
                  {me ? `مسجل: ${me.name ?? me.email}` : "غير مسجل"}
                </div>
              </div>

              {commentGateMsg && (
                <div className="mb-3 rounded-xl bg-white/10 border border-white/15 p-3 text-sm">
                  {commentGateMsg}{" "}
                  {!loggedIn && (
                    <button
                      onClick={() => router.push("/login")}
                      className="underline font-bold"
                    >
                      تسجيل الدخول
                    </button>
                  )}
                </div>
              )}

              <div className="flex gap-2 mb-4">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={!loggedIn}
                  placeholder={loggedIn ? "اكتب تعليق..." : "سجل دخول عشان تقدر تعلق"}
                  className="flex-1 rounded-xl px-4 py-3 bg-white/15 border border-white/20 outline-none disabled:opacity-60"
                />

                {loggedIn ? (
                  <button
                    onClick={submitComment}
                    disabled={commentLoading}
                    className="rounded-xl bg-yellow-400 text-black font-bold px-4 py-3 disabled:opacity-70"
                  >
                    {commentLoading ? "..." : "إرسال"}
                  </button>
                ) : (
                  <button
                    onClick={() => router.push("/login")}
                    className="rounded-xl bg-yellow-400 text-black font-bold px-4 py-3"
                  >
                    تسجيل الدخول
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-64 overflow-auto">
                {comments.length === 0 ? (
                  <div className="text-sm opacity-70">لا يوجد تعليقات بعد</div>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="bg-white/10 rounded-xl p-3">
                      <div className="text-xs opacity-70 mb-1">
                        {c.user?.name ?? c.user?.email ?? "User"}
                      </div>
                      <div className="text-sm">{c.body}</div>
                    </div>
                  ))
                )}
              </div>
            </div> */}
          </main>
        </div>

        {/* ✅ CreateSetupModal هنا (آخر الصفحة) */}
        <CreateSetupModal
          open={openCreate}
          onClose={() => setOpenCreate(false)}
          onCreated={() => {
            setOpenCreate(false);
            loadNext();
          }}
        />
      </div>
    );
  }




