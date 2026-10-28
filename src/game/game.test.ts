import { describe, expect, it } from "vitest";
import { articulationPoints, bfs, buildAdjacency, countComponents, validateNetwork, type EdgeStates } from "./graph";
import { EDGES, NODES, SCHOOLS } from "./network";
import { MISSIONS, isCriticalNode, isMissionComplete, schoolsPowered } from "./missions";

const allOn = (): EdgeStates => Object.fromEntries(EDGES.map((e) => [e.id, "on"]));

describe("network data", () => {
  it("has 1 central, 6 substations, 15-22 distribution nodes and 7 schools", () => {
    expect(NODES.filter((n) => n.type === "central")).toHaveLength(1);
    expect(NODES.filter((n) => n.type === "substation")).toHaveLength(6);
    const d = NODES.filter((n) => n.type === "distribution").length;
    expect(d).toBeGreaterThanOrEqual(15);
    expect(d).toBeLessThanOrEqual(22);
    expect(SCHOOLS).toHaveLength(7);
  });
  it("never connects a school to another school", () => {
    expect(validateNetwork(NODES, EDGES)).toEqual([]);
  });
});

describe("BFS connectivity", () => {
  it("ignores off and broken edges", () => {
    const adj = buildAdjacency(NODES, EDGES, { ...allOn(), k1: "broken", k2: "off" });
    const r = bfs("central", adj);
    expect(r.has("sc_minas")).toBe(false);
    expect(r.has("sc_pucarita")).toBe(false);
    expect(r.has("sc_huerto")).toBe(true);
  });
  it("counts components", () => {
    expect(countComponents(buildAdjacency(NODES, EDGES, allOn()))).toBe(1);
    expect(countComponents(buildAdjacency(NODES, EDGES, { ...allOn(), k1: "off" }))).toBe(2);
  });
  it("finds articulation points", () => {
    const ap = articulationPoints(buildAdjacency(NODES, EDGES, allOn()));
    expect(ap.has("d1")).toBe(true); // only path to Escuela de Minas
  });
});

describe("mission 1", () => {
  const m = MISSIONS[0]!;
  it("every school has a valid route when all available connections are active", () => {
    const s = { ...m.initial };
    for (const id of m.toggleable) s[id] = "on";
    expect(schoolsPowered(s).size).toBe(7);
  });
  it("starts dark and is not complete", () => {
    expect(schoolsPowered(m.initial).size).toBe(0);
    expect(isMissionComplete(m, m.initial, null)).toBe(false);
  });
  it("wins only with all 7 schools; losing one route revokes the win", () => {
    const s = { ...m.initial };
    for (const id of ["m1", "m2", "m3", "m4", "m5"]) s[id] = "on";
    expect(isMissionComplete(m, s, null)).toBe(true);
    s.m2 = "off";
    expect(schoolsPowered(s).has("sc_comercial1")).toBe(false);
    expect(isMissionComplete(m, s, null)).toBe(false);
  });
});

describe("mission 2", () => {
  const m = MISSIONS[1]!;
  it("the fault really cuts Comercial 1 and an alternative restores it", () => {
    expect(schoolsPowered(m.initial).has("sc_comercial1")).toBe(false);
    expect(isMissionComplete(m, { ...m.initial, a2: "on" }, null)).toBe(true);
  });
});

describe("mission 3", () => {
  const m = MISSIONS[2]!;
  it("accepts a cut vertex that darkens schools, rejects others", () => {
    expect(isCriticalNode(m.initial, "d1")).toBe(true);
    expect(isCriticalNode(m.initial, "d3")).toBe(false);
    expect(isCriticalNode(m.initial, "central")).toBe(false);
  });
});

describe("mission 4", () => {
  const m = MISSIONS[3]!;
  it("can be solved with 2 repairs plus alternatives", () => {
    expect(schoolsPowered(m.initial).size).toBeLessThan(7);
    const s = { ...m.initial, u1: "on" as const, a5: "on" as const, a2: "on" as const };
    expect(isMissionComplete(m, s, null)).toBe(true);
  });
});
