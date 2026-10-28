import type { GraphEdge, GraphNode } from "./graph";

// Fictional educational network. Coordinates are in a 1600 x 1040 map space.
export const CENTRAL_ID = "central";

export const NODES: GraphNode[] = [
  { id: "central", label: "Central de Energía", type: "central", x: 800, y: 540 },
  { id: "s_centro", label: "Sub. Centro", type: "substation", x: 800, y: 370 },
  { id: "s_norte", label: "Sub. Norte", type: "substation", x: 800, y: 150 },
  { id: "s_sur", label: "Sub. Sur", type: "substation", x: 800, y: 820 },
  { id: "s_este", label: "Sub. Este", type: "substation", x: 1180, y: 520 },
  { id: "s_oeste", label: "Sub. Oeste", type: "substation", x: 420, y: 520 },
  { id: "s_parque", label: "Sub. Parque", type: "substation", x: 1160, y: 800 },
  { id: "d1", label: "Nodo N1", type: "distribution", x: 620, y: 110 },
  { id: "d2", label: "Nodo N2", type: "distribution", x: 980, y: 110 },
  { id: "d3", label: "Nodo N3", type: "distribution", x: 680, y: 250 },
  { id: "d4", label: "Nodo C1", type: "distribution", x: 640, y: 390 },
  { id: "d5", label: "Nodo C2", type: "distribution", x: 960, y: 380 },
  { id: "d6", label: "Nodo O1", type: "distribution", x: 260, y: 400 },
  { id: "d7", label: "Nodo O2", type: "distribution", x: 260, y: 650 },
  { id: "d8", label: "Nodo O3", type: "distribution", x: 440, y: 720 },
  { id: "d9", label: "Nodo E1", type: "distribution", x: 1340, y: 400 },
  { id: "d10", label: "Nodo E2", type: "distribution", x: 1350, y: 640 },
  { id: "d11", label: "Nodo E3", type: "distribution", x: 1040, y: 620 },
  { id: "d12", label: "Nodo S1", type: "distribution", x: 640, y: 900 },
  { id: "d13", label: "Nodo S2", type: "distribution", x: 960, y: 920 },
  { id: "d14", label: "Nodo S3", type: "distribution", x: 560, y: 780 },
  { id: "d15", label: "Nodo P1", type: "distribution", x: 1320, y: 860 },
  { id: "d16", label: "Nodo P2", type: "distribution", x: 1140, y: 960 },
  { id: "d17", label: "Nodo NE", type: "distribution", x: 1120, y: 240 },
  { id: "d18", label: "Nodo NO", type: "distribution", x: 470, y: 250 },
  { id: "sc_minas", label: "Escuela de Minas", type: "school", x: 470, y: 60 },
  { id: "sc_pucarita", label: "Pucarita", type: "school", x: 1290, y: 160 },
  { id: "sc_comercial1", label: "Comercial 1", type: "school", x: 110, y: 310 },
  { id: "sc_nacional1", label: "Nacional 1", type: "school", x: 1500, y: 720 },
  { id: "sc_normal1", label: "Normal 1", type: "school", x: 520, y: 980 },
  { id: "sc_nacional2", label: "Nacional 2", type: "school", x: 1480, y: 950 },
  { id: "sc_huerto", label: "El Huerto", type: "school", x: 110, y: 740 },
];

const e = (id: string, source: string, target: string, kind: GraphEdge["kind"]): GraphEdge => ({
  id,
  source,
  target,
  kind,
});

export const EDGES: GraphEdge[] = [
  // Central -> substations
  e("m1", "central", "s_centro", "main"),
  e("m2", "central", "s_oeste", "main"),
  e("m3", "central", "s_este", "main"),
  e("m4", "central", "s_sur", "main"),
  e("m5", "s_centro", "s_norte", "main"),
  e("m6", "s_este", "s_parque", "main"),
  // Distribution
  e("n1", "s_norte", "d1", "distribution"),
  e("n2", "s_norte", "d2", "distribution"),
  e("n3", "s_norte", "d3", "distribution"),
  e("n4", "d3", "d18", "distribution"),
  e("n5", "d18", "d1", "distribution"),
  e("n6", "d2", "d17", "distribution"),
  e("c1", "s_centro", "d4", "distribution"),
  e("c2", "s_centro", "d5", "distribution"),
  e("c3", "d4", "d3", "distribution"),
  e("c4", "d5", "d17", "distribution"),
  e("o1", "s_oeste", "d6", "distribution"),
  e("o2", "s_oeste", "d7", "distribution"),
  e("o3", "s_oeste", "d8", "distribution"),
  e("o4", "d7", "d8", "distribution"),
  e("o5", "d8", "d14", "distribution"),
  e("e1", "s_este", "d9", "distribution"),
  e("e2", "s_este", "d10", "distribution"),
  e("e3", "s_este", "d11", "distribution"),
  e("e4", "d9", "d10", "distribution"),
  e("e5", "d11", "d5", "distribution"),
  e("u1", "s_sur", "d12", "distribution"),
  e("u2", "s_sur", "d13", "distribution"),
  e("u3", "s_sur", "d14", "distribution"),
  e("u4", "d14", "d12", "distribution"),
  e("u5", "d13", "d16", "distribution"),
  e("p1", "s_parque", "d15", "distribution"),
  e("p2", "s_parque", "d16", "distribution"),
  e("p3", "d16", "d15", "distribution"),
  // Alternative routes (normally open)
  e("a1", "s_sur", "s_parque", "alternative"),
  e("a2", "d6", "d18", "alternative"),
  e("a3", "d9", "d17", "alternative"),
  e("a4", "d11", "d13", "alternative"),
  e("a5", "d15", "d10", "alternative"),
  // Service lines to schools (always from a distribution node)
  e("k1", "d1", "sc_minas", "service"),
  e("k2", "d17", "sc_pucarita", "service"),
  e("k3", "d6", "sc_comercial1", "service"),
  e("k4", "d10", "sc_nacional1", "service"),
  e("k5", "d12", "sc_normal1", "service"),
  e("k6", "d15", "sc_nacional2", "service"),
  e("k7", "d7", "sc_huerto", "service"),
];

export const SCHOOLS = NODES.filter((n) => n.type === "school");
export const NODE_BY_ID = new Map(NODES.map((n) => [n.id, n]));
export const TYPE_LABEL: Record<GraphNode["type"], string> = {
  central: "Central de energía (fuente)",
  substation: "Subestación",
  distribution: "Nodo de distribución",
  school: "Escuela (consumidor)",
};
export const KIND_LABEL: Record<GraphEdge["kind"], string> = {
  main: "Línea troncal",
  distribution: "Línea de distribución",
  service: "Acometida a escuela",
  alternative: "Ruta alternativa",
};
