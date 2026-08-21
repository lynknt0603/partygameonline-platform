# Prompt 10 — Spring Boot Modular Monolith Scaffolding

## Mục tiêu

Create backend at:

```text
apps/server
```

## Technology

- Java 21
- Spring Boot 4.1.x
- Maven Wrapper
- Spring Web
- Spring Validation
- Spring WebSocket
- Spring Security
- Spring Data JPA
- PostgreSQL driver
- Spring Boot Test

Do not add Redis/Kafka.

## Package

Working base:

```text
com.boardverse
```

## Target modules

```text
com.boardverse
├── common
├── config
├── auth
├── user
├── catalog
├── room
├── realtime
├── game
│   ├── core
│   └── games
├── history
└── persistence
```

At this phase, create package boundaries and minimal classes only where needed.
Do not create empty interface forests.

## Configuration

Profiles:
- default/dev
- test

Use environment placeholders for DB credentials.

Do not commit real passwords.

## Health

Expose a simple health endpoint or actuator health configuration.

## Security

Create a development-safe security skeleton:
- do not invent production JWT implementation yet;
- document how authentication will plug into room/game commands;
- health endpoint can be public.

## Database

Configure PostgreSQL but tests must not require a developer's external database yet.

Use a test-friendly approach for application context tests.

## Architecture doc

Create:

```text
docs/BACKEND-ARCHITECTURE.md
```

Explain:
- modular monolith;
- room/game authority;
- no microservices at MVP.

## Verification

From `apps/server`:

```text
./mvnw test
./mvnw package
```

On Windows also ensure `mvnw.cmd` exists.

## Acceptance

- Java 21 configured;
- app starts;
- test suite passes;
- no secrets committed;
- no game-specific logic yet.
