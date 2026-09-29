# Generated Layout

The backend template generates a structured Vix application with a small process entry point and a clear backend shell. The project is still one executable target, but the generated files separate startup, routes, middleware, response helpers, runtime resources, tests, and production workflow metadata.

A generated backend named `api` follows this general shape:

```txt
api/
  include/
    api/
      app/
        AppBootstrap.hpp
      presentation/
        controllers/
          HomeController.hpp
          HealthController.hpp
        middleware/
          MiddlewareRegistry.hpp
        routes/
          RouteRegistry.hpp
      support/
        HttpResponses.hpp

  src/
    main.cpp
    api/
      app/
        AppBootstrap.cpp
      presentation/
        controllers/
          HomeController.cpp
          HealthController.cpp
        middleware/
          MiddlewareRegistry.cpp
        routes/
          RouteRegistry.cpp
      support/
        HttpResponses.cpp

  public/
  views/
  storage/
  migrations/
  tests/
    test_basic.cpp
    vix.app

  .env.example
  README.md
  vix.app
  vix.json
```

When generated with `--api-only`, the layout keeps the backend source tree, storage, migrations, tests, `.env`, `.env.example`, `vix.app`, `vix.json`, and README, but omits `public/` and `views/`.

Some generated versions may also include additional configuration files such as `config/production.json`. The core backend layout stays the same: the root `vix.app` describes the backend executable, `vix.json` describes project workflow and production metadata, and the source tree keeps backend responsibilities separated.

## `src/main.cpp`

The backend entry point is deliberately small.

```txt
src/main.cpp
```

It includes the generated bootstrap header, creates an `AppBootstrap` instance, and delegates startup to it.

```cpp
#include <api/app/AppBootstrap.hpp>

int main()
{
  api::app::AppBootstrap bootstrap;
  return bootstrap.run();
}
```

This file should stay boring. It starts the process and hands control to the backend bootstrap. Routes, middleware, configuration, optional static files, module registration, and server startup belong elsewhere.

## `include/<project>/app/AppBootstrap.hpp`

The public bootstrap declaration lives under the project include tree.

```txt
include/api/app/AppBootstrap.hpp
```

`AppBootstrap` owns the startup sequence of the backend application. The class is intentionally non-copyable and exposes one main operation:

```cpp
int run();
```

The header gives `main.cpp` a stable public entry point without exposing the whole startup implementation.

## `src/<project>/app/AppBootstrap.cpp`

The bootstrap implementation is the center of the generated backend startup flow.

```txt
src/api/app/AppBootstrap.cpp
```

It loads runtime configuration from `.env`, creates the `vix::App`, configures public files and views for the standard backend scaffold, registers middleware, registers base application routes, connects generated application modules, and finally starts the server.

The generated flow is:

```txt
AppBootstrap::run()
  -> vix::config::Config cfg{".env"}
  -> vix::App app
  -> configure static files and views when generated
  -> MiddlewareRegistry::register_all(app)
  -> RouteRegistry::register_all(app)
  -> vix::app_generated::register_app_modules(app)
  -> app.run(cfg)
```

This is the main reason the backend template stays readable as it grows. The bootstrap owns startup, but it delegates the details of middleware, routes, and modules to focused files.

## `presentation/controllers`

The backend template generates two base controllers.

```txt
include/api/presentation/controllers/
  HomeController.hpp
  HealthController.hpp

src/api/presentation/controllers/
  HomeController.cpp
  HealthController.cpp
```

`HomeController` registers the default API route.

```txt
GET /api
```

`HealthController` registers health check routes.

```txt
GET /health
GET /api/health
```

These routes are small, but they prove that the backend is reachable and correctly wired. They also give the project a clear pattern for adding future application-level controllers.

Feature-specific controllers should normally move into application modules when the backend grows.

## `presentation/routes`

The route registry groups application-level route registration.

```txt
include/api/presentation/routes/RouteRegistry.hpp
src/api/presentation/routes/RouteRegistry.cpp
```

The generated implementation calls the base controllers.

```cpp
void RouteRegistry::register_all(vix::App &app)
{
  controllers::HomeController::register_routes(app);
  controllers::HealthController::register_routes(app);
}
```

This keeps `AppBootstrap` from including every controller directly. The bootstrap calls the route registry once, and the registry owns the list of base application routes.

## `presentation/middleware`

The middleware registry groups global HTTP middleware.

```txt
include/api/presentation/middleware/MiddlewareRegistry.hpp
src/api/presentation/middleware/MiddlewareRegistry.cpp
```

The generated backend starts with middleware for security headers, request logging, and a simple API marker header. It also leaves commented examples for common middleware such as CORS and rate limiting.

Middleware is placed in a registry because it affects the request pipeline as a whole. Keeping it in one file makes the order visible and avoids scattering global HTTP behavior through unrelated controllers.

## `support/HttpResponses`

The backend template includes JSON response helpers.

```txt
include/api/support/HttpResponses.hpp
src/api/support/HttpResponses.cpp
```

These helpers keep common response shapes out of controllers.

```cpp
api::support::json_error(res, 404, "not_found", "Resource not found");
api::support::json_ok(res, data);
api::support::json_message(res, "Backend is running");
```

This file is not meant to contain all application logic. It is a small shared support layer for response formatting. As features grow, feature-specific response logic can live inside modules.

## `public/`

The standard backend scaffold includes `public/` for static files.

```txt
public/
```

The backend bootstrap can mount this directory so files can be served by the application at runtime.

The directory is also declared as a runtime resource in `vix.app`.

```ini
resources = [
  "public=public",
]
```

This allows the built backend to find the directory beside the executable.

API-only backends do not generate `public/`, do not write static files such as `index.html`, `app.css`, `app.js`, `status.html`, `status.css`, or `status.js`, and do not call `app.static_dir(...)`.

## `views/`

The standard backend scaffold includes `views/` for templates.

```txt
views/
```

The backend template is API-oriented, but it still provides a place for views because some backend services need simple HTML pages, error views, diagnostics, admin pages, or generated documentation.

For a project whose main purpose is server-rendered HTML, the `web` template is usually a better fit.

API-only backends do not generate `views/` and do not call `app.templates(...)`.

## `storage/`

The `storage/` directory gives the backend a local runtime area.

```txt
storage/
```

It can be used for generated files, local SQLite databases, uploads, temporary files, or other application-owned runtime data. The generated `.env.example` uses this shape for SQLite by default:

```dotenv
DATABASE_SQLITE_PATH=storage/api.db
```

The directory is also copied as a resource so the runtime layout remains predictable after the build.

```ini
resources = [
  "storage=storage",
]
```

## `tests/`

The backend template includes a test directory.

```txt
tests/
  test_basic.cpp
  vix.app
```

The generated test source defines its own `main()` and uses the Vix test runner. It does not include the application `main.cpp`, because tests are separate executables.

The test manifest describes the generated test target.

```ini
name = "api_tests"
type = "executable"
standard = "c++20"
output_dir = "bin"

sources = [
  "test_basic.cpp",
]

include_dirs = [
  "../include",
  "../src",
]

packages = [
  "vix",
]

links = [
  "vix::vix",
]
```

Run the test workflow with:

```bash
vix tests
```

For a stronger local validation:

```bash
vix check --tests --run
```

## `.env.example`

The generated backend includes an example environment file.

```txt
.env.example
```

Copy it before running the backend locally.

```bash
cp .env.example .env
```

The file documents the expected runtime values: application name, environment, server host and port, TLS options, logging settings, storage path, database settings, ORM values, WebSocket settings, and production diagnostics. Standard backend projects also include public file and template settings. API-only backend projects omit those variables.

```dotenv
APP_NAME=api
APP_ENV=development
SERVER_HOST=0.0.0.0
SERVER_PORT=8080
DATABASE_ENGINE=sqlite
DATABASE_SQLITE_PATH=storage/api.db
```

The example file should be committed. The real `.env` file should hold local values and secrets.

## `vix.app`

The root `vix.app` file describes the backend executable.

```txt
vix.app
```

It lists the generated source files, include roots, definitions, packages, linked targets, runtime resources, and output directory.

```ini
name = "api"
type = "executable"
standard = "c++20"
output_dir = "bin"

sources = [
  "src/main.cpp",
  "src/api/app/AppBootstrap.cpp",
  "src/api/support/HttpResponses.cpp",
  "src/api/presentation/routes/RouteRegistry.cpp",
  "src/api/presentation/middleware/MiddlewareRegistry.cpp",
  "src/api/presentation/controllers/HomeController.cpp",
  "src/api/presentation/controllers/HealthController.cpp",
]

include_dirs = [
  "include",
  "src",
]

defines = [
  "VIX_BACKEND_APP=1",
  "VIX_APP_NAME=api",
]

packages = [
  "vix",
]

links = [
  "vix::vix",
]

resources = [
  ".env=.env",
  "public=public",
  "views=views",
  "storage=storage",
]
```

API-only backends omit frontend/template resources:

```ini
resources = [
  ".env=.env",
  "storage=storage",
]
```

When Vix builds the project, it converts this manifest into an internal CMake project under:

```txt
.vix/generated/app/
```

The generated files are not the source of truth. Edit `vix.app` when the backend target changes.

## `vix.json`

The root `vix.json` file describes project metadata, tasks, and production-oriented workflow settings.

```txt
vix.json
```

It can include tasks such as:

```json
{
  "tasks": {
    "dev": "vix dev",
    "build": "vix build",
    "check": "vix check --tests --run",
    "test": "vix tests",
    "env": "vix env check",
    "health": "vix health",
    "logs": "vix logs",
    "service": "vix service status",
    "proxy": "vix proxy nginx check",
    "doctor": "vix doctor production",
    "deploy": "vix deploy"
  }
}
```

It can also hold production metadata for service configuration, ports, reverse proxy settings, health checks, deploy behavior, logs, environment requirements, and database defaults.

The split is important:

```txt
vix.app   -> C++ target manifest
vix.json  -> project workflow and production metadata
.env      -> local runtime values and secrets
```

## `README.md`

The generated README gives the project a local starting guide.

```txt
README.md
```

It should explain the quick start, layout, important routes, configuration, build commands, and production workflow. The README belongs to the generated project itself, while these documentation pages explain the template in more detail.

## Optional production config

Some backend template versions include a production configuration file.

```txt
config/production.json
```

When present, it records production defaults such as the app name, server settings, logging format, public files, templates, storage, database path, health routes, and WebSocket defaults.

Use this file for structured runtime defaults when the project needs it. Keep secrets and machine-specific values in `.env`.

## How the pieces work together

The backend template is organized around a stable startup path.

```txt
src/main.cpp
  -> AppBootstrap
      -> Config
      -> vix::App
      -> public/ and views/ when generated
      -> MiddlewareRegistry
      -> RouteRegistry
      -> generated app modules
      -> app.run(...)
```

The project files have separate responsibilities.

```txt
main.cpp                      process entry point
AppBootstrap                  startup owner
MiddlewareRegistry            global HTTP middleware
RouteRegistry                 base application routes
HomeController                default API route
HealthController              health routes
HttpResponses                 shared JSON response helpers
public/                       static files in the standard backend scaffold
views/                        templates in the standard backend scaffold
storage/                      runtime data
migrations/                   database migration space
tests/                        generated test target
vix.app                       backend executable manifest
vix.json                      project workflow and production metadata
.env.example                  documented runtime variables
```

This is the main value of the backend template. It gives the project a structure that can grow without making the entry point or bootstrap absorb every feature.

## Next step

Continue with the App Bootstrap page to understand the generated startup flow in detail.

[App Bootstrap](/templates/backend/app-bootstrap)
