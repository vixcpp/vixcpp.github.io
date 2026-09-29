# Generated Layout

The web template generates a server-rendered Vix application. The project is still one C++ executable, but the generated layout separates the web startup flow, page routes, middleware, views, public assets, tests, runtime files, and project metadata.

A generated web project named `site` follows this general shape:

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
    test_basic.cpp
    vix.app

  .env.example
  README.md
  vix.app
  vix.json
```

The important idea is that the web template has a page-oriented structure. `AppBootstrap` starts the app, `PageController` renders HTML, `HealthController` exposes a health route, `RouteRegistry` connects controllers, `MiddlewareRegistry` installs global HTTP behavior, `views/` contains templates, and `public/` contains static files.

## `src/main.cpp`

The process entry point is small.

```txt
src/main.cpp
```

It includes the generated bootstrap header, creates the bootstrap object, and delegates startup to it.

```cpp
#include <site/app/AppBootstrap.hpp>

int main()
{
  site::app::AppBootstrap bootstrap;
  return bootstrap.run();
}
```

This file should stay focused on starting the application. Template setup, static file mounting, middleware, and route registration belong to the generated web shell, not to `main.cpp`.

## `include/<project>/app/AppBootstrap.hpp`

The bootstrap declaration lives under the project include tree.

```txt
include/site/app/AppBootstrap.hpp
```

The generated class exposes one main operation:

```cpp
int run();
```

`AppBootstrap` owns the startup sequence of the web application. It is the public object that `main.cpp` uses to start the process.

## `src/<project>/app/AppBootstrap.cpp`

The bootstrap implementation lives in:

```txt
src/site/app/AppBootstrap.cpp
```

This file creates the Vix application, loads `.env`, configures the template directory, mounts the public asset directory, registers middleware, registers routes, and starts the server.

The generated flow is:

```txt
AppBootstrap::run()
  -> vix::config::Config cfg{".env"}
  -> vix::App app
  -> app.templates("views")
  -> app.static_dir("public", "/")
  -> MiddlewareRegistry::register_all(app)
  -> RouteRegistry::register_all(app)
  -> app.run(cfg)
```

The web template keeps this flow simple because the purpose of the generated project is clear: render pages from `views/` and serve assets from `public/`.

## `presentation/controllers`

The web template generates two controllers.

```txt
include/site/presentation/controllers/
  PageController.hpp
  HealthController.hpp

src/site/presentation/controllers/
  PageController.cpp
  HealthController.cpp
```

`PageController` owns browser-facing page routes.

```txt
GET /
GET /dashboard
```

`HealthController` owns the health check route.

```txt
GET /health
```

This keeps HTML page logic away from the bootstrap. The bootstrap starts the application, while controllers decide how HTTP routes respond.

## `PageController`

`PageController` renders HTML templates through the Vix template engine.

```txt
src/site/presentation/controllers/PageController.cpp
```

The generated home route creates a template context and renders `index.html`.

```cpp
vix::template_::Context ctx;
ctx.set("title", "Home");
ctx.set("app_name", "site");
ctx.set("user", "Guest");

res.render("index.html", ctx);
```

The dashboard route demonstrates a slightly richer context with a number and a list.

```cpp
vix::template_::Array features;
features.emplace_back("Server-rendered HTML");
features.emplace_back("Layouts with extends");
features.emplace_back("Partials with include");
features.emplace_back("Static assets");

ctx.set("features", features);

res.render("dashboard.html", ctx);
```

These examples are small on purpose. They show how a C++ controller can prepare data and render a server-side view.

## `HealthController`

The generated health controller exposes a JSON health check.

```txt
src/site/presentation/controllers/HealthController.cpp
```

The route is:

```txt
GET /health
```

It returns a small JSON response with the service name and template type.

```cpp
res.json({
  "ok", true,
  "status", "ok",
  "service", "site",
  "template", "web"
});
```

This route is useful for local checks, deployment scripts, reverse proxies, and monitoring tools.

## `presentation/routes`

Route wiring lives in the route registry.

```txt
include/site/presentation/routes/RouteRegistry.hpp
src/site/presentation/routes/RouteRegistry.cpp
```

The generated implementation connects the page controller and health controller.

```cpp
void RouteRegistry::register_all(vix::App &app)
{
  controllers::PageController::register_routes(app);
  controllers::HealthController::register_routes(app);
}
```

This keeps `AppBootstrap` small. The bootstrap asks the route registry to register routes, and the registry decides which base controllers belong to the web application.

## `presentation/middleware`

Global middleware lives in the middleware registry.

```txt
include/site/presentation/middleware/MiddlewareRegistry.hpp
src/site/presentation/middleware/MiddlewareRegistry.cpp
```

The generated middleware includes security headers, request logging, and a basic web marker header.

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

The middleware registry is the right place for global web behavior such as security headers, request logging, rate limiting, body limits, and other request pipeline concerns.

## `views/`

The `views/` directory contains server-rendered HTML templates.

```txt
views/
  base.html
  header.html
  index.html
  dashboard.html
```

The generated bootstrap configures this directory with:

```cpp
app.templates("views");
```

The generated views demonstrate the basic template patterns used by a web project: a base layout, an included header, page templates, variables, blocks, and loops.

## `views/base.html`

`base.html` is the main layout.

```txt
views/base.html
```

It defines the document structure, loads the generated CSS and JavaScript, includes the header partial, and exposes the main content block.

```html
{% include "header.html" %}

<main class="page">{% block content %}{% endblock %}</main>
```

Page templates extend this layout instead of repeating the full HTML document.

## `views/header.html`

`header.html` is a partial template.

```txt
views/header.html
```

It renders the generated site header and navigation.

```html
<header class="site-header">
  <a class="brand" href="/">{{ app_name }}</a>

  <nav class="nav">
    <a href="/">Home</a>
    <a href="/dashboard">Dashboard</a>
    <a href="/health">Health</a>
  </nav>
</header>
```

This file demonstrates how shared HTML fragments can be included from the base layout.

## `views/index.html`

`index.html` is the generated home page.

```txt
views/index.html
```

It extends the base layout and fills the content block.

```html
{% extends "base.html" %} {% block content %}
<section class="hero">
  <p class="eyebrow">Vix Web</p>
  <h1>{{ title }}</h1>
  <p class="lead">
    Hello {{ user }}. Your Vix web backend is rendering HTML with layouts,
    includes, variables, and static assets.
  </p>
</section>
{% endblock %}
```

The values such as `title`, `user`, and `app_name` are set by the C++ controller before rendering.

## `views/dashboard.html`

`dashboard.html` is the generated example dashboard page.

```txt
views/dashboard.html
```

It demonstrates variables and loops.

```html
<strong>{{ total_orders }}</strong>

<ul class="feature-list">
  {% for feature in features %}
  <li>{{ feature }}</li>
  {% endfor %}
</ul>
```

The controller builds the `features` array in C++ and passes it to the template context.

## `public/`

The `public/` directory contains static files.

```txt
public/
  app.css
  app.js
```

The generated bootstrap mounts the directory at `/`.

```cpp
app.static_dir("public", "/");
```

That means these files are served as:

```txt
/app.css
/app.js
```

The generated `base.html` references them directly.

```html
<link rel="stylesheet" href="/app.css" />
<script src="/app.js"></script>
```

## `public/app.css`

The generated stylesheet gives the starter pages a complete visual layout.

```txt
public/app.css
```

It defines the page background, header, navigation, hero section, cards, buttons, stats, and responsive behavior. It is only a starting point. A real project can replace it, split it, or move to its own asset pipeline later.

## `public/app.js`

The generated JavaScript file is intentionally small.

```txt
public/app.js
```

It logs that the web app is running.

```js
console.log("site web app is running");
```

This file exists to show where browser-side JavaScript belongs in the server-rendered template.

## `storage/`

The `storage/` directory is a local runtime directory.

```txt
storage/
```

A web project may use it later for generated files, local data, uploads, cache files, or other application-owned runtime data. The generated project creates it so the runtime layout is ready without forcing the developer to invent a storage location later.

## `tests/`

The generated web project includes a test directory.

```txt
tests/
  test_basic.cpp
  vix.app
```

The generated test source defines its own `main()` and uses the Vix test runner. It does not include the application `main.cpp`.

The test manifest describes the generated test executable.

```ini
name = "site_web_tests"
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

defines = [
  "VIX_WEB_TESTS=1",
  "VIX_APP_NAME=site",
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

For a stronger check:

```bash
vix check --tests --run
```

## `.env.example`

The generated web project includes an example environment file.

```txt
.env.example
```

Copy it before running the project locally.

```bash
cp .env.example .env
```

The file documents runtime values such as application name, environment, template type, server settings, logging settings, public path, views path, template settings, storage path, and production diagnostics.

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

The example file is safe to commit. The real `.env` file should contain local or deployment-specific values.

## `vix.app`

The root `vix.app` describes the web executable.

```txt
vix.app
```

It lists the C++ sources, include roots, definitions, packages, links, output directory, and runtime resources.

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

The important distinction is that C++ files belong in `sources`, while HTML views, CSS, JavaScript, `.env`, and storage directories belong in `resources`.

## `vix.json`

The root `vix.json` describes project metadata, tasks, and production workflow information.

```txt
vix.json
```

A generated web project can include tasks such as:

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

`vix.json` is not the target manifest. It describes workflow and production metadata around the project. The C++ target belongs in `vix.app`.

## `README.md`

The generated README gives the project a local starting guide.

```txt
README.md
```

It explains the quick start, project layout, generated routes, templates, static files, configuration, commands, and production workflow. It belongs to the generated project itself, while these documentation pages explain the template in more detail.

## Configuration files

The web template keeps runtime values in `.env` and project workflow metadata in `vix.json`.

Some internal template code can produce a structured production configuration, but the generated web project should not create two competing production configuration files by default. Keep the rule simple:

```txt
vix.json      -> Vix workflow and production metadata
.env          -> local runtime values and secrets
.env.example  -> documented expected variables
```

This avoids confusion between runtime configuration and project orchestration configuration.

## How the pieces work together

The generated web project has a simple request flow.

```txt
browser
  -> vix::App
      -> MiddlewareRegistry
      -> RouteRegistry
          -> PageController
              -> Context
              -> views/*.html
          -> HealthController
      -> public/
```

The project files have separate responsibilities.

```txt
main.cpp                  process entry point
AppBootstrap              startup owner
MiddlewareRegistry        global HTTP middleware
RouteRegistry             route wiring
PageController            server-rendered page routes
HealthController          health route
views/                    HTML templates
public/                   CSS and JavaScript
storage/                  runtime data
tests/                    generated test target
vix.app                   web executable manifest
vix.json                  project workflow and production metadata
.env.example              documented runtime variables
```

This separation is what makes the web template useful. It gives the project a small but real server-rendered structure without requiring a separate frontend framework.

## Next step

Continue with the rendering flow to understand how the generated web app turns a C++ route handler into an HTML response.

[Rendering Flow](/templates/web/rendering-flow)
