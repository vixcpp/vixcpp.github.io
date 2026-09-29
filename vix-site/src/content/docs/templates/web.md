# Web Template

The web template creates a server-rendered Vix application. It is built for projects that return HTML pages from the backend, serve static assets from `public/`, and keep browser-facing routes inside C++ controllers.

This template is different from the backend template. A backend project is usually API-first and starts with JSON routes such as `/api` and `/health`. A web project is page-first. It starts with routes such as `/`, `/dashboard`, and `/health`, then renders HTML through the Vix template engine.

```bash
vix new site --template web
```

After creation, the normal first workflow is:

```bash
cd site
cp .env.example .env
vix dev
curl http://localhost:8080/health
```

## What this template is for

Use the web template when the application should render pages on the server. It is a good fit for dashboards, internal tools, admin panels, documentation sites, small business applications, and web projects that do not need a separate frontend framework at the beginning.

The generated project gives you a C++ application with a clear startup flow, page controllers, a route registry, a middleware registry, views, public assets, a local environment file, a `vix.app` manifest, and project workflow metadata in `vix.json`.

It is still a Vix application. The difference is that the first-class output is HTML, not only JSON.

## Generated project shape

A generated web project follows this general layout:

```txt
site/
  include/
    site/
      app/
        AppBootstrap.hpp
      presentation/
        controllers/
          PageController.hpp
          HealthController.hpp
        middleware/
          MiddlewareRegistry.hpp
        routes/
          RouteRegistry.hpp

  src/
    main.cpp
    site/
      app/
        AppBootstrap.cpp
      presentation/
        controllers/
          PageController.cpp
          HealthController.cpp
        middleware/
          MiddlewareRegistry.cpp
        routes/
          RouteRegistry.cpp

  views/
    base.html
    header.html
    index.html
    dashboard.html

  public/
    app.css
    app.js

  storage/
  tests/

  .env.example
  README.md
  vix.app
  vix.json
```

The layout keeps the web shell small and readable. Startup belongs to `AppBootstrap`, page routes belong to `PageController`, health checks belong to `HealthController`, route wiring belongs to `RouteRegistry`, and global HTTP behavior belongs to `MiddlewareRegistry`.

## Entry point

The generated `main.cpp` is intentionally small.

```cpp
#include <site/app/AppBootstrap.hpp>

int main()
{
  site::app::AppBootstrap bootstrap;
  return bootstrap.run();
}
```

The entry point should stay focused on starting the process. It should not become the place where page routes, static files, middleware, or template setup are written by hand.

## AppBootstrap

`AppBootstrap` owns the startup sequence of the generated web app.

The generated flow is:

```txt
main.cpp
  -> AppBootstrap
      -> vix::config::Config
      -> vix::App
      -> app.templates("views")
      -> app.static_dir("public", "/")
      -> MiddlewareRegistry
      -> RouteRegistry
      -> app.run(cfg)
```

The bootstrap loads `.env`, creates the Vix app, configures the template directory, mounts the static asset directory, registers middleware, registers routes, and starts the server.

The generated setup is simple:

```cpp
vix::config::Config cfg{".env"};
vix::App app;

app.templates("views");
app.static_dir("public", "/");

presentation::middleware::MiddlewareRegistry::register_all(app);
presentation::routes::RouteRegistry::register_all(app);

app.run(cfg);
```

This is the core of the web template. The app is ready to render templates and serve public assets without requiring a separate JavaScript frontend.

## Views

The web template generates HTML views under:

```txt
views/
```

The starter views are:

```txt
base.html
header.html
index.html
dashboard.html
```

The generated templates demonstrate the basic features expected from a server-rendered web app: layouts, blocks, includes, variables, and loops.

```html
{% extends "base.html" %} {% block content %}
<section class="hero">
  <h1>{{ title }}</h1>
  <p>Hello {{ user }}.</p>
</section>
{% endblock %}
```

The base layout includes the header and exposes a content block.

```html
{% include "header.html" %}

<main class="page">{% block content %}{% endblock %}</main>
```

The page controller creates the template context and renders the view.

```cpp
vix::template_::Context ctx;
ctx.set("title", "Home");
ctx.set("app_name", "site");
ctx.set("user", "Guest");

res.render("index.html", ctx);
```

## Public assets

Static files live under:

```txt
public/
```

The generated project starts with:

```txt
public/
  app.css
  app.js
```

The bootstrap mounts this directory at `/`.

```cpp
app.static_dir("public", "/");
```

That means files such as `public/app.css` and `public/app.js` are available as:

```txt
/app.css
/app.js
```

The generated `base.html` uses those paths directly.

```html
<link rel="stylesheet" href="/app.css" />
<script src="/app.js"></script>
```

## Routes

The generated web project starts with three routes.

```txt
GET /             HTML home page
GET /dashboard    HTML dashboard page
GET /health       JSON health check
```

The page routes are registered from `PageController`.

```txt
src/site/presentation/controllers/PageController.cpp
```

The health route is registered from `HealthController`.

```txt
src/site/presentation/controllers/HealthController.cpp
```

The route registry connects both controllers.

```cpp
void RouteRegistry::register_all(vix::App &app)
{
  controllers::PageController::register_routes(app);
  controllers::HealthController::register_routes(app);
}
```

This keeps `AppBootstrap` small. The bootstrap asks the route registry to register routes, and the registry decides which controllers belong to the generated web shell.

## Middleware

The web template creates a middleware registry.

```txt
include/site/presentation/middleware/MiddlewareRegistry.hpp
src/site/presentation/middleware/MiddlewareRegistry.cpp
```

The generated middleware starts with security headers, request logging, and a simple web marker header.

```cpp
app.use(vix::middleware::app::security_headers_dev(false));

app.use([](vix::Request &req, vix::Response &res, vix::App::Next next)
{
  (void)res;

  vix::log::info("{} {}", req.method(), req.path());
  next();
});

app.use([](vix::Request &req, vix::Response &res, vix::App::Next next)
{
  (void)req;

  res.header("X-Web", "true");
  next();
});
```

The registry is the right place for global web behavior such as security headers, logging, rate limiting, body limits, or other middleware that should apply before page routes are handled.

## Manifest

The web template uses `vix.app` as the application manifest.

```txt
vix.app
```

The generated manifest describes one executable web target.

```ini
name = "site"
type = "executable"
standard = "c++20"
output_dir = "bin"

sources = [
  "src/main.cpp",
  "src/site/app/AppBootstrap.cpp",
  "src/site/presentation/routes/RouteRegistry.cpp",
  "src/site/presentation/middleware/MiddlewareRegistry.cpp",
  "src/site/presentation/controllers/PageController.cpp",
  "src/site/presentation/controllers/HealthController.cpp",
]

include_dirs = [
  "include",
  "src",
]

defines = [
  "VIX_WEB_APP=1",
  "VIX_APP_NAME=site",
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

The source list describes the C++ files compiled into the executable. The resources list describes runtime files copied beside the built target.

This distinction matters. HTML views, CSS, JavaScript, and storage directories are runtime resources, not C++ source files.

## Project metadata

The generated web project also includes `vix.json`.

```txt
vix.json
```

This file describes project metadata, tasks, and production-oriented workflow settings for Vix commands.

A generated web project can expose tasks such as:

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

The split is clear:

```txt
vix.app   -> C++ target manifest
vix.json  -> project workflow and production metadata
.env      -> runtime values
views/    -> HTML templates
public/   -> static assets
```

## Environment file

The web template includes `.env.example`.

```txt
.env.example
```

Copy it before running the project locally.

```bash
cp .env.example .env
```

The generated environment file documents values such as the application name, template type, server settings, logging settings, public path, views path, storage path, and production diagnostics.

```dotenv
APP_NAME=site
APP_ENV=development
APP_TEMPLATE=web

SERVER_HOST=0.0.0.0
SERVER_PORT=8080

PUBLIC_PATH=public
VIEWS_PATH=views
TEMPLATE_AUTO_ESCAPE_HTML=true
TEMPLATE_CACHE=true

STORAGE_PATH=storage
```

The real `.env` file can hold local or deployment-specific values. The example file should stay safe to commit.

## Runtime resources

The generated manifest copies the runtime directories beside the built target.

```ini
resources = [
  ".env=.env",
  "public=public",
  "views=views",
  "storage=storage",
]
```

A runtime output may look like this:

```txt
bin/
  site
  .env
  public/
    app.css
    app.js
  views/
    base.html
    header.html
    index.html
    dashboard.html
  storage/
```

This is why `resources` is important. The executable runs from the build output, so the templates and static files must be available there.

If the application cannot find a view or a static file, check the resource list and the output directory before changing the C++ code.

## Difference from the backend template

The web and backend templates both use `AppBootstrap`, `RouteRegistry`, `MiddlewareRegistry`, `vix.app`, `vix.json`, `.env.example`, and runtime resources. Their purpose is different.

The backend template is API-oriented. It starts with JSON routes and prepares the project for backend services, production checks, and feature modules.

The web template is page-oriented. It starts with server-rendered HTML, template views, public assets, and browser-facing routes.

Choose the web template when the first interface of the project is HTML rendered by the server. Choose the backend template when the project is mainly an API service.

## Difference from the Vue template

The web template renders HTML directly from the Vix backend. The Vue template creates a separate Vue frontend under `frontend/` and uses Vite during development.

The web template:

```txt
Vix renders HTML from views/
Vix serves public assets
No separate frontend build required at the start
```

The Vue template:

```txt
Vue owns the browser UI
Vite runs the frontend dev server
Vix owns the backend API
/api is proxied to the Vix backend
```

Use the web template when server-rendered pages are enough. Use the Vue template when the frontend needs to be a separate Vue application.

## Tests

The web template includes a generated test target.

```txt
tests/
  test_basic.cpp
  vix.app
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

The test target is separate from the application target. It defines its own `main()` and should not include the application `main.cpp`.

## Recommended workflow

A normal first session with the web template looks like this:

```bash
vix new site --template web
cd site

cp .env.example .env
vix dev
```

Then open:

```txt
http://127.0.0.1:8080
```

Check the health route:

```bash
curl http://localhost:8080/health
```

For validation:

```bash
vix build
vix tests
vix check --tests --run
```

## Common mistakes

The most common mistake is choosing the web template when the project really needs a separate frontend application. If the browser UI will be built with Vue, use the Vue template instead.

Another mistake is treating `views/` and `public/` as source files. They are runtime resources. They should be copied through `resources`, not compiled through `sources`.

A third mistake is adding a new controller `.cpp` file and forgetting to add it to `vix.app`. Source files must be listed in the manifest before they are compiled.

A fourth mistake is hard-coding runtime paths in C++ when they should be configuration values. Keep local runtime values in `.env` and document them in `.env.example`.

## Recommended rule

Use the web template when Vix should own the HTTP server and render HTML on the server. Keep startup in `AppBootstrap`, page handlers in controllers, route wiring in `RouteRegistry`, middleware in `MiddlewareRegistry`, templates in `views/`, assets in `public/`, and runtime values in `.env`.

## Next step

Continue with the generated layout to see each file created by the web template and what role it plays in the project.

[Generated Layout](/templates/web/layout)
