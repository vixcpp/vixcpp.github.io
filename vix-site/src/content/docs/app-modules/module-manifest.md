# Module Manifest

Each application module contains a `vix.module` file. This file describes the module itself: its name, its kind, its exported include directory, its route prefix when the module is routed, module-owned external dependencies, and whether module tests are enabled.

The module manifest belongs to the module directory. It is different from the root `vix.app` file. The root manifest describes the application and decides which modules are active. The module manifest describes one module from inside its own folder, including registry and Git dependencies that belong to that module rather than to the application shell as a whole.

```txt
modules/auth/
  CMakeLists.txt
  vix.module
  include/auth/
  src/
  tests/
```

This separation keeps the project readable. `vix.app` answers the application-level question: which modules belong to this application? `vix.module` answers the module-level question: what kind of module is this, and what does it expose?

## Basic shape

A simple module manifest looks like this:

```ini
name = "auth"
kind = "module"

[exports]
include = "include"

[tests]
enabled = true
```

This describes a module named `auth`. It is a normal internal module, it exports headers from its `include` directory, and it has tests enabled.

A matching module layout may look like this:

```txt
modules/auth/
  include/auth/
    api.hpp
  src/
    auth.cpp
  tests/
    test_auth.cpp
  CMakeLists.txt
  vix.module
```

The public include path comes from the `include` directory.

```cpp
#include <auth/api.hpp>
```

The source files remain private to the module target.

## Routed module shape

Backend and service modules are routed modules. They expose a module entry point and usually register routes on a `vix::App`.

A backend module manifest looks like this:

```ini
name = "auth"
kind = "backend"

[routes]
prefix = "/api/auth"

[deps]
registry = [
]

links = [
]

[tests]
enabled = true
```

The `routes.prefix` value gives the module a clear HTTP namespace. For a module named `auth`, the default route prefix is usually:

```txt
/api/auth
```

A generated backend module uses that prefix in its starter controller.

```cpp
app.get("/api/auth", [](vix::Request &req, vix::Response &res)
{
  (void)req;

  res.json({
    "ok", true,
    "module", "auth",
    "message", "Auth module is available"
  });
});
```

The prefix does not replace route registration. Routes are still registered by module code. The prefix gives the module a declared route ownership area and lets the module checker detect conflicts between modules.

## WebSocket module shape

A generated WebSocket module stores its workflow in `vix.module`.

```ini
name = "live_chat"
kind = "websocket.attached"
runtime = true

[websocket]
workflow = "attached"

[tests]
enabled = true
```

The `kind` value identifies the module as a WebSocket module and records the selected workflow. The supported workflow suffixes are:

```txt
websocket.attached
websocket.standalone
websocket.bridge
websocket.client
```

`attached`, `standalone`, and `bridge` are runtime workflows. They generate a module entry point that can take ownership of the application runtime. `client` is support code only and does not generate a runtime `run(...)` entry point.

The generated layout follows the module name.

```txt
modules/live_chat/
  include/live_chat/LiveChatModule.hpp
  src/LiveChatModule.cpp
  tests/test_live_chat.cpp
  CMakeLists.txt
  vix.module
```

Create one with the CLI.

```bash
vix modules add live_chat --websocket --workflow attached
vix modules add --websocket --name notifications --workflow bridge
```

## `name`

The `name` field is the stable module name.

```ini
name = "auth"
```

The name should match the module directory and the declaration in `vix.app`.

```txt
modules/auth/
```

```ini
[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = []
```

Keep this name stable. It is used in generated files, route defaults, test names, CMake target names, and module checks.

## `kind`

The `kind` field describes the role of the module.

```ini
kind = "backend"
```

A simple internal module usually uses:

```ini
kind = "module"
```

A backend feature module uses:

```ini
kind = "backend"
```

A routed module in a non-backend application may use:

```ini
kind = "service"
```

A generated WebSocket module uses:

```ini
kind = "websocket.attached"
```

The exact suffix matches the WebSocket workflow. Use `websocket.client` only for non-runtime client/helper modules.

The value should describe what the module does in the application. A module that owns HTTP backend routes should use `backend`. A module that only exposes reusable internal C++ code can use `module`.

## `[exports]`

The `[exports]` section describes what the module exposes.

```ini
[exports]
include = "include"
```

For simple modules, this tells the project that public headers are under the module’s `include` directory.

```txt
modules/auth/include/
```

The public headers should still live under a module-named folder.

```txt
modules/auth/include/auth/api.hpp
```

That gives users of the module a stable include path.

```cpp
#include <auth/api.hpp>
```

The export section should describe public surface, not private implementation. Files under `src/` should not be exported as public API.

## `[routes]`

The `[routes]` section is used by routed modules.

```ini
[routes]
prefix = "/api/auth"
```

The prefix should be unique across routed modules in the same application. If two modules claim the same prefix, the project becomes harder to reason about because route ownership is no longer clear.

Good route prefixes usually follow the module name.

```txt
auth      -> /api/auth
projects  -> /api/projects
builds    -> /api/builds
packages  -> /api/packages
```

The prefix is also checked by `vix modules check`.

```bash
vix modules check
```

This helps catch duplicate route prefixes before the application is built or run.

## `[deps]`

The `[deps]` section records registry packages that belong to this module. Use it when a package is part of the module implementation rather than part of the application shell. For example, an `auth` module may use a JWT package while the rest of the backend only depends on the public `auth` API.

```ini
[deps]
registry = [
  "gk/jwt@^1.0.0",
]

links = [
  "gk::jwt",
]
```

The `registry` list contains Vix Registry package specs. The `links` list contains the CMake targets that should be linked to the generated module target. These lists are intentionally kept together: one tells Vix what package must be resolved, and the other tells the build what target the module uses.

The easiest way to update this section is through `vix add --module`.

```bash
vix add gk/jwt@^1.0.0 --module auth
```

When the module is enabled in `vix.app`, Vix includes its registry dependencies in the application dependency resolution and writes the exact resolved graph to the root `vix.lock`. During the generated `vix.app` build, Vix also passes the declared link targets to the module CMake target. A disabled module can keep its dependency metadata on disk, but those dependencies are not part of the active application graph until the module is enabled.

## `[dependencies.<name>]`

Structured Git dependencies that belong to one module are declared under `[dependencies.<name>]`.

```toml
[dependencies.spdlog]
git = "https://github.com/gabime/spdlog"
tag = "v1.15.3"
target = "spdlog::spdlog"
```

This keeps the dependency close to the module that uses it while preserving a single dependency state for the application.

The easiest way to add one is:

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

Vix writes the Git declaration to `modules/auth/vix.module`. The exact resolved commit still belongs to the root `vix.lock`, and the dependency uses the same shared Git cache as root application dependencies.

```text
modules/auth/vix.module
        |
        +-- desired Git dependency
        |
        v
root vix.lock
        |
        +-- exact resolved dependency state
```

A module does not receive its own lockfile or cache directory.

### Revision selection

A module Git dependency can select a tag, branch, or exact revision.

Tag:

```toml
[dependencies.spdlog]
git = "https://github.com/gabime/spdlog"
tag = "v1.15.3"
target = "spdlog::spdlog"
```

Branch:

```toml
[dependencies.parser]
git = "https://github.com/company/parser.git"
branch = "dev"
target = "company::parser"
```

Revision:

```toml
[dependencies.parser]
git = "https://github.com/company/parser.git"
rev = "a1b2c3d4e5f6"
target = "company::parser"
```

Use only one revision selector for the same dependency. Tags and branches are resolved to exact commits before the dependency state is written to `vix.lock`.

### Monorepo dependencies

If the dependency's CMake project is inside a repository subdirectory, use `subdirectory`.

```toml
[dependencies.parser]
git = "https://github.com/company/monorepo.git"
tag = "v2.0.0"
subdirectory = "libs/parser"
target = "company::parser"
```

The `target` field identifies the CMake target used by the owning module.

### Dependency CMake options

CMake options for one Git dependency are stored in a nested `.cmake` table.

```toml
[dependencies.spdlog]
git = "https://github.com/gabime/spdlog"
tag = "v1.15.3"
target = "spdlog::spdlog"

[dependencies.spdlog.cmake]
SPDLOG_BUILD_TESTS = false
SPDLOG_BUILD_EXAMPLE = false
SPDLOG_BUILD_BENCH = false
```

Vix applies these options before the dependency is added to the generated CMake graph.

### Ownership and conflict behavior

A dependency declared in one module belongs to that module's generated CMake target. It is not automatically attached to sibling modules or to the application target.

For example:

```text
auth
   +-- spdlog::spdlog

billing
   +-- no spdlog dependency
```

If two enabled modules declare the same compatible dependency, Vix can reuse one exact resolved dependency state while preserving both module owners.

If active owners require incompatible revisions or incompatible CMake configuration for the same effective Git dependency, Vix rejects the conflict instead of choosing whichever declaration was processed last.

The same conflict rules apply between a root application dependency in `vix.app` and a module dependency in `vix.module`.

Disabled modules keep their declarations on disk, but their external dependencies do not constrain the active application dependency graph until those modules are enabled.

## `[tests]`

The `[tests]` section records whether the module has tests enabled.

```ini
[tests]
enabled = true
```

Generated modules include a starter test file.

```txt
modules/auth/tests/test_auth.cpp
```

For a simple module, the generated test usually checks the public API. For a backend module, it usually checks that the module exposes its name and that the module header is correctly wired.

The test section does not mean test files are part of the main application target. Module tests remain separate from the application executable.

## What does not belong in vix.module

The module manifest should stay focused on module metadata. It should not become a second application manifest, even though it may declare registry and Git dependencies used by the module itself.

Application-level activation belongs in `vix.app`.

```ini
[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = []
```

Internal module-to-module dependencies still belong in the application manifest and in the module CMake target relationship.

```ini
[module.projects]
enabled = true
path = "modules/projects"
kind = "backend"
depends = [
  "auth",
]
```

```cmake
target_link_libraries(api_projects
  PUBLIC
    api::auth
)
```

The `vix.module` file should describe the module itself. It should not duplicate the full application graph. External dependencies are different: registry and Git dependencies can live in `vix.module` when they belong to the module implementation, because that keeps dependency ownership close to the code that uses it.

## Example: simple module

A simple module can use this manifest:

```ini
name = "logger"
kind = "module"

[exports]
include = "include"

[tests]
enabled = true
```

A matching layout may look like this:

```txt
modules/logger/
  include/logger/
    api.hpp
  src/
    logger.cpp
  tests/
    test_logger.cpp
  CMakeLists.txt
  vix.module
```

This is a good shape for internal reusable code that does not register HTTP routes.

## Example: backend module

A backend module can use this manifest:

```ini
name = "projects"
kind = "backend"

[routes]
prefix = "/api/projects"

[tests]
enabled = true
```

A matching layout may look like this:

```txt
modules/projects/
  include/projects/
    ProjectsModule.hpp
    controllers/
      ProjectsController.hpp
  src/
    ProjectsModule.cpp
    controllers/
      ProjectsController.cpp
  migrations/
  tests/
    test_projects.cpp
  CMakeLists.txt
  vix.module
```

The module entry point registers the module routes.

```cpp
void ProjectsModule::register_routes(vix::App &app)
{
  controllers::ProjectsController::register_routes(app);
}
```

The generated application bridge can call that entry point when the module is enabled in `vix.app`.

## Generated manifests

When you create a module with the CLI, Vix writes the initial `vix.module` file for you.

```bash
vix modules add auth
```

For a normal module, the generated manifest contains the export section.

```ini
name = "auth"
kind = "module"

[exports]
include = "include"

[deps]
registry = [
]

links = [
]

[tests]
enabled = true
```

For a routed backend module, the generated manifest contains the route prefix and the same empty dependency section.

```ini
name = "auth"
kind = "backend"

[routes]
prefix = "/api/auth"

[deps]
registry = [
]

links = [
]

[tests]
enabled = true
```

You can edit the generated manifest when the module needs a different route prefix, when the module kind changes, or when the module needs a structured Git dependency. For package installation, prefer the CLI commands because they also update the dependency state safely.

Registry dependency:

```bash
vix add gk/jwt@^1.0.0 --module auth
```

Git dependency:

```bash
vix install https://github.com/gabime/spdlog \
  --tag v1.15.3 \
  --target spdlog::spdlog \
  --module auth
```

After editing module metadata manually, run the module checks.

```bash
vix modules check
```

## Common mistakes

The most common mistake is confusing `vix.module` with `vix.app`. The module manifest describes one module. It does not decide whether the module is enabled in the application. Enabled and disabled state belongs to the root `vix.app` file.

Another mistake is declaring a route prefix that another module already owns. This can happen when modules are copied and renamed without updating `vix.module`. Run `vix modules check` after creating or moving routed modules.

A third mistake is using `[exports]` to expose private implementation folders. Public headers should live under `include/<module>/`. Implementation files under `src/` should remain private to the module target.

Another mistake is creating a lockfile or dependency cache inside a module directory. Module ownership is logical and build-level ownership. The application still uses the root `vix.lock` and the shared Vix dependency cache.

When multiple active modules use the same Git source, keep their revision and CMake requirements compatible. Vix rejects incompatible active requirements instead of silently selecting one.

## Recommended rule

Keep `vix.module` small. It should tell the reader what the module is, what it exposes, which route prefix it owns when it is routed, which external dependencies belong to the module, and whether it has tests. The application graph and module activation belong in `vix.app`; module metadata and module-owned dependency declarations belong in `vix.module`. Exact resolved dependency state belongs in the root `vix.lock`.

## Next step

Continue with dependency checks to see how module dependencies, the active module graph, and validation work together.

[Dependencies and Checks](/app-modules/dependencies-and-checks)
