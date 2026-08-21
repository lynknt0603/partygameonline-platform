# Prompt 11 — Shared Contracts, REST Client & TanStack Query

## Mục tiêu

Establish explicit HTTP contracts between web and server.

## Root contracts

Create human-readable schemas/examples under:

```text
contracts/rest/
```

Do not attempt cross-language code generation yet unless there is a concrete need.

Define:
- ApiError
- GameSummary
- RoomSummary
- RoomDetails
- PlayerSummary

Use versioned API prefix:

```text
/api/v1
```

## Error envelope

Create one consistent error model containing at least:
- code
- message
- request/correlation id when available
- field errors for validation when applicable

Do not expose stack traces to client responses.

## Backend

Add minimal mock/in-memory endpoints:
- `GET /api/v1/games`
- `GET /api/v1/rooms`
- `GET /api/v1/rooms/{roomId}`

No real create/join behavior yet; that is Prompt 12.

## Frontend API layer

Create:
- fetch wrapper;
- typed error normalization;
- base URL from Vite env;
- AbortSignal support.

Do not call `fetch` directly from page components.

## TanStack Query

Configure QueryClient provider.

Create query hooks:
- useGames
- useRooms
- useRoom

Keep REST state out of Zustand.

## Loading/error/empty UX

Pages must distinguish:
- loading;
- error;
- empty;
- success.

## Acceptance

- frontend data comes through typed API modules/query hooks;
- no page-level raw fetch;
- backend contract examples match actual response shape;
- frontend typecheck/build pass;
- backend tests/package pass.
