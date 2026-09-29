# Routes and Middleware

The backend template separates route registration and middleware registration from the application bootstrap. `AppBootstrap` owns the startup sequence, but it does not need to know every controller or every middleware detail. It delegates those responsibilities to two generated registries:

```txt
MiddlewareRegistry
RouteRegistry
```

This keeps the backend shell readable. Startup remains in one place, global HTTP behavior remains in one place, and base application routes remain in one place.

```txt
AppBootstrap
  -> MiddlewareRegistry
  -> RouteRegistry
  -> generated app modules
  -> app.run(...)
```

## Generated files

The backend template creates route and middleware files under the project namespace.

```txt
include/api/presentation/
  middleware/
    MiddlewareRegistry.hpp
  routes/
    RouteRegistry.hpp
  controllers/
    HomeController.hpp
    HealthController.hpp

src/api/presentation/
  middleware/
    MiddlewareRegistry.cpp
  routes/
    RouteRegistry.cpp
  controllers/
    HomeController.cpp
    HealthController.cpp
```

The route registry connects controllers. The middleware registry connects global middleware. Controllers own route handlers. This gives each file a clear role.

## Middleware registry

The middleware registry is declared in:

```txt
include/api/presentation/middleware/MiddlewareRegistry.hpp
```

and implemented in:

```txt
src/api/presentation/middleware/MiddlewareRegistry.cpp
```

The generated declaration exposes one function:

```cpp
namespace api::presentation::middleware
{
  class MiddlewareRegistry
  {
  public:
    static void register_all(vix::App &app);
  };
}
```

`AppBootstrap` calls this function during startup.

```cpp
presentation::middleware::MiddlewareRegistry::register_all(app);
```

This keeps middleware setup outside the bootstrap implementation. The bootstrap controls the startup order, while the registry controls which global middleware is installed.

## Generated middleware

The generated backend starts with a small middleware stack. It registers security headers, request logging, and an API marker header.

```cpp
void MiddlewareRegistry::register_all(vix::App &app)
{
  app.use(vix::middleware::app::security_headers_dev(false));

  app.use([](vix::Request &req, vix::Response &res, vix::App::Next next)
  {
    (void)res;

    vix::log::info("{} {}", req.method(), req.path());
    next();
  });

  app.use("/api", [](vix::Request &req, vix::Response &res, vix::App::Next next)
  {
    (void)req;

    res.header("X-API", "true");
    next();
  });
}
```

The generated file also leaves examples for common backend middleware such as CORS and rate limiting. Those examples are intentionally commented because different backends have different security, proxy, and deployment requirements.

## Middleware order

Middleware order matters. A request passes through middleware in the order it is registered before it reaches the final route handler.

The generated comments use this order as a guide:

```txt
CORS
rate limit
request logging
security headers
body limits
auth
routes
```

Not every backend needs all of these immediately. The important point is that global HTTP behavior should be registered deliberately and in a readable order.

For example, request logging should usually run early enough to observe requests, while authentication middleware should run before protected routes. Body limits should be applied before handlers read large request bodies. Security headers should be applied consistently to outgoing responses.

## Route registry

The route registry is declared in:

```txt
include/api/presentation/routes/RouteRegistry.hpp
```

and implemented in:

```txt
src/api/presentation/routes/RouteRegistry.cpp
```

The generated declaration also exposes one function:

```cpp
namespace api::presentation::routes
{
  class RouteRegistry
  {
  public:
    static void register_all(vix::App &app);
  };
}
```

`AppBootstrap` calls it after middleware registration.

```cpp
presentation::routes::RouteRegistry::register_all(app);
```

This keeps base route wiring out of the bootstrap. The bootstrap knows that routes must be registered, but the registry owns which base controllers are connected.

## Generated route registration

The generated route registry connects the base controllers.

```cpp
void RouteRegistry::register_all(vix::App &app)
{
  controllers::HomeController::register_routes(app);
  controllers::HealthController::register_routes(app);
}
```

This gives the backend a simple route map from the beginning:

```txt
HomeController
HealthController
```

As the application grows, the route registry can continue to own application-level routes. Feature-specific routes should usually move into application modules instead of making this registry a long list of every feature in the backend.

## HomeController

`HomeController` registers the default API route.

```txt
GET /api
```

The generated implementation returns a small JSON response to prove that the backend is running and reachable.

```cpp
void HomeController::register_routes(vix::App &app)
{
  app.get("/api", [](vix::Request &req, vix::Response &res)
  {
    (void)req;

    res.json({
      "ok", true,
      "service", "api",
      "message", "Vix backend is running"
    });
  });
}
```

This route is intentionally small. It gives the generated backend a visible API endpoint without pretending to be a real feature.

## HealthController

`HealthController` registers health check routes.

```txt
GET /health
GET /api/health
```

The generated health routes return JSON responses that can be used by local checks, reverse proxies, deployment scripts, and monitoring tools.

```cpp
void HealthController::register_routes(vix::App &app)
{
  app.get("/health", [](vix::Request &req, vix::Response &res)
  {
    (void)req;

    res.json({
      "ok", true,
      "status", "ok",
      "service", "api"
    });
  });

  app.get("/api/health", [](vix::Request &req, vix::Response &res)
  {
    (void)req;

    res.json({
      "ok", true,
      "status", "ok",
      "service", "api",
      "api", true
    });
  });
}
```

The two routes serve slightly different needs. `/health` is simple and useful for infrastructure checks. `/api/health` is useful when API paths are grouped under `/api`.

## Checking the generated routes

After creating a backend project, copy the environment file, build, and run the application.

```bash
cp .env.example .env
vix build
vix run
```

Then check the health route:

```bash
curl http://localhost:8080/health
```

You can also check the API route:

```bash
curl http://localhost:8080/api
```

These routes confirm that the bootstrap, middleware registry, route registry, and controllers are wired correctly.

## Adding application-level routes

For small application-level routes, add a controller and connect it through `RouteRegistry`.

For example:

```txt
include/api/presentation/controllers/StatusController.hpp
src/api/presentation/controllers/StatusController.cpp
```

Then update the route registry:

```cpp
#include <api/presentation/controllers/StatusController.hpp>

void RouteRegistry::register_all(vix::App &app)
{
  controllers::HomeController::register_routes(app);
  controllers::HealthController::register_routes(app);
  controllers::StatusController::register_routes(app);
}
```

Remember to add the new `.cpp` file to `vix.app`.

```ini
sources = [
  "src/main.cpp",
  "src/api/app/AppBootstrap.cpp",
  "src/api/support/HttpResponses.cpp",
  "src/api/presentation/routes/RouteRegistry.cpp",
  "src/api/presentation/middleware/MiddlewareRegistry.cpp",
  "src/api/presentation/controllers/HomeController.cpp",
  "src/api/presentation/controllers/HealthController.cpp",
  "src/api/presentation/controllers/StatusController.cpp",
]
```

A source file that is not listed in `vix.app` is not compiled into the backend target.

## When to use modules instead

The route registry is a good place for base application routes: health, root API information, status, diagnostics, or small application-level endpoints.

It should not become a list of every feature in a large backend.

When a feature starts to own its own routes, services, tests, migrations, or dependencies, create a backend module.

```bash
vix modules add auth
```

A backend module can own its own controller and route registration.

```txt
modules/auth/
  include/auth/AuthModule.hpp
  include/auth/controllers/AuthController.hpp
  src/AuthModule.cpp
  src/controllers/AuthController.cpp
```

Then Vix can connect enabled modules through the generated module bridge.

```cpp
vix::app_generated::register_app_modules(app);
```

This keeps `RouteRegistry` focused on the backend shell while feature routes live with the feature that owns them.

## Adding middleware

Global middleware belongs in `MiddlewareRegistry`.

For example, a backend can add CORS middleware there:

```cpp
app.use(vix::middleware::app::cors_dev({
  "http://localhost:5173",
  "http://127.0.0.1:5173"
}));
```

A rate limiter can also be added there:

```cpp
app.use(vix::middleware::app::rate_limit({
  .max_requests = 60,
  .window_seconds = 60
}));
```

The registry is the right place for middleware that applies broadly to the backend. Feature-specific middleware can live closer to the feature when it only applies to a module or a route group.

## What belongs in RouteRegistry

`RouteRegistry` should contain route wiring, not business logic.

Good use:

```cpp
void RouteRegistry::register_all(vix::App &app)
{
  controllers::HomeController::register_routes(app);
  controllers::HealthController::register_routes(app);
}
```

Avoid putting large route handlers directly in the registry.

```cpp
// Avoid this shape in RouteRegistry.
app.post("/api/auth/login", [](vix::Request &req, vix::Response &res)
{
  // feature logic
});
```

A better shape is to create a controller or a module and let that file own the route handler.

## What belongs in MiddlewareRegistry

`MiddlewareRegistry` should contain global request pipeline configuration.

Good responsibilities include:

```txt
security headers
CORS
rate limiting
request logging
body limits
authentication middleware
global response headers
```

Avoid putting route-specific business logic there. Middleware should prepare, protect, observe, or modify the request pipeline. Controllers and modules should own endpoint behavior.

## Relationship with AppBootstrap

`AppBootstrap` controls the order.

```cpp
presentation::middleware::MiddlewareRegistry::register_all(app);
presentation::routes::RouteRegistry::register_all(app);
vix::app_generated::register_app_modules(app);
```

This order means global middleware is installed before base routes and modules are registered. That is the expected shape for most backends: middleware defines request behavior, then routes and modules attach handlers.

If the backend needs a different startup order, change it in `AppBootstrap`. If the backend needs different middleware, change `MiddlewareRegistry`. If the backend needs different base routes, change `RouteRegistry`.

## Common mistakes

The most common mistake is putting all route handlers directly in `AppBootstrap.cpp`. That makes startup harder to read. Keep route wiring in `RouteRegistry` and route handlers in controllers or modules.

Another mistake is letting `RouteRegistry` grow into a feature registry for the whole backend. Application-level routes belong there, but large feature areas should move into modules.

A third mistake is adding a new controller `.cpp` file and forgetting to add it to `vix.app`. The file may exist in the source tree, but it will not be compiled unless the manifest lists it.

## Recommended rule

Use `MiddlewareRegistry` for global HTTP behavior. Use `RouteRegistry` for base application routes. Use controllers for route handlers. Use backend modules when a feature becomes large enough to own its own routes and implementation.

This keeps the backend shell small, readable, and ready to grow.

## Next step

Continue with modules integration to see how backend modules connect to the generated startup flow.

[Modules Integration](/templates/backend/modules-integration)
