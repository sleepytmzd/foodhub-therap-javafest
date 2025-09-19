// components/ui/sonner.tsx
"use client";
import { Toaster } from "sonner";

export default function SonnerToaster() {
  // richColors gives nicer colors and works well with dark-mode
  return <Toaster position="bottom-right" richColors />;
}
