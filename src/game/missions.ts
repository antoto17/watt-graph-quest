import {
  articulationPoints,
  buildAdjacency,
  poweredSchools,
  type EdgeState,
  type EdgeStates,
} from "./graph";
import { CENTRAL_ID, EDGES, NODES, NODE_BY_ID, SCHOOLS } from "./network";

export interface Mission {
  id: number;
  title: string;
  instructions: string;
  goal: string;
  kind: "power" | "critical";
  initial: EdgeStates;
  toggleable: string[];
  repairable: string[];
  repairBudget: number;
  highlightAlternatives: boolean;
  winText: string;
}

const ALT = EDGES.filter((e) => e.kind === "alternative").map((e) => e.id);

function states(overrides: Record<string, EdgeState>): EdgeStates {
  const s: EdgeStates = {};
  for (const e of EDGES) s[e.id] = e.kind === "alternative" ? "off" : "on";
  return { ...s, ...overrides };
}

const MAIN_SWITCHES = ["m1", "m2", "m3", "m4", "m5", "m6"];

export const MISSIONS: Mission[] = [
  {
    id: 1,
    title: "Primer encendido",
    instructions:
      "¡La ciudad está a oscuras! La central está preparada, pero necesitás comprobar que la energía pueda llegar a todas las escuelas. Seleccioná las conexiones disponibles y verificá que cada escuela tenga un camino hasta la central.",
    goal: "Activá los interruptores troncales (líneas punteadas) hasta que las 7 escuelas tengan un camino activo desde la central.",
    kind: "power",
    // Cross-zone links are open, so each trunk switch really matters.
    initial: states({
      ...Object.fromEntries(MAIN_SWITCHES.map((id) => [id, "off" as const])),
      c3: "off",
      c4: "off",
      e5: "off",
      o5: "off",
    }),
    toggleable: MAIN_SWITCHES,
    repairable: [],
    repairBudget: 0,
    highlightAlternatives: false,
    winText: "Las siete escuelas tienen un camino de conexiones activas hasta la central: el grafo las conecta con la fuente.",
  },
  {
    id: 2,
    title: "Una falla inesperada",
    instructions:
      "Una tormenta cortó la línea entre la Sub. Oeste y el Nodo O1. El equipo de reparación no llega hoy. Buscá una ruta alternativa (naranja) que vuelva a llevar energía.",
    goal: "Activá una ruta alternativa para que todas las escuelas recuperen un camino desde la central.",
    kind: "power",
    initial: states({ o1: "broken" }),
    toggleable: ALT,
    repairable: [],
    repairBudget: 0,
    highlightAlternatives: true,
    winText: "Gracias al ciclo que forma la ruta alternativa, la energía encontró otro camino hasta Comercial 1.",
  },
  {
    id: 3,
    title: "El nodo crítico",
    instructions:
      "Las rutas alternativas están desconectadas. Algunos vértices son tan importantes que, si fallan, parte de la red queda aislada. Seleccioná un nodo y usá «Simular falla» para ver qué pasaría.",
    goal: "Encontrá un punto de articulación (subestación o nodo) cuya falla deje escuelas sin energía.",
    kind: "critical",
    initial: states({}),
    toggleable: [],
    repairable: [],
    repairBudget: 0,
    highlightAlternatives: false,
    winText: "Encontraste un punto de articulación: al quitarlo, el grafo se divide en más componentes conexas y algunas escuelas quedan sin camino a la central.",
  },
  {
    id: 4,
    title: "Emergencia en la ciudad",
    instructions:
      "Varias líneas se cortaron al mismo tiempo. Tenés solo 2 reparaciones disponibles: usalas con cuidado y combiná rutas alternativas.",
    goal: "Reparar (máx. 2) y activar rutas alternativas hasta que las 7 escuelas vuelvan a tener energía.",
    kind: "power",
    initial: states({ m5: "broken", e2: "broken", e4: "broken", u1: "broken", u4: "broken" }),
    toggleable: ALT,
    repairable: ["m5", "e2", "e4", "u1", "u4"],
    repairBudget: 2,
    highlightAlternatives: true,
    winText: "Con reparaciones y rutas alternativas la red volvió a ser conexa para todas las escuelas.",
  },
];

export function schoolsPowered(s: EdgeStates, failed: Set<string> = new Set()) {
  return poweredSchools(NODES, EDGES, s, CENTRAL_ID, failed);
}

/** Schools that lose power if `nodeId` fails (compared to the current state). */
export function schoolsLostByFailure(s: EdgeStates, nodeId: string): string[] {
  const before = schoolsPowered(s);
  const after = schoolsPowered(s, new Set([nodeId]));
  return SCHOOLS.filter((sc) => before.has(sc.id) && !after.has(sc.id) && sc.id !== nodeId).map((sc) => sc.id);
}

/** A node counts as "the critical node" if it is a cut vertex and its failure darkens a school. */
export function isCriticalNode(s: EdgeStates, nodeId: string): boolean {
  const n = NODE_BY_ID.get(nodeId);
  if (!n || n.type === "central" || n.type === "school") return false;
  const ap = articulationPoints(buildAdjacency(NODES, EDGES, s));
  return ap.has(nodeId) && schoolsLostByFailure(s, nodeId).length > 0;
}

export function isMissionComplete(m: Mission, s: EdgeStates, criticalFound: string | null): boolean {
  if (m.kind === "critical") return criticalFound !== null && isCriticalNode(s, criticalFound);
  return schoolsPowered(s).size === SCHOOLS.length;
}
