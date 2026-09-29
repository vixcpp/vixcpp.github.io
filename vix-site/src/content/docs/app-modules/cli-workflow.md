# CLI Workflow

`vix modules` is the command group used to create and maintain application modules. It gives a project a repeatable workflow for initializing module support, adding module skeletons, listing declared modules, enabling or disabling them, checking the module graph, and keeping module-owned dependencies explicit.

The command is useful in two different situations. In a `vix.app` project, it works with the application manifest and keeps active modules declared from the project root. In an existing CMake project, it can create the same `modules/` structure and connect module targets through CMake without requiring the project to adopt the full Vix application template.

```bash
vix modules <subcommand> [options]
```

## Subcommands

The module workflow is built around a small set of subcommands.

```txt
init                 Initialize module support
add <name>           Create a module skeleton
list                 List modules declared in vix.app
enable <name>        Enable a module in vix.app
disable <name>       Disable a module in vix.app
check                Validate module structure and dependencies
```

Most projects only need a small sequence at the beginning.

```bash
vix modules init
vix modules add auth
vix modules check
vix build
```

This initializes the module layer, creates the first module, validates the module structure, and then builds the application.

When the module needs an external dependency, keep that dependency owned by the module.

Registry package:

```bash
vix add gk/jwt@^1.0.0 --module auth
```

Direct Git dependency:

```bash
vix install https://github.com/gabime/spdlog   --tag v1.15.3   --target spdlog::spdlog   --module auth
```

## Initialize module support

Start with `init` from the project root.

```bash
vix modules init
```

This creates the standard module directory and the CMake loader used by the module system.

```txt
modules/
cmake/vix_modules.cmake
```

In a classic CMake project, `vix modules init` can patch the root `CMakeLists.txt` so the module loader is included by the existing build. In a `vix.app` project, the root build file is generated internally by Vix, so the command skips root CMake patching and keeps the project source of truth in `vix.app`.

Use `--no-patch` when you want Vix to create the module files without modifying an existing root `CMakeLists.txt`.

```bash
vix modules init --no-patch
```

This is useful when the project has a custom CMake structure and the module loader should be connected manually.

## Add a module

Create a module with `add`.

```bash
vix modules add auth
```

The command creates a new directory under `modules/` and writes the files for the module. The generated shape depends on the project type that Vix detects.

In a backend-style `vix.app` project, the generated module is a routed backend module.

```txt
modules/auth/
  include/auth/AuthModule.hpp
  include/auth/controllers/AuthController.hpp
  src/AuthModule.cpp
  src/controllers/AuthController.cpp
  migrations/
  tests/test_auth.cpp
  CMakeLists.txt
  vix.module
```

In a simpler C++ project, the generated module exposes a public API header and a private implementation file.

```txt
modules/auth/
  include/auth/api.hpp
  src/auth.cpp
  tests/test_auth.cpp
  CMakeLists.txt
  vix.module
```

Module names are normalized before files are written. A name such as `user-profile` becomes `user_profile`, which keeps namespaces, include paths, and CMake target names stable.

Generator flags can also receive the module name through `--name`.

```bash
vix modules add live_chat --websocket
vix modules add --websocket --name live_chat
```

Both forms create a module named `live_chat`. The positional name is usually clearer for humans; `--name` is useful for generated scripts and option-driven templates.

## Add a WebSocket module

Use `--websocket` to generate a WebSocket application module.

```bash
vix modules add live_chat --websocket --workflow attached
```

The generated module is registered in `vix.app`, placed under `modules/live_chat/`, and built by the normal `vix build` workflow.

```txt
modules/live_chat/
  include/live_chat/LiveChatModule.hpp
  src/LiveChatModule.cpp
  tests/test_live_chat.cpp
  CMakeLists.txt
  vix.module
```

WebSocket modules support these workflows.

| Workflow     | Description                                  |
| ------------ | -------------------------------------------- |
| `attached`   | Runs HTTP and WebSocket together.            |
| `standalone` | Runs a WebSocket server owned by the module. |
| `bridge`     | Bridges app setup and WebSocket setup.       |
| `client`     | Generates client/helper code only.           |

`attached`, `standalone`, and `bridge` are runtime workflows. They generate a module `run(...)` entry point. `client` does not generate a runtime entry point and can be used for code that supports a WebSocket client without taking ownership of application startup.

```bash
vix modules add --websocket --name notifications --workflow bridge
```

Backend templates also include a static WebSocket status panel on the generated home page. When a runtime WebSocket module is running, the panel connects from the browser and shows the live connection state.

## Automatic registration

When the project has a `vix.app` file, `vix modules add <name>` registers the new module in the application manifest.

```ini
[module.auth]
enabled = true
path = modules/auth
kind = backend
```

For a backend project, the module kind is `backend`. For a non-backend `vix.app` project, Vix can create a routed service-style module. The manifest declaration is the part that makes the module visible to the generated application build.

When the project has a root `CMakeLists.txt`, `vix modules add <name>` can patch the CMake file so the module target is linked into the main project target.

```bash
vix modules add auth
```

Use `--no-link` when you want the module skeleton to be created but do not want Vix to modify the root CMake project.

```bash
vix modules add auth --no-link
```

In that case, connect the module manually from your build file.

```cmake
target_link_libraries(api PRIVATE api::auth)
```

## Add a dependency to one module

A module can own external dependencies independently from sibling modules.

For a Registry package, use `vix add --module`:

```bash
vix add gk/jwt@^1.0.0 --module auth
```

Vix records the Registry requirement in `modules/auth/vix.module`.

For a direct Git dependency, use `vix install --module`:

```bash
vix install https://github.com/gabime/spdlog   --tag v1.15.3   --target spdlog::spdlog   --module auth
```

The short form is:

```bash
vix install https://github.com/gabime/spdlog   --tag v1.15.3   --target spdlog::spdlog   -m auth
```

The Git declaration is stored in the target module's `vix.module`.

```toml
[dependencies.spdlog]
git = "https://github.com/gabime/spdlog"
tag = "v1.15.3"
target = "spdlog::spdlog"
```

The application still has one root `vix.lock` and one shared dependency cache. `--module` changes ownership and generated linkage, not the physical storage model.

```text
modules/auth/vix.module
        |
        +-- module-owned dependency
        |
        v
root vix.lock
```

The target module must already be declared and enabled. Vix rejects an unknown, disabled, missing, or invalid module before attempting Git resolution.

After adding the dependency:

```bash
vix modules check
vix build
```

## List modules

Use `list` to inspect modules declared in `vix.app`.

```bash
vix modules list
```

The command reads the application manifest and shows the module name, status, kind, path, filesystem state, and dependencies. It is useful after creating modules, editing module declarations, or reviewing which modules are active in the current application.

A module declaration usually looks like this:

```ini
[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = []
```

The modern format is the `[module.<name>]` section because it can describe the enabled state, module path, kind, and dependency list. Older manifests that use `modules = [...]` can still be read, but new projects should use the section format.

## Enable and disable modules

A module can be disabled without deleting its files.

```bash
vix modules disable auth
```

This updates the `enabled` field in `vix.app`.

```ini
[module.auth]
enabled = false
path = "modules/auth"
kind = "backend"
depends = []
```

Enable the module again with:

```bash
vix modules enable auth
```

These commands only work when the module is declared in `vix.app`. They do not create missing modules and they do not remove existing files. Their job is to change whether a declared module participates in the generated application wiring.

This makes it possible to keep unfinished or temporarily inactive features in the repository while keeping them out of the active application target.

## Check the module layer

Run `check` after changing module declarations, module dependencies, route prefixes, or module files.

```bash
vix modules check
```

The check command validates the parts of the module system that matter for long-term maintenance. It verifies declared module identity and paths, required files for enabled modules, unknown and self-dependencies, enabled modules depending on disabled modules, and dependency cycles.

It also rejects ambiguous module identities, such as names that normalize to the same generated CMake target identity, and conflicting module paths.

Boundary checks remain part of the workflow. Public headers should not include private implementation paths from `src/`, and cross-module usage should be expressed through explicit dependencies instead of hidden include relationships.

For backend modules, the check command also catches duplicate route prefixes declared in module metadata.

A normal backend workflow is:

```bash
vix modules check
vix build
```

When tests should be part of the local validation, run the full project check after the module check.

```bash
vix modules check
vix check --tests --run
```

## Work from another directory

By default, `vix modules` uses the current directory as the project root. Use `--dir` or `-d` when running the command from somewhere else.

```bash
vix modules list --dir ./api
```

or:

```bash
vix modules check -d ./api
```

This is useful in scripts, monorepos, or workspaces where the command is launched from a parent directory.

## Override the project name

Vix normally detects the project name from the root `CMakeLists.txt` or from the `name` field in `vix.app`. That name is used when generating module targets.

```txt
api_auth
api::auth
```

Use `--project` when the detected name is not the target prefix you want.

```bash
vix modules add auth --project api
```

This is mostly useful for CMake projects where the main target name is different from the directory name or where the root `project()` call does not match the target that should consume the modules.

## CMake projects

In a CMake project, `vix modules init` creates the module loader and can insert it into the root build file.

```bash
vix modules init
```

Then `vix modules add` creates module targets under `modules/<name>/`.

```bash
vix modules add auth
```

Each module exports a real target and an alias target.

```txt
api_auth
api::auth
```

This means the module can be consumed by normal CMake code. A project that already has its own build structure can use the module layout without converting to `vix.app`.

When the project has unusual CMake rules, use `--no-patch` and `--no-link`, then connect the generated loader and targets manually.

```bash
vix modules init --no-patch
vix modules add auth --no-link
```

## vix.app projects

In a `vix.app` project, the root manifest decides which modules are part of the active application.

```ini
[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = []
```

The generated build uses the enabled modules from the manifest. A module folder can exist without being active, and a disabled module can remain declared without being wired into the application target.

A disabled module can also keep dependency declarations in its `vix.module`. Those external requirements remain inactive until the module is enabled.

The active module graph is validated before generated project integration uses it. The graph has a deterministic dependency-first order, so build generation does not depend on the physical order of module declarations in `vix.app`.

This is the preferred workflow for Vix application projects because the module graph is visible from the same file that describes the application target.

## Dependency conflicts

Application-owned and module-owned external dependencies participate in one active dependency graph.

Compatible owners can share the same resolved dependency:

```text
application
auth
billing
   |
   +-- same compatible dependency
```

Incompatible active requirements are rejected before the new dependency state is published.

Examples include:

```text
auth    -> repository X at revision A
billing -> repository X at revision B
```

or incompatible CMake option values for the same effective Git dependency.

Vix does not choose the last declaration that happened to be processed. The active requirements must have one compatible resolution.

## Safe project mutations

Commands that change module or dependency metadata publish their changes through one project mutation boundary.

This includes:

```bash
vix modules add auth
vix modules enable auth
vix modules disable auth
vix add gk/jwt@^1.0.0 --module auth
vix install <git-url> --module auth
```

If validation, dependency resolution, materialization, or metadata publication fails, Vix preserves the previous authoritative project state instead of leaving partially updated manifests and lock state.

Project mutations are also serialized so concurrent Vix commands cannot silently overwrite the same project metadata.

## Common workflow

For a new backend application, the common workflow is:

```bash
vix modules init
vix modules add auth
vix modules add projects
vix modules list
vix modules check
vix build
```

Add module-owned dependencies when a feature needs them:

```bash
vix add gk/jwt@^1.0.0 --module auth
```

or:

```bash
vix install https://github.com/gabime/spdlog   --tag v1.15.3   --target spdlog::spdlog   --module auth
```

Then edit `vix.app` when one module depends on another.

```ini
[module.projects]
enabled = true
path = "modules/projects"
kind = "backend"
depends = [
  "auth",
]
```

After changing dependencies, run the checks again.

```bash
vix modules check
vix build
```

## Next step

Continue with `vix modules` to see the complete command reference and validation behavior.

[`vix modules`](/cli/modules)
