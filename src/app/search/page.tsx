import { Suspense } from "react";
import { SearchView } from "./SearchView";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted">Loading…</div>}>
      <SearchView />
    </Suspense>
  );
}
