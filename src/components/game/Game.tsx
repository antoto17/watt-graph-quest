import { useEffect, useMemo, useRef, useState } from "react";
import { bfs, buildAdjacency, countComponents, type EdgeStates } from "@/game/graph";
import { CENTRAL_ID, EDGES, KIND_LABEL, NODES, NODE_BY_ID, SCHOOLS, TYPE_LABEL } from "@/game/network";
import { MISSIONS, isCriticalNode, isMissionComplete, schoolsLostByFailure } from "@/game/missions";
import { NetworkMap, type MapHandle, type Selection } from "./NetworkMap";

const STATE_LABEL = { on: "Activa", off: "Desactivada", broken: "Averiada" } as const;

export function Game() {
  const [idx, setIdx] = useState(0);
  const mission = MISSIONS[idx];
  const [states, setStates] = useState<EdgeStates>(() => ({ ...MISSIONS[0].initial }));
  const [repairsUsed, setRepairsUsed] = useState(0);
  const [failedNode, setFailedNode] = useState<string | null>(null);
  const [criticalFound, setCriticalFound] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [selection, setSelection] = useState<Selection>(null);
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [notice, setNotice] = useState<{ tone: "info" | "warn" | "ok"; text: string } | null>(null);
  const [showWin, setShowWin] = useState(false);
  const mapRef = useRef<MapHandle>(null);

  const toggleable = useMemo(() => new Set(mission.toggleable), [mission]);
  const repairable = useMemo(() => new Set(mission.repairable), [mission]);
  const failedSet = useMemo(() => new Set(failedNode ? [failedNode] : []), [failedNode]);
  const adj = useMemo(() => buildAdjacency(NODES, EDGES, states, failedSet), [states, failedSet]);
  const reachable = useMemo(() => bfs(CENTRAL_ID, adj), [adj]);
  const powered = SCHOOLS.filter((s) => reachable.has(s.id));
  const complete = isMissionComplete(mission, states, criticalFound);

  useEffect(() => {
    if (complete) {
      setCompleted((c) => new Set(c).add(idx));
      setUnlocked((u) => Math.max(u, Math.min(idx + 1, MISSIONS.length - 1)));
      setShowWin(true);
    } else setShowWin(false);
  }, [complete, idx]);

  useEffect(() => {
    if (paused || complete) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [paused, complete]);

  const loadMission = (i: number) => {
    setIdx(i);
    setStates({ ...MISSIONS[i].initial });
    setRepairsUsed(0);
    setFailedNode(null);
    setCriticalFound(null);
    setSelection(null);
    setSeconds(0);
    setPaused(false);
    setShowWin(false);
    setNotice(null);
  };

  const toggleEdge = (id: string) => {
    if (paused) return setNotice({ tone: "warn", text: "El juego está en pausa." });
    const st = states[id];
    if (st === "broken") return setNotice({ tone: "warn", text: "Esta conexión está averiada: no se puede activar, primero hay que repararla." });
    if (!toggleable.has(id)) return setNotice({ tone: "warn", text: "Esta conexión no se puede modificar en esta misión." });
    setStates((s) => ({ ...s, [id]: st === "on" ? "off" : "on" }));
    setNotice(null);
  };

  const repairEdge = (id: string) => {
    if (paused) return;
    if (states[id] !== "broken" || !repairable.has(id))
      return setNotice({ tone: "warn", text: "El equipo de reparación no está disponible para esta conexión en esta misión." });
    if (repairsUsed >= mission.repairBudget)
      return setNotice({ tone: "warn", text: "No quedan reparaciones disponibles. Probá con rutas alternativas o reiniciá la misión." });
    setStates((s) => ({ ...s, [id]: "on" }));
    setRepairsUsed((r) => r + 1);
    setNotice({ tone: "ok", text: "Conexión reparada." });
  };

  const onSelect = (s: Selection) => {
    if (paused) return;
    setSelection(s);
    if (s?.kind === "edge" && toggleable.has(s.id) && states[s.id] !== "broken") toggleEdge(s.id);
  };

  const simulateFailure = (id: string) => {
    if (failedNode === id) {
      setFailedNode(null);
      return setNotice({ tone: "info", text: "El nodo volvió a funcionar." });
    }
    const lost = schoolsLostByFailure(states, id);
    setFailedNode(id);
    const name = NODE_BY_ID.get(id)!.label;
    if (isCriticalNode(states, id)) {
      setCriticalFound(id);
      setNotice({ tone: "ok", text: `¡${name} es un punto de articulación! Sin él quedan aisladas: ${lost.map((l) => NODE_BY_ID.get(l)!.label).join(", ")}.` });
    } else {
      setNotice({ tone: "info", text: `Si falla ${name}, ${lost.length ? `se apagan: ${lost.map((l) => NODE_BY_ID.get(l)!.label).join(", ")}` : "ninguna escuela pierde energía: existe otro camino (un ciclo) que lo rodea"}.` });
    }
  };

  const checkNetwork = () => {
    const off = SCHOOLS.filter((s) => !reachable.has(s.id)).map((s) => s.label);
    setNotice(
      off.length === 0
        ? { tone: "ok", text: "Comprobación: las 7 escuelas tienen un camino activo hasta la central." }
        : { tone: "warn", text: `Comprobación: ${powered.length}/7 escuelas con electricidad. Sin camino: ${off.join(", ")}.` },
    );
  };

  const goNext = () => {
    if (idx >= MISSIONS.length - 1) return;
    if (!complete && idx >= unlocked) return setNotice({ tone: "warn", text: "Completá la misión actual para avanzar." });
    loadMission(idx + 1);
  };

  const counts = {
    active: EDGES.filter((e) => states[e.id] === "on").length,
    broken: EDGES.filter((e) => states[e.id] === "broken").length,
  };
  const components = countComponents(adj);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="flex min-h-screen flex-col gap-3 bg-background p-3 lg:h-screen">
      {/* Top bar */}
      <header className="panel flex flex-wrap items-center gap-x-6 gap-y-2 py-3">
        <h1 className="text-lg font-bold tracking-tight text-foreground">
          <span className="text-accent">⚡</span> Que no se apague la ciudad
        </h1>
        <div className="text-sm">
          <span className="text-muted-foreground">Misión {mission.id}/4 · </span>
          <span className="font-semibold text-primary">{mission.title}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Progreso</span>
          <div className="h-2 w-28 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-school-on transition-all" style={{ width: `${(completed.size / 4) * 100}%` }} />
          </div>
          <span className="font-mono">{completed.size}/4</span>
        </div>
        <span className="font-mono text-sm text-muted-foreground">⏱ {mm}:{ss}</span>
        <div className="ml-auto flex gap-2">
          <button className="btn" onClick={() => loadMission(idx)}>↺ Reiniciar misión</button>
          <button className="btn" onClick={() => setPaused((p) => !p)} disabled={complete}>
            {paused ? "▶ Reanudar" : "⏸ Pausa"}
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[320px_1fr_270px]">
        {/* Left: mission + tools + inspector */}
        <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto">
          <section className="panel">
            <p className="panel-title">Misión {mission.id}</p>
            <h2 className="mb-2 text-xl font-bold">{mission.title}</h2>
            <p className="text-sm leading-relaxed">{mission.instructions}</p>
            <p className="mt-3 rounded-lg bg-muted p-2 text-sm text-primary">🎯 {mission.goal}</p>
            {mission.repairBudget > 0 && (
              <p className="mt-2 font-mono text-sm text-alternative">
                Reparaciones: {mission.repairBudget - repairsUsed}/{mission.repairBudget}
              </p>
            )}
          </section>

          <section className="panel">
            <p className="panel-title">Herramientas</p>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn btn-primary col-span-2" onClick={checkNetwork} disabled={paused}>Comprobar red</button>
              <button className="btn" onClick={() => mapRef.current?.zoomIn()}>Zoom +</button>
              <button className="btn" onClick={() => mapRef.current?.zoomOut()}>Zoom −</button>
              <button className="btn col-span-2" onClick={() => mapRef.current?.center()}>Centrar red</button>
              <button className="btn" onClick={() => loadMission(idx - 1)} disabled={idx === 0}>← Anterior</button>
              <button className="btn" onClick={goNext} disabled={idx === MISSIONS.length - 1 || (!complete && idx >= unlocked)}
                title={!complete && idx >= unlocked ? "Completá la misión para avanzar" : undefined}>
                Siguiente →
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Hacé clic en una línea modificable para activarla o desactivarla. Arrastrá el mapa para moverlo y usá la rueda para ampliar.
            </p>
          </section>

          {notice && (
            <div role="status" className={`panel text-sm ${notice.tone === "ok" ? "border-school-on text-school-on" : notice.tone === "warn" ? "border-alternative text-alternative" : "text-foreground"}`}>
              {notice.text}
            </div>
          )}

          <Inspector
            selection={selection}
            states={states}
            reachable={reachable}
            toggleable={toggleable}
            repairable={repairable}
            missionKind={mission.kind}
            failedNode={failedNode}
            onToggle={toggleEdge}
            onRepair={repairEdge}
            onSimulate={simulateFailure}
            onSelect={setSelection}
          />
        </aside>

        {/* Map */}
        <main className="panel relative min-h-[480px] overflow-hidden p-0">
          <NetworkMap
            ref={mapRef}
            states={states}
            reachable={reachable}
            failedNode={failedNode}
            toggleable={toggleable}
            repairable={repairable}
            highlightAlternatives={mission.highlightAlternatives}
            selection={selection}
            onSelect={onSelect}
          />
          {paused && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <div className="panel text-center">
                <p className="text-2xl font-bold">Juego en pausa</p>
                <button className="btn btn-primary mt-3" onClick={() => setPaused(false)}>▶ Reanudar</button>
              </div>
            </div>
          )}
          {showWin && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70 p-4" role="dialog" aria-label="Misión completada">
              <div className="panel max-w-md border-school-on text-center">
                <p className="text-4xl">🎉</p>
                <p className="mt-1 text-2xl font-bold text-school-on">¡Misión completada!</p>
                <p className="mt-1 font-semibold">{mission.title}</p>
                <p className="mt-2 text-sm leading-relaxed">{mission.winText}</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <button className="btn" onClick={() => loadMission(idx)}>↺ Reiniciar misión</button>
                  <button className="btn" onClick={() => setShowWin(false)}>Ver la red</button>
                  {idx < MISSIONS.length - 1 ? (
                    <button className="btn btn-primary" onClick={goNext}>Siguiente misión →</button>
                  ) : (
                    <span className="btn border-school-on text-school-on">¡Completaste el juego!</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Right: legend + concepts */}
        <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto">
          <section className="panel text-sm">
            <p className="panel-title">Leyenda</p>
            <ul className="space-y-1.5">
              <Legend dot="bg-central" text="Central de energía" />
              <Legend dot="bg-substation" text="Subestación" />
              <Legend dot="bg-distribution" text="Nodo de distribución" />
              <Legend dot="bg-school-on" text="Escuela con electricidad" />
              <Legend dot="bg-school-off" text="Escuela sin electricidad" />
              <Legend line="bg-power" text="Línea activa" />
              <Legend line="bg-alternative" text="Ruta alternativa" />
              <Legend line="bg-fault" text="Conexión averiada" />
              <Legend line="bg-line-off" text="Desactivada (punteada)" />
            </ul>
          </section>
          <section className="panel text-sm">
            <p className="panel-title">Conceptos de grafos</p>
            <dl className="space-y-2">
              <Concept t="Vértice" d="Un elemento de la red: central, subestación, nodo o escuela." />
              <Concept t="Arista" d="Una conexión entre dos vértices." />
              <Concept t="Camino" d="Secuencia de conexiones para llegar de un vértice a otro." />
              <Concept t="Conectividad" d="Indica si existe un camino entre dos vértices." />
              <Concept t="Ciclo" d="Camino que regresa al vértice inicial sin repetir aristas." />
              <Concept t="Punto de articulación" d="Vértice cuya eliminación aumenta la cantidad de componentes conexas." />
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              Simulación educativa ficticia basada en teoría de grafos. No representa la red eléctrica real de Jujuy ni los cálculos físicos de una red real.
            </p>
          </section>
        </aside>
      </div>

      {/* Bottom panel */}
      <footer className="grid gap-3 lg:grid-cols-[1fr_2fr_1.4fr]">
        <section className="panel">
          <p className="panel-title">Objetivos</p>
          <ul className="space-y-1 text-sm">
            {mission.kind === "power" ? (
              <li className={complete ? "text-school-on" : ""}>{complete ? "✔" : "○"} Las 7 escuelas con camino a la central ({powered.length}/7)</li>
            ) : (
              <>
                <li className={failedNode ? "text-school-on" : ""}>{failedNode ? "✔" : "○"} Simular la falla de un nodo</li>
                <li className={complete ? "text-school-on" : ""}>{complete ? "✔" : "○"} Encontrar un punto de articulación</li>
              </>
            )}
            {mission.repairBudget > 0 && <li>○ Usar como máximo {mission.repairBudget} reparaciones ({repairsUsed} usadas)</li>}
          </ul>
        </section>
        <section className="panel">
          <p className="panel-title">Escuelas · {powered.length}/7 con electricidad</p>
          <ul className="grid grid-cols-2 gap-1 text-sm sm:grid-cols-4">
            {SCHOOLS.map((s) => (
              <li key={s.id}>
                <button className={`flex w-full items-center gap-1.5 text-left ${reachable.has(s.id) ? "text-school-on" : "text-school-off"}`} onClick={() => setSelection({ kind: "node", id: s.id })}>
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${reachable.has(s.id) ? "bg-school-on" : "bg-school-off"}`} />
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel">
          <p className="panel-title">Indicadores de la red</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-0.5 font-mono text-xs">
            <Stat k="Nodos" v={NODES.length} />
            <Stat k="Aristas" v={EDGES.length} />
            <Stat k="Activas" v={counts.active} />
            <Stat k="Averiadas" v={counts.broken} />
            <Stat k="Escuelas con luz" v={powered.length} />
            <Stat k="Escuelas sin luz" v={7 - powered.length} />
            <Stat k="Componentes conexas" v={components} />
            <Stat k="Misión" v={complete ? "Completada" : paused ? "En pausa" : "En curso"} />
          </dl>
        </section>
      </footer>
    </div>
  );
}

function Inspector(props: {
  selection: Selection;
  states: EdgeStates;
  reachable: Set<string>;
  toggleable: Set<string>;
  repairable: Set<string>;
  missionKind: "power" | "critical";
  failedNode: string | null;
  onToggle: (id: string) => void;
  onRepair: (id: string) => void;
  onSimulate: (id: string) => void;
  onSelect: (s: Selection) => void;
}) {
  const { selection: sel } = props;
  if (!sel)
    return (
      <section className="panel text-sm text-muted-foreground">
        <p className="panel-title">Información</p>
        Seleccioná un nodo o una conexión en el mapa para ver sus datos.
      </section>
    );
  if (sel.kind === "node") {
    const n = NODE_BY_ID.get(sel.id)!;
    const links = EDGES.filter((e) => e.source === n.id || e.target === n.id);
    return (
      <section className="panel text-sm">
        <p className="panel-title">Información del nodo</p>
        <p className="text-lg font-bold">{n.label}</p>
        <p className="text-muted-foreground">{TYPE_LABEL[n.type]} · <span className="font-mono">{n.id}</span></p>
        <p className={props.reachable.has(n.id) ? "text-school-on" : "text-school-off"}>
          {props.reachable.has(n.id) ? "Recibe energía de la central" : "Sin camino hasta la central"}
        </p>
        <p className="mt-2 font-semibold">Conexiones (grado {links.length}):</p>
        <ul className="mt-1 space-y-0.5">
          {links.map((e) => {
            const other = NODE_BY_ID.get(e.source === n.id ? e.target : e.source)!;
            return (
              <li key={e.id}>
                <button className="hover:text-primary" onClick={() => props.onSelect({ kind: "edge", id: e.id })}>
                  → {other.label} <span className="text-muted-foreground">({STATE_LABEL[props.states[e.id]]})</span>
                </button>
              </li>
            );
          })}
        </ul>
        {props.missionKind === "critical" && n.type !== "central" && n.type !== "school" && (
          <button className="btn btn-danger mt-3 w-full" onClick={() => props.onSimulate(n.id)}>
            {props.failedNode === n.id ? "Restaurar nodo" : "Simular falla"}
          </button>
        )}
      </section>
    );
  }
  const e = EDGES.find((x) => x.id === sel.id)!;
  const st = props.states[e.id];
  const canToggle = props.toggleable.has(e.id) && st !== "broken";
  const canRepair = st === "broken" && props.repairable.has(e.id);
  return (
    <section className="panel text-sm">
      <p className="panel-title">Información de la arista</p>
      <p className="font-bold">{NODE_BY_ID.get(e.source)!.label} — {NODE_BY_ID.get(e.target)!.label}</p>
      <p className="text-muted-foreground">{KIND_LABEL[e.kind]} · <span className="font-mono">{e.id}</span></p>
      <p className={st === "on" ? "text-power" : st === "broken" ? "text-fault" : "text-muted-foreground"}>Estado: {STATE_LABEL[st]}</p>
      {canToggle && (
        <button className="btn btn-warn mt-3 w-full" onClick={() => props.onToggle(e.id)}>{st === "on" ? "Desactivar conexión" : "Activar conexión"}</button>
      )}
      {canRepair && <button className="btn btn-primary mt-3 w-full" onClick={() => props.onRepair(e.id)}>Reparar conexión</button>}
      {!canToggle && !canRepair && (
        <p className="mt-2 text-xs text-muted-foreground">
          {st === "broken" ? "Averiada: no hay equipo de reparación para esta línea en esta misión." : "Esta conexión no se puede modificar en esta misión."}
        </p>
      )}
    </section>
  );
}

function Legend({ dot, line, text }: { dot?: string; line?: string; text: string }) {
  return (
    <li className="flex items-center gap-2">
      {dot && <span className={`h-3 w-3 rounded-full ${dot}`} />}
      {line && <span className={`h-1 w-5 rounded ${line}`} />}
      {text}
    </li>
  );
}
function Concept({ t, d }: { t: string; d: string }) {
  return (
    <div>
      <dt className="font-semibold text-primary">{t}</dt>
      <dd className="text-muted-foreground">{d}</dd>
    </div>
  );
}
function Stat({ k, v }: { k: string; v: string | number }) {
  return (
    <>
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right text-foreground">{v}</dd>
    </>
  );
}
