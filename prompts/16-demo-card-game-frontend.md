# Prompt 16 — Full-stack Demo Card Game Frontend Integration

## Mục tiêu

Connect Prompt 07 Pixi card table to real room/game realtime data.

## Client action model

Pixi interaction must produce high-level intents, e.g.:

```ts
onPlayCard(cardId)
onDrawCard()
onEndTurn()
```

Pixi must not directly call WebSocket.

A game-controller/application layer translates UI intents to realtime messages.

## Realtime store

Create a focused store for accepted game snapshot:
- room/game id;
- current player;
- public opponent state;
- local private hand;
- turn;
- last serverSequence;
- connection state.

Do not mix:
- menus/settings;
- particles;
- TanStack REST state.

## Optimistic behavior

For authoritative gameplay:
- avoid optimistic mutation that can reveal or commit illegal state;
- visual "pending" feedback is allowed;
- final state comes from server event/snapshot.

## Pixi synchronization

Renderer should update from accepted view model.

Do not recreate the entire Pixi Application for each WebSocket message.

Animate meaningful transitions:
- draw;
- play;
- turn change.

If a snapshot jumps over missed animations, prioritize correct state over replaying every animation.

## Mobile

Verify:
- tap card;
- drag card;
- play via accessible React button after selecting card;
- draw;
- end turn;
- portrait layout.

## Multi-client validation

Test with two browser windows:
- join same room;
- ready/start;
- each sees only own hand;
- turn synchronizes;
- actions broadcast;
- reload behavior may still require Prompt 17 reconnect support.

## Acceptance

- one game works full stack;
- no hidden hand leakage;
- client cannot force illegal move;
- no rule duplication in Pixi;
- frontend build and backend tests pass.
