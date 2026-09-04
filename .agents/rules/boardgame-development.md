# Board Game Development Rules

These rules apply across the entire workspace for developing tabletop and party card games:

1. **Domain Isolation**:
   - Each game module belongs inside its own folder `apps/web/src/games/<gameId>/`.
   - Never import internal implementation details across different game modules (e.g., `bloodBound` must not import internals of `nob`).

2. **Pure Logic Separation**:
   - Logic in `model/<gameId>Rules.ts` must remain 100% pure TypeScript functions.
   - Do NOT import React hooks (`useState`, `useEffect`) or access the browser DOM in `model/`.

3. **Automated Unit Tests Mandatory**:
   - Every rule transition, victory condition, and command validation MUST be covered by Vitest in `model/<gameId>Rules.test.ts`.
   - Never proceed to UI implementation until all unit tests pass with zero failures.

4. **UI & Theme Tokens**:
   - Always use CSS Modules for page and component styles.
   - Use design tokens (`var(--brand)`, `var(--surface)`, `var(--bg)`, `var(--text)`, `var(--on-brand)`).
   - Never hardcode `#000000` or raw colors that break contrast in Daybreak or Midnight modes.
   - Touch targets must be at least 44px x 44px. Layout must support 360px width.

5. **Client Simulation Fallback**:
   - Every PlayPage must include self-contained mock/bot simulation state so that users and developers can playtest the game immediately without needing an active backend server.
