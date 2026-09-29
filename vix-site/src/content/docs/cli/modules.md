# `vix modules`

`vix modules` manages application modules from the command line. It initializes module support, creates module skeletons, lists declared modules, enables or disables modules, and validates the module graph before the project is built.

This command manages modules that belong to the application itself. It is different from Vix SDK modules such as `vix::orm`, `vix::requests`, or `vix::ui`.

```bash
vix modules <subcommand> [options]
```

## Basic workflow

A typical `vix.app` workflow starts from the project root:

```bash
vix modules init
vix modules add auth
vix modules check
vix build
```

When a module needs its own external dependency, keep that dependency owned by the module.

Registry package:

```bash
vix add gk/jwt@^1.0.0 --module auth
```

Direct Git dependency:

```bash
vix install https://github.com/gabime/spdlog \
  --tag v1.15.3 \
  --target spdlog::spdlog \
  --module auth
```

The dependency declaration is stored with the module, while exact dependency resolution remains part of the root application state.

## Subcommands

```text
init                 Initialize module support
add <name>           Create a module skeleton
list                 List modules declared in vix.app
enable <name>        Enable a module in vix.app
disable <name>       Disable a module in vix.app
check                Validate module structure and dependencies
```

## Options

```text
-d, --dir <path>         Project root. Defaults to the current directory.
--project <name>         Override the detected project name.
--name <name>            Explicit module name, useful with generator flags.
--no-patch               Do not patch the root CMakeLists.txt during init.
--patch                  Patch the root CMakeLists.txt during init.
--no-link                Do not auto-link a new module into the main target.
--link                   Auto-link a new module into the main target.
--websocket              Generate a WebSocket application module.
--workflow <name>        WebSocket workflow: attached, standalone, bridge, client.
-h, --help               Show command help.
```

The project name is used to generate module targets. For a project named `api` and a module named `auth`, Vix creates:

```text
api_auth
api::auth
```

Use `--project` when the detected project name is not the target prefix you need.

```bash
vix modules add auth --project api
```

## Initialize module support

`vix modules init` prepares the current project for application modules.

```bash
vix modules init
```

It creates the standard module directory and loader:

```text
modules/
cmake/vix_modules.cmake
```

In a CMake-first project, Vix can patch the root `CMakeLists.txt` so the module loader participates in the existing build.

In a `vix.app` project, the active application build is generated from the manifest, so the command keeps the root source of truth in `vix.app`.

Use `--no-patch` when the project has custom CMake structure:

```bash
vix modules init --no-patch
```

Then include the loader manually where appropriate:

```cmake
include(${CMAKE_CURRENT_LIST_DIR}/cmake/vix_modules.cmake)
```

## Add a module

Create a module with:

```bash
vix modules add auth
```

In a backend-style `vix.app` project, the generated module can look like:

```text
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

In a simpler C++ or CMake-first project:

```text
modules/auth/
  include/auth/api.hpp
  src/auth.cpp
  tests/test_auth.cpp
  CMakeLists.txt
  vix.module
```

Module names may contain letters, numbers, underscores, and hyphens. Hyphens are normalized for generated identifiers.

```text
user-profile -> user_profile
```

The resulting normalized identity must remain unique. Names that would collide after normalization cannot safely coexist.

For example:

```text
foo-bar
foo_bar
```

may map to the same generated identity and are rejected by module graph validation.

Case-only identity collisions are also rejected when they would make the module graph ambiguous.

```text
Auth
auth
```

When generator flags are used, the name can also be supplied through `--name`.

```bash
vix modules add live_chat --websocket
vix modules add --websocket --name live_chat
```

## Add a WebSocket module

Use `--websocket` to generate a WebSocket application module.

```bash
vix modules add live_chat --websocket --workflow attached
```

Supported workflows are:

| Workflow     | Use case                                               | Runtime module |
| ------------ | ------------------------------------------------------ | -------------- |
| `attached`   | Run HTTP and WebSocket together in one app.            | yes            |
| `standalone` | Run a WebSocket server owned by the module.            | yes            |
| `bridge`     | Bridge application setup to WebSocket setup.           | yes            |
| `client`     | Generate client/helper code without runtime ownership. | no             |

Runtime workflows generate the module entry point needed by the selected WebSocket model. `client` generates support code without taking ownership of application startup.

A generated manifest can contain:

```toml
name = "live_chat"
kind = "websocket.attached"
runtime = true

[websocket]
workflow = "attached"
```

## Add without linking

In a CMake-first project, Vix can connect a newly generated module to the detected main target.

Use `--no-link` when the root build should remain untouched:

```bash
vix modules add auth --no-link
```

Then link the alias target manually:

```cmake
target_link_libraries(my_server PRIVATE api::auth)
```

## List modules

Use:

```bash
vix modules list
```

The command reads module declarations from `vix.app` and shows their declared state, including name, enabled state, kind, path, filesystem status, and dependencies.

A module declaration looks like:

```toml
[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = []
```

The `[module.<name>]` form is the current application module representation because it can describe activation, location, kind, and module-to-module dependencies.

## Enable a module

Enable an existing module declaration with:

```bash
vix modules enable auth
```

This updates the module state in `vix.app`.

```toml
[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = []
```

An enabled module participates in the active application graph.

Its module-owned Registry and Git dependency requirements also become active dependency requirements.

## Disable a module

Disable a module without deleting its files:

```bash
vix modules disable auth
```

The declaration remains in `vix.app`:

```toml
[module.auth]
enabled = false
path = "modules/auth"
kind = "backend"
depends = []
```

A disabled module can remain in the repository and can keep dependency declarations in its `vix.module`.

Those external dependencies do not constrain the active application dependency graph until the module is enabled again.

## Add a Registry dependency to one module

Use `vix add --module` when a Registry package belongs to one application module.

```bash
vix add gk/jwt@^1.0.0 --module auth
```

The module manifest stores the Registry requirement and its link targets.

```toml
[deps]
registry = [
  "gk/jwt@^1.0.0",
]

links = [
  "gk::jwt",
]
```

The package still participates in the application's root dependency resolution.

## Add a Git dependency to one module

Use `vix install --module` for a direct Git dependency owned by one module.

```bash
vix install https://github.com/gabime/spdlog \
  --tag v1.15.3 \
  --target spdlog::spdlog \
  --module auth
```

The short form is:

```bash
vix install https://github.com/gabime/spdlog \
  --tag v1.15.3 \
  --target spdlog::spdlog \
  -m auth
```

Vix writes the dependency declaration to:

```text
modules/auth/vix.module
```

For example:

```toml
[dependencies.spdlog]
git = "https://github.com/gabime/spdlog"
tag = "v1.15.3"
target = "spdlog::spdlog"
```

CMake options can be stored with the same dependency:

```toml
[dependencies.spdlog.cmake]
SPDLOG_BUILD_TESTS = false
SPDLOG_BUILD_EXAMPLE = false
```

The module must already be declared and enabled. Unknown, disabled, missing, or invalid modules are rejected before Git resolution begins.

## One lockfile and one shared cache

Module ownership does not create a separate dependency universe for each module.

The application keeps one exact dependency state:

```text
vix.app
  |
  +-- auth
  |     |
  |     +-- modules/auth/vix.module
  |
  +-- projects
  |
  v
root vix.lock
```

Module-owned Git dependencies use the same shared Vix dependency cache as other direct Git dependencies.

A module therefore has logical ownership of a dependency without receiving its own lockfile, checkout cache, or vendor directory.

## Shared dependencies

Multiple active modules can own the same compatible external dependency.

```text
auth
  +-- spdlog

billing
  +-- spdlog
```

Vix can preserve both owners while resolving one effective dependency state.

The same applies when the root application and one or more modules require the same external dependency.

Ownership answers:

```text
who uses the dependency?
```

Resolution answers:

```text
which exact dependency state satisfies all active owners?
```

These are separate concepts.

## Dependency conflicts

All active application and module requirements participate in the same constraint analysis.

If two active owners require incompatible revisions of the same effective Git dependency, Vix rejects the change.

```text
auth
  -> repository X at revision A

billing
  -> repository X at revision B
```

The same rule applies between the root application and a module.

CMake configuration is also part of Git dependency compatibility. Conflicting CMake option values for the same effective dependency are rejected when they cannot safely coexist in one generated CMake graph.

For repository-root dependencies, these two source locations are treated as equivalent:

```toml
# omitted
```

and:

```toml
subdirectory = "."
```

Vix does not use last-write-wins dependency behavior.

## Check modules

Run:

```bash
vix modules check
```

This validates the module layer before the build relies on it.

The check verifies important structural contracts such as:

- declared module paths
- required files for enabled modules
- unknown dependencies
- self-dependencies
- enabled modules depending on disabled modules
- dependency cycles
- normalized identity collisions
- duplicate or conflicting module paths
- public/private module boundaries
- cross-module dependency relationships
- route prefix conflicts for routed modules
- module dependency metadata consistency

A normal workflow is:

```bash
vix modules check
vix build
```

For broader project validation:

```bash
vix modules check
vix check --tests --run
```

## Unknown dependencies

A module cannot depend on a module that is not declared in `vix.app`.

Invalid:

```toml
[module.projects]
enabled = true
path = "modules/projects"
kind = "backend"
depends = [
  "auth",
]
```

when no `module.auth` declaration exists.

Declare the dependency module before using it.

## Self-dependencies

A module cannot depend on itself.

Invalid:

```toml
[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = [
  "auth",
]
```

## Enabled module depending on a disabled module

This graph is invalid:

```toml
[module.auth]
enabled = false
path = "modules/auth"
kind = "backend"
depends = []

[module.projects]
enabled = true
path = "modules/projects"
kind = "backend"
depends = [
  "auth",
]
```

Enable the required dependency:

```bash
vix modules enable auth
```

or disable the dependent module:

```bash
vix modules disable projects
```

The active graph must remain complete.

## Dependency cycles

This graph is invalid:

```toml
[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = [
  "projects",
]

[module.projects]
enabled = true
path = "modules/projects"
kind = "backend"
depends = [
  "auth",
]
```

It produces:

```text
auth -> projects -> auth
```

Vix reports the actual cycle instead of producing a build order from an invalid graph.

## Deterministic module order

A valid graph has a stable dependency-first order.

For:

```text
auth
  ^
  |
projects
  ^
  |
builds
```

the dependency order is:

```text
auth
projects
builds
```

This order comes from the module graph, not from the physical order of declarations in `vix.app`.

## Public and private boundaries

Modules follow a public/private layout convention.

```text
modules/<name>/include/<name>/...  public headers
modules/<name>/src/...             private implementation
```

Code outside a module should use public headers:

```cpp
#include <auth/api.hpp>
```

It should not include implementation files from another module:

```cpp
#include "../../auth/src/AuthStore.hpp"
```

When one module uses another module's public API, the CMake target relationship should remain explicit.

```cmake
target_link_libraries(api_projects
  PUBLIC
    api::auth
)
```

This prevents builds from succeeding accidentally because of leaked include paths.

## Route prefix conflicts

Routed modules can declare their route namespace in `vix.module`.

```toml
name = "auth"
kind = "backend"

[routes]
prefix = "/api/auth"
```

Two active routed modules should not claim the same prefix.

```text
auth   -> /api/auth
users  -> /api/auth
```

`vix modules check` reports the conflict before application startup.

## Safe project mutations

Commands that change module state or dependency declarations use one project mutation boundary.

This includes:

```bash
vix modules add auth
vix modules enable auth
vix modules disable auth
vix add gk/jwt@^1.0.0 --module auth
vix install <git-url> --module auth
```

Vix validates and prepares the prospective state before authoritative project metadata is published.

If a mutation fails during validation, dependency resolution, materialization, or metadata publication, the previous project state is preserved.

Project mutations are also serialized so concurrent Vix commands do not silently overwrite the same manifest or lock state.

## Working with `vix.app`

In a `vix.app` project, the root manifest is the source of truth for the active module graph.

```toml
[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = []

[module.projects]
enabled = true
path = "modules/projects"
kind = "backend"
depends = [
  "auth",
]
```

The manifest describes the logical module relationship.

CMake describes the actual target relationship:

```cmake
target_link_libraries(api_projects
  PUBLIC
    api::auth
)
```

Module-owned external dependencies remain in the module manifest rather than being moved to the root application declaration.

## Working with CMake-first projects

A project does not need to use `vix.app` to use the module layout.

```bash
vix modules init
vix modules add auth
```

For custom CMake structure:

```bash
vix modules init --no-patch
vix modules add auth --no-link
```

Then connect the generated loader and target manually.

```cmake
include(${CMAKE_CURRENT_LIST_DIR}/cmake/vix_modules.cmake)

target_link_libraries(my_server PRIVATE api::auth)
```

CMake remains responsible for the final build graph in this mode.

## Common workflows

Create and validate a module:

```bash
vix modules init
vix modules add auth
vix modules check
vix build
```

Add a Registry dependency to the module:

```bash
vix add gk/jwt@^1.0.0 --module auth
vix modules check
vix build
```

Add a direct Git dependency to the module:

```bash
vix install https://github.com/gabime/spdlog \
  --tag v1.15.3 \
  --target spdlog::spdlog \
  --module auth

vix modules check
vix build
```

Create a module in another project directory:

```bash
vix modules add auth --dir ./api
```

Create a module with an explicit project prefix:

```bash
vix modules add auth --project api
```

Create a module without changing the root CMake target:

```bash
vix modules add auth --no-link
```

List active declarations:

```bash
vix modules list
```

Disable and enable a module:

```bash
vix modules disable auth
vix modules enable auth
```

## When to use this command

Use `vix modules` when one C++ application has features that deserve explicit boundaries, such as authentication, projects, builds, packages, billing, logs, or deployment logic.

A small project does not need modules immediately. Introduce a module when a feature benefits from its own public API, implementation, tests, dependency ownership, and position in the application graph.

## Related pages

- [Application Modules](/app-modules/)
- [CLI Workflow](/app-modules/cli-workflow)
- [Module Manifest](/app-modules/module-manifest)
- [Dependencies and Checks](/app-modules/dependencies-and-checks)
- [Using with vix.app](/app-modules/with-vix-app)
- [Using with CMake](/app-modules/with-cmake)
- [`vix install`](/cli/install)
- [`vix add`](/cli/add)
