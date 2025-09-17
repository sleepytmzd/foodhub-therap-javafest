import { Suspense } from "react";
import ExploreClient from "./ExplorePage";

export default function ExplorePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ExploreClient />
    </Suspense>
  );
}
