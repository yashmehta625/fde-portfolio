export type FieldType =
  | "string"
  | "integer"
  | "float"
  | "boolean"
  | "date"
  | "null"
  | "array"
  | "object";

export interface FieldSchema {
  name: string;
  types: FieldType[];
  nullable: boolean;
  optional: boolean;
  occurrences: number;
  sampleValues: unknown[];
  children?: Record<string, FieldSchema>;
  itemTypes?: FieldType[];
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/;

function detectPrimitiveType(value: unknown): FieldType {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return Number.isInteger(value) ? "integer" : "float";
  if (typeof value === "string") {
    if (ISO_DATE_RE.test(value)) return "date";
    return "string";
  }
  return "string";
}

/**
 * Infers a unified schema across a set of (possibly heterogeneous) JSON
 * records: field types observed across all records, nullability, and
 * optionality (present in some records but not others).
 */
export function inferSchema(records: unknown[]): Record<string, FieldSchema> {
  const fields: Record<string, FieldSchema> = {};
  const total = records.length;

  for (const record of records) {
    if (record === null || typeof record !== "object" || Array.isArray(record)) continue;
    const obj = record as Record<string, unknown>;

    for (const [key, value] of Object.entries(obj)) {
      if (!fields[key]) {
        fields[key] = {
          name: key,
          types: [],
          nullable: false,
          optional: false,
          occurrences: 0,
          sampleValues: [],
        };
      }
      const field = fields[key];
      field.occurrences += 1;

      const type = detectPrimitiveType(value);
      if (type === "null") {
        field.nullable = true;
      } else if (!field.types.includes(type)) {
        field.types.push(type);
      }

      if (field.sampleValues.length < 3 && value !== null && value !== undefined) {
        field.sampleValues.push(value);
      }

      if (type === "object") {
        field.children = inferSchema([value]);
        // merge across occurrences
        if (field.children) {
          const nested = inferSchema([value]);
          for (const [nk, nv] of Object.entries(nested)) {
            field.children[nk] = field.children[nk]
              ? mergeFieldSchema(field.children[nk], nv)
              : nv;
          }
        }
      } else if (type === "array") {
        const arr = value as unknown[];
        const itemTypes = new Set<FieldType>();
        for (const item of arr) itemTypes.add(detectPrimitiveType(item));
        field.itemTypes = Array.from(
          new Set([...(field.itemTypes ?? []), ...itemTypes])
        );
      }
    }
  }

  for (const field of Object.values(fields)) {
    field.optional = field.occurrences < total;
  }

  return fields;
}

function mergeFieldSchema(a: FieldSchema, b: FieldSchema): FieldSchema {
  return {
    ...a,
    types: Array.from(new Set([...a.types, ...b.types])),
    nullable: a.nullable || b.nullable,
    occurrences: a.occurrences + b.occurrences,
    sampleValues: [...a.sampleValues, ...b.sampleValues].slice(0, 3),
  };
}

const SQL_TYPE_MAP: Record<FieldType, string> = {
  string: "TEXT",
  integer: "BIGINT",
  float: "DOUBLE PRECISION",
  boolean: "BOOLEAN",
  date: "TIMESTAMP",
  null: "TEXT",
  array: "JSONB",
  object: "JSONB",
};

function sqlColumnType(field: FieldSchema): string {
  const nonNullTypes = field.types.filter((t) => t !== "null");
  if (nonNullTypes.length === 0) return "TEXT";
  if (nonNullTypes.length > 1) return "JSONB"; // mixed types -> safest widening
  return SQL_TYPE_MAP[nonNullTypes[0]];
}

export function generateCreateTable(
  tableName: string,
  schema: Record<string, FieldSchema>
): string {
  const lines = Object.values(schema).map((field) => {
    const colType = sqlColumnType(field);
    const constraint = field.nullable || field.optional ? "" : " NOT NULL";
    return `  "${field.name}" ${colType}${constraint}`;
  });
  return `CREATE TABLE "${tableName}" (\n${lines.join(",\n")}\n);`;
}
