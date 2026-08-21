# Prompt 12 — Room & Lobby Domain

## Mục tiêu

Implement actual room lifecycle before gameplay.

## Domain

A room should model:
- roomId
- gameType
- hostPlayerId
- capacity
- players
- player ready status
- room status

Suggested room statuses:
- WAITING
- STARTING
- IN_GAME
- FINISHED

Do not persist active authoritative game state to PostgreSQL yet.

## Commands

Implement REST or application-service operations for:
- create room;
- join room;
- leave room;
- get room;
- list public/open rooms;
- set ready;
- start game precondition check.

Start game should fail unless:
- requester is allowed;
- player count is valid;
- required players are ready.

## Concurrency

Room mutation must be concurrency-safe within a single Spring Boot instance.

Do not assume frontend prevents duplicate joins.

## Identity

If production auth is not implemented:
- use a clearly marked development identity mechanism;
- isolate it behind an interface;
- do not let client choose arbitrary authoritative player identity in production code paths.

## Frontend

Wire:
- create room;
- join room;
- lobby page;
- ready toggle.

Game launch may still navigate to a placeholder.

## Tests

Backend tests:
- duplicate join;
- full room;
- host leaves;
- start without ready players;
- valid start preconditions.

## Acceptance

- two browser sessions can conceptually join the same in-memory room through API;
- room mutation rules are server-side;
- frontend does not maintain its own authoritative room copy;
- builds/tests pass.
