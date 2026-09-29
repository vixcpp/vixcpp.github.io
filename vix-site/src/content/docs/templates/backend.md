# Backend Template

The backend template creates a structured Vix application for API services and production-oriented backends. It keeps the executable target simple, but gives the project a clearer internal shape from the beginning: startup is owned by `AppBootstrap`, routes are grouped through `RouteRegistry`, middleware is grouped through `MiddlewareRegistry`, and generated application modules can be connected without rewriting the main entry point.

Use this template when the project is meant to become a backend service rather than a small example application.

```bash
vix new api --template backend
```

For deployments where the frontend is hosted separately, generate the same backend shell without static files or templates:

```bash
vix new api --template backend --api-only
```

After creation, the normal first workflow is:

```bash
cd api
cp .env.example .env
vix build
vix run
curl http://localhost:8080/health
```

## What this template is for

The backend template is designed for C++ applications that need a stable backend shell. A small application can keep routes directly in `main.cpp`, but a backend usually grows into configuration, middleware, health checks, route groups, response helpers, runtime directories, tests, production tasks, and internal feature modules. The template gives those responsibilities a place before the project becomes difficult to reorganize.

It is still one executable application. The template does not split the backend into services, and it does not force every feature to become a module on day one. It creates a clean application shell that can run immediately, then gives the project enough structure to grow feature by feature.

## Generated project shape

A generated backend project follows this general layout:

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

  .env.example
  README.md
  vix.app
  vix.json
```

The important part is the separation of responsibilities. `main.cpp` starts the program, `AppBootstrap` owns startup, route and middleware registries keep HTTP wiring organized, and support helpers keep common response logic out of controllers.

When the project is created with `--api-only`, the same backend source structure is generated, but `public/`, `views/`, and the generated static frontend files are omitted. The generated bootstrap also skips template setup, static directory setup, and static-file compression middleware.

## Entry point

The generated `main.cpp` stays intentionally small.

```cpp
#include <api/app/AppBootstrap.hpp>

int main()
{
  api::app::AppBootstrap bootstrap;
  return bootstrap.run();
}
```

This file should remain the process entry point, not the place where the backend grows all its routes and setup code. The backend startup sequence belongs to `AppBootstrap`.

## AppBootstrap

`AppBootstrap` owns the backend startup flow. It loads configuration from `.env`, creates the `vix::App`, configures templates and static files when the standard backend scaffold is used, registers middleware, registers application routes, connects generated modules, then starts the server.

The generated flow is close to this:

```txt
main.cpp
  -> AppBootstrap
      -> vix::config::Config
      -> vix::App
      -> public files and views when generated
      -> MiddlewareRegistry
      -> RouteRegistry
      -> generated app modules
      -> app.run(cfg)
```

This keeps startup readable. When the backend grows, the bootstrap should still explain the application startup path without becoming a long list of feature controllers.

## Routes

The backend template creates a route registry.

```txt
include/api/presentation/routes/RouteRegistry.hpp
src/api/presentation/routes/RouteRegistry.cpp
```

The registry groups application-level routes in one place. The generated backend starts with a home API route and health routes.

```txt
GET /api
GET /health
GET /api/health
```

The controllers own the actual route handlers.

```txt
HomeController      basic API route
HealthController    health check routes
```

This structure keeps `AppBootstrap` from knowing about every controller directly. The bootstrap asks `RouteRegistry` to register routes, and the registry decides which controllers belong to the base backend shell.

## Middleware

The backend template also creates a middleware registry.

```txt
include/api/presentation/middleware/MiddlewareRegistry.hpp
src/api/presentation/middleware/MiddlewareRegistry.cpp
```

The generated middleware includes a basic production-oriented order: security headers, request logging, and an API marker header. It also leaves examples for common middleware such as CORS and rate limiting.

Middleware belongs in the registry because it affects the application as a whole. Feature-specific behavior can still live inside modules or controllers, but global HTTP behavior should remain visible from one place.

## Response helpers

The backend template includes JSON response helpers.

```txt
include/api/support/HttpResponses.hpp
src/api/support/HttpResponses.cpp
```

These helpers provide a small place for common response shapes, such as JSON errors, successful JSON payloads, and message responses. This avoids repeating the same response structure inside every controller.

A generated backend can use helpers such as:

```cpp
api::support::json_error(res, 404, "not_found", "Resource not found");
api::support::json_message(res, "Backend is running");
```

As the backend grows, support code like this can remain application-level when it is shared by the whole service, or move into modules when it belongs to a specific feature.

## Runtime directories

The backend template creates runtime-oriented directories.

```txt
public/
views/
storage/
```

`public/` is used for static files. `views/` can be used for templates when the backend needs to render files. `storage/` gives the application a local writable area for generated data, SQLite databases, uploads, logs, or other runtime files, depending on the project.

API-only backends do not generate `public/` or `views/`. Their resource list keeps `.env` and `storage`, but omits frontend and template resources.

These directories are also declared as resources in `vix.app`, so they are copied beside the built target.

```ini
resources = [
  ".env=.env",
  "public=public",
  "views=views",
  "storage=storage",
]
```

In API-only mode, the generated resource list is smaller:

```ini
resources = [
  ".env=.env",
  "storage=storage",
]
```

This matters because the executable runs from the build output, and the runtime files need to be available next to it.

The generated static home page also includes a small WebSocket status panel. By default it probes the local development WebSocket endpoint from the browser and shows whether the connection is open. This is useful after adding a runtime WebSocket module.

```bash
vix modules init
vix modules add live_chat --websocket --workflow attached
vix build
vix run
```

Use `--name` when the module name should be supplied as an option.

```bash
vix modules add --websocket --name notifications --workflow bridge
```

## Manifest

The backend template uses `vix.app` as the application manifest.

```txt
vix.app
```

The generated manifest describes one executable backend target.

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
```

Selected features can add definitions, compile options, link options, and linked targets. For example, ORM support can add:

```ini
defines = [
  "VIX_USE_ORM=1",
]

links = [
  "vix::vix",
  "vix::orm",
]
```

The manifest remains the source of truth for the backend target. Vix converts it into an internal CMake project under `.vix/generated/app/`.

## Project metadata

The backend template also generates `vix.json`.

```txt
vix.json
```

This file describes project metadata, tasks, and production-oriented configuration used by Vix commands. It can include tasks such as:

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

The split is important. `vix.app` describes the C++ target. `vix.json` describes the wider project workflow around that target.

## Environment file

The generated backend includes `.env.example`.

```txt
.env.example
```

Copy it before running the backend locally.

```bash
cp .env.example .env
```

The file documents runtime values such as server host, port, logging settings, storage path, database settings, ORM values, WebSocket settings, and production diagnostics. Standard backend projects also include public file and template settings. API-only backend projects omit those variables because they do not serve frontend files or views.

```dotenv
APP_NAME=api
APP_ENV=development
SERVER_HOST=0.0.0.0
SERVER_PORT=8080
DATABASE_ENGINE=sqlite
DATABASE_SQLITE_PATH=storage/api.db
```

Local values and secrets belong in `.env`. The generated `.env.example` documents what the project expects without committing real local secrets.

## Application modules

The backend template is ready for `vix modules`. The generated bootstrap includes the generated module registration bridge.

```cpp
vix::app_generated::register_app_modules(app);
```

That means backend features can later be added as application modules.

```bash
vix modules init
vix modules add auth
vix modules add projects
vix modules check
```

Modules are then declared in `vix.app`.

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

This keeps feature-specific routes and logic inside modules while the backend shell remains stable. `AppBootstrap` still owns startup; modules own their feature routes and implementation.

## Tests

The backend template includes a generated test target.

```txt
tests/
  test_basic.cpp
```

The generated test is small. It confirms that the test runner is wired and that the generated project can compile test targets.

Run tests with:

```bash
vix tests
```

For a stronger local validation, run:

```bash
vix check --tests --run
```

For module-based backends, run module checks before the full project check.

```bash
vix modules check
vix check --tests --run
```

## Difference from the application template

The application template is smaller. It creates a minimal Vix app, a module registry, a manifest, and a basic test.

The backend template is more structured. It creates a startup owner, route registry, middleware registry, controllers, support helpers, runtime directories, production metadata, environment configuration, and module integration.

Choose the application template when the project should start small. Choose the backend template when the project is already meant to be a backend service with a long-term structure.

## Difference from the web template

The backend and web templates both generate a structured Vix executable, but their intent is different.

The backend template is API-oriented. It starts with JSON routes such as `/api`, `/health`, and `/api/health`, and it prepares the project for backend services, production checks, and feature modules.

The web template is page-oriented. It renders HTML from `views/`, serves assets from `public/`, and starts with browser-facing routes such as `/` and `/dashboard`.

Use `backend` when the project is mainly an API or service. Use `backend --api-only` when the C++ process should expose only API routes and another frontend app is hosted separately. Use `web` when the project should render server-side HTML pages.

## Recommended workflow

A normal first backend session looks like this:

```bash
vix new api --template backend
cd api

cp .env.example .env
vix build
vix run
curl http://localhost:8080/health
```

For an API-only backend:

```bash
vix new api --template backend --api-only
cd api

cp .env.example .env
vix build
vix run
curl http://localhost:8080/api/health
```

When the backend starts using modules:

```bash
vix modules init
vix modules add auth
vix modules check
vix build
```

Before committing larger backend changes:

```bash
vix modules check
vix check --tests --run
```

## Next step

Continue with the generated layout to see each file created by the backend template and how the backend shell is organized.

[Generated Layout](/templates/backend/layout)
