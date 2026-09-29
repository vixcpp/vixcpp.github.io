# Routes and Views

The web template connects C++ route handlers to HTML templates. A route receives the request, prepares a template context, and renders a file from `views/`. The view then uses layouts, includes, variables, and loops to produce the final HTML response.

This page focuses on the generated page routes and the template files they render.

```txt id="web-routes-views-flow"
RouteRegistry
  -> PageController
      -> vix::template_::Context
      -> views/index.html
      -> views/dashboard.html
```

## Generated routes

A new web project starts with three routes.

```txt id="web-routes-views-generated-routes"
GET /             HTML home page
GET /dashboard    HTML dashboard page
GET /health       JSON health check
```

The first two routes render HTML. They are owned by `PageController`.

```txt id="web-routes-views-page-controller"
src/site/presentation/controllers/PageController.cpp
```

The health route returns JSON. It is owned by `HealthController`.

```txt id="web-routes-views-health-controller"
src/site/presentation/controllers/HealthController.cpp
```

This separation keeps browser pages and operational checks clear. Page routes render templates. Health routes give infrastructure a simple endpoint to check.

## RouteRegistry

The generated route registry connects the controllers to the running application.

```txt id="web-routes-views-registry-files"
include/site/presentation/routes/RouteRegistry.hpp
src/site/presentation/routes/RouteRegistry.cpp
```

The implementation is intentionally small.

```cpp id="web-routes-views-registry-code"
void RouteRegistry::register_all(vix::App &app)
{
  controllers::PageController::register_routes(app);
  controllers::HealthController::register_routes(app);
}
```

`AppBootstrap` calls the registry during startup.

```cpp id="web-routes-views-bootstrap-call"
presentation::routes::RouteRegistry::register_all(app);
```

This keeps startup readable. The bootstrap knows when routes are registered, but the registry owns which base controllers are connected.

## PageController

`PageController` owns the browser-facing page routes.

```txt id="web-routes-views-page-controller-files"
include/site/presentation/controllers/PageController.hpp
src/site/presentation/controllers/PageController.cpp
```

The generated controller exposes one route registration function.

```cpp id="web-routes-views-page-controller-header"
namespace site::presentation::controllers
{
  class PageController
  {
  public:
    static void register_routes(vix::App &app);
  };
}
```

The controller is the place where C++ prepares the data needed by a page. It should not build large HTML strings by hand. It should collect values, put them into a template context, and render the correct view.

## Home route

The generated home route handles:

```txt id="web-routes-views-home-route"
GET /
```

It creates a template context and renders `index.html`.

```cpp id="web-routes-views-home-code"
app.get("/", [](vix::Request &req, vix::Response &res)
{
  (void)req;

  vix::template_::Context ctx;
  ctx.set("title", "Home");
  ctx.set("app_name", "site");
  ctx.set("user", "Guest");

  res.render("index.html", ctx);
});
```

The route handler decides which values the view needs. The template decides how those values are displayed.

## Dashboard route

The generated dashboard route handles:

```txt id="web-routes-views-dashboard-route"
GET /dashboard
```

It demonstrates a context with simple values and an array.

```cpp id="web-routes-views-dashboard-code"
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

This example shows the normal pattern for server-rendered pages. The controller prepares the page data in C++, then the view renders that data with template syntax.

## Views directory

The generated views live in:

```txt id="web-routes-views-directory"
views/
  base.html
  header.html
  index.html
  dashboard.html
```

`AppBootstrap` registers the directory during startup.

```cpp id="web-routes-views-templates-call"
app.templates("views");
```

After this call, a route can render a view by name.

```cpp id="web-routes-views-render-call"
res.render("index.html", ctx);
```

The template name is resolved relative to the configured `views/` directory.

```txt id="web-routes-views-render-path"
views/index.html
```

## Base layout

The generated base layout is:

```txt id="web-routes-views-base-path"
views/base.html
```

It contains the shared HTML document structure.

```html id="web-routes-views-base-html"
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

The base layout keeps repeated HTML in one place. It loads the shared CSS and JavaScript, includes the header, and exposes a content block for page templates.

## Header partial

The generated header lives in:

```txt id="web-routes-views-header-path"
views/header.html
```

It is included from `base.html`.

```html id="web-routes-views-header-html"
<header class="site-header">
  <a class="brand" href="/">{{ app_name }}</a>

  <nav class="nav">
    <a href="/">Home</a>
    <a href="/dashboard">Dashboard</a>
    <a href="/health">Health</a>
  </nav>
</header>
```

A partial is useful for shared markup that should appear on multiple pages. In this template, the header partial keeps navigation outside individual page templates.

## Home view

The generated home view is:

```txt id="web-routes-views-index-path"
views/index.html
```

It extends the base layout and fills the content block.

```html id="web-routes-views-index-html"
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

The view receives `title`, `app_name`, and `user` from the C++ route handler. The base layout uses `title` and `app_name` for the document title, while the page content uses `title` and `user`.

## Dashboard view

The generated dashboard view is:

```txt id="web-routes-views-dashboard-path"
views/dashboard.html
```

It also extends the base layout.

```html id="web-routes-views-dashboard-html"
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

This page demonstrates a loop.

```html id="web-routes-views-loop"
{% for feature in features %}
<li>{{ feature }}</li>
{% endfor %}
```

The `features` value comes from the controller.

```cpp id="web-routes-views-features-context"
vix::template_::Array features;
features.emplace_back("Server-rendered HTML");
features.emplace_back("Layouts with extends");
features.emplace_back("Partials with include");
features.emplace_back("Static assets");

ctx.set("features", features);
```

This keeps page data in C++ and page presentation in HTML.

## Public assets used by views

The generated base layout loads files from `public/`.

```html id="web-routes-views-assets-html"
<link rel="stylesheet" href="/app.css" />
<script src="/app.js"></script>
```

Those paths work because `AppBootstrap` mounts the public directory at `/`.

```cpp id="web-routes-views-static-dir"
app.static_dir("public", "/");
```

The generated files are:

```txt id="web-routes-views-public-files"
public/
  app.css
  app.js
```

Because `public/` is mounted at `/`, the browser loads them as:

```txt id="web-routes-views-public-urls"
/app.css
/app.js
```

Do not write `/public/app.css` in the generated layout unless the mount path is changed.

## Health route

The health route is not a page view.

```txt id="web-routes-views-health-route"
GET /health
```

It returns JSON from `HealthController`.

```cpp id="web-routes-views-health-code"
app.get("/health", [](vix::Request &req, vix::Response &res)
{
  (void)req;

  res.json({
    "ok", true,
    "status", "ok",
    "service", "site",
    "template", "web"
  });
});
```

Keep this route separate from page rendering. It exists for local checks, deployment scripts, reverse proxies, and monitoring tools.

## Adding a new page

To add a new page, create a new view under `views/`.

```txt id="web-routes-views-about-file"
views/about.html
```

```html id="web-routes-views-about-html"
{% extends "base.html" %} {% block content %}
<section class="card">
  <p class="eyebrow">About</p>
  <h1>{{ title }}</h1>
  <p class="lead">{{ message }}</p>
</section>
{% endblock %}
```

Then add the route in `PageController`.

```cpp id="web-routes-views-about-route"
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

Add the link to the shared header when the page should appear in navigation.

```html id="web-routes-views-about-link"
<a href="/about">About</a>
```

No new C++ source file is needed in this case, so `vix.app` does not need to change. The new HTML file is inside `views/`, and the whole `views/` directory is already copied as a runtime resource.

## Adding a new page controller

When one controller becomes too large, create another controller for a page group.

```txt id="web-routes-views-new-controller-files"
include/site/presentation/controllers/AdminController.hpp
src/site/presentation/controllers/AdminController.cpp
```

Connect it through the route registry.

```cpp id="web-routes-views-new-controller-registry"
#include <site/presentation/controllers/AdminController.hpp>

void RouteRegistry::register_all(vix::App &app)
{
  controllers::PageController::register_routes(app);
  controllers::HealthController::register_routes(app);
  controllers::AdminController::register_routes(app);
}
```

Then add the new implementation file to the web manifest.

```ini id="web-routes-views-new-controller-manifest"
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

Every `.cpp` file compiled into the application must be listed in `vix.app`.

## Adding shared view parts

Shared HTML should live in partials.

For example:

```txt id="web-routes-views-footer-file"
views/footer.html
```

```html id="web-routes-views-footer-html"
<footer class="site-footer">
  <p>&copy; {{ app_name }}</p>
</footer>
```

Then include it from the base layout.

```html id="web-routes-views-footer-include"
{% include "footer.html" %}
```

This keeps repeated layout pieces out of individual pages. Page templates should focus on their own content.

## Adding static assets

Add CSS, JavaScript, images, or other public files under `public/`.

```txt id="web-routes-views-assets-add"
public/
  app.css
  app.js
  logo.svg
  images/
    hero.png
```

Because `public/` is mounted at `/`, those files are loaded with root paths.

```html id="web-routes-views-logo-html"
<img src="/logo.svg" alt="{{ app_name }}" />
```

For nested assets:

```html id="web-routes-views-image-html"
<img src="/images/hero.png" alt="Hero" />
```

No manifest change is needed when files are added under the existing `public/` resource directory.

## Runtime resource copying

The generated web manifest declares runtime resources.

```ini id="web-routes-views-resources"
resources = [
  ".env=.env",
  "public=public",
  "views=views",
  "storage=storage",
]
```

This means the runtime output can contain:

```txt id="web-routes-views-runtime-layout"
bin/
  site
  .env
  public/
  views/
  storage/
```

If a page renders correctly from the source tree but fails after build or run, check whether the resource was copied to the runtime output. The view must be available beside the executable, not only in the project root.

## Controller responsibilities

A page controller should prepare data and choose the view.

Good responsibilities include:

```txt id="web-routes-views-controller-good"
read request values
load page data
build a template context
choose the template
render the response
return redirects or errors
```

Avoid using the controller to generate large HTML strings. The template files exist so the HTML remains readable and editable.

## View responsibilities

A view should present data.

Good responsibilities include:

```txt id="web-routes-views-template-good"
HTML structure
layout extension
partials
blocks
variables
loops
small presentation conditions
```

Avoid hiding complicated application decisions inside the template. When a decision is important to the application, make it in C++ and pass the result to the view.

## Common mistakes

The most common mistake is adding a new C++ controller and forgetting to add its `.cpp` file to `vix.app`. The header can be found and the file can exist, but the implementation will not be compiled unless the manifest lists it.

Another mistake is using the wrong asset path. In the generated web template, `public/` is mounted at `/`, so `public/app.css` is requested as `/app.css`.

A third mistake is placing business logic in templates. Templates should render what the controller gives them. They should not become the place where application behavior is hidden.

A fourth mistake is forgetting that `views/` and `public/` are runtime resources. If they are missing beside the built target, the application may not find templates or assets even though the source tree looks correct.

## Recommended rule

Use `PageController` for page routes, `HealthController` for operational checks, `RouteRegistry` for wiring controllers, `views/` for HTML templates, and `public/` for browser assets. Add new HTML and assets freely under those resource directories. Add new `.cpp` files to `vix.app` whenever the web application gains new C++ implementation files.

## Next step

Continue with production files to understand how the web template uses `.env.example`, `vix.json`, runtime resources, and production metadata.

[Production Files](/templates/web/production-files)
