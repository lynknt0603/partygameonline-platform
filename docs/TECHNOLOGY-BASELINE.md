# Technology Baseline — August 2026

This prompt pack intentionally targets stable major lines rather than copying old 2024 package versions.

Baseline:
- React 19.2
- Vite 8.x
- PixiJS 8.x
- React Router v7.x for this project
- Zustand current stable compatible with React 19
- TanStack Query current stable
- Java 21
- Spring Boot 4.1.x

## Why React Router v7 is pinned

React Router v8 raises its baseline and changes packaging. This project intentionally stays on the latest v7.x line during the initial platform foundation to minimize unnecessary migration churn.

Do not auto-upgrade the router major during unrelated feature work.

## Dependency rule

For dependencies not explicitly pinned:
- install the current stable release compatible with the selected stack;
- do not use beta/RC/canary versions;
- record the resolved version in the lockfile;
- do not make broad version upgrades in feature prompts.

Official references:
- https://react.dev/versions
- https://vite.dev/releases
- https://pixijs.com/8.x/guides/components/application
- https://reactrouter.com/
- https://zustand.docs.pmnd.rs/
- https://tanstack.com/query/latest/docs/framework/react
- https://docs.spring.io/spring-boot/system-requirements.html
