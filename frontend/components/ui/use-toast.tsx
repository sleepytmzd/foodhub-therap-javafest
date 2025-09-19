// components/ui/use-toast.tsx
"use client";
import { useCallback } from "react";
import { toast as sonnerToast } from "sonner";

type ToastPayload = { title?: string; description?: string; variant?: "default" | "destructive" | "success" | "info" };

export function useToast() {
  const toast = useCallback(({ title, description, variant }: ToastPayload) => {
    const message = title ?? description ?? "";

    // Sonner supports description as options. Map "variant" to sonner helpers:
    const opts = description ? { description } : undefined;

    if (variant === "destructive") return sonnerToast.error(message, opts);
    if (variant === "success") return sonnerToast.success(message, opts);
    if (variant === "info") return sonnerToast('Info: ' + message, opts); // example mapping
    return sonnerToast(message, opts);
  }, []);

  return { toast };
}
export default useToast;
