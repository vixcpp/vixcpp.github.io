# Rendering Flow

The web template is built around a simple server-rendered flow: a request reaches the Vix application, global middleware runs, the route registry forwards the request to a controller, the controller prepares a template context, and the response renders an HTML file from `views/`.

This flow is intentionally direct. The browser does not need a separate frontend framework to show the first pages. The C++ backend owns the route, prepares the data, renders the template, and serves the final HTML response.

```txt id="web-rendering-flow-overview"
browser
  -> vix::App
      -> MiddlewareRegistry
      -> RouteRegistry
          -> PageController
              -> vix::template_::Context
              -> views/index.html
              -> HTML response
```

## Startup prepares rendering

Rendering is enabled during application startup. The generated `AppBootstrap` configures the template directory before routes are registered.

```cpp id="web-rendering-flow-bootstrap"
vix::config::Config cfg{".env"};
vix::App app;

app.templates("views");
app.static_dir("public", "/");

presentation::middleware::MiddlewareRegistry::register_all(app);
presentation::routes::RouteRegistry::register_all(app);

app.run(cfg);
```

The important line for rendering is:

```cpp id="web-rendering-flow-templates-call"
app.templates("views");
```

It tells the Vix application where HTML templates are stored. In the generated web template, those files live in the root `views/` directory.

```txt id="web-rendering-flow-views-dir"
views/
  base.html
  header.html
  index.html
  dashboard.html
```

Static files are mounted separately.

```cpp id="web-rendering-flow-static-call"
app.static_dir("public", "/");
```

That makes files such as `public/app.css` and `public/app.js` available to the rendered HTML pages.

## Request enters the app

When the browser opens the generated home page, it sends a request to `/`.

```txt id="web-rendering-flow-home-request"
GET /
```

The request first passes through global middleware registered by `MiddlewareRegistry`. The generated middleware adds basic security headers, logs the request, and marks the response as a web response.

```cpp id="web-rendering-flow-middleware"
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

Middleware does not render the page. It prepares the request and response pipeline before the matching route handler runs.

## RouteRegistry connects page routes

After middleware is registered, `AppBootstrap` calls the route registry.

```cpp id="web-rendering-flow-route-registry-call"
presentation::routes::RouteRegistry::register_all(app);
```

The generated route registry connects the page controller and health controller.

```cpp id="web-rendering-flow-route-registry"
void RouteRegistry::register_all(vix::App &app)
{
  controllers::PageController::register_routes(app);
  controllers::HealthController::register_routes(app);
}
```

For HTML pages, the important controller is `PageController`.

```txt id="web-rendering-flow-page-controller-path"
src/site/presentation/controllers/PageController.cpp
```

## PageController handles the route

The generated `PageController` owns the browser-facing page routes.

```txt id="web-rendering-flow-page-routes"
GET /
GET /dashboard
```

The home route creates a template context and renders `index.html`.

```cpp id="web-rendering-flow-home-controller"
void PageController::register_routes(vix::App &app)
{
  app.get("/", [](vix::Request &req, vix::Response &res)
  {
    (void)req;

    vix::template_::Context ctx;
    ctx.set("title", "Home");
    ctx.set("app_name", "site");
    ctx.set("user", "Guest");

    res.render("index.html", ctx);
  });
}
```

The controller is responsible for preparing the data that the template needs. The template is responsible for presenting that data as HTML.

## Template context

The template context is the bridge between C++ and HTML.

```cpp id="web-rendering-flow-context"
vix::template_::Context ctx;
ctx.set("title", "Home");
ctx.set("app_name", "site");
ctx.set("user", "Guest");
```

Each value added to the context becomes available inside the template.

```html id="web-rendering-flow-template-vars"
<h1>{{ title }}</h1>
<p>Hello {{ user }}.</p>
```

This is the main rendering pattern in the generated web template. The route handler prepares values in C++, then the view uses those values with template syntax.

## Rendering a view

The response renders the template with:

```cpp id="web-rendering-flow-render-call"
res.render("index.html", ctx);
```

The template name is resolved inside the configured views directory.

```txt id="web-rendering-flow-render-path"
views/index.html
```

The generated `index.html` extends the base layout.

```html id="web-rendering-flow-index-view"
{% extends "base.html" %} {% block content %}
<section class="hero">
  <p class="eyebrow">Vix Web</p>
  <h1>{{ title }}</h1>
  <p class="lead">
    Hello {{ user }}. Your Vix web backend is rendering HTML with layouts,
    includes, variables, and static assets.
  </p>

  <div class="actions">
    <a class="button primary" href="/dashboard">Open dashboard</a>
    <a class="button secondary" href="/health">Check health</a>
  </div>
</section>
{% endblock %}
```

The controller does not need to build a full HTML document as a string. It only selects the view and passes the context.

## Base layout

The generated base layout lives in:

```txt id="web-rendering-flow-base-path"
views/base.html
```

It defines the HTML document structure, loads the CSS and JavaScript files, includes the header partial, and exposes the page content block.

```html id="web-rendering-flow-base"
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{{ title }} - {{ app_name }}</title>
    <link rel="stylesheet" href="/app.css" />
  </head>
  <body>
    {% include "header.html" %}

    <main class="page">{% block content %}{% endblock %}</main>

    <script src="/app.js"></script>
  </body>
</html>
```

The base layout keeps shared HTML in one place. Individual page templates only define the content that changes from page to page.

## Header partial

The generated header is a partial template.

```txt id="web-rendering-flow-header-path"
views/header.html
```

It is included by the base layout.

```html id="web-rendering-flow-header"
<header class="site-header">
  <a class="brand" href="/">{{ app_name }}</a>

  <nav class="nav">
    <a href="/">Home</a>
    <a href="/dashboard">Dashboard</a>
    <a href="/health">Health</a>
  </nav>
</header>
```

This shows how shared page fragments can be split into separate files without duplicating markup in every view.

## Dashboard rendering

The generated dashboard route shows a richer context.

```cpp id="web-rendering-flow-dashboard-controller"
app.get("/dashboard", [](vix::Request &req, vix::Response &res)
{
  (void)req;

  vix::template_::Context ctx;
  ctx.set("title", "Dashboard");
  ctx.set("app_name", "site");
  ctx.set("user", "Guest");
  ctx.set("total_orders", 42);

  vix::template_::Array features;
  features.emplace_back("Server-rendered HTML");
  features.emplace_back("Layouts with extends");
  features.emplace_back("Partials with include");
  features.emplace_back("Static assets");

  ctx.set("features", features);

  res.render("dashboard.html", ctx);
});
```

The dashboard view reads those values and loops over the feature list.

```html id="web-rendering-flow-dashboard-view"
{% extends "base.html" %} {% block content %}
<section class="card">
  <p class="eyebrow">Dashboard</p>
  <h1>{{ title }}</h1>
  <p class="lead">Welcome back, {{ user }}.</p>

  <div class="stat">
    <span>Total orders</span>
    <strong>{{ total_orders }}</strong>
  </div>

  <h2>Enabled features</h2>

  <ul class="feature-list">
    {% for feature in features %}
    <li>{{ feature }}</li>
    {% endfor %}
  </ul>
</section>
{% endblock %}
```

This pattern is enough for many server-rendered pages: collect the values in C++, put them in the context, then let the template render the HTML.

## Static assets in rendered pages

The generated layout loads assets from `public/`.

```html id="web-rendering-flow-assets-html"
<link rel="stylesheet" href="/app.css" />
<script src="/app.js"></script>
```

Those URLs work because the bootstrap mounts `public/` at `/`.

```cpp id="web-rendering-flow-assets-mount"
app.static_dir("public", "/");
```

The source files are:

```txt id="web-rendering-flow-assets-files"
public/
  app.css
  app.js
```

The browser does not see the source directory name. It receives the mounted paths:

```txt id="web-rendering-flow-assets-urls"
/app.css
/app.js
```

## Runtime resource copying

The web template declares views and public assets as resources in `vix.app`.

```ini id="web-rendering-flow-resources"
resources = [
  ".env=.env",
  "public=public",
  "views=views",
  "storage=storage",
]
```

This is important because the built executable runs from the build output. The runtime files must be available beside it.

A typical runtime layout can look like this:

```txt id="web-rendering-flow-runtime-layout"
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

When a template cannot be found, check the runtime output before changing the route handler. The source file may exist in `views/`, but the executable needs it in the runtime directory after the build.

## Adding a new page

A new server-rendered page usually needs three small changes.

First, create the view.

```txt id="web-rendering-flow-new-page-file"
views/about.html
```

```html id="web-rendering-flow-new-page-view"
{% extends "base.html" %} {% block content %}
<section class="card">
  <p class="eyebrow">About</p>
  <h1>{{ title }}</h1>
  <p class="lead">{{ message }}</p>
</section>
{% endblock %}
```

Then register the route in `PageController`.

```cpp id="web-rendering-flow-new-page-route"
app.get("/about", [](vix::Request &req, vix::Response &res)
{
  (void)req;

  vix::template_::Context ctx;
  ctx.set("title", "About");
  ctx.set("app_name", "site");
  ctx.set("message", "This page is rendered by Vix.");

  res.render("about.html", ctx);
});
```

Finally, add a navigation link when the page should appear in the shared header.

```html id="web-rendering-flow-new-page-nav"
<a href="/about">About</a>
```

No change to `vix.app` is needed when only a new HTML view is added under an already copied `views/` directory. A change to `vix.app` is needed when you add a new C++ source file.

## Adding a new controller

When a page group becomes large, create a new controller instead of putting every route in `PageController`.

```txt id="web-rendering-flow-new-controller"
include/site/presentation/controllers/AdminController.hpp
src/site/presentation/controllers/AdminController.cpp
```

Connect it through `RouteRegistry`.

```cpp id="web-rendering-flow-new-controller-registry"
#include <site/presentation/controllers/AdminController.hpp>

void RouteRegistry::register_all(vix::App &app)
{
  controllers::PageController::register_routes(app);
  controllers::HealthController::register_routes(app);
  controllers::AdminController::register_routes(app);
}
```

Then add the new source file to `vix.app`.

```ini id="web-rendering-flow-new-controller-manifest"
sources = [
  "src/main.cpp",
  "src/site/app/AppBootstrap.cpp",
  "src/site/presentation/routes/RouteRegistry.cpp",
  "src/site/presentation/middleware/MiddlewareRegistry.cpp",
  "src/site/presentation/controllers/PageController.cpp",
  "src/site/presentation/controllers/HealthController.cpp",
  "src/site/presentation/controllers/AdminController.cpp",
]
```

The manifest must list every `.cpp` file that should be compiled into the web executable.

## What belongs in the controller

A page controller should prepare the data needed by the view and call `res.render`.

Good responsibilities include:

```txt id="web-rendering-flow-controller-responsibilities"
reading route parameters
checking request data
loading page data
building the template context
choosing the view to render
returning redirects or errors when needed
```

Avoid turning templates into hidden application logic. The controller should decide what data the page receives. The template should present that data.

## What belongs in the template

A template should handle presentation.

Good responsibilities include:

```txt id="web-rendering-flow-template-responsibilities"
layout
HTML structure
includes
blocks
variables
loops
small presentation conditions
```

Avoid putting complicated business decisions into templates. Complex decisions should happen in C++ before rendering.

## Health route does not render HTML

The generated health route returns JSON.

```txt id="web-rendering-flow-health-route"
GET /health
```

It belongs to `HealthController`, not `PageController`, because it is not a browser page. It is a simple operational endpoint for local checks, reverse proxies, deployment scripts, and monitoring tools.

```cpp id="web-rendering-flow-health-response"
res.json({
  "ok", true,
  "status", "ok",
  "service", "site",
  "template", "web"
});
```

This keeps browser-facing pages and operational checks separate.

## Common mistakes

The most common mistake is adding a new `.cpp` controller and forgetting to add it to `vix.app`. The route file can exist in the source tree, but it will not be compiled unless it is listed in `sources`.

Another mistake is adding a new view and then looking for it in the source tree while the executable is running from the build output. Since `views/` is a runtime resource, confirm that it is copied beside the built target.

A third mistake is putting too much logic inside templates. Templates should present the page. Controllers should prepare the data.

A fourth mistake is hard-coding asset paths that do not match the public mount. In the generated template, `public/` is mounted at `/`, so `public/app.css` is loaded as `/app.css`.

## Recommended rule

Keep the rendering flow simple. Configure templates in `AppBootstrap`, connect routes through `RouteRegistry`, prepare data in controllers, render files from `views/`, and keep static files in `public/`. When a page needs more data, expand the context. When a page group grows, create another controller and add its `.cpp` file to `vix.app`.

## Next step

Continue with routes and views to see how page routes, templates, layout files, and static assets work together in the generated web project.

[Routes and Views](/templates/web/routes-and-views)
