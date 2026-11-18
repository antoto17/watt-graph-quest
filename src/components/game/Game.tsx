
import { useEffect, useMemo, useRef, useState } from "react";
import { bfs, buildAdjacency, type EdgeState, type EdgeStates } from "@/game/graph";
import { CENTRAL_ID, EDGES, NODES, NODE_BY_ID, SCHOOLS } from "@/game/network";
import {
  MISSIONS,
  isCriticalNode,
  isMissionComplete,
  planStep,
  schoolsLostByFailure
} from "@/game/missions";
import { NetworkMap, type MapHandle } from "./NetworkMap";

type Step = {
  edgeId: string;
  prevState: EdgeState;
  prevCurrent: string;
  repair: boolean;
};

type Notice = {
  tone: "info" | "warn" | "ok";
  text: string;
} | null;

type PathPoint = {
  node: string;
  historyLength: number;
};

const label = (id: string) => NODE_BY_ID.get(id)!.label;

export function Game() {
  const [idx, setIdx] = useState(0);
  const mission = MISSIONS[idx]!;

  const [states, setStates] = useState<EdgeStates>(() => ({
    ...MISSIONS[0]!.initial
  }));

  const [history, setHistory] = useState<Step[]>([]);
  const [path, setPath] = useState<PathPoint[]>([]);

  const [start, setStart] = useState<string | null>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const [failedNode, setFailedNode] = useState<string | null>(null);
  const [criticalFound, setCriticalFound] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(0);
  const [won, setWon] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [seconds, setSeconds] = useState(0);

  const mapRef = useRef<MapHandle>(null);

  const repairsUsed = history.filter((h) => h.repair).length;

  const built = useMemo(
    () => new Set(history.map((h) => h.edgeId)),
    [history]
  );

  const failedSet = useMemo(
    () => new Set(failedNode ? [failedNode] : []),
    [failedNode]
  );

  const reachable = useMemo(
    () => bfs(CENTRAL_ID, buildAdjacency(NODES, EDGES, states, failedSet)),
    [states, failedSet]
  );

  const powered = SCHOOLS.filter((s) => reachable.has(s.id)).length;
  const activeLines = EDGES.filter((e) => states[e.id] === "on").length;
  const brokenLines = EDGES.filter((e) => states[e.id] === "broken").length;

  useEffect(() => {
    if (won) return;

    const t = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(t);
  }, [won]);

  useEffect(() => {
    if (!notice || notice.tone === "ok") return;

    const t = setTimeout(() => setNotice(null), 3500);

    return () => clearTimeout(t);
  }, [notice]);

  const loadMission = (i: number) => {
    setIdx(i);
    setStates({ ...MISSIONS[i]!.initial });
    setHistory([]);
    setPath([]);
    setStart(null);
    setCurrent(null);
    setFailedNode(null);
    setCriticalFound(null);
    setWon(false);
    setNotice(null);
    setSeconds(0);
  };

  const onNodeClick = (id: string) => {
    if (won) return;

if (id === CENTRAL_ID && current && current !== CENTRAL_ID && mission.kind !== "critical") {
  setStart(CENTRAL_ID);
  setCurrent(CENTRAL_ID);
  setPath([
    {
      node: CENTRAL_ID,
      historyLength: history.length
    }
  ]);
  setNotice(null);
  return;
}


    // En la misión de nodos críticos solo seleccionamos el nodo.
    if (mission.kind === "critical") {
      setStart(id);
      setCurrent(id);
      setNotice(null);
      return;
    }

    // Si todavía no hay un recorrido, comienza uno nuevo.
    if (!current) {
      setStart(id);
      setCurrent(id);

      setPath([
        {
          node: id,
          historyLength: history.length
        }
      ]);

      setNotice(null);
      return;
    }

    // Comprueba si el nodo seleccionado ya pertenece al recorrido.
    const previousIndex = path.findIndex((p) => p.node === id);

    // Si es un nodo anterior, retrocede directamente hasta él.
    if (previousIndex !== -1) {
  const target = path[previousIndex]!;

  const removedSteps = history.slice(target.historyLength);

  // Restaura las conexiones construidas o reparadas después del nodo.
  setStates((s) => {
    const next = { ...s };

    for (let i = removedSteps.length - 1; i >= 0; i--) {
      const step = removedSteps[i]!;

      next[step.edgeId] = step.prevState;
    }

    return next;
  });

  setHistory(history.slice(0, target.historyLength));
  setPath(path.slice(0, previousIndex + 1));
  setCurrent(id);
  setNotice(null);
  setWon(false);
  return;
}

    const r = planStep(mission, states, current, id, repairsUsed);

    switch (r.kind) {
      case "same":
        return;

      case "no-edge":
        setNotice({
          tone: "warn",
          text: "No existe una conexión directa entre estos nodos"
        });
        return;

      case "broken":
        setNotice({
          tone: "warn",
          text: "Esa conexión está averiada y no se puede reparar en esta misión"
        });
        return;

      case "no-repairs":
        setNotice({
          tone: "warn",
          text: "No quedan reparaciones disponibles"
        });
        return;

      case "locked":
        setNotice({
          tone: "warn",
          text: "Esa conexión no se puede activar en esta misión"
        });
        return;

      case "move":
        // Se mueve por una conexión que ya estaba activa.
        setCurrent(id);

        setPath((p) => [
          ...p,
          {
            node: id,
            historyLength: history.length
          }
        ]);

        setNotice(null);
        return;

      case "build":
      case "repair": {
        // Activa la conexión.
        setStates((s) => ({
          ...s,
          [r.edgeId]: "on"
        }));

        // Guarda el estado anterior para poder deshacerlo.
        setHistory((h) => [
          ...h,
          {
            edgeId: r.edgeId,
            prevState: states[r.edgeId]!,
            prevCurrent: current,
            repair: r.kind === "repair"
          }
        ]);

        setCurrent(id);

        // Registra el nuevo nodo y la cantidad de pasos construidos.
        setPath((p) => [
          ...p,
          {
            node: id,
            historyLength: history.length + 1
          }
        ]);

        setNotice(
          r.kind === "repair"
            ? { tone: "info", text: "Conexión reparada" }
            : null
        );

        return;
      }
    }
  };

  const cancelPath = () => {
    setStart(null);
    setCurrent(null);
    setPath([]);
    setNotice(null);
  };

  const undo = () => {
    const last = history[history.length - 1];

    if (!last) return;

    // Restaura la conexión del último paso construido.
    setStates((s) => ({
      ...s,
      [last.edgeId]: last.prevState
    }));

    setHistory((h) => h.slice(0, -1));

    // Vuelve al nodo desde el que se construyó esa conexión.
    setCurrent(last.prevCurrent);

    const previousIndex = path.findIndex(
      (p) => p.node === last.prevCurrent
    );

    if (previousIndex !== -1) {
      setPath(path.slice(0, previousIndex + 1));
    } else {
      setPath([
        {
          node: last.prevCurrent,
          historyLength: history.length - 1
        }
      ]);
    }

    if (!start) {
      setStart(last.prevCurrent);
    }

    setWon(false);
  };

  const check = () => {
    if (isMissionComplete(mission, states, criticalFound)) {
      setWon(true);

      setUnlocked((u) =>
        Math.max(u, Math.min(idx + 1, MISSIONS.length - 1))
      );

      setNotice({
        tone: "ok",
        text: mission.winText
      });
    } else if (mission.kind === "critical") {
      setNotice({
        tone: "warn",
        text: "Todavía no encontraste un nodo crítico. Simulá la falla de otro nodo."
      });
    } else {
      const missing = SCHOOLS
        .filter((s) => !reachable.has(s.id))
        .map((s) => s.label);

      setNotice({
        tone: "warn",
        text: `Sin camino desde la central: ${missing.join(", ")}`
      });
    }
  };

  const simulateFailure = () => {
    if (!current) return;

    if (failedNode === current) {
      setFailedNode(null);

      return setNotice({
        tone: "info",
        text: "El nodo volvió a funcionar"
      });
    }

    const lost = schoolsLostByFailure(states, current);

    setFailedNode(current);

    if (isCriticalNode(states, current)) {
      setCriticalFound(current);

      setNotice({
        tone: "info",
        text: `${label(current)} es un punto de articulación. Se apagan: ${lost.map(label).join(", ")}. Tocá «Comprobar red».`
      });
    } else {
      setNotice({
        tone: "info",
        text: lost.length
          ? `Se apagan: ${lost.map(label).join(", ")}`
          : `Si falla ${label(current)}, ninguna escuela se apaga`
      });
    }
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const toneClass =
    notice?.tone === "warn"
      ? "border-fault text-fault"
      : notice?.tone === "ok"
        ? "border-school-on text-school-on"
        : "border-primary text-primary";

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="flex h-12 shrink-0 items-center gap-4 border-b border-border/60 px-4">
        <h1 className="text-sm font-bold tracking-wide">
          <span className="text-central">⚡</span> Que no se apague la ciudad
        </h1>

        <nav className="flex items-center gap-1" aria-label="Misiones">
          {MISSIONS.map((m, i) => (
            <button
              key={m.id}
              onClick={() => loadMission(i)}
              disabled={i > unlocked}
              className={`h-7 w-7 rounded-full text-xs font-semibold transition disabled:opacity-30 ${
                i === idx
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
              aria-label={`Misión ${m.id}`}
            >
              {m.id}
            </button>
          ))}
        </nav>

        <span className="truncate text-sm text-muted-foreground">
          {mission.title}
        </span>

        <div className="ml-auto flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Escuelas</span>

          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-school-on transition-all"
              style={{ width: `${(powered / SCHOOLS.length) * 100}%` }}
            />
          </div>

          <span className="font-mono font-semibold">
            {powered}/{SCHOOLS.length}
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="relative min-w-0 flex-1">
          <NetworkMap
            ref={mapRef}
            states={states}
            reachable={reachable}
            failedNode={failedNode}
            built={built}
            highlightAlternatives={mission.highlightAlternatives}
            startNode={start}
            currentNode={current}
            onNodeClick={onNodeClick}
            onBackground={() => {}}
          />

          {notice && (
            <div
              role="status"
              className={`absolute left-1/2 top-3 max-w-md -translate-x-1/2 rounded-lg border bg-background/90 px-3 py-1.5 text-center text-sm backdrop-blur ${toneClass}`}
            >
              {notice.text}
            </div>
          )}

          <div className="absolute bottom-3 right-3 flex flex-col gap-1">
            <button
              className="btn h-8 w-8 p-0"
              onClick={() => mapRef.current?.zoomIn()}
              aria-label="Acercar"
            >
              +
            </button>

            <button
              className="btn h-8 w-8 p-0"
              onClick={() => mapRef.current?.zoomOut()}
              aria-label="Alejar"
            >
              −
            </button>

            <button
              className="btn h-8 w-8 p-0"
              onClick={() => mapRef.current?.center()}
              aria-label="Centrar"
            >
              ◎
            </button>
          </div>

          <ul className="absolute bottom-3 left-3 flex gap-3 rounded-lg bg-background/70 px-3 py-1.5 text-[11px] text-muted-foreground">
            <li className="flex items-center gap-1">
              <i className="h-2.5 w-2.5 rounded-full bg-central" />
              Central
            </li>

            <li className="flex items-center gap-1">
              <i className="h-2.5 w-2.5 rounded-full bg-substation" />
              Subestación
            </li>

            <li className="flex items-center gap-1">
              <i className="h-2.5 w-2.5 rounded-full bg-distribution" />
              Nodo
            </li>

            <li className="flex items-center gap-1">
              <i className="h-2.5 w-2.5 rounded-full bg-school-on" />
              Escuela
            </li>

            <li className="flex items-center gap-1">
              <i className="h-0.5 w-3 bg-alternative" />
              Alternativa
            </li>

            <li className="flex items-center gap-1">
              <i className="h-0.5 w-3 bg-fault" />
              Averiada
            </li>
          </ul>
        </main>

        <aside className="flex w-72 shrink-0 flex-col gap-3 border-l border-border/60 p-4">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Misión {mission.id}
            </p>

            <h2 className="text-lg font-semibold">{mission.title}</h2>
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">
            {mission.instructions}
          </p>

          <p className="text-sm font-medium text-accent">
            {mission.goal}
          </p>

          <div className="rounded-lg bg-muted/60 px-3 py-2 text-xs">
            {current ? (
              <>
                <span className="text-muted-foreground">Nodo actual: </span>
                <span className="font-semibold text-primary">
                  {label(current)}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">
                {mission.kind === "critical"
                  ? "Tocá un nodo para elegirlo"
                  : "Tocá un nodo para empezar"}
              </span>
            )}
          </div>

          <div className="mt-auto grid grid-cols-2 gap-2">
            {mission.kind === "critical" ? (
              <button
                className="btn btn-danger col-span-2"
                onClick={simulateFailure}
                disabled={!current || current === CENTRAL_ID}
              >
                {failedNode && failedNode === current
                  ? "Restaurar nodo"
                  : "Simular falla"}
              </button>
            ) : (
              <>
                <button
                  className="btn"
                  onClick={cancelPath}
                  disabled={!current}
                >
                  Cancelar camino
                </button>

                <button
                  className="btn"
                  onClick={undo}
                  disabled={!history.length}
                >
                  Deshacer paso
                </button>
              </>
            )}

            <button className="btn btn-primary" onClick={check}>
              Comprobar red
            </button>

            <button
              className="btn"
              onClick={() => loadMission(idx)}
            >
              Reiniciar misión
            </button>

            {won && idx < MISSIONS.length - 1 && (
              <button
                className="btn btn-primary col-span-2"
                onClick={() => loadMission(idx + 1)}
              >
                Siguiente misión →
              </button>
            )}
          </div>
        </aside>
      </div>

      <footer className="flex h-8 shrink-0 items-center gap-5 border-t border-border/60 px-4 font-mono text-[11px] text-muted-foreground">
        <span>Conexiones activas {activeLines}</span>
        <span>Construidas {history.length}</span>

        {brokenLines > 0 && (
          <span className="text-fault">
            Averiadas {brokenLines}
          </span>
        )}

        {mission.repairBudget > 0 && (
          <span>
            Reparaciones {mission.repairBudget - repairsUsed}/{mission.repairBudget}
          </span>
        )}

        <span className="ml-auto">
          {mm}:{ss}
        </span>
      </footer>
    </div>
  );
}
