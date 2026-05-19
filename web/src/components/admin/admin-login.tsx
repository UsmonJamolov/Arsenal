"use client";

import { Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminRequest } from "@/lib/admin-api";
import { saveAdminSession, type AdminSession } from "@/lib/admin-auth";

export function AdminLogin() {
  const router = useRouter();
  const [phone, setPhone] = useState("+998901111111");
  const [password, setPassword] = useState("admin1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await adminRequest<{ admin: AdminSession }>("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ phone, password }),
      });

      saveAdminSession(data.admin);
      router.replace("/admin");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#1a1630] px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-5 rounded-3xl border border-amber-500/30 bg-black/40 p-8 backdrop-blur-xl"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300">
            <Shield className="size-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-amber-300/80">Arsenal Union</p>
            <h1 className="text-2xl font-black text-white">Admin Panel</h1>
          </div>
        </div>

        <label className="block space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-violet-200/70">Telefon</span>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>

        <label className="block space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-violet-200/70">Parol</span>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>

        {error ? <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Kirish..." : "Admin panelga kirish"}
        </Button>

        <p className="text-center text-xs text-violet-300/50">Default: +998901111111 / admin1234</p>
      </form>
    </main>
  );
}
