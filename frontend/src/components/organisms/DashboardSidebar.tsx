"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bot, LayoutGrid } from "lucide-react";

import { cn } from "@/lib/utils";

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col gap-6 rounded-2xl surface-panel p-5">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-quiet">
          Navigation
        </p>
        <nav className="space-y-2 text-sm">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 font-semibold text-muted transition hover:border-[color:var(--border)] hover:bg-[color:var(--surface-muted)]",
              pathname === "/dashboard" &&
                "border-[color:var(--accent-soft)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]"
            )}
          >
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/boards"
            className={cn(
              "flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 font-semibold text-muted transition hover:border-[color:var(--border)] hover:bg-[color:var(--surface-muted)]",
              pathname.startsWith("/boards") &&
                "border-[color:var(--accent-soft)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
            Boards
          </Link>
          <Link
            href="/agents"
            className={cn(
              "flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 font-semibold text-muted transition hover:border-[color:var(--border)] hover:bg-[color:var(--surface-muted)]",
              pathname.startsWith("/agents") &&
                "border-[color:var(--accent-soft)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]"
            )}
          >
            <Bot className="h-4 w-4" />
            Agents
          </Link>
        </nav>
      </div>
      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-xs text-quiet">
        <p className="font-semibold uppercase tracking-[0.2em] text-strong">
          Ops health
        </p>
        <p className="mt-2">
          Live boards and agents appear here once data streams in.
        </p>
      </div>
    </aside>
  );
}
