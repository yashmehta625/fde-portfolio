import Link from "next/link";
import type { DemoMeta } from "@/lib/demos";

export function DemoShell({
  demo,
  children,
}: {
  demo: DemoMeta;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-300">
        ← All demos
      </Link>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-3 mb-2">
        {demo.title}
      </h1>
      <p className="text-neutral-400 max-w-2xl mb-8">{demo.description}</p>
      {children}
    </div>
  );
}

export function Panel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 ${className}`}
    >
      <h3 className="text-sm font-semibold text-neutral-300 mb-3">{title}</h3>
      {children}
    </div>
  );
}
