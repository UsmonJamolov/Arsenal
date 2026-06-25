"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { BrandLogo } from "@/components/brand-logo";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminRequest } from "@/lib/admin-api";
import { saveAdminSession, type AdminSession } from "@/lib/admin-auth";

export function AdminLogin() {
  const router = useRouter();
  const [phone, setPhone] = useState("+998901111111");
  const [firstName, setFirstName] = useState("Admin");
  const [lastName, setLastName] = useState("Union");
  const [password, setPassword] = useState("admin1234");
  const [secretKey, setSecretKey] = useState("arsenal-admin-secret");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await adminRequest<{ admin: AdminSession }>("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({
          phone,
          firstName,
          lastName,
          password,
          secretKey,
        }),
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
    <main className="arena-bg flex min-h-screen items-center justify-center px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-2xl border border-brand-gold/25 bg-arena-raised/90 p-8 backdrop-blur-xl"
      >
        <div className="flex items-center gap-3">
          <BrandLogo size="md" />
          <div>
            <p className="label-caps text-brand-gold">Arsenal Union</p>
            <h1 className="text-2xl font-bold text-text-primary">Admin Panel</h1>
          </div>
        </div>

        <label className="block space-y-2">
          <span className="label-caps">Telefon</span>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-2">
            <span className="label-caps">Ism</span>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" />
          </label>

          <label className="block space-y-2">
            <span className="label-caps">Familiya</span>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="label-caps">Parol</span>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>

        <label className="block space-y-2">
          <span className="label-caps">Secret key</span>
          <Input
            type="password"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            autoComplete="off"
            placeholder="Admin secret key"
          />
        </label>

        {error ? (
          <p className="rounded-xl border border-status-busy/40 bg-status-busy/10 px-3 py-2 text-sm text-status-busy">
            {error}
          </p>
        ) : null}

        <Button type="submit" variant="gold" className="w-full" disabled={loading}>
          {loading ? "Kirish..." : "Admin panelga kirish"}
        </Button>

        <p className="text-center text-xs leading-relaxed text-text-faint">
          Default: +998901111111 · Admin Union · admin1234 · arsenal-admin-secret
        </p>
      </form>
    </main>
  );
}
