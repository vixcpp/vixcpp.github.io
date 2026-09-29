# Backend Integration

The Vue template keeps the backend as a normal Vix C++ application. The frontend lives in `frontend/`, but the backend is still built from the project root, described by `vix.app`, and run through the Vix CLI.

The integration between both sides happens through HTTP. Vue calls API routes, usually under `/api`, and the Vix backend returns JSON responses. This keeps the frontend and backend close in one project without mixing their source files or build systems.

```txt id="vue-backend-integration-map"
Vue frontend
  -> fetch("/api/...")
      -> Vix backend route
          -> JSON response
```

## Backend role

The backend side of a Vue template project is responsible for application logic, API routes, data access, authentication, validation, server configuration, and anything that should not run inside the browser.

The generated frontend should not import backend files. The backend should not import Vue components. They live in the same project, but they communicate through API routes.

```txt id="vue-backend-integration-boundary"
frontend/src/   Vue components and browser code
src/            C++ backend source
include/        backend headers
vix.app         backend build manifest
vix.json        shared project workflow
```

This boundary is the main reason the template stays understandable as it grows.

## Backend layout

The generated backend is intentionally small.

```txt id="vue-backend-integration-layout"
dashboard/
  include/
    app/
      ModuleRegistry.hpp

  src/
    main.cpp
    app/
      ModuleRegistry.cpp

  vix.app
  vix.json
```

The exact backend can grow over time, but the starting point is simple: one Vix application target, one entry point, and a place for future module registration.

## Backend entry point

The backend entry point lives in:

```txt id="vue-backend-integration-main-path"
src/main.cpp
```

A small Vue template backend usually creates a Vix app, registers API routes, and starts the server.

```cpp id="vue-backend-integration-main-example"
#include <vix.hpp>

int main()
{
  vix::App app;

  app.get("/api/hello", [](vix::Request &req, vix::Response &res)
  {
    (void)req;

    res.json({
      "ok", true,
      "message", "Hello from Vix"
    });
  });

  app.run(8080);
}
```

The generated frontend calls this route with a relative path.

```js id="vue-backend-integration-fetch-example"
const response = await fetch("/api/hello");
const data = await response.json();
```

During development, Vite receives that `/api/hello` request and forwards it to the Vix backend through the proxy.

## API route prefix

The generated project uses `/api` as the backend boundary.

```txt id="vue-backend-integration-api-prefix"
/api
```

This makes the project easier to reason about. Browser page routes and frontend assets belong to the Vue side. Backend data routes belong under `/api`.

```txt id="vue-backend-integration-route-shape"
GET /api/hello
GET /api/projects
POST /api/login
GET /api/me
```

Keeping API routes grouped under `/api` also makes the Vite proxy simple.

```js id="vue-backend-integration-vite-proxy"
server: {
  proxy: {
    "/api": "http://localhost:8080"
  }
}
```

## Vite proxy

The frontend development server forwards API requests to the backend.

```txt id="vue-backend-integration-proxy-flow"
browser
  -> Vite dev server
      -> Vue app
      -> /api request
          -> Vix backend on localhost:8080
```

This lets frontend code stay clean.

```js id="vue-backend-integration-relative-api"
fetch("/api/hello");
```

Avoid hard-coding the local backend URL inside Vue components.

```js id="vue-backend-integration-avoid-hardcoded-url"
fetch("http://localhost:8080/api/hello");
```

The proxy already knows where the backend runs during development. Relative `/api` paths make the frontend easier to move between local development and production.

## `vix.app`

The backend target is described by the root `vix.app`.

```txt id="vue-backend-integration-vix-app-file"
vix.app
```

A generated Vue project can start with a small backend manifest.

```ini id="vue-backend-integration-vix-app"
name = "dashboard"
type = "executable"
standard = "c++20"
output_dir = "bin"

sources = [
  "src/main.cpp",
  "src/app/ModuleRegistry.cpp",
]

include_dirs = [
  "include",
  "src",
]

packages = [
  "vix",
]

links = [
  "vix::vix",
]
```

This manifest describes only the C++ backend. Vue files under `frontend/` do not belong in `sources`, because they are handled by Vite.

## Adding backend source files

When the backend grows, add C++ files under `src/` and headers under `include/`.

```txt id="vue-backend-integration-new-source-layout"
include/
  api/
    ProjectsController.hpp

src/
  api/
    ProjectsController.cpp
```

Then add the new `.cpp` file to `vix.app`.

```ini id="vue-backend-integration-new-source-manifest"
sources = [
  "src/main.cpp",
  "src/app/ModuleRegistry.cpp",
  "src/api/ProjectsController.cpp",
]
```

This is still a Vix application. A `.cpp` file must be listed in the manifest before it is compiled into the backend target.

## Adding an API controller

A cleaner backend can move routes out of `main.cpp` and into controllers.

```txt id="vue-backend-integration-controller-files"
include/api/ProjectsController.hpp
src/api/ProjectsController.cpp
```

The controller can expose a route registration function.

```cpp id="vue-backend-integration-controller-header"
#pragma once

namespace vix
{
  class App;
}

namespace api
{
  class ProjectsController
  {
  public:
    static void register_routes(vix::App &app);
  };
}
```

The implementation owns the routes.

```cpp id="vue-backend-integration-controller-cpp"
#include <api/ProjectsController.hpp>

#include <vix.hpp>

namespace api
{
  void ProjectsController::register_routes(vix::App &app)
  {
    app.get("/api/projects", [](vix::Request &req, vix::Response &res)
    {
      (void)req;

      res.json({
        "ok", true,
        "projects", vix::json::Array{}
      });
    });
  }
}
```

Then `main.cpp` can stay focused on application setup.

```cpp id="vue-backend-integration-main-controller-call"
#include <api/ProjectsController.hpp>
#include <vix.hpp>

int main()
{
  vix::App app;

  api::ProjectsController::register_routes(app);

  app.run(8080);
}
```

This is a good step when the backend starts to have more than one or two routes.

## ModuleRegistry

The generated Vue template can include a backend module registry.

```txt id="vue-backend-integration-module-registry-files"
include/app/ModuleRegistry.hpp
src/app/ModuleRegistry.cpp
```

The registry gives the backend one place to connect internal modules later. A small project may not need modules immediately, but the integration point prevents `main.cpp` from becoming a long file as the backend grows.

```txt id="vue-backend-integration-module-registry-flow"
main.cpp
  -> app::ModuleRegistry
      -> backend modules
```

A simple registry can expose one function.

```cpp id="vue-backend-integration-module-registry-header"
#pragma once

namespace vix
{
  class App;
}

namespace app
{
  class ModuleRegistry
  {
  public:
    static void register_all(vix::App &app);
  };
}
```

The default implementation can be empty.

```cpp id="vue-backend-integration-module-registry-empty"
#include <app/ModuleRegistry.hpp>

namespace app
{
  void ModuleRegistry::register_all(vix::App &app)
  {
    (void)app;
  }
}
```

Then `main.cpp` can call the registry once.

```cpp id="vue-backend-integration-main-module-registry"
#include <app/ModuleRegistry.hpp>
#include <vix.hpp>

int main()
{
  vix::App app;

  app::ModuleRegistry::register_all(app);

  app.run(8080);
}
```

## Using app modules later

When the backend becomes larger, features can move into app modules.

```bash id="vue-backend-integration-modules-add"
vix modules init
vix modules add auth
vix modules add projects
```

A module-based backend can keep feature routes and implementation inside `modules/`.

```txt id="vue-backend-integration-modules-layout"
modules/
  auth/
    include/auth/
    src/
    tests/
    vix.module
    CMakeLists.txt

  projects/
    include/projects/
    src/
    tests/
    vix.module
    CMakeLists.txt
```

The root `vix.app` can declare which modules are active.

```ini id="vue-backend-integration-module-declaration"
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

The Vue frontend still calls the backend through `/api`. The internal backend organization can change without changing the frontend boundary.

## Returning JSON

The Vue frontend expects API responses it can parse.

```js id="vue-backend-integration-json-frontend"
const response = await fetch("/api/projects");
const data = await response.json();
```

The backend should return JSON for API routes.

```cpp id="vue-backend-integration-json-backend"
res.json({
  "ok", true,
  "message", "Hello from Vix"
});
```

Keep response shapes consistent. For example, a project can use a simple convention:

```json id="vue-backend-integration-json-shape"
{
  "ok": true,
  "data": {}
}
```

and for errors:

```json id="vue-backend-integration-json-error"
{
  "ok": false,
  "error": "not_found",
  "message": "Resource not found"
}
```

The exact shape is a project decision. What matters is that the frontend and backend agree on it.

## Backend configuration

The Vue template backend can start small, but real projects usually need runtime configuration.

A simple backend can run on the default port:

```cpp id="vue-backend-integration-simple-run"
app.run(8080);
```

A more structured backend can load configuration from `.env`.

```cpp id="vue-backend-integration-config-run"
vix::config::Config cfg{".env"};
vix::App app;

app.run(cfg);
```

When the backend uses `.env`, keep `.env.example` in the repository to document expected variables, and keep real local values in `.env`.

```txt id="vue-backend-integration-env-files"
.env.example  documented variables
.env          local runtime values
```

## Frontend calls should stay relative

The frontend should call backend routes through relative `/api` paths.

```js id="vue-backend-integration-good-fetch"
fetch("/api/projects");
```

This works during development because Vite proxies `/api` to the backend. It also works better in production when the frontend and backend are served under the same domain or behind the same reverse proxy.

Hard-coded local URLs are harder to move.

```js id="vue-backend-integration-bad-fetch"
fetch("http://localhost:8080/api/projects");
```

A hard-coded development URL can break when the app is opened from another device, deployed behind a domain, served through HTTPS, or routed through a proxy.

## Backend development commands

Backend commands run from the project root.

```bash id="vue-backend-integration-backend-commands"
vix build
vix run
vix tests
vix check --tests --run
```

The frontend commands run inside `frontend/`.

```bash id="vue-backend-integration-frontend-commands"
npm install --prefix frontend
npm run dev --prefix frontend
npm run build --prefix frontend
```

During normal development, use the project workflow.

```bash id="vue-backend-integration-dev-workflow"
npm install --prefix frontend
vix dev
```

For manual debugging, run backend and frontend in separate terminals.

```bash id="vue-backend-integration-run-backend"
vix run
```

```bash id="vue-backend-integration-run-frontend"
npm run dev --prefix frontend
```

## Building for production

Build the backend with Vix.

```bash id="vue-backend-integration-build-backend"
vix build
```

Build the frontend with Vite.

```bash id="vue-backend-integration-build-frontend"
npm run build --prefix frontend
```

The frontend output is written to:

```txt id="vue-backend-integration-dist"
frontend/dist/
```

A production deployment can decide how to serve that directory. One common approach is to let the backend carry it as a runtime resource.

```ini id="vue-backend-integration-dist-resource"
resources = [
  "frontend/dist=public",
]
```

Then the built frontend is copied beside the backend executable as `public/`.

```txt id="vue-backend-integration-runtime-layout"
bin/
  dashboard
  public/
    index.html
    assets/
```

That deployment shape is optional. During development, Vite serves the frontend directly.

## Checking the integration

A practical integration check validates both sides.

```bash id="vue-backend-integration-check-backend"
vix check --tests
vix tests --fail-fast
```

Then build the frontend.

```bash id="vue-backend-integration-check-frontend"
npm run build --prefix frontend
```

Finally, confirm that the frontend uses relative API routes and that the backend exposes matching `/api` routes.

```txt id="vue-backend-integration-check-list"
Vue calls /api/...
Vite proxies /api to the backend
Vix backend registers matching /api routes
backend returns JSON
frontend handles success and failure responses
```

## Common mistakes

The most common mistake is mixing the two build systems. Vue files do not belong in `vix.app`, and C++ files do not belong in the Vite build.

Another mistake is adding a backend `.cpp` file but forgetting to list it in `vix.app`. The backend may compile without the new route, or linking may fail because the implementation was never added to the target.

A third mistake is hard-coding `http://localhost:8080` inside Vue components. Use relative `/api` paths and let the Vite proxy handle development routing.

A fourth mistake is putting too much backend logic directly in `main.cpp`. That is fine for the first route, but controllers or modules are better once the backend grows.

## Recommended rule

Keep the integration simple. Vue owns the browser UI. Vix owns the backend API. Use `/api` as the boundary, keep frontend calls relative, list backend `.cpp` files in `vix.app`, and move backend features into controllers or modules when they become larger than a starter route.

## Next step

Continue with the API proxy page to see how Vite forwards frontend requests to the Vix backend during development.

[API Proxy](/templates/vue/backend-integration)
