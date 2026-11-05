import { Suspense } from "react";
import { ProviderDetail } from "./ProviderDetail";

export default function ProviderPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted">Loading…</div>}>
      <ProviderDetail />
    </Suspense>
  );
}
