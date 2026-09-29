# Using with vix.app

`vix.app` is the preferred place to describe application modules in a Vix application project. The manifest already describes the application target, its source files, include roots, packages, links, resources, and output directory. Module declarations extend that same file with the internal feature graph of the application.

This keeps the project readable from the root. A developer can open `vix.app` and see not only how the main application is built, but also which internal modules are active, where they live, what kind of modules they are, and which modules depend on other modules.

## Basic declaration

A module is declared with a `[module.<name>]` section.

```ini
[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = []
```

The section name is the module name. In this example, the module is `auth`. The `path` points to the module directory, `kind` describes the module role, and `depends` lists other application modules that this module uses.

A backend with several modules may look like this:

```ini
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

[module.builds]
enabled = true
path = "modules/builds"
kind = "backend"
depends = [
  "projects",
]
```

This makes the internal architecture visible without opening the generated build files. The reader can see that `projects` depends on `auth`, and that `builds` depends on `projects`.

## Creating modules from the CLI

In a `vix.app` project, modules are usually created through the CLI.

```bash
vix modules init
vix modules add auth
```

When the project contains a `vix.app` file, `vix modules add <name>` creates the module skeleton and registers the module in the manifest.

```ini
[module.auth]
enabled = true
path = modules/auth
kind = backend
```

After creating a module, inspect the manifest state with:

```bash
vix modules list
```

Then run the module checks before building.

```bash
vix modules check
vix build
```

This workflow keeps the file structure, manifest declaration, and generated build wiring aligned.

WebSocket modules use the same manifest flow.

```bash
vix modules add live_chat --websocket --workflow attached
```

The module name can be positional or explicit.

```bash
vix modules add live_chat --websocket
vix modules add --websocket --name live_chat
```

Both forms declare the same module in `vix.app`.

```ini
[module.live_chat]
enabled = true
path = modules/live_chat
kind = websocket.attached
```

Runtime WebSocket workflows such as `attached`, `standalone`, and `bridge` can provide the generated application runtime. The `websocket.client` workflow is different: it generates client/helper code and does not expose a runtime `run(...)` entry point.

## Enabled modules

The `enabled` field controls whether a module participates in the generated application target.

```ini
[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = []
```

An enabled module is part of the active module graph. Vix loads it into the generated build and, for routed modules, includes it in the generated registration bridge.

A disabled module remains declared, but it is not wired into the active application target.

```ini
[module.billing]
enabled = false
path = "modules/billing"
kind = "backend"
depends = [
  "auth",
]
```

This is useful when a feature is being prepared or temporarily removed from the current build. The module can stay in the repository and in the manifest without becoming part of the running application.

Use the CLI to change the state:

```bash
vix modules disable billing
vix modules enable billing
```

After enabling or disabling modules, run:

```bash
vix modules check
```

The check command catches invalid states such as an enabled module depending on a disabled module.

## Module paths

The default module path is:

```txt
modules/<name>
```

For a module named `auth`, the default path is:

```txt
modules/auth
```

The path is written relative to the project root.

```ini
[module.auth]
path = "modules/auth"
```

A project can use a different path when it already has its own feature layout.

```ini
[module.auth]
enabled = true
path = "features/auth"
kind = "backend"
depends = []
```

The default `modules/<name>` convention is still recommended for new projects because it is easy to scan and works naturally with `vix modules`.

## Module kind

The `kind` field describes the role of the module inside the application.

```ini
kind = "backend"
```

For backend applications, use `backend`. Backend modules are routed modules: they expose a module entry point, register HTTP routes, and usually include a controller and a route prefix in `vix.module`.

A regular application may use service-style modules when the module is routed but not part of the production backend template.

```ini
kind = "service"
```

Generated WebSocket modules use a more specific kind.

```ini
kind = "websocket.attached"
kind = "websocket.standalone"
kind = "websocket.bridge"
kind = "websocket.client"
```

The suffix matches the selected WebSocket workflow. Runtime workflows participate in generated application startup. `websocket.client` is intentionally treated as non-runtime support code.

Simple internal code modules may use:

```ini
kind = "module"
```

The value should describe the role of the module in the application. A feature that owns backend routes should be a backend module. A reusable internal library that does not register routes can stay as a simple module.

## Dependencies

The `depends` field records internal module dependencies.

```ini
[module.projects]
enabled = true
path = "modules/projects"
kind = "backend"
depends = [
  "auth",
]
```

This means the `projects` module depends on the `auth` module. The relationship is part of the application architecture and should be visible from the manifest.

Dependencies are declared by module name, not by CMake target name.

```ini
depends = [
  "auth",
]
```

When one module depends on another, the module build target should also express that relationship.

```cmake
target_link_libraries(api_projects
  PUBLIC
    api::auth
)
```

The manifest makes the dependency understandable at the application level. The CMake target relationship makes it correct at the build level.

Run the check command after changing dependencies.

```bash
vix modules check
```

The command reports undeclared dependencies, enabled modules depending on disabled modules, and circular dependency chains.

## Registry dependencies owned by modules

A module can also own registry dependencies in its `vix.module` file. This is useful when the package is part of one feature implementation and should not be presented as a dependency of the whole application shell.

```bash
vix add gk/jwt@^1.0.0 --module auth
```

The command updates `modules/auth/vix.module`.

```ini
[deps]
registry = [
  "gk/jwt@^1.0.0",
]

links = [
  "gk::jwt",
]
```

The root `vix.app` still decides whether `auth` is enabled. When it is enabled, Vix merges the module registry dependencies into the application dependency resolution, refreshes the root `vix.lock`, and injects the module link targets into the generated CMake build. When the module is disabled, its dependency metadata remains in the module folder but does not participate in the active generated build.

Use `--link` when the package exports a CMake target that does not match the default `namespace::name` form.

```bash
vix add gk/jwt@^1.0.0 --module auth --link gk::jwt
```

## Generated build wiring

When Vix builds a `vix.app` project, it generates the internal CMake project under:

```txt
.vix/generated/app/
```

For modules, the generated build uses the enabled module declarations from `vix.app`. A module folder may exist on disk without being loaded if it is not enabled in the manifest.

The generated CMake flow loads the active modules through the module loader created by `vix modules init`.

```txt
cmake/vix_modules.cmake
```

In `vix.app` mode, the generated build defines the enabled module list, and the loader only loads those modules. This is what allows disabled modules to remain on disk without becoming part of the active application target.

The generated files can be inspected while debugging, but they should not be edited by hand. The source of truth is the root `vix.app` file.

## Generated route registration

For routed modules such as backend modules, Vix also generates a registration bridge.

Conceptually, the generated code looks like this:

```cpp
void register_app_modules(vix::App &app)
{
  api::auth::AuthModule::register_routes(app);
  api::projects::ProjectsModule::register_routes(app);
}
```

The actual generated file is managed by Vix. The application uses the stable generated entry point:

```cpp
vix::app_generated::register_app_modules(app);
```

This is why generated Vix applications and backends can keep their startup code stable. Adding a module updates the manifest and the module files. The startup flow does not need to become a long list of manually included module controllers.

## Application template integration

A generated Vix application has a small module registry.

```txt
include/app/ModuleRegistry.hpp
src/app/ModuleRegistry.cpp
```

The application entry point calls:

```cpp
app::ModuleRegistry::register_all(app);
```

The registry delegates to the generated module bridge.

```cpp
void ModuleRegistry::register_all(vix::App &app)
{
  vix::app_generated::register_app_modules(app);
}
```

This gives simple applications one stable place where internal modules are connected.

## Backend template integration

A generated backend uses `AppBootstrap` as the startup owner. The bootstrap creates the Vix app, loads configuration, mounts public files when the standard backend scaffold includes them, registers middleware, registers the main routes, then registers enabled modules.

```txt
main.cpp
  -> AppBootstrap
      -> MiddlewareRegistry
      -> RouteRegistry
      -> vix::app_generated::register_app_modules(app)
      -> app.run(...)
```

The backend template keeps the main routes in `RouteRegistry`. Feature-specific module routes are registered through the generated module bridge. This keeps the backend bootstrap readable as the application grows.

## CMake fallback

A `vix.app` file is only the active project input when the project root does not contain a root `CMakeLists.txt`.

```txt
1. CMakeLists.txt
2. vix.app
```

If both files exist, Vix treats the project as an existing CMake project and uses the root `CMakeLists.txt`. This matters during migration. A project can prepare a `vix.app` manifest while still using CMake, but the manifest becomes active only after the root CMake file is removed or moved out of the way.

For a pure `vix.app` module workflow, the project root should look like this:

```txt
api/
  src/
  include/
  modules/
  vix.app
  vix.json
```

The generated CMake files under `.vix/generated/app/` are internal to the Vix workflow.

## Checking the manifest

Use `vix modules list` to inspect module declarations.

```bash
vix modules list
```

This shows the module name, status, kind, path, filesystem state, and dependencies. It is the fastest way to confirm that the manifest describes the module graph you expect.

Use `vix modules check` to validate the structure.

```bash
vix modules check
```

The check command is especially important after editing `vix.app` manually. It catches missing module folders, missing module metadata, invalid dependency relationships, cycles, duplicate route prefixes, and public/private boundary violations.

## Recommended workflow

A normal `vix.app` module workflow looks like this:

```bash
vix modules init
vix modules add auth
vix modules add projects
vix modules list
vix modules check
vix build
```

Then declare dependencies in `vix.app`.

```ini
[module.projects]
enabled = true
path = "modules/projects"
kind = "backend"
depends = [
  "auth",
]
```

After changing the module graph, run the checks again.

```bash
vix modules check
vix build
```

This keeps the application manifest, module folders, generated build wiring, and route registration in sync.

## Next step

Continue with the CMake integration guide to see how application modules can be used in projects that keep a root `CMakeLists.txt`.

[Using with CMake](/app-modules/with-cmake)
