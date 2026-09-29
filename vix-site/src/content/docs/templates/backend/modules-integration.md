# Modules Integration

The backend template is prepared for application modules from the beginning. A generated backend can run without any modules, but its startup flow already contains the integration point that Vix uses when modules are added later.

This matters because backend applications often grow by feature area. Authentication, projects, builds, packages, billing, logs, deployments, and permissions should not all become direct additions to `AppBootstrap.cpp`. The backend template keeps the application shell stable and lets feature modules connect through a generated registration bridge.

## Where modules connect

The generated backend connects modules from `AppBootstrap`.

```cpp
vix::app_generated::register_app_modules(app);
```

This call happens after the backend registers global middleware and base application routes.

```txt
AppBootstrap
  -> MiddlewareRegistry
  -> RouteRegistry
  -> generated app modules
  -> app.run(...)
```

The order is intentional. Global middleware is installed first, base application routes are registered next, and enabled feature modules are connected after that.

## Generated module bridge

The generated module bridge is exposed through:

```cpp
#include <vix_app_modules.hpp>
```

The backend template includes this header in `AppBootstrap.cpp`.

```cpp
#include <vix_app_modules.hpp>
```

The generated header gives the backend one stable function:

```cpp
vix::app_generated::register_app_modules(app);
```

When there are no active modules, this function can be empty. When modules are enabled in `vix.app`, Vix generates the registration code needed to connect them.

Conceptually, an enabled `auth` module may produce a registration bridge like this:

```cpp
void register_app_modules(vix::App &app)
{
  api::auth::AuthModule::register_routes(app);
}
```

The exact generated file is managed by Vix. The backend should call the stable generated function, not edit the generated output directly.

## Adding the first backend module

From the backend project root, initialize module support and add a module.

```bash
vix modules init
vix modules add auth
```

A backend module gives the feature its own folder, public entry point, controller, implementation files, tests, build file, and module manifest.

```txt
modules/auth/
  include/auth/
    AuthModule.hpp
    controllers/
      AuthController.hpp
  src/
    AuthModule.cpp
    controllers/
      AuthController.cpp
  migrations/
  tests/
    test_auth.cpp
  CMakeLists.txt
  vix.module
```

The module owns its feature route registration. The backend shell does not need to include `AuthController.hpp` directly.

## Module declaration in vix.app

In a `vix.app` backend, modules are declared in the root manifest.

```ini
[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = []
```

This declaration tells Vix that the backend has an `auth` module, where the module lives, what kind of module it is, and whether it should be part of the active application build.

A backend with more modules can describe its internal graph in the same file.

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

This keeps the backend architecture visible from the project root. A developer can see which modules are active and how they depend on each other without opening generated build files.

## Backend module entry point

A backend module exposes a public module class.

```txt
modules/auth/include/auth/AuthModule.hpp
```

The generated module class provides a stable entry point for route registration.

```cpp
namespace api::auth
{
  class AuthModule
  {
  public:
    static const char *name();
    static void register_routes(vix::App &app);
  };
}
```

The implementation delegates to the module controller.

```cpp
void AuthModule::register_routes(vix::App &app)
{
  controllers::AuthController::register_routes(app);
}
```

This is the important boundary. The backend shell registers enabled modules. The module owns how its routes are registered internally.

## Module controller

A backend module controller owns the feature routes.

```txt
modules/auth/include/auth/controllers/AuthController.hpp
modules/auth/src/controllers/AuthController.cpp
```

A generated starter controller may register a route such as:

```cpp
void AuthController::register_routes(vix::App &app)
{
  app.get("/api/auth", [](vix::Request &req, vix::Response &res)
  {
    (void)req;

    res.json({
      "ok", true,
      "module", "auth",
      "message", "Auth module is available"
    });
  });
}
```

As the feature grows, the module can add services, repositories, validators, migrations, and tests inside its own folder. The backend `RouteRegistry` does not need to become the owner of every feature route.

## Module manifest

Each module also contains a `vix.module` file.

```txt
modules/auth/vix.module
```

For a backend module, it usually looks like this:

```ini
name = "auth"
kind = "backend"

[routes]
prefix = "/api/auth"

[tests]
enabled = true
```

The root `vix.app` decides whether the module is enabled in the application. The module’s own `vix.module` describes the module itself: its name, its kind, its route prefix, and its test setting.

The route prefix is useful because it documents route ownership and lets module checks detect duplicate route areas.

```txt
auth      -> /api/auth
projects  -> /api/projects
builds    -> /api/builds
packages  -> /api/packages
```

## Enabled and disabled modules

The `enabled` field controls whether the module is part of the active backend.

```ini
[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = []
```

An enabled backend module can be linked into the generated application target and registered through the generated module bridge.

A disabled module remains declared but is not wired into the active backend.

```ini
[module.billing]
enabled = false
path = "modules/billing"
kind = "backend"
depends = [
  "auth",
]
```

This is useful for unfinished features, temporary removals, or migrations. The module can remain in the repository without becoming part of the running application.

Use the CLI to change the state.

```bash
vix modules disable billing
vix modules enable billing
```

After changing module state, run the checks.

```bash
vix modules check
vix build
```

## Dependencies between modules

Backend modules should declare internal dependencies in `vix.app`.

```ini
[module.projects]
enabled = true
path = "modules/projects"
kind = "backend"
depends = [
  "auth",
]
```

This means `projects` depends on `auth`. The relationship should also be reflected in the module build file when one module uses another module’s public headers or symbols.

```cmake
target_link_libraries(api_projects
  PUBLIC
    api::auth
)
```

The manifest shows the application architecture. The CMake target relationship makes the build dependency explicit. Both should tell the same story.

## Module checks

Run module checks after adding modules, changing dependencies, enabling or disabling modules, moving module folders, or editing route prefixes.

```bash
vix modules check
```

For backend projects, the check command is part of the normal development rhythm.

```bash
vix modules check
vix build
```

Before a commit, use a stronger validation workflow.

```bash
vix modules check
vix check --tests --run
```

The check command catches problems such as missing module folders, enabled modules depending on disabled modules, undeclared dependencies, circular dependencies, duplicate route prefixes, and public headers that include private implementation paths.

## Keeping AppBootstrap clean

The backend template already calls the generated module bridge.

```cpp
vix::app_generated::register_app_modules(app);
```

Do not add every module controller directly to `AppBootstrap.cpp` when the project uses generated module registration.

Avoid this shape:

```cpp
#include <auth/controllers/AuthController.hpp>
#include <projects/controllers/ProjectsController.hpp>

controllers::AuthController::register_routes(app);
controllers::ProjectsController::register_routes(app);
```

That turns the bootstrap into a manual feature list. The better shape is to let the enabled module declarations drive the generated registration.

```ini
[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = []
```

Then let Vix generate the bridge and keep the bootstrap stable.

## Relationship with RouteRegistry

`RouteRegistry` owns base application routes.

```txt
GET /api
GET /health
GET /api/health
```

Backend modules own feature routes.

```txt
auth      -> /api/auth
projects  -> /api/projects
builds    -> /api/builds
```

This separation keeps the backend shell readable. The route registry remains focused on application-level routes, while each feature module owns its own route area and internal implementation.

## Generated files are output

When Vix builds a `vix.app` backend, it generates internal files under:

```txt
.vix/generated/app/
```

The module registration bridge is part of that generated output. It can be inspected when debugging, but it should not be edited by hand.

Change the source of truth instead:

```txt
vix.app
modules/auth/
modules/auth/vix.module
modules/auth/CMakeLists.txt
```

Then run:

```bash
vix modules check
vix build
```

This keeps the backend reproducible. Another developer can clone the project, run the same commands, and get the same generated build wiring.

## Recommended workflow

A normal module workflow in a generated backend looks like this:

```bash
vix modules init
vix modules add auth
vix modules list
vix modules check
vix build
```

Add another module when a feature needs its own boundary.

```bash
vix modules add projects
```

Then declare the dependency in `vix.app`.

```ini
[module.projects]
enabled = true
path = "modules/projects"
kind = "backend"
depends = [
  "auth",
]
```

Run the check again.

```bash
vix modules check
vix build
```

This keeps the backend shell stable while feature modules grow independently.

## Common mistakes

The most common mistake is adding feature controllers directly to `AppBootstrap.cpp` after modules are enabled. The bootstrap should call the generated module bridge once, and modules should own their route registration.

Another mistake is creating a module folder but not declaring it in `vix.app`. In a `vix.app` backend, the manifest is the active module graph.

A third mistake is enabling a module while one of its dependencies is disabled. The active module graph must be complete.

A fourth mistake is editing generated registration files under `.vix/generated/app/`. Those files are rebuilt by Vix. Edit the manifest and module files instead.

## Recommended rule

Use the backend template as the application shell. Keep startup in `AppBootstrap`, base routes in `RouteRegistry`, global middleware in `MiddlewareRegistry`, and feature routes inside backend modules. Let `vix.app` describe which modules are active, and let Vix generate the registration bridge from that manifest.

## Next step

Continue with production files to understand how the backend template uses `.env.example`, `vix.json`, runtime directories, and production metadata.

[Production Files](/templates/backend/production-files)
