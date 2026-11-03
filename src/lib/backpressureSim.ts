export interface SimParams {
  arrivalRatePerSec: number;
  serviceRatePerSec: number;
  queueCapacity: number;
  failureProbability: number; // 0..1
  maxRetries: number;
  baseBackoffMs: number;
  durationSec: number;
  seed: number;
}

export interface TickMetrics {
  tSec: number;
  queueDepth: number;
  processedThisTick: number;
  droppedThisTick: number; // queue overflow
  failedThisTick: number; // exhausted retries
  retryingCount: number;
  avgLatencyMs: number; // of items completed this tick
}

interface QueueItem {
  arrivalTick: number;
  retryCount: number;
  nextEligibleTick: number;
}

/** Deterministic PRNG (mulberry32) so a given seed always reproduces the same run. */
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TICK_MS = 100;

/**
 * Discrete-tick simulation of a bounded queue fed at `arrivalRatePerSec`,
 * drained by a consumer capped at `serviceRatePerSec`, with per-item
 * failure probability and exponential-backoff-with-jitter retry.
 * Returns a full time series for charting/animation.
 */
export function runSimulation(params: SimParams): TickMetrics[] {
  const rand = mulberry32(params.seed);
  const ticksTotal = Math.round((params.durationSec * 1000) / TICK_MS);
  const arrivalPerTick = (params.arrivalRatePerSec * TICK_MS) / 1000;
  const servicePerTick = (params.serviceRatePerSec * TICK_MS) / 1000;

  let queue: QueueItem[] = [];
  let arrivalCarry = 0;
  let serviceCarry = 0;
  const metrics: TickMetrics[] = [];

  for (let tick = 0; tick < ticksTotal; tick++) {
    // 1. Arrivals (fractional rates accumulate via carry so e.g. 2.5/tick averages correctly)
    arrivalCarry += arrivalPerTick;
    let newArrivals = Math.floor(arrivalCarry);
    arrivalCarry -= newArrivals;

    let droppedThisTick = 0;
    while (newArrivals-- > 0) {
      if (queue.length < params.queueCapacity) {
        queue.push({ arrivalTick: tick, retryCount: 0, nextEligibleTick: tick });
      } else {
        droppedThisTick++;
      }
    }

    // 2. Service (process from front of queue, skipping items still in backoff)
    serviceCarry += servicePerTick;
    let capacity = Math.floor(serviceCarry);
    let processedThisTick = 0;
    let failedThisTick = 0;
    const latencies: number[] = [];
    const nextQueue: QueueItem[] = [];
    let retryingCount = 0;

    for (const item of queue) {
      if (capacity > 0 && item.nextEligibleTick <= tick) {
        capacity--;
        serviceCarry--;
        const succeeded = rand() >= params.failureProbability;
        if (succeeded) {
          processedThisTick++;
          latencies.push((tick - item.arrivalTick) * TICK_MS);
        } else if (item.retryCount >= params.maxRetries) {
          failedThisTick++;
        } else {
          const backoffMs =
            params.baseBackoffMs * Math.pow(2, item.retryCount) * (0.5 + rand());
          nextQueue.push({
            ...item,
            retryCount: item.retryCount + 1,
            nextEligibleTick: tick + Math.ceil(backoffMs / TICK_MS),
          });
          retryingCount++;
        }
      } else {
        if (item.nextEligibleTick > tick) retryingCount++;
        nextQueue.push(item);
      }
    }
    queue = nextQueue;

    const avgLatencyMs =
      latencies.length > 0
        ? latencies.reduce((a, b) => a + b, 0) / latencies.length
        : 0;

    metrics.push({
      tSec: ((tick + 1) * TICK_MS) / 1000,
      queueDepth: queue.length,
      processedThisTick,
      droppedThisTick,
      failedThisTick,
      retryingCount,
      avgLatencyMs,
    });
  }

  return metrics;
}
