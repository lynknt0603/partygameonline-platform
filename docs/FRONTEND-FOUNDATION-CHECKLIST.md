# Frontend foundation checklist (Phase A)

Status after the Phase A rebuild into `apps/web`.

| Check | Result | Kind | Evidence |
| --- | --- | --- | --- |
| Stack: React 19.2, Vite 8, Zustand, TanStack Query, React Router v7, CSS Modules | Pass | Automated | `apps/web/package.json` lockfile |
| `npm run typecheck` | Pass | Automated | `apps/web` — tsc --noEmit, 0 errors |
| `npm run build` | Pass | Automated | Vite 8.2.1 production build succeeded |
| Theme tokens Daybreak / Midnight | Pass | Automated | `src/shared/theme/theme.css` |
| Anti-FOUC bootstrap before React | Pass | Automated | inline script in `apps/web/index.html` |
| Store has no `document` access | Pass | Automated | `useThemeStore.ts` |
| ThemeProvider owns DOM + OS listener | Pass | Automated | `ThemeProvider.tsx` |
| Real URL routing (no tab state) | Pass | Automated | `AppRouter.tsx` |
| Game route fullscreen, no bottom nav | Pass | Automated | `/play/:roomId` outside `AppShell` |
| Status uses text + icon + color | Pass | Automated | `StatusBadge` |
| Teal/gold not used as small text on white | Pass | Automated | buttons use `--on-brand` `#202824` |
| Self-hosted fonts, no Google Fonts network | Pass | Automated | `@fontsource-variable/*` |
| Manual: 360px / iPhone / tablet / desktop | Manual required | Manual | Needs browser + device toolbar |
| Manual: Light/Dark persistence without FOUC | Manual required | Manual | Reload with each stored mode |
| Manual: System follows OS | Manual required | Manual | `prefers-color-scheme` |
| Manual: card selection + touch controls | Manual required | Manual | Night of Bloodlines room |
| Manual: gothic board stays dark in Daybreak | Manual required | Manual | Night of Bloodlines room |
| Manual: keyboard radio theme cards | Manual required | Manual | `/settings` |
| Manual: reduced motion | Manual required | Manual | OS setting |

## TODO

- Prompt 09 feature/domain split
- Real networking (Prompt 11+)
- Authoritative game rules stay on the server
- Visual polish of Night of Bloodlines board and card assets
- Device-lab pass on physical phones
