import type { Idea } from "@/types";
export function sources(n: Idea): string[] {
  return [
    ...new Set([
      ...(n.parent_id ? [n.parent_id] : []),
      ...(Array.isArray(n.metadata.sources)
        ? n.metadata.sources.filter((s): s is string => typeof s === "string")
        : []),
    ]),
  ];
}
export function lineage(
  nodes: Idea[],
  id: string,
  direction: "ancestors" | "descendants",
) {
  const seen = new Set<string>([id]);
  const queue = [id];
  while (queue.length) {
    const next = queue.shift()!;
    const adjacent =
      direction === "ancestors"
        ? sources(
            nodes.find((n) => n.id === next) ||
              ({ parent_id: null, metadata: {} } as Idea),
          )
        : nodes.filter((n) => sources(n).includes(next)).map((n) => n.id);
    for (const v of adjacent)
      if (!seen.has(v)) {
        seen.add(v);
        queue.push(v);
      }
  }
  return seen;
}
export function compareText(before: string, after: string) {
  const a = before.split(/\s+/),
    b = after.split(/\s+/);
  // Bound the comparison to keep long contributions responsive.
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let end = 0;
  while (
    end < a.length - start &&
    end < b.length - start &&
    a[a.length - 1 - end] === b[b.length - 1 - end]
  )
    end++;
  return {
    unchanged: a.slice(0, start).join(" "),
    removed: a.slice(start, a.length - end).join(" "),
    added: b.slice(start, b.length - end).join(" "),
    suffix: end ? a.slice(-end).join(" ") : "",
  };
}
