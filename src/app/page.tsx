import Link from "next/link";
import { demos } from "@/lib/demos";

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <section className="mb-16">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Forward Deployed Engineering, made interactive
        </h1>
        <p className="text-neutral-400 max-w-2xl leading-relaxed">
          A Forward Deployed Engineer&apos;s job isn&apos;t abstract —
          it&apos;s parsing a customer&apos;s messy export, integrating a
          flaky third-party API, and keeping a pipeline alive when traffic
          spikes. Below are four of those problems, solved with real
          algorithms running entirely in your browser. Change the input,
          move the sliders, and see the actual behavior — not a mockup.
        </p>
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        {demos.map((demo) => (
          <Link
            key={demo.slug}
            href={`/demos/${demo.slug}`}
            className="group rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 hover:border-neutral-600 hover:bg-neutral-900 transition-colors"
          >
            <h2 className="text-lg font-semibold mb-1 group-hover:text-white">
              {demo.title}
            </h2>
            <p className="text-sm text-neutral-400 mb-4">{demo.tagline}</p>
            <div className="flex gap-2 flex-wrap">
              {demo.skillTags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs rounded-full border border-neutral-700 px-2 py-0.5 text-neutral-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </section>

      <section className="mt-16 text-sm text-neutral-500">
        <p>
          Full source for every demo, including the algorithms themselves, is
          public on{" "}
          <a
            href="https://github.com/yashmehta625/fde-portfolio"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-neutral-300"
          >
            GitHub
          </a>
          .
        </p>
      </section>
    </div>
  );
}
