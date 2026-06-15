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
      router.replace("/");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="arena-bg flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-5 rounded-2xl border border-brand-gold/25 bg-arena-raised/90 p-8 backdrop-blur-xl"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl border border-brand-gold/30 bg-brand-gold-dim text-brand-gold">
            <Shield className="size-6" />
          </div>
          <div>
            <p className="label-caps text-brand-gold">Arsenal Union</p>
            <h1 className="text-2xl font-bold text-text-primary">Admin Panel</h1>
          </div>
        </div>

        <label className="block space-y-2">
          <span className="label-caps">Telefon</span>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>

        <label className="block space-y-2">
          <span className="label-caps">Parol</span>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>

        {error ? (
          <p className="rounded-xl border border-status-busy/40 bg-status-busy/10 px-3 py-2 text-sm text-status-busy">
            {error}
          </p>
        ) : null}

        <Button type="submit" variant="gold" className="w-full" disabled={loading}>
          {loading ? "Kirish..." : "Admin panelga kirish"}
        </Button>

        <p className="text-center text-xs text-text-faint">Default: +998901111111 / admin1234</p>
      </form>
    </main>
  );
}
