# Prompt 19 — Night of Bloodlines Game Module Skeleton

## Mục tiêu

Create the first real game module **without** implementing every card/role at once.

The purpose is to prove that a real game can plug into the established platform without modifying generic infrastructure unnecessarily.

## Backend module

Create:

```text
game/games/bloodlines/
```

Include only:
- engine registration;
- state model skeleton;
- phase model;
- action/event types;
- player-specific projection;
- rule package structure;
- initial test fixtures.

Do not implement the full ruleset unless separately provided.

## Frontend module

Create:

```text
game/games/night-of-bloodlines/
├── manifest.ts
├── controller/
├── renderer/
├── ui/
├── assets/
└── theme/
```

Manifest:
- game id;
- display name;
- player limits placeholder;
- `prefersDarkCanvas: true`;
- Gothic independent game canvas.

Platform Light/Dark must continue to control:
- shared settings;
- leave dialog;
- connection indicator;
- generic chat if shared.

## Art loading

Do not import all card artwork into the initial bundle.

Provide lazy asset loading by game/scene.

Support:
- normal card texture;
- higher-resolution detail preview if needed.

## First vertical slice

Implement only one tiny end-to-end mechanic after the skeleton, for example:
- start phase;
- one safe example action;
- one server event;
- one renderer response.

Do not add 39 cards/roles in this prompt.

## Architecture protection

If a Bloodlines requirement appears to need a core change:
1. explain why;
2. determine whether the concept is genuinely generic;
3. prefer local game implementation;
4. change core only if multiple games plausibly need the abstraction.

## Acceptance

- game registers without switch statements;
- route/catalogue can launch it;
- Gothic canvas remains dark under Daybreak platform;
- one vertical slice works;
- no mass implementation of rules yet;
- builds/tests pass.
