import { Suspense } from "react";

import { AdminApp } from "@/components/admin/admin-app";

export default function AdminPage() {
  return (
    <Suspense fallback={null}>
      <AdminApp />
    </Suspense>
  );
}
