# BoardVerse Coding Agent Rules

## First rule

Before implementing a task:
1. read `memory/` (`DECISIONS.md`, `SESSION.md`, `NEXT.md`) if present — this is the compact session memory when context is full;
2. inspect the repository;
3. read the relevant architecture docs;
4. identify which module owns the requested behavior;
5. implement only the requested phase.

If the conversation is long or near the context limit, update `memory/` before stopping. Do not dump full prompt files into memory — only locked decisions, current snapshot, and next steps.

Do not silently cross architecture boundaries for convenience.

## Stack

Frontend:
- React 19.2
- TypeScript strict
- Vite 8.x
- PixiJS 8.x
- Zustand
- TanStack Query
- React Router v7.x
- CSS Modules + CSS Custom Properties

Backend:
- Java 21
- Spring Boot 4.1.x
- Maven
- PostgreSQL

## Responsibility boundaries

React:
- shell
- pages
- lobby
- room UI
- menus
- forms
- dialogs
- chat UI
- settings
- shared HUD

PixiJS:
- cards
- decks
- tokens
- board/table graphics
- drag interactions
- game animations
- visual effects

Zustand:
- client-only UI state
- preferences
- dialogs
- temporary local state

TanStack Query:
- REST/server data

Spring Boot:
- authoritative room state
- authoritative gameplay state
- validation
- game rules
- turn/phase transitions
- result calculation

## Game rules

Client sends intent.
Server validates and computes results.
Client renders accepted server state/events.

Never trust a client-supplied gameplay result.

## File size

Prefer files below ~250 lines.
When a file approaches ~350 lines, consider decomposition.

Avoid:
- God components
- God services
- giant switch statements across all games
- one global Zustand store
- game-specific logic inside shared platform modules

## Mobile

Platform UI is mobile-first.
Game interaction is touch-first.
No required action may depend solely on hover.
Use Pointer Events semantics.
Respect safe areas.
Do not merely shrink a desktop board.

## Theme

Platform:
- Daybreak Table
- Midnight Table

Game canvas:
- independent artistic theme allowed

Shared HUD:
- follows platform theme unless a game manifest explicitly opts into a game-specific HUD.

## Verification

Frontend phase:
- npm run typecheck
- npm run build

Backend phase:
- ./mvnw test
- ./mvnw package

If a command fails because of code changed in the current phase, fix it before finishing.
