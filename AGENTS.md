<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Game data (`src/game/network.ts`), graph algorithms (`src/game/graph.ts`) and mission rules (`src/game/missions.ts`) stay free of React so they can be unit-tested; UI in `src/components/game/` only derives state from them.
- The map is a custom SVG with its own zoom/pan (no graph library) to avoid extra dependencies and SSR issues.
