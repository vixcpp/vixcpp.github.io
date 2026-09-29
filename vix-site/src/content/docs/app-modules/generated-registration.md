# Generated Registration

Generated registration is the bridge between the modules declared in `vix.app` and the application that runs them. It lets the application keep a stable startup flow while Vix connects the enabled modules behind the scenes.

In a module-based backend, the main application should not need to include every module controller by hand. Adding `auth`, `projects`, or `billing` should not turn `main.cpp` or `AppBootstrap.cpp` into a long list of feature-specific includes. The application should have one clear integration point, and the active module list should come from the project manifest.

That is the role of the generated registration bridge.

## The idea

A routed module exposes a public entry point.

```cpp
class AuthModule
{
public:
  static const char *name();
  static void register_routes(vix::App &app);
};
```

The module owns its internal route registration.

```cpp
void AuthModule::register_routes(vix::App &app)
{
  controllers::AuthController::register_routes(app);
}
```

When the module is enabled in `vix.app`, Vix can generate the code that calls this entry point from the application startup flow.

```ini
[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = []
```

Conceptually, the generated bridge behaves like this:

```cpp
void register_app_modules(vix::App &app)
{
  api::auth::AuthModule::register_routes(app);
}
```

The real generated file is managed by Vix. The developer edits the module declaration and the module source files, not the generated bridge.

## The generated entry point

Vix exposes one stable function for registering application modules.

```cpp
vix::app_generated::register_app_modules(app);
```

Generated Vix application templates and backend templates call this function from their normal startup path. This gives modules one place to connect to the running application without forcing every module to be manually wired in the application shell.

The generated header is included as:

```cpp
#include <vix_app_modules.hpp>
```

That file belongs to the generated application build. It can be inspected when debugging, but it should not become the place where application design is edited.

## Application template flow

A generated Vix application uses a small module registry.

```txt
include/app/ModuleRegistry.hpp
src/app/ModuleRegistry.cpp
```

The entry point creates the Vix app, registers its base route, then delegates module wiring to the registry.

```cpp
app::ModuleRegistry::register_all(app);
```

The registry calls the generated bridge.

```cpp
void ModuleRegistry::register_all(vix::App &app)
{
  vix::app_generated::register_app_modules(app);
}
```

This keeps `main.cpp` small. The application can grow through modules without turning the entry point into the place where every feature is connected manually.

```txt
main.cpp
  -> app::ModuleRegistry
      -> vix::app_generated::register_app_modules(app)
```

## Backend template flow

A generated backend uses `AppBootstrap` as the startup owner. The bootstrap creates the Vix application, loads configuration, mounts public files when the standard backend scaffold includes them, registers middleware, registers the main application routes, then registers enabled modules.

```txt
main.cpp
  -> AppBootstrap
      -> MiddlewareRegistry
      -> RouteRegistry
      -> vix::app_generated::register_app_modules(app)
      -> app.run(...)
```

This order keeps the backend readable. Middleware and application-level routes stay in the backend shell. Feature-specific routes live in modules and are connected through the generated bridge.

For example, `RouteRegistry` can own base routes such as:

```txt
GET /api
GET /health
GET /api/health
```

A module such as `auth` can own its feature routes:

```txt
GET /api/auth
POST /api/auth/login
```

The backend does not need to include `AuthController.hpp` directly from `AppBootstrap.cpp`. The enabled module declaration is enough for Vix to generate the registration bridge.

## What Vix reads

The generated registration is built from the active module declarations in `vix.app`.

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
```

Only enabled routed modules are wired into the generated registration bridge. A disabled module can remain declared and remain on disk, but it is not connected to the application startup flow.

```ini
[module.billing]
enabled = false
path = "modules/billing"
kind = "backend"
depends = [
  "auth",
]
```

This lets a project keep unfinished modules in the repository without making them part of the running application.

Runtime WebSocket modules are handled separately from routed HTTP registration. A WebSocket module generated with `attached`, `standalone`, or `bridge` can provide a runtime `run(...)` entry point for the generated application. A module generated with the `client` workflow is ignored by runtime generation because it is support code and does not own startup.

```ini
[module.live_chat]
enabled = true
path = "modules/live_chat"
kind = "websocket.attached"
depends = []
```

The generated application currently supports one runtime application module at a time. Keep additional WebSocket modules as `websocket.client` or non-runtime support modules unless the application runtime is explicitly designed to compose them.

## Routed modules

Generated registration is mainly useful for routed modules. A backend module is routed because it exposes `register_routes(vix::App &app)` and owns HTTP routes through a controller.

```txt
modules/auth/
  include/auth/AuthModule.hpp
  include/auth/controllers/AuthController.hpp
  src/AuthModule.cpp
  src/controllers/AuthController.cpp
  vix.module
```

The module metadata gives the module a route prefix.

```ini
name = "auth"
kind = "backend"

[routes]
prefix = "/api/auth"

[tests]
enabled = true
```

The prefix is not the registration mechanism by itself. The registration still happens through the module entry point. The prefix gives the module a clear HTTP namespace and gives `vix modules check` a way to detect duplicate route ownership.

## Generated files are not the source of truth

When Vix uses `vix.app`, it generates internal build files under:

```txt
.vix/generated/app/
```

The generated module registration files are part of that internal output. They are produced from the manifest and the enabled module list.

Do not edit generated registration files to add or remove modules. Edit `vix.app` instead.

```ini
[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = []
```

Then rebuild or run the normal workflow.

```bash
vix modules check
vix build
```

This keeps the project state reproducible. Another developer should be able to clone the project, run the same commands, and get the same generated registration bridge.

## Adding a module

The usual workflow is to add the module through the CLI.

```bash
vix modules add auth
```

In a backend `vix.app` project, this creates the backend module skeleton and appends a module declaration to the manifest.

```ini
[module.auth]
enabled = true
path = modules/auth
kind = backend
```

After that, inspect the module list and run the checks.

```bash
vix modules list
vix modules check
vix build
```

The next build regenerates the internal application build input and includes the enabled module in the registration bridge.

## Enabling and disabling registration

Because generated registration follows the `enabled` field, enabling or disabling a module changes whether it is connected to the application.

```bash
vix modules disable auth
```

The manifest becomes:

```ini
[module.auth]
enabled = false
path = "modules/auth"
kind = "backend"
depends = []
```

The module remains on disk, but the generated application registration no longer calls `AuthModule::register_routes`.

Enable it again with:

```bash
vix modules enable auth
```

After changing module state, run:

```bash
vix modules check
vix build
```

The check command catches invalid states, such as an enabled module depending on a disabled module, before the build tries to generate or compile the application.

## Dependencies and registration order

Module dependencies should be declared in `vix.app`.

```ini
[module.projects]
enabled = true
path = "modules/projects"
kind = "backend"
depends = [
  "auth",
]
```

This tells the application that `projects` depends on `auth`. The dependency is part of the module graph and should also be reflected in the module build target when one module uses another.

```cmake
target_link_libraries(api_projects
  PUBLIC
    api::auth
)
```

The generated registration bridge should be treated as an output of the module graph. The project should not rely on manual ordering inside generated files. Keep dependencies explicit, run `vix modules check`, and let Vix produce the registration bridge from the active manifest state.

## Existing CMake projects

Generated registration is most natural in a `vix.app` project because Vix controls the generated application build and can produce the module bridge automatically.

In a classic CMake project, `vix modules` can still create the module layout and module targets.

```bash
vix modules init
vix modules add auth
```

The module can expose a backend-style entry point if the project chooses that layout.

```cpp
api::auth::AuthModule::register_routes(app);
```

But an existing CMake project that does not use the generated Vix application bootstrap may need to call that entry point manually from its own startup code. The module system can still provide structure, targets, public headers, and checks, but automatic application registration belongs to the `vix.app` generated application workflow.

## Common mistakes

The first mistake is editing generated files under `.vix/generated/app/`. Those files are rebuilt by Vix. Any change made there can disappear on the next build. The module declaration in `vix.app` is the correct place to change active modules.

The second mistake is adding module controllers directly to `AppBootstrap.cpp` while also using generated registration. That creates two competing wiring paths. The backend shell should register the generated module bridge once, and modules should register their own routes through their module entry point.

The third mistake is expecting a disabled module to be registered. Disabled modules remain declared, but they are not part of the generated registration bridge.

## Recommended workflow

Use the CLI to create modules, keep the manifest as the active module graph, and run checks before building.

```bash
vix modules init
vix modules add auth
vix modules list
vix modules check
vix build
```

When the module graph changes, repeat the check and build steps.

```bash
vix modules check
vix build
```

This keeps the application startup stable while modules are added, removed, enabled, disabled, or reorganized.

## Next step

Continue with the module manifest guide to understand the `vix.module` file inside each module.

[Module Manifest](/app-modules/module-manifest)
