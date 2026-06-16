// MegaKUMUL Memory System
// Production-ready local memory vault with relevance scoring & prompt injection.
// Persistence: localStorage (works without auth). Designed to migrate to Supabase
// later without changing the public API of this module.

export type MemoryType =
  | "preference" // how user wants things done
  | "fact"       // stable fact about the user
  | "project"    // ongoing work / context
  | "goal"       // objectives
  | "context";   // misc background

export type Memory = {
  id: string;
  content: string;
  type: MemoryType;
  importance: number; // 1..5
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
  source: "auto" | "manual";
  tags?: string[];
};

const KEY = "megakumul.memory.v1";
const MAX_ENTRIES = 500;

function read(): Memory[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(mems: Memory[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(mems.slice(0, MAX_ENTRIES)));
    window.dispatchEvent(new CustomEvent("megakumul:memory-changed"));
  } catch {
    // quota or serialization issue — ignore
  }
}

export function listMemories(): Memory[] {
  return read().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (a.importance !== b.importance) return b.importance - a.importance;
    return b.updatedAt - a.updatedAt;
  });
}

export function addMemory(
  input: Omit<Memory, "id" | "createdAt" | "updatedAt"> & { id?: string }
): Memory {
  const now = Date.now();
  const mem: Memory = {
    id: input.id ?? crypto.randomUUID(),
    content: input.content.trim(),
    type: input.type,
    importance: clamp(input.importance ?? 3, 1, 5),
    pinned: !!input.pinned,
    createdAt: now,
    updatedAt: now,
    source: input.source ?? "manual",
    tags: input.tags,
  };
  if (!mem.content) return mem;
  const all = read();
  // dedupe by normalized content
  const norm = mem.content.toLowerCase().replace(/\s+/g, " ").trim();
  const existing = all.find(
    (m) => m.content.toLowerCase().replace(/\s+/g, " ").trim() === norm
  );
  if (existing) {
    existing.importance = Math.max(existing.importance, mem.importance);
    existing.updatedAt = now;
    if (mem.pinned) existing.pinned = true;
    write(all);
    return existing;
  }
  write([mem, ...all]);
  return mem;
}

export function updateMemory(id: string, patch: Partial<Memory>) {
  const all = read();
  const idx = all.findIndex((m) => m.id === id);
  if (idx === -1) return;
  all[idx] = { ...all[idx], ...patch, id, updatedAt: Date.now() };
  write(all);
}

export function deleteMemory(id: string) {
  write(read().filter((m) => m.id !== id));
}

export function clearAllMemories() {
  write([]);
}

export function exportMemories(): string {
  return JSON.stringify(listMemories(), null, 2);
}

export function importMemories(json: string): number {
  try {
    const arr = JSON.parse(json);
    if (!Array.isArray(arr)) return 0;
    let count = 0;
    arr.forEach((m) => {
      if (m && typeof m.content === "string" && typeof m.type === "string") {
        addMemory({
          content: m.content,
          type: m.type as MemoryType,
          importance: m.importance ?? 3,
          pinned: !!m.pinned,
          source: m.source === "auto" ? "auto" : "manual",
          tags: m.tags,
        });
        count++;
      }
    });
    return count;
  } catch {
    return 0;
  }
}

/** Score memory relevance against a query for context injection. */
function scoreFor(mem: Memory, query: string): number {
  const q = query.toLowerCase();
  const c = mem.content.toLowerCase();
  let score = 0;
  if (!q) score = 0;
  else {
    const tokens = q.split(/\W+/).filter((t) => t.length > 2);
    for (const t of tokens) if (c.includes(t)) score += 2;
  }
  score += mem.importance;
  if (mem.pinned) score += 4;
  // recency boost
  const ageDays = (Date.now() - mem.updatedAt) / 86400000;
  score += Math.max(0, 3 - ageDays / 7);
  return score;
}

/** Build a compact memory context block for system-prompt injection. */
export function buildMemoryContext(query: string, max = 12): string {
  const all = read();
  if (all.length === 0) return "";
  const scored = all
    .map((m) => ({ m, s: scoreFor(m, query) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, max)
    .map(({ m }) => m);

  const grouped: Record<MemoryType, Memory[]> = {
    preference: [],
    fact: [],
    project: [],
    goal: [],
    context: [],
  };
  scored.forEach((m) => grouped[m.type].push(m));

  const sections: string[] = [];
  const order: { key: MemoryType; label: string }[] = [
    { key: "preference", label: "User Preferences" },
    { key: "fact", label: "Facts About User" },
    { key: "goal", label: "Goals" },
    { key: "project", label: "Active Projects" },
    { key: "context", label: "Context" },
  ];
  for (const { key, label } of order) {
    if (grouped[key].length === 0) continue;
    sections.push(
      `### ${label}\n` +
        grouped[key].map((m) => `- ${m.content}`).join("\n")
    );
  }
  if (sections.length === 0) return "";
  return (
    `MEMORY VAULT (always honor these — they describe the user):\n\n` +
    sections.join("\n\n")
  );
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export function memoryCount(): number {
  return read().length;
}
