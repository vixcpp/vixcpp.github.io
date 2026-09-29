# Backend Modules

Backend modules are application modules designed for routed Vix backends. They group feature-specific HTTP routes, controllers, tests, metadata, and optional migrations under one module directory. A backend can keep its main startup flow stable while features such as `auth`, `projects`, `builds`, `packages`, or `billing` grow independently.

A backend module is still part of the same application. It is not a separate service, not a package by default, and not a replacement for the main application bootstrap. The main backend owns startup, configuration, middleware, shared routes, static files, and runtime setup. Backend modules own feature-specific routes and implementation.

## Basic layout

A generated backend module has this shape:

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

The module entry point is `AuthModule`. The controller owns the default route registration. The `vix.module` file stores module metadata such as the module name, kind, route prefix, and test settings. The `migrations/` directory gives backend features a place to keep database changes when they need them.

For a module named `projects`, the generated class names follow the module name:

```txt
ProjectsModule
ProjectsController
```

For a module named `user_profile`, Vix generates:

```txt
UserProfileModule
UserProfileController
```

## Creating a backend module

Start from a backend-style `vix.app` project and initialize module support.

```bash
vix modules init
```

Then add the module.

```bash
vix modules add auth
```

In a backend project, Vix creates a routed backend module and registers it in `vix.app`.

```ini
[module.auth]
enabled = true
path = modules/auth
kind = backend
```

After creating the module, inspect the manifest state.

```bash
vix modules list
```

Then validate the module layer before building.

```bash
vix modules check
vix build
```

## The module entry point

The module class is the public entry point used by the generated application registration code.

```cpp
class AuthModule
{
public:
  static const char *name();
  static void register_routes(vix::App &app);
};
```

The generated implementation is intentionally small. It returns the module name and delegates route registration to the controller.

```cpp
const char *AuthModule::name()
{
  return "auth";
}

void AuthModule::register_routes(vix::App &app)
{
  controllers::AuthController::register_routes(app);
}
```

This keeps the module boundary clear. The application only needs a stable module entry point. The feature can then organize its controllers, services, repositories, validators, or other internal files behind that boundary.

## Controllers

A generated backend module starts with one controller.

```txt
modules/auth/
  include/auth/controllers/AuthController.hpp
  src/controllers/AuthController.cpp
```

The controller exposes a static `register_routes` function.

```cpp
class AuthController
{
public:
  static void register_routes(vix::App &app);
};
```

The generated route is minimal and exists to prove that the module is wired correctly.

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

A real module can replace this default route with its own endpoints.

```cpp
app.post("/api/auth/login", [](vix::Request &req, vix::Response &res)
{
  // Login logic.
});
```

Keep the controller focused on HTTP concerns. As the module grows, move business logic into module-owned services or domain files instead of putting everything inside route handlers.

## Module metadata

Backend modules include a `vix.module` file.

```ini
name = "auth"
kind = "backend"

[routes]
prefix = "/api/auth"

[tests]
enabled = true
```

The `kind` tells Vix that this is a backend module. The route prefix gives the module a clear HTTP namespace and lets `vix modules check` detect duplicate prefixes across routed modules.

Two backend modules should not claim the same route prefix.

```ini
[routes]
prefix = "/api/auth"
```

If two modules use the same prefix, the module check command reports the conflict. This helps prevent route ownership from becoming ambiguous as the backend grows.

## Declaration in vix.app

In a `vix.app` backend, the active module graph is declared from the root manifest.

```ini
[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = []
```

The declaration says that `auth` is an enabled backend module located at `modules/auth`. When the project is built, Vix uses the enabled module declarations to load and wire the module targets.

A module can depend on another module.

```ini
[module.projects]
enabled = true
path = "modules/projects"
kind = "backend"
depends = [
  "auth",
]
```

This means `projects` uses `auth`. The relationship is visible from the application manifest and can be checked by the CLI.

## Enabled and disabled modules

A backend module can stay in the repository while being disabled from the active application.

```bash
vix modules disable auth
```

This updates the manifest.

```ini
[module.auth]
enabled = false
path = "modules/auth"
kind = "backend"
depends = []
```

Disabled modules are not deleted. They remain declared and can stay on disk, but they are not wired into the generated application target. This is useful for features that are being prepared, reviewed, or temporarily removed from the current build.

Enable the module again with:

```bash
vix modules enable auth
```

After changing module state, run the check command.

```bash
vix modules check
```

## Registration in the backend

A generated backend keeps startup in `AppBootstrap`. The bootstrap creates the Vix app, mounts public files, registers middleware, registers the main application routes, then registers enabled app modules through the generated module bridge.

```txt
main.cpp
  -> AppBootstrap
      -> MiddlewareRegistry
      -> RouteRegistry
      -> vix::app_generated::register_app_modules(app)
      -> app.run(...)
```

The important point is that the backend does not need to manually include every module controller in `AppBootstrap`. Enabled modules are read from `vix.app`, and Vix generates the bridge that calls each module’s `register_routes` function.

This keeps the application bootstrap stable. Adding `auth`, `projects`, or `billing` should not turn startup code into a long list of feature-specific includes.

## Generated registration bridge

When a backend uses `vix.app`, Vix generates a small registration file under the internal generated app directory. That generated code includes the enabled routed modules and calls their module entry points.

Conceptually, the generated bridge behaves like this:

```cpp
void register_app_modules(vix::App &app)
{
  api::auth::AuthModule::register_routes(app);
  api::projects::ProjectsModule::register_routes(app);
}
```

The generated files belong to Vix. They can be inspected when debugging, but they should not be edited by hand. The source of truth is the module declaration in `vix.app`.

## CMake target

Each backend module has its own CMake target.

```txt
api_auth
```

It also exposes an alias target.

```txt
api::auth
```

The backend module target compiles the module implementation files, exposes the module public headers, and links the Vix runtime target needed by routed modules.

When one module depends on another, the dependency should be visible through the module graph and through the build target relationship.

```cmake
target_link_libraries(api_projects
  PUBLIC
    api::auth
)
```

This makes the dependency clear to CMake and to the developer reading the module structure.

## Migrations

Backend modules include a `migrations/` directory because many backend features eventually need database changes.

```txt
modules/auth/
  migrations/
```

This directory is intentionally empty at first. Use it when the feature owns schema changes or data migrations that belong to the module.

A project may still keep global migrations at the application level. Use module migrations when the database change is clearly owned by one feature. Use application-level migrations when the change belongs to the application as a whole or spans several features.

## Tests

Generated backend modules include a test file.

```txt
modules/auth/
  tests/test_auth.cpp
```

The default test checks that the module exposes its generated name. It is small, but it proves that the module header, target, and test wiring are valid.

As the module grows, keep tests close to the feature they protect. Authentication tests should live with `auth`. Project tests should live with `projects`. This makes the module easier to review because the implementation and its tests evolve together.

Run module checks and tests as part of the normal local workflow.

```bash
vix modules check
vix check --tests --run
```

## Adding real feature code

The generated backend module is only a starting point. A real module can grow its own internal structure under `include/<module>/` and `src/`.

```txt
modules/auth/
  include/auth/
    AuthModule.hpp
    controllers/
      AuthController.hpp
    services/
      AuthService.hpp
  src/
    AuthModule.cpp
    controllers/
      AuthController.cpp
    services/
      AuthService.cpp
```

Keep public headers under `include/auth/` when they are meant to be used outside the module. Keep implementation details under `src/` when they should remain private.

For example, the controller can call a module-owned service.

```cpp
void AuthController::register_routes(vix::App &app)
{
  app.post("/api/auth/login", [](vix::Request &req, vix::Response &res)
  {
    (void)req;

    // Call module-owned auth logic here.
    res.json({
      "ok", true,
      "message", "login route"
    });
  });
}
```

The module structure should make ownership visible. If a file belongs to authentication, it should normally live inside `modules/auth/`.

## Backend modules outside generated templates

Backend modules are easiest to use in a backend `vix.app` project because the application template already includes the generated module registration point. Existing C++ projects can still use the module layout, but they may need to connect routed modules manually if they do not use the generated Vix application bootstrap.

For a classic CMake project, `vix modules add <name>` creates a normal C++ module skeleton by default. That is still useful for organizing code into public headers, private implementation files, tests, and module targets. If the project wants backend-style routed modules, it can follow the same layout and call the module entry point from its own application startup code.

```cpp
api::auth::AuthModule::register_routes(app);
```

This keeps the module system useful outside a fully generated Vix backend while making it clear that automatic route registration depends on the `vix.app` generated application workflow.

## Recommended workflow

A normal backend module workflow looks like this:

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

Run the checks again after changing dependencies.

```bash
vix modules check
vix build
```

## Next step

Continue with the `vix.app` integration guide to understand how enabled backend modules are loaded from the root manifest and connected to the generated application build.

[Using with vix.app](/app-modules/with-vix-app)
