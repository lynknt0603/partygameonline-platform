# Prompt 14 — Generic Server-side GameEngine Core

## Mục tiêu

Create the generic backend contract that future games implement.

No Bloodlines-specific rule in core.

## Core concepts

Define only what is genuinely common:
- GameEngine
- GameState marker/base contract
- GameAction marker/base contract
- GameEvent marker/base contract
- ValidationResult
- GameResult
- GameConfig
- GameRegistry

Example conceptual interface:

```java
public interface GameEngine<S, A, E> {
    String gameType();
    S createGame(GameConfig config);
    ValidationResult validate(S state, PlayerContext actor, A action);
    GameResult<S, E> apply(S state, PlayerContext actor, A action);
}
```

Exact types may be improved, but keep:
- validation server-side;
- deterministic state transition when given state/action/random source;
- events returned separately from state when useful.

## Randomness

Do not call global random helpers throughout rules.

Introduce a testable RNG abstraction or seeded source so:
- shuffle can be tested;
- replay/debug is possible later.

Do not expose seed to clients if it would enable cheating.

## Registry

`GameRegistry` resolves engine by gameType.

Avoid:

```java
switch (gameType) {
  case "bloodlines": ...
  case "salem": ...
}
```

## State ownership

Room runtime holds:
- selected engine;
- authoritative game state;
- sequence.

Transport layer calls application/game service, not engine implementation directly.

## Tests

Create a tiny test engine or use upcoming demo skeleton to verify:
- registration;
- unknown game rejection;
- validate-before-apply discipline.

## Acceptance

- core has zero imports from a concrete game package;
- adding new engine does not require editing core switch logic;
- tests/package pass.
