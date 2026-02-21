// "use client";

// import { useEffect } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { setToken } from "@/lib/auth";

// export default function AuthCallback() {
//   const router = useRouter();
//   const params = useSearchParams();

//   useEffect(() => {
//     const token = params.get("token");
//     if (token) {
//       setToken(token);
//       router.replace("/");
//     } else {
//       router.replace("/login");
//     }
//   }, [params, router]);

//   return (
//     <div className="min-h-screen flex items-center justify-center">
//       جاري تسجيل الدخول...
//     </div>
//   );
// }

"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setToken } from "@/lib/auth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    const token = sp.get("token");
    if (token) {
      setToken(token);
      router.replace("/");
    } else {
      router.replace("/login?err=missing_token");
    }
  }, [router, sp]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white">
      <div className="bg-black/25 p-6 rounded-2xl">جارٍ تسجيل الدخول...</div>
    </div>
  );
}

