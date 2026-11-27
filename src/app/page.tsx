import { Suspense } from "react";
import Playground from "@/components/Playground";
export default function Page() {
  return (
    <Suspense
      fallback={<main className="loading-page">Loading gh-spotlight...</main>}
    >
      <Playground />
    </Suspense>
  );
}
