"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/DemoShell";
import { Slider } from "@/components/Slider";
import { LineChart } from "@/components/LineChart";
import { runSimulation, type SimParams } from "@/lib/backpressureSim";

const DEFAULT_PARAMS: SimParams = {
  arrivalRatePerSec: 12,
  serviceRatePerSec: 10,
  queueCapacity: 50,
  failureProbability: 0.1,
  maxRetries: 3,
  baseBackoffMs: 200,
  durationSec: 30,
  seed: 42,
};

export function BackpressureDemo() {
  const [params, setParams] = useState<SimParams>(DEFAULT_PARAMS);

  const metrics = useMemo(() => runSimulation(params), [params]);

  const totals = useMemo(() => {
    return metrics.reduce(
      (acc, m) => ({
        processed: acc.processed + m.processedThisTick,
        dropped: acc.dropped + m.droppedThisTick,
        failed: acc.failed + m.failedThisTick,
      }),
      { processed: 0, dropped: 0, failed: 0 }
    );
  }, [metrics]);

  const peakQueueDepth = Math.max(...metrics.map((m) => m.queueDepth), 0);
  const isOverloaded = params.arrivalRatePerSec > params.serviceRatePerSec;

  function update(patch: Partial<SimParams>) {
    setParams((p) => ({ ...p, ...patch }));
  }

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Panel title="Parameters" className="lg:col-span-1 flex flex-col gap-4">
        <Slider
          label="Arrival rate (req/sec)"
          value={params.arrivalRatePerSec}
          min={1}
          max={50}
          step={1}
          onChange={(v) => update({ arrivalRatePerSec: v })}
        />
        <Slider
          label="Consumer throughput (req/sec)"
          value={params.serviceRatePerSec}
          min={1}
          max={50}
          step={1}
          onChange={(v) => update({ serviceRatePerSec: v })}
        />
        <Slider
          label="Queue capacity"
          value={params.queueCapacity}
          min={5}
          max={200}
          step={5}
          onChange={(v) => update({ queueCapacity: v })}
        />
        <Slider
          label="Per-request failure probability"
          value={params.failureProbability}
          min={0}
          max={0.8}
          step={0.01}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => update({ failureProbability: v })}
        />
        <Slider
          label="Max retries"
          value={params.maxRetries}
          min={0}
          max={8}
          step={1}
          onChange={(v) => update({ maxRetries: v })}
        />
        <Slider
          label="Base backoff (ms)"
          value={params.baseBackoffMs}
          min={50}
          max={2000}
          step={50}
          onChange={(v) => update({ baseBackoffMs: v })}
        />
        <Slider
          label="Duration (sec)"
          value={params.durationSec}
          min={5}
          max={120}
          step={5}
          onChange={(v) => update({ durationSec: v })}
        />
        <button
          onClick={() => update({ seed: Math.floor(Math.random() * 1_000_000) })}
          className="text-xs rounded-lg border border-neutral-700 px-3 py-1.5 hover:bg-neutral-800 transition-colors"
        >
          Reroll randomness (seed: {params.seed})
        </button>

        {isOverloaded && (
          <p className="text-xs text-amber-400 border border-amber-900/50 bg-amber-950/20 rounded-lg p-2">
            Arrival rate exceeds consumer throughput — the queue will grow
            unbounded until it hits capacity, then starts dropping requests.
            This is the exact signal that should page an on-call engineer.
          </p>
        )}
      </Panel>

      <div className="lg:col-span-2 flex flex-col gap-5">
        <Panel title="Queue depth over time">
          <LineChart
            series={[
              { label: "queue depth", color: "#60a5fa", values: metrics.map((m) => m.queueDepth) },
            ]}
            yLabel={`peak depth: ${peakQueueDepth} / capacity ${params.queueCapacity}`}
          />
        </Panel>

        <Panel title="Items in flight: retrying vs steady">
          <LineChart
            series={[
              { label: "retrying (in backoff)", color: "#f59e0b", values: metrics.map((m) => m.retryingCount) },
              { label: "avg latency (ms)", color: "#a78bfa", values: metrics.map((m) => m.avgLatencyMs) },
            ]}
          />
        </Panel>

        <Panel title="Outcome totals over full run">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-emerald-400">{totals.processed}</div>
              <div className="text-xs text-neutral-500">processed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">{totals.dropped}</div>
              <div className="text-xs text-neutral-500">dropped (queue full)</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-400">{totals.failed}</div>
              <div className="text-xs text-neutral-500">failed (retries exhausted)</div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
