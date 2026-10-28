// Pure graph logic for the game. No React here so it can be tested in isolation.

export type NodeType = "central" | "substation" | "distribution" | "school";
export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  x: number;
  y: number;
}
export type EdgeKind = "main" | "distribution" | "service" | "alternative";
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  kind: EdgeKind;
}
export type EdgeState = "on" | "off" | "broken";
export type EdgeStates = Record<string, EdgeState>;
export type Adjacency = Map<string, string[]>;

/** Adjacency list using only active ("on") edges and skipping failed nodes. */
export function buildAdjacency(
  nodes: GraphNode[],
  edges: GraphEdge[],
  states: EdgeStates,
  failed: Set<string> = new Set(),
): Adjacency {
  const adj: Adjacency = new Map();
  for (const n of nodes) if (!failed.has(n.id)) adj.set(n.id, []);
  for (const e of edges) {
    if (states[e.id] !== "on") continue;
    if (failed.has(e.source) || failed.has(e.target)) continue;
    adj.get(e.source)?.push(e.target);
    adj.get(e.target)?.push(e.source);
  }
  return adj;
}

/** Breadth-first search from `start` over the adjacency list. */
export function bfs(start: string, adj: Adjacency): Set<string> {
  const seen = new Set<string>();
  if (!adj.has(start)) return seen;
  const queue = [start];
  seen.add(start);
  while (queue.length) {
    const cur = queue.shift()!;
    for (const nb of adj.get(cur) ?? []) {
      if (!seen.has(nb)) {
        seen.add(nb);
        queue.push(nb);
      }
    }
  }
  return seen;
}

export function countComponents(adj: Adjacency): number {
  const seen = new Set<string>();
  let count = 0;
  for (const id of adj.keys()) {
    if (seen.has(id)) continue;
    count++;
    for (const v of bfs(id, adj)) seen.add(v);
  }
  return count;
}

/** Tarjan's algorithm for articulation points (cut vertices). */
export function articulationPoints(adj: Adjacency): Set<string> {
  const disc = new Map<string, number>();
  const low = new Map<string, number>();
  const result = new Set<string>();
  let time = 0;
  const dfs = (u: string, parent: string | null) => {
    disc.set(u, time);
    low.set(u, time);
    time++;
    let children = 0;
    for (const v of adj.get(u) ?? []) {
      if (!disc.has(v)) {
        children++;
        dfs(v, u);
        low.set(u, Math.min(low.get(u)!, low.get(v)!));
        if (parent !== null && low.get(v)! >= disc.get(u)!) result.add(u);
      } else if (v !== parent) {
        low.set(u, Math.min(low.get(u)!, disc.get(v)!));
      }
    }
    if (parent === null && children > 1) result.add(u);
  };
  for (const id of adj.keys()) if (!disc.has(id)) dfs(id, null);
  return result;
}

export function poweredSchools(
  nodes: GraphNode[],
  edges: GraphEdge[],
  states: EdgeStates,
  centralId: string,
  failed: Set<string> = new Set(),
): Set<string> {
  const reach = bfs(centralId, buildAdjacency(nodes, edges, states, failed));
  return new Set(nodes.filter((n) => n.type === "school" && reach.has(n.id)).map((n) => n.id));
}

/** Structural rules of the network. Returns a list of problems (empty = valid). */
export function validateNetwork(nodes: GraphNode[], edges: GraphEdge[]): string[] {
  const errors: string[] = [];
  const byId = new Map<string, GraphNode>();
  for (const n of nodes) {
    if (byId.has(n.id)) errors.push(`Nodo duplicado: ${n.id}`);
    byId.set(n.id, n);
  }
  const edgeIds = new Set<string>();
  for (const e of edges) {
    if (edgeIds.has(e.id)) errors.push(`Arista duplicada: ${e.id}`);
    edgeIds.add(e.id);
    const a = byId.get(e.source);
    const b = byId.get(e.target);
    if (!a || !b) {
      errors.push(`Arista ${e.id} con extremo inexistente`);
      continue;
    }
    if (a.type === "school" && b.type === "school")
      errors.push(`Arista ${e.id} conecta dos escuelas`);
    if ((a.type === "school" || b.type === "school") && a.type !== "distribution" && b.type !== "distribution")
      errors.push(`La escuela de ${e.id} no se conecta a un nodo de distribución`);
  }
  return errors;
}
