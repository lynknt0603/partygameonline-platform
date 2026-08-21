# Prompt 13 — Realtime WebSocket Protocol

## Mục tiêu

Add realtime room/game messaging.

Use Spring's WebSocket support with JSON messages.

For MVP, prefer a simple explicit protocol over introducing a message broker.

Do not add Kafka.
Do not require Redis.
Do not add SockJS unless a demonstrated environment requires it.

## Endpoint

Example:

```text
/ws
```

Document the exact endpoint and authentication handoff.

## Envelope

Client → server:

```json
{
  "version": 1,
  "type": "GAME_ACTION",
  "requestId": "uuid",
  "roomId": "ROOM001",
  "payload": {}
}
```

Server → client:

```json
{
  "version": 1,
  "type": "GAME_EVENTS",
  "roomId": "ROOM001",
  "serverSequence": 42,
  "payload": {}
}
```

## Required message families

Room:
- ROOM_SNAPSHOT
- PLAYER_JOINED
- PLAYER_LEFT
- PLAYER_READY_CHANGED

Connection:
- CONNECTED
- ERROR
- RESYNC_REQUIRED

Game:
- GAME_STARTED
- GAME_ACTION
- GAME_EVENTS
- GAME_SNAPSHOT

## Rules

- client may send intent;
- server computes results;
- serverSequence is server-owned and monotonic within a room/game stream;
- requestId supports dedupe/diagnostics;
- never trust client timestamp for ordering.

## Frontend

Create a realtime client abstraction:
- connect;
- disconnect;
- subscribe;
- send;
- connection state.

Do not let React pages directly manipulate native WebSocket.

## Docs

Create:

```text
contracts/websocket/PROTOCOL.md
```

Include message examples and versioning policy.

## Acceptance

- two clients in a room receive join/ready updates without polling;
- malformed message gets a controlled error;
- sequence exists;
- no gameplay logic in WebSocket transport classes;
- tests/builds pass.
