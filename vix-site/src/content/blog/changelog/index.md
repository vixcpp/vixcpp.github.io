---
title: "Vix.cpp Changelog"
description: "Version-by-version release notes for Vix.cpp, covering the runtime, CLI, SDK profiles, application modules, package workflows, diagnostics, development tools, and ecosystem changes."
date: 2026-07-19
---

---

# Vix.cpp Changelog

This changelog documents the evolution of Vix.cpp across its public releases.

Each page explains the purpose of the release, the technical changes it introduced, the workflows affected, and the compatibility or validation work behind it. Releases are grouped by development period so related architectural changes remain easy to follow.

## V2.8 releases

The v2.8 line introduces `vix::realtime`, a transport-independent runtime for authoritative stateful applications, then strengthens the everyday C++ development loop, modular application architecture, dependency management, and project mutation safety.

Versions v2.8.0, v2.8.1, and v2.8.2 were published while release, packaging, and distribution issues were still being resolved. They remain part of the project history for traceability, but they should not be used as stable releases. **Vix.cpp v2.8.3 is the first stable and supported release of the v2.8 line.**

- [Vix.cpp v2.8.5](./v2.8.5.md) stabilizes Vix Realtime and adds module-scoped Git dependencies, canonical module graph validation, dependency ownership and conflict detection, transactional project mutations, interrupted transaction recovery, and stricter Git installation contracts.

- [Vix.cpp v2.8.4](./v2.8.4.md) adds lighter public headers, faster compilation and rebuilds, dependency-aware caching, safer build parallelism, clearer diagnostics, improved cross-compilation controls, and more consistent behavior across `vix build`, `vix run`, and `vix dev`.

- [Vix.cpp v2.8.3](./v2.8.3.md) introduces the stable v2.8 realtime runtime for authoritative stateful applications, with rooms, serialized commands, deterministic events, logical sessions, snapshots, replay, reconnection, presence, persistence stores, and optional WebSocket and PostgreSQL integration.

## V2.7 releases

The v2.7 line expands Vix beyond the core build and runtime workflow. It introduces specialized SDK profiles, Vix Note, Vix UI, Vix Requests, application modules, Softadastra Cloud integration, composable SDK installations, improved package management, package and namespace migrations, and the first package-based Note extension system.

- [Vix.cpp v2.7.8](./v2.7.8.md) — adds first-class package moves and namespace migrations across the Vix Registry and CLI, automatic registry pull request creation, dependency-only workspace packages, semantic version ordering, and broader compatibility with managed, system, local, and legacy Vix SDK installations.

- [Vix.cpp v2.7.7](./v2.7.7.md) — introduces package-based extensions for Vix Note, extension discovery and management, registry-aware extension commands, a modernized Vix Reply editor, and more reliable global installation of CLI packages.

- [Vix.cpp v2.7.6](./v2.7.6.md) — adds secure browser-based authentication for Softadastra Cloud, preserves terminal login for scripts and fallback environments, and fixes Cloud API connectivity and HTTPS transport lifetime handling.

- [Vix.cpp v2.7.5](./v2.7.5.md) — fixes composed SDK generation for multi-profile installations and adds safe automatic migration of obsolete lockfile integrity metadata during `vix install`.

- [Vix.cpp v2.7.4](./v2.7.4.md) — makes installed SDK profiles composable, allowing projects to combine modules from profiles such as `web` and `data` without installing the complete `all` SDK.

- [Vix.cpp v2.7.3](./v2.7.3.md) — adds generated WebSocket modules, API-only backend projects, the first Softadastra Cloud CLI workflow, Git dependencies, global package installation, faster single-file execution, and safer public registry publishing.

- [Vix.cpp v2.7.2](./v2.7.2.md) — adds module-level registry dependencies, keeps dependency resolution in one root `vix.lock`, links packages to the modules that use them, and introduces timeout and output guards for C++ cells in Vix Note.

- [Vix.cpp v2.7.1](./v2.7.1.md) — introduces Vix App Modules for structuring C++ applications and backends, with manifest-driven activation, generated route registration, module tests, architecture checks, and manifest-aware `vix dev` rebuilds.

- [Vix.cpp v2.7.0](./v2.7.0.md) — introduces Vix Note, Vix UI, and Vix Requests, together with specialized SDK profiles, CLI-first SDK installation, and the first desktop and mobile application shell workflows.

## V2.6 releases

The v2.6 line develops the application workflow around `vix.app`, backend tooling, runtime reliability, diagnostics, tests, and release validation.

- [Vix.cpp v2.6.3](./v2.6.3.md) — strengthens Core lifecycle and shutdown behavior, adds official benchmark baselines, improves `vix run` and `vix tests`, expands sanitizer coverage, and tightens CI and module validation.

- [Vix.cpp v2.6.2](./v2.6.2.md) — improves dependency installation and updates, registry reliability, package listing commands, Windows SDK packaging, crypto helpers, and command diagnostics.

- [Vix.cpp v2.6.1](./v2.6.1.md) — improves runtime and build diagnostics, test failure reporting, SDK release validation, and full-SDK consumer linking through `vix::vix`.

- [Vix.cpp v2.6.0](./v2.6.0.md) — introduces the AI agent module, the official `vix.app` workflow, Vue integration, target-aware builds, async-powered `vix dev`, production backend tooling, and the game runtime foundation.

## V2.5 releases

The v2.5 line develops faster execution, generated projects, registry integration, build diagnostics, replay, and the early application manifest architecture.

- [Vix.cpp v2.5.6](./v2.5.6.md) — fixes generated library workflows, improves header-only package guidance, strengthens Ninja target diagnostics, and simplifies CLI output.

- [Vix.cpp v2.5.5](./v2.5.5.md) — improves registry dependency linking in `vix run`, installed module consistency, package exports, and the first experimental `vix.app` workflow.

- [Vix.cpp v2.5.3](./v2.5.3.md) — introduces execution replay, runtime diagnostics, incremental build graph foundations, improved test and check output, and a dedicated development session engine.

## Ecosystem and package architecture

These releases establish the broader module, package, manifest, and direct-execution workflows used by later Vix versions.

- [Vix.cpp v2.4.0](./v2.4.0.md) — adds native static file serving, standalone modules, umbrella headers, `vix::tests`, broader environment support, and real-world examples.

- [Vix.cpp v2.3.1](./v2.3.1.md) — fixes OpenSSL package resolution for consumer projects, particularly on macOS and Homebrew-based environments.

- [Vix.cpp v2.3.0](./v2.3.0.md) — adds fast direct C++ execution, intelligent CMake fallback, script caching, database flags, and a cleaner `vix run` pipeline.

- [Vix.cpp v2.2.0](./v2.2.0.md) — introduces manifests, dependency resolution, root lockfiles, Semantic Versioning constraints, transitive packages, and interactive configuration generation.

## V2 stabilization releases

The v2.1 series focuses on cross-platform SDK packaging, dependency exports, runtime output, CMake diagnostics, and release portability.

- [Vix.cpp v2.1.19](./v2.1.19.md) — adds structured CMake diagnostics, dedicated build failure detection, reliable clean builds, and fixes for package publication edge cases.

- [Vix.cpp v2.1.18](./v2.1.18.md) — improves SQLite target compatibility across CMake versions and fixes exported WebSocket dependencies.

- [Vix.cpp v2.1.17](./v2.1.17.md) — fixes SQLite target resolution for exported WebSocket packages and improves dependency handling in `VixConfig.cmake`.

- [Vix.cpp v2.1.16](./v2.1.16.md) — improves Linux release portability, SDK runtime compatibility, header-only `fmt` and `spdlog` integration, and packaged artifact validation.

- [Vix.cpp v2.1.15](./v2.1.15.md) — improves SDK binary portability, relative runtime paths, installer behavior, and self-contained runtime execution.

- [Vix.cpp v2.1.14](./v2.1.14.md) — cleans up cache module dependencies, unifies `vix::json`, and fixes exported `VixTargets`.

- [Vix.cpp v2.1.13](./v2.1.13.md) — makes `nlohmann_json` integration export-safe and improves cache module dependency and SDK packaging behavior.

- [Vix.cpp v2.1.12](./v2.1.12.md) — stabilizes JSON and SQLite exports, CMake package generation, and reusable SDK installation.

- [Vix.cpp v2.1.11](./v2.1.11.md) — introduces full SDK packaging for Linux, macOS, and Windows with consistent `bin`, `include`, and `lib` layouts.

- [Vix.cpp v2.1.10](./v2.1.10.md) — improves Windows dependency resolution, cross-platform build reliability, and Boost dependency cleanup.

- [Vix.cpp v2.1.9](./v2.1.9.md) — completes the `fmt` migration, fixes logging dependency propagation, and simplifies CMake configuration.

- [Vix.cpp v2.1.8](./v2.1.8.md) — fixes macOS `spdlog` compatibility and improves logging portability.

- [Vix.cpp v2.1.7](./v2.1.7.md) — fixes macOS builds and completes cross-platform dependency setup.

- [Vix.cpp v2.1.6](./v2.1.6.md) — restores Linux dependencies and fixes aarch64 cross-compilation behavior.

- [Vix.cpp v2.1.5](./v2.1.5.md) — fixes the Linux aarch64 release pipeline and cross-compilation dependency discovery.

- [Vix.cpp v2.1.4](./v2.1.4.md) — removes build warnings, improves runtime safety, cleans up CMake configuration, and simplifies the CLI.

- [Vix.cpp v2.1.3](./v2.1.3.md) — improves runtime output, task execution, `vix fmt`, `vix info`, global updates, and Vix Reply.

- [Vix.cpp v2.1.2](./v2.1.2.md) — adds shell completion, paginated package search, PTY runtime output, and improved command suggestions.

- [Vix.cpp v2.1.1](./v2.1.1.md) — fixes registry dependency resolution, generated CMake safety, and package loading order.

- [Vix.cpp v2.1.0](./v2.1.0.md) — improves runtime performance, documentation structure, project templates, examples, and ecosystem maturity.

## V2 foundation

- [Vix.cpp v2.0.0](./v2.0.0.md) — begins the V2 architecture by replacing the Boost.Beast-based V1 runtime with a Boost-free native HTTP stack, an async-first execution model, and clearer module boundaries.
