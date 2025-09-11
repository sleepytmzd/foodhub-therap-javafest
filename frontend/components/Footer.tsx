import Link from "next/link";
import { ModeToggle } from "@/components/ModeToggle";

export function Footer() {
  return (
    <footer className="border-t bg-background py-8">
      {/* center content and add horizontal padding so footer links don't touch edges */}
      <div className="max-w-7xl w-full mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Foodhub. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <ModeToggle />
        </div>
      </div>
    </footer>
  );
}
