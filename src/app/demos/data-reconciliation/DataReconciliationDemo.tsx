"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/DemoShell";
import { reconcile, type ReconciliationConfig } from "@/lib/dataReconciliation";

const SOURCE_A = `[
  { "crm_id": "C1", "Email": "ada@acme.com", "FullName": "Ada Lovelace", "SignupDate": "2024-01-03", "Plan": "pro" },
  { "crm_id": "C2", "Email": "ben@acme.com", "FullName": "Ben Franklin", "SignupDate": "01/15/2024", "Plan": "starter" },
  { "crm_id": "C3", "Email": "cy@acme.com", "FullName": "Cy Jones", "SignupDate": "2024-02-02", "Plan": "pro" },
  { "crm_id": "C4", "Email": "", "FullName": "No Email Guy", "SignupDate": "2024-03-01", "Plan": "pro" }
]`;

const SOURCE_B = `[
  { "billing_id": "B1", "email_address": "ADA@acme.com", "customer_name": "Ada Lovelace", "created_on": "2024-01-03", "subscription_tier": "pro" },
  { "billing_id": "B2", "email_address": "ben@acme.com", "customer_name": "Ben Franklin", "created_on": "2024-01-15", "subscription_tier": "premium" },
  { "billing_id": "B3", "email_address": "dee@acme.com", "customer_name": "Dee Who", "created_on": "2024-02-20", "subscription_tier": "starter" }
]`;

const CONFIG: ReconciliationConfig = {
  // crm_id/billing_id are kept under source-specific canonical names (not
  // both mapped to "id") — they're independent identifiers assigned by two
  // different systems, not the same fact, so they should never be diffed
  // against each other as a "conflict".
  sourceAMap: { crm_id: "crm_id", email: "Email", name: "FullName", created_at: "SignupDate", plan: "Plan" },
  sourceBMap: { billing_id: "billing_id", email: "email_address", name: "customer_name", created_at: "created_on", plan: "subscription_tier" },
  keyFields: ["email"],
  requiredFields: ["email"],
};

function parseOrEmpty(input: string): Record<string, unknown>[] {
  try {
    const parsed = JSON.parse(input);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function DataReconciliationDemo() {
  const [sourceAInput, setSourceAInput] = useState(SOURCE_A);
  const [sourceBInput, setSourceBInput] = useState(SOURCE_B);

  const sourceA = useMemo(() => parseOrEmpty(sourceAInput), [sourceAInput]);
  const sourceB = useMemo(() => parseOrEmpty(sourceBInput), [sourceBInput]);

  const result = useMemo(() => reconcile(sourceA, sourceB, CONFIG), [sourceA, sourceB]);

  const matched = result.merged.filter((m) => m.status === "matched");
  const aOnly = result.merged.filter((m) => m.status === "source_a_only");
  const bOnly = result.merged.filter((m) => m.status === "source_b_only");
  const conflictCount = matched.reduce((acc, m) => acc + m.conflicts.length, 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-3 text-xs text-neutral-500">
        Match key: <span className="font-mono text-neutral-300">email</span>{" "}
        (case/whitespace-normalized) · Required field:{" "}
        <span className="font-mono text-neutral-300">email</span> · Source A
        wins on field-level conflicts, which are still surfaced below for
        review. Edit either JSON array — e.g. change a plan value, remove a
        record, or add a new email mismatch — and the merge re-runs live.
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Source A — CRM export (crm_id, Email, FullName, SignupDate, Plan)">
          <textarea
            value={sourceAInput}
            onChange={(e) => setSourceAInput(e.target.value)}
            spellCheck={false}
            className="w-full h-56 font-mono text-xs bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-neutral-200 focus:outline-none focus:border-neutral-500"
          />
        </Panel>
        <Panel title="Source B — Billing export (billing_id, email_address, customer_name, created_on, subscription_tier)">
          <textarea
            value={sourceBInput}
            onChange={(e) => setSourceBInput(e.target.value)}
            spellCheck={false}
            className="w-full h-56 font-mono text-xs bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-neutral-200 focus:outline-none focus:border-neutral-500"
          />
        </Panel>
      </div>

      <Panel title="Reconciliation result">
        <div className="grid grid-cols-4 gap-4 text-center mb-5">
          <div>
            <div className="text-2xl font-bold text-emerald-400">{matched.length}</div>
            <div className="text-xs text-neutral-500">matched</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-400">{conflictCount}</div>
            <div className="text-xs text-neutral-500">field conflicts</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400">{aOnly.length + bOnly.length}</div>
            <div className="text-xs text-neutral-500">unmatched across sources</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-400">{result.issues.length}</div>
            <div className="text-xs text-neutral-500">unreconcilable rows</div>
          </div>
        </div>

        <div className="flex flex-col gap-2 max-h-96 overflow-auto pr-1">
          {matched.map((m) => (
            <div
              key={m.key}
              className={`rounded-lg border p-3 text-xs ${
                m.conflicts.length > 0
                  ? "border-amber-900/50 bg-amber-950/10"
                  : "border-neutral-800 bg-neutral-900/30"
              }`}
            >
              <div className="font-mono text-neutral-300">{m.key}</div>
              <pre className="mt-1 text-neutral-500 whitespace-pre-wrap">
                {JSON.stringify(m.canonical)}
              </pre>
              {m.conflicts.map((c) => (
                <div key={c.field} className="text-amber-400 mt-1">
                  conflict on <span className="font-mono">{c.field}</span>:{" "}
                  {JSON.stringify(c.aValue)} (A) vs {JSON.stringify(c.bValue)} (B)
                </div>
              ))}
            </div>
          ))}

          {[...aOnly, ...bOnly].map((m) => (
            <div key={m.key} className="rounded-lg border border-blue-900/40 bg-blue-950/10 p-3 text-xs">
              <span className="text-blue-400">
                {m.status === "source_a_only" ? "A only" : "B only"}
              </span>{" "}
              <span className="font-mono text-neutral-400">{JSON.stringify(m.canonical)}</span>
            </div>
          ))}

          {result.issues.map((issue, i) => (
            <div key={i} className="rounded-lg border border-red-900/40 bg-red-950/10 p-3 text-xs">
              <span className="text-red-400">
                [{issue.source}] {issue.reason}
              </span>{" "}
              <span className="font-mono text-neutral-500">{JSON.stringify(issue.record)}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
