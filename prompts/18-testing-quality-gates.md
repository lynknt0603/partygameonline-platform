# Prompt 18 — Testing Strategy & Quality Gates

## Mục tiêu

Create a practical test pyramid before adding a complex real game.

## Frontend

Add tests where they provide value:
- theme resolver/storage;
- Zustand theme behavior;
- critical navigation;
- message parsing;
- game-view projection handling;
- selected card → intent mapping.

Avoid brittle snapshot tests for large visual trees.

## Backend

Unit test:
- Room rules;
- GameEngine rules;
- demo card game;
- projections/privacy;
- error mapping.

Integration test:
- REST room flows;
- WebSocket happy path where feasible;
- persistence repositories.

## Contract checks

Keep `contracts/` examples synchronized with actual DTOs.

If automation is practical, add schema/serialization tests.

## Build commands

Frontend:
```text
npm run typecheck
npm run build
npm test
```

Backend:
```text
./mvnw test
./mvnw package
```

Only add scripts that actually exist and work.

## Quality principles

- zero compile errors;
- no ignored TypeScript errors;
- no `any` as shortcut;
- no swallowed backend exceptions;
- no secret keys;
- no test that depends on internet access.

## Documentation

Create:

```text
docs/QUALITY-GATES.md
```

Separate:
- automated;
- manual browser/mobile;
- performance checks.

## Acceptance

All automated quality gates that are available in the repository pass.
If a manual check cannot be run in the agent environment, record it as manual instead of claiming success.
