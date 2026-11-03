export type RawRecord = Record<string, unknown>;

export interface ReconciliationConfig {
  /** canonical field name -> field name as it appears in source A */
  sourceAMap: Record<string, string>;
  /** canonical field name -> field name as it appears in source B */
  sourceBMap: Record<string, string>;
  /** canonical fields used together to build the match key */
  keyFields: string[];
  /** canonical fields that must be present (non-null) for a record to be valid */
  requiredFields: string[];
}

export interface MergedRecord {
  key: string;
  status: "matched" | "source_a_only" | "source_b_only";
  canonical: RawRecord;
  conflicts: { field: string; aValue: unknown; bValue: unknown }[];
}

export interface ReconciliationIssue {
  source: "A" | "B";
  record: RawRecord;
  reason: string;
}

export interface ReconciliationResult {
  merged: MergedRecord[];
  issues: ReconciliationIssue[];
}

function normalizeValue(v: unknown): unknown {
  if (v === undefined || v === null) return null;
  if (typeof v === "string") {
    const trimmed = v.trim();
    if (trimmed === "") return null;
    // normalize common date formats (MM/DD/YYYY or DD-MM-YYYY) to ISO where unambiguous
    const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
      const [, mm, dd, yyyy] = slashMatch;
      return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    }
    return trimmed.toLowerCase();
  }
  return v;
}

function projectRecord(
  record: RawRecord,
  fieldMap: Record<string, string>
): RawRecord {
  const canonical: RawRecord = {};
  for (const [canonicalField, sourceField] of Object.entries(fieldMap)) {
    canonical[canonicalField] = record[sourceField];
  }
  return canonical;
}

function buildKey(
  canonical: RawRecord,
  keyFields: string[]
): string | null {
  const parts: string[] = [];
  for (const field of keyFields) {
    const normalized = normalizeValue(canonical[field]);
    if (normalized === null) return null;
    parts.push(String(normalized));
  }
  return parts.join("::");
}

/**
 * Reconciles two heterogeneous record sets (different field names, date
 * formats, casing) into a canonical merged set, flagging field-level
 * conflicts and rows that can't be matched or are missing required data.
 */
export function reconcile(
  sourceA: RawRecord[],
  sourceB: RawRecord[],
  config: ReconciliationConfig
): ReconciliationResult {
  const issues: ReconciliationIssue[] = [];
  const merged: MergedRecord[] = [];

  const bByKey = new Map<string, { raw: RawRecord; canonical: RawRecord }>();
  for (const raw of sourceB) {
    const canonical = projectRecord(raw, config.sourceBMap);
    const missingRequired = config.requiredFields.filter(
      (f) => normalizeValue(canonical[f]) === null
    );
    if (missingRequired.length > 0) {
      issues.push({
        source: "B",
        record: raw,
        reason: `missing required field(s): ${missingRequired.join(", ")}`,
      });
      continue;
    }
    const key = buildKey(canonical, config.keyFields);
    if (key === null) {
      issues.push({ source: "B", record: raw, reason: "could not build match key" });
      continue;
    }
    if (bByKey.has(key)) {
      issues.push({ source: "B", record: raw, reason: `duplicate key within source B: ${key}` });
      continue;
    }
    bByKey.set(key, { raw, canonical });
  }

  const matchedBKeys = new Set<string>();

  for (const raw of sourceA) {
    const canonicalA = projectRecord(raw, config.sourceAMap);
    const missingRequired = config.requiredFields.filter(
      (f) => normalizeValue(canonicalA[f]) === null
    );
    if (missingRequired.length > 0) {
      issues.push({
        source: "A",
        record: raw,
        reason: `missing required field(s): ${missingRequired.join(", ")}`,
      });
      continue;
    }
    const key = buildKey(canonicalA, config.keyFields);
    if (key === null) {
      issues.push({ source: "A", record: raw, reason: "could not build match key" });
      continue;
    }

    const bMatch = bByKey.get(key);
    if (!bMatch) {
      merged.push({ key, status: "source_a_only", canonical: canonicalA, conflicts: [] });
      continue;
    }

    matchedBKeys.add(key);
    const canonicalB = bMatch.canonical;
    const conflicts: { field: string; aValue: unknown; bValue: unknown }[] = [];
    const combined: RawRecord = { ...canonicalA };

    const allFields = new Set([...Object.keys(canonicalA), ...Object.keys(canonicalB)]);
    for (const field of allFields) {
      const aVal = normalizeValue(canonicalA[field]);
      const bVal = normalizeValue(canonicalB[field]);
      if (aVal !== null && bVal !== null && aVal !== bVal) {
        conflicts.push({ field, aValue: canonicalA[field], bValue: canonicalB[field] });
        combined[field] = canonicalA[field]; // prefer source A, surfaced as conflict for review
      } else if (aVal === null && bVal !== null) {
        combined[field] = canonicalB[field];
      }
    }

    merged.push({ key, status: "matched", canonical: combined, conflicts });
  }

  for (const [key, { canonical }] of bByKey.entries()) {
    if (!matchedBKeys.has(key)) {
      merged.push({ key, status: "source_b_only", canonical, conflicts: [] });
    }
  }

  return { merged, issues };
}
