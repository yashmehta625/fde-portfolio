export interface DemoMeta {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  skillTags: string[];
}

export const demos: DemoMeta[] = [
  {
    slug: "schema-inference",
    title: "Schema Inference Playground",
    tagline: "Paste messy JSON. Get a unified schema and a SQL table.",
    description:
      "Every new customer hands you data with an unknown or inconsistent shape. This infers field types, nullability, and optionality across a batch of heterogeneous JSON records, then generates a CREATE TABLE statement.",
    skillTags: ["data integration", "schema design"],
  },
  {
    slug: "entity-resolution",
    title: "Fuzzy Entity Resolution",
    tagline: "Cluster near-duplicate names with a tunable similarity threshold.",
    description:
      "Customer CRM exports are full of 'Acme Corp.' vs 'ACME Corporation' vs 'Acme Co'. This clusters likely duplicates using edit distance + token overlap, and lets you feel the precision/recall tradeoff live.",
    skillTags: ["data quality", "fuzzy matching"],
  },
  {
    slug: "backpressure-simulator",
    title: "Backpressure & Rate-Limit Simulator",
    tagline: "Tune arrival rate, consumer throughput, and failure rate. Watch the queue.",
    description:
      "A discrete-tick simulation of a bounded queue fed faster than it can drain, a rate-limited consumer, and exponential backoff with jitter on failure. The exact tradeoffs you reason about when a customer's ingestion pipeline falls behind.",
    skillTags: ["resilience", "systems design"],
  },
  {
    slug: "data-reconciliation",
    title: "Heterogeneous Data Reconciliation",
    tagline: "Merge two source systems with different schemas into one canonical table.",
    description:
      "Two systems, two schemas, inconsistent casing and date formats. This matches records by a configurable key, merges fields, and flags conflicts and unreconcilable rows instead of silently guessing.",
    skillTags: ["ETL", "data integration"],
  },
];

export function getDemo(slug: string): DemoMeta | undefined {
  return demos.find((d) => d.slug === slug);
}
