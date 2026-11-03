"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/DemoShell";
import {
  inferSchema,
  generateCreateTable,
  type FieldSchema,
} from "@/lib/schemaInference";

const SAMPLE = `[
  { "id": 1, "email": "a@acme.com", "name": "Ada", "signup_at": "2024-01-03T10:00:00Z", "plan": "pro", "mrr": 49.0 },
  { "id": 2, "email": "b@acme.com", "name": "Ben", "signup_at": "2024-02-11", "plan": null, "mrr": 0 },
  { "id": "3", "email": "c@acme.com", "name": "Cy", "signup_at": "2024-03-20T08:30:00Z", "mrr": 19.5, "referrer": "google" },
  { "id": 4, "email": "d@acme.com", "name": "Dee", "signup_at": "2024-04-01T00:00:00Z", "plan": "enterprise", "mrr": 999, "seats": 12, "tags": ["beta", "vip"] }
]`;

function TypeBadge({ type }: { type: string }) {
  return (
    <span className="text-xs rounded-full bg-neutral-800 border border-neutral-700 px-2 py-0.5 text-neutral-300">
      {type}
    </span>
  );
}

function FieldRow({ field, depth = 0 }: { field: FieldSchema; depth?: number }) {
  return (
    <div>
      <div
        className="flex items-center gap-2 py-1.5 border-b border-neutral-800/60"
        style={{ paddingLeft: depth * 16 }}
      >
        <span className="font-mono text-sm text-neutral-200">{field.name}</span>
        <div className="flex gap-1">
          {field.types.map((t) => (
            <TypeBadge key={t} type={t} />
          ))}
          {field.itemTypes && field.itemTypes.length > 0 && (
            <TypeBadge type={`item: ${field.itemTypes.join("|")}`} />
          )}
        </div>
        {field.nullable && <TypeBadge type="nullable" />}
        {field.optional && <TypeBadge type="optional" />}
        <span className="text-xs text-neutral-600 ml-auto">
          {field.occurrences} occurrence{field.occurrences === 1 ? "" : "s"}
        </span>
      </div>
      {field.children &&
        Object.values(field.children).map((child) => (
          <FieldRow key={child.name} field={child} depth={depth + 1} />
        ))}
    </div>
  );
}

export function SchemaInferenceDemo() {
  const [input, setInput] = useState(SAMPLE);
  const [tableName, setTableName] = useState("customers");

  const { records, error } = useMemo(() => {
    try {
      const parsed = JSON.parse(input);
      if (!Array.isArray(parsed)) {
        return { records: [] as unknown[], error: "Input must be a JSON array of objects." };
      }
      return { records: parsed as unknown[], error: null as string | null };
    } catch (e) {
      return { records: [] as unknown[], error: (e as Error).message };
    }
  }, [input]);

  const schema = useMemo(() => inferSchema(records), [records]);
  const sql = useMemo(
    () => (records.length > 0 ? generateCreateTable(tableName || "table", schema) : ""),
    [schema, records, tableName]
  );

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Input: array of JSON records">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          className="w-full h-72 font-mono text-xs bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-neutral-200 focus:outline-none focus:border-neutral-500"
        />
        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        <p className="text-xs text-neutral-600 mt-2">
          Try adding/removing fields across records, mixing types for the same
          field, or nesting objects/arrays — the schema below updates live.
        </p>
      </Panel>

      <div className="flex flex-col gap-5">
        <Panel title={`Inferred schema (${records.length} records)`}>
          {Object.values(schema).length === 0 ? (
            <p className="text-sm text-neutral-600">No valid records to infer from.</p>
          ) : (
            Object.values(schema).map((field) => (
              <FieldRow key={field.name} field={field} />
            ))
          )}
        </Panel>

        <Panel title="Generated SQL">
          <div className="flex items-center gap-2 mb-2">
            <label className="text-xs text-neutral-500">table name:</label>
            <input
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              className="font-mono text-xs bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-neutral-200 focus:outline-none focus:border-neutral-500"
            />
          </div>
          <pre className="font-mono text-xs bg-neutral-950 border border-neutral-800 rounded-lg p-3 overflow-auto whitespace-pre-wrap text-emerald-300">
            {sql || "// add records to generate SQL"}
          </pre>
        </Panel>
      </div>
    </div>
  );
}
