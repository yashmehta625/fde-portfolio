# FDE Portfolio

Interactive demos of the problems a Forward Deployed Engineer actually
solves in the field — not slides, working code you can poke at. Every demo
runs a real algorithm client-side, in your browser, against whatever input
you give it.

**Live site:** _(add your deployed URL here)_

## Demos

| Demo | Problem it solves | Core logic |
| --- | --- | --- |
| [Schema Inference Playground](src/app/demos/schema-inference) | A new customer hands you data with an unknown/inconsistent shape. Infer a unified schema (types, nullability, optionality) across heterogeneous JSON records and generate a `CREATE TABLE`. | [`src/lib/schemaInference.ts`](src/lib/schemaInference.ts) |
| [Fuzzy Entity Resolution](src/app/demos/entity-resolution) | CRM exports are full of near-duplicate names ("Acme Corp." vs "ACME Corporation"). Cluster likely duplicates with a tunable similarity threshold (edit distance + token overlap). | [`src/lib/entityResolution.ts`](src/lib/entityResolution.ts) |
| [Backpressure & Rate-Limit Simulator](src/app/demos/backpressure-simulator) | A customer's ingestion pipeline is fed faster than it can drain. Discrete-tick simulation of a bounded queue, a rate-limited consumer, and exponential backoff with jitter on failure. | [`src/lib/backpressureSim.ts`](src/lib/backpressureSim.ts) |
| [Heterogeneous Data Reconciliation](src/app/demos/data-reconciliation) | Two source systems, two schemas, inconsistent casing/date formats. Match records by a configurable key, merge fields, and flag conflicts and unreconcilable rows instead of silently guessing. | [`src/lib/dataReconciliation.ts`](src/lib/dataReconciliation.ts) |

Each `src/lib/*.ts` file is pure TypeScript with no framework dependency —
the algorithm is fully decoupled from the UI and readable on its own.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS v4
- No backend — every demo computes entirely client-side

## Running locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
  lib/            # pure algorithm implementations (the actual "solutions")
  components/      # shared UI (demo shell, charts, sliders)
  app/
    page.tsx        # landing page listing all demos
    demos/<slug>/    # one route + one client component per demo
```
