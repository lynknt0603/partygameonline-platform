# Prompt 17 — Reconnect, Snapshot Resync & Match Persistence

## Mục tiêu

Make mobile/network interruptions survivable without overengineering event sourcing.

## Reconnect

Frontend:
- exponential backoff with sane cap;
- stop retrying after explicit leave;
- expose connection state to HUD;
- avoid reconnect storms.

On reconnect send:
- roomId;
- last accepted serverSequence;
- authenticated player identity/session.

## Server resync strategy

MVP strategy:
- authoritative snapshot resync;
- do not build full event sourcing.

If sequence continuity cannot be guaranteed:
- send `RESYNC_REQUIRED`;
- send player-specific `GAME_SNAPSHOT`.

Snapshot is source of truth.

## Disconnect grace

Room domain should support a configurable temporary disconnected state rather than instantly deleting an active player.

Do not permanently reserve seats forever.

## PostgreSQL persistence

Persist durable records:
- users (if available);
- match metadata;
- match players;
- final result;
- timestamps;
- optional final public summary.

Do not persist every animation/event by default.

Active game state may remain in memory for single-instance MVP.

## History API

Add:
- list user's matches;
- match summary endpoint.

Frontend:
- simple history page or profile section.

## Acceptance

- refresh/reconnect restores correct player-specific snapshot;
- sequence is updated;
- temporary disconnect does not corrupt game;
- completed match history survives server restart;
- active game cross-instance scaling is explicitly documented as future work;
- builds/tests pass.
