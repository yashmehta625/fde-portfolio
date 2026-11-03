"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/DemoShell";
import { resolveEntities } from "@/lib/entityResolution";

const SAMPLE = `Acme Corp.
ACME Corporation
Acme Co
Acme Industries
Globex Inc
Globex Incorporated
Globex LLC
Initech
Initec
Umbrella Corporation
Umbrella Corp
Soylent Co.
Soylent Industries
Stark Industries
Wayne Enterprises`;

export function EntityResolutionDemo() {
  const [input, setInput] = useState(SAMPLE);
  const [threshold, setThreshold] = useState(0.6);

  const names = useMemo(
    () => input.split("\n").map((l) => l.trim()).filter(Boolean),
    [input]
  );

  const clusters = useMemo(() => resolveEntities(names, threshold), [names, threshold]);

  const multiMemberClusters = clusters.filter((c) => c.members.length > 1).length;
  const singletons = clusters.filter((c) => c.members.length === 1).length;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Input: one name per line">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          className="w-full h-72 font-mono text-xs bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-neutral-200 focus:outline-none focus:border-neutral-500"
        />
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span>Similarity threshold</span>
            <span className="font-mono">{threshold.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-neutral-600 mt-2">
            Lower threshold → more aggressive merging (higher recall, risk of
            false matches). Higher threshold → stricter merging (higher
            precision, risk of missed duplicates). Try 0.3 and 0.9 to feel
            the difference.
          </p>
        </div>
      </Panel>

      <Panel
        title={`${multiMemberClusters} duplicate cluster(s) found, ${singletons} unique`}
      >
        <div className="flex flex-col gap-3 max-h-[26rem] overflow-auto pr-1">
          {clusters
            .filter((c) => c.members.length > 1)
            .map((cluster) => (
              <div
                key={cluster.id}
                className="rounded-lg border border-emerald-900/50 bg-emerald-950/20 p-3"
              >
                <div className="text-sm font-medium text-emerald-300 mb-1">
                  → {cluster.representative}
                </div>
                <div className="flex flex-col gap-1">
                  {cluster.members.map((m) => (
                    <span key={m} className="text-xs font-mono text-neutral-400">
                      {m}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-neutral-600 mt-1">
                  min pairwise similarity:{" "}
                  {Math.min(...cluster.edges.map((e) => e.similarity)).toFixed(2)}
                </div>
              </div>
            ))}
          {clusters.filter((c) => c.members.length === 1).length > 0 && (
            <details className="text-xs text-neutral-500">
              <summary className="cursor-pointer">
                {singletons} name(s) with no match
              </summary>
              <div className="mt-2 flex flex-col gap-1">
                {clusters
                  .filter((c) => c.members.length === 1)
                  .map((c) => (
                    <span key={c.id} className="font-mono">
                      {c.members[0]}
                    </span>
                  ))}
              </div>
            </details>
          )}
        </div>
      </Panel>
    </div>
  );
}
