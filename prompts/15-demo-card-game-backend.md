# Prompt 15 — Server-authoritative Demo Card Game

## Mục tiêu

Implement the first actual engine as a deliberately simple validation game.

Game id:

```text
demo-card-game
```

## Rules

- exactly 2 players for first iteration;
- shuffled deck;
- each starts with 5 cards;
- turn alternates;
- on turn player can:
  - DRAW once;
  - PLAY one eligible card;
  - END_TURN;
- played card moves to discard/play pile;
- no complex damage/win condition needed.

The purpose is architecture validation, not game design.

## Server state

State includes:
- player order;
- current player;
- deck;
- each private hand;
- discard;
- per-turn flags;
- turn number.

## Critical privacy rule

Do NOT broadcast full authoritative state containing both players' hands.

Create player-specific view/snapshot projection:
- current user's hand visible;
- opponent cards represented as count/backs;
- deck contents hidden.

This is mandatory for card-game security.

## Actions

Examples:
- DRAW_CARD
- PLAY_CARD
- END_TURN

Server validates:
- actor is room player;
- actor turn;
- card ownership;
- per-turn constraints.

## Events

Examples:
- CARD_DRAWN (private detail only to drawing player where needed)
- CARD_PLAYED
- TURN_ENDED
- GAME_SNAPSHOT

Do not leak hidden card values through events.

## Tests

Test cheating attempts:
- play opponent card;
- act out of turn;
- draw twice;
- play nonexistent card;
- inspect projection does not reveal opponent hand.

## Acceptance

- authoritative demo works in backend tests;
- private information is projected safely;
- WebSocket transport can publish player-specific views;
- package passes.
