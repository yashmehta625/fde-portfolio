const CORPORATE_SUFFIXES = [
  "incorporated",
  "corporation",
  "corp",
  "company",
  "co",
  "limited",
  "ltd",
  "llc",
  "llp",
  "inc",
  "plc",
  "group",
  "holdings",
];

export function normalizeName(raw: string): string {
  let s = raw.toLowerCase().trim();
  s = s.replace(/[.,'"&]/g, " ");
  s = s.replace(/[^a-z0-9\s]/g, " ");
  s = s.replace(/\s+/g, " ").trim();

  const tokens = s.split(" ").filter((t) => !CORPORATE_SUFFIXES.includes(t));
  return tokens.join(" ").trim();
}

/** Classic Levenshtein edit distance. */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const prev = new Array(n + 1);
  const curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1, // deletion
        curr[j - 1] + 1, // insertion
        prev[j - 1] + cost // substitution
      );
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

/** Similarity in [0, 1], combining normalized edit distance with token overlap (Jaccard). */
export function nameSimilarity(a: string, b: string): number {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na === nb) return 1;
  if (na.length === 0 || nb.length === 0) return 0;

  const maxLen = Math.max(na.length, nb.length);
  const editSim = 1 - levenshtein(na, nb) / maxLen;

  const tokensA = new Set(na.split(" "));
  const tokensB = new Set(nb.split(" "));
  const intersection = [...tokensA].filter((t) => tokensB.has(t)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  const jaccard = union === 0 ? 0 : intersection / union;

  return editSim * 0.6 + jaccard * 0.4;
}

export interface MatchEdge {
  a: string;
  b: string;
  similarity: number;
}

export interface EntityCluster {
  id: number;
  members: string[];
  representative: string;
  edges: MatchEdge[];
}

class UnionFind {
  parent: number[];
  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
  }
  find(x: number): number {
    if (this.parent[x] !== x) this.parent[x] = this.find(this.parent[x]);
    return this.parent[x];
  }
  union(x: number, y: number) {
    const rx = this.find(x);
    const ry = this.find(y);
    if (rx !== ry) this.parent[rx] = ry;
  }
}

/**
 * Clusters a list of raw names into likely-duplicate groups using
 * pairwise similarity above `threshold`. O(n^2) pairwise comparison —
 * fine for interactive demo-sized lists (hundreds of names).
 */
export function resolveEntities(names: string[], threshold: number): EntityCluster[] {
  const n = names.length;
  const uf = new UnionFind(n);
  const allEdges: MatchEdge[] = [];

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const sim = nameSimilarity(names[i], names[j]);
      if (sim >= threshold) {
        uf.union(i, j);
        allEdges.push({ a: names[i], b: names[j], similarity: sim });
      }
    }
  }

  const groups = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const root = uf.find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(i);
  }

  const clusters: EntityCluster[] = [];
  let clusterId = 0;
  for (const indices of groups.values()) {
    const members = indices.map((i) => names[i]);
    const edges = allEdges.filter(
      (e) => members.includes(e.a) && members.includes(e.b)
    );
    const representative = members.reduce((longest, m) =>
      m.length > longest.length ? m : longest
    );
    clusters.push({ id: clusterId++, members, representative, edges });
  }

  return clusters.sort((a, b) => b.members.length - a.members.length);
}
