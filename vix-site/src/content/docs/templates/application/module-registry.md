# Module Registry

The application template includes a module registry so a small Vix app has one stable place for internal module wiring. The project can start with only a few files, but it does not have to rewrite `main.cpp` when application modules are added later.

The registry is intentionally simple. It is not a framework layer and it is not where every feature should be implemented. Its job is to keep module registration separate from the entry point, so the startup flow stays readable as the application grows.

## Why the registry exists

A small application can begin with route handlers directly in `main.cpp`.

```cpp
app.get("/", [](vix::Request &req, vix::Response &res)
{
  (void)req;
  res.send("Hello from Vix");
});
```

That is fine for a small project. The problem appears when the application starts gaining features. Authentication, projects, billing, logs, packages, or dashboards should not all be wired directly from the entry point. If every feature adds includes and registration calls to `main.cpp`, the entry point slowly becomes the place where the whole application is assembled by hand.

The module registry avoids that shape. `main.cpp` starts the application, and the registry owns the module connection point.

```txt
src/main.cpp
  -> app::ModuleRegistry
      -> application modules
```

This keeps the entry point focused on startup.

## Generated files

The application template creates two registry files.

```txt
include/app/ModuleRegistry.hpp
src/app/ModuleRegistry.cpp
```

The header declares the registry. The source file implements it.

```txt
include/app/ModuleRegistry.hpp   public declaration
src/app/ModuleRegistry.cpp       implementation
```

The registry is small by default, but it gives the project a clear place to connect modules later.

## How main.cpp uses it

The generated application entry point creates the Vix app, registers its base routes, calls the module registry, then starts the server.

```cpp
#include <app/ModuleRegistry.hpp>

#include <vix.hpp>

int main()
{
  vix::App app;

  app.get("/", [](vix::Request &req, vix::Response &res)
  {
    (void)req;
    res.send("Hello from Vix");
  });

  app::ModuleRegistry::register_all(app);

  app.run(8080);
  return 0;
}
```

The important line is:

```cpp
app::ModuleRegistry::register_all(app);
```

That call gives the application a stable extension point. The entry point does not need to know every module that may exist later.

## Registry declaration

The registry header usually exposes one function.

```cpp
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

The declaration stays small because the registry should not become an application container. It receives the Vix app and registers modules on it.

## Registry implementation

The default implementation can be minimal.

```cpp
#include <app/ModuleRegistry.hpp>

#include <vix.hpp>

namespace app
{
  void ModuleRegistry::register_all(vix::App &app)
  {
    (void)app;
  }
}
```

This is a valid starting point. The project has no application modules yet, so there is nothing to register.

When the project starts using `vix modules`, this file becomes the right place to connect generated module registration or project-specific module wiring.

```cpp
void ModuleRegistry::register_all(vix::App &app)
{
  vix::app_generated::register_app_modules(app);
}
```

The exact generated bridge is managed by Vix. The important rule is that `main.cpp` should keep calling the registry, and the registry should own module wiring.

## Relationship with vix modules

Application modules are created with the `vix modules` command.

```bash
vix modules init
vix modules add auth
```

A module can then be declared in `vix.app`.

```ini
[module.auth]
enabled = true
path = "modules/auth"
kind = "service"
depends = []
```

When modules are active, the registry gives the application a single place where those modules can be registered with the running `vix::App`.

```txt
vix.app
  -> enabled modules
      -> generated module registration
          -> app::ModuleRegistry
              -> vix::App
```

This lets a small application grow without changing the basic startup shape.

## What belongs in the registry

The registry should contain module wiring, not feature logic.

Good use:

```cpp
void ModuleRegistry::register_all(vix::App &app)
{
  vix::app_generated::register_app_modules(app);
}
```

Also acceptable for a small custom project:

```cpp
void ModuleRegistry::register_all(vix::App &app)
{
  auth::AuthModule::register_routes(app);
  projects::ProjectsModule::register_routes(app);
}
```

The second shape is useful when the project is not using generated registration yet. Once the application uses `vix.app` module declarations and generated registration, prefer the generated bridge so module wiring stays derived from the manifest.

## What should not go in the registry

The registry should not become a large feature file.

Avoid putting route logic directly inside it.

```cpp
void ModuleRegistry::register_all(vix::App &app)
{
  app.post("/api/auth/login", [](vix::Request &req, vix::Response &res)
  {
    // Too much feature logic for the registry.
  });
}
```

A better shape is to let the module own its routes.

```cpp
void ModuleRegistry::register_all(vix::App &app)
{
  auth::AuthModule::register_routes(app);
}
```

Then the `auth` module can decide how its controller, services, validation, and internal files are organized.

## Difference from the backend template

The application template uses `ModuleRegistry` because the project is intentionally small. It does not generate `AppBootstrap`, `RouteRegistry`, and `MiddlewareRegistry`.

The backend template uses a richer startup structure.

```txt
main.cpp
  -> AppBootstrap
      -> MiddlewareRegistry
      -> RouteRegistry
      -> generated app modules
      -> app.run(...)
```

The application template keeps the lighter shape.

```txt
main.cpp
  -> ModuleRegistry
  -> app.run(...)
```

Both ideas serve the same purpose: keep startup readable and avoid scattering feature wiring through the entry point. The backend template does this with a full bootstrap layer. The application template does it with one small registry.

## When to edit the registry

Edit the registry when the application needs to connect modules or module-like groups of routes.

For example, after adding modules:

```bash
vix modules add auth
vix modules add projects
```

The registry can become the place where module registration is connected.

```cpp
void ModuleRegistry::register_all(vix::App &app)
{
  vix::app_generated::register_app_modules(app);
}
```

After changing module declarations, run:

```bash
vix modules check
vix build
```

This confirms that the module graph is valid and that the application still builds.

## Keep main.cpp stable

The main benefit of the registry is that `main.cpp` does not need to grow every time the application gains a feature.

A good `main.cpp` should remain easy to read.

```txt
create app
register base route
register modules
run app
```

The registry gives the project room to grow while keeping that shape intact.

## Recommended rule

Use `ModuleRegistry` as the application’s module wiring point. Keep it small, keep feature logic inside modules, and avoid turning `main.cpp` into the place where every future route or feature is manually connected.

## Next step

Continue with the manifest page to understand how the application template describes its executable target through `vix.app`.

[Manifest](/templates/application/manifest)
