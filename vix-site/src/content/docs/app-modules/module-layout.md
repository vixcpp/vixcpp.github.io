# Module Layout

A Vix application module is a small project inside the main project. It has its own public headers, private implementation files, metadata, tests, and build target. The layout is intentionally simple because the goal is not to invent a new framework structure, but to make ownership visible in a C++ codebase.

A module usually lives under `modules/<name>/`.

```txt
modules/auth/
  include/auth/
  src/
  tests/
  CMakeLists.txt
  vix.module
```

The module name is part of the layout. Public headers are placed under `include/<module>/`, so code outside the module can include them with a stable path. Implementation files stay under `src/`, where they belong to the module target but are not treated as the public surface of the module.

## Basic layout

A simple module has a compact structure.

```txt
modules/auth/
  include/auth/
    api.hpp
  src/
    auth.cpp
  tests/
    test_auth.cpp
  CMakeLists.txt
  vix.module
```

This layout is useful for reusable internal code, service helpers, or feature code that does not need route registration. The public API is exposed from `include/auth/api.hpp`, and the implementation lives in `src/auth.cpp`.

Code outside the module should include the public header.

```cpp
#include <auth/api.hpp>
```

The private implementation file is compiled into the module target, but other modules should not include it directly.

## Backend module layout

Backend modules use a richer layout because they are routed modules. They need a module entry point, a controller, tests, and sometimes migration space.

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

The module class is the public entry point used by the generated application registration code. The controller owns the default route registration for that module. The `migrations/` directory gives backend modules a place for database changes when the feature needs them.

For a module named `auth`, the generated class name is `AuthModule`. For a module named `user_profile`, the generated class name is `UserProfileModule`.

## Public headers

Public headers live under `include/<module>/`.

```txt
modules/auth/
  include/auth/
    AuthModule.hpp
```

That layout gives the module a stable include path.

```cpp
#include <auth/AuthModule.hpp>
```

The include path should describe the module boundary, not the physical location of a private source file. Public headers are the part of the module that other code is allowed to use. They should be small enough to understand and stable enough to depend on.

A backend module can also expose public controller headers when the controller is part of the module’s public route registration surface.

```txt
modules/auth/
  include/auth/controllers/AuthController.hpp
```

In generated backend modules, the module entry point includes the controller header and delegates route registration to it.

## Private implementation

Implementation files live under `src/`.

```txt
modules/auth/
  src/
    AuthModule.cpp
    controllers/
      AuthController.cpp
```

These files are compiled into the module target. They are not meant to be included directly from another module. Keeping implementation files private helps prevent accidental coupling between features.

When another module needs behavior from `auth`, it should include a public header from `include/auth/` and declare the dependency explicitly. It should not reach into `modules/auth/src/`.

## Tests

Each module can have its own tests under `tests/`.

```txt
modules/auth/
  tests/
    test_auth.cpp
```

Module tests are useful because they keep checks close to the feature they protect. A simple module test can validate the public API. A backend module test can validate that the module exposes its name or that the module entry point compiles correctly.

The module test target is generated from the module `CMakeLists.txt` when tests are enabled for the project. This keeps tests separate from the main application target and avoids pulling test-only code into the application executable.

## Module metadata

Each module has a `vix.module` file.

```txt
modules/auth/
  vix.module
```

For a simple module, the file describes the module name, kind, exported include directory, and test setting.

```ini
name = "auth"
kind = "module"

[exports]
include = "include"

[tests]
enabled = true
```

For a routed backend module, the metadata also includes the route prefix.

```ini
name = "auth"
kind = "backend"

[routes]
prefix = "/api/auth"

[tests]
enabled = true
```

The route prefix is used by module checks to detect collisions between modules. Two routed modules should not claim the same prefix.

## CMake target

Each module has its own `CMakeLists.txt`.

```txt
modules/auth/
  CMakeLists.txt
```

The generated module target uses the project name and the module name.

```txt
api_auth
```

It also exposes an alias target.

```txt
api::auth
```

The alias is the target other code should link against when it depends on the module. This keeps module relationships readable in CMake and gives `vix modules check` a clear dependency signal.

```cmake
target_link_libraries(api_projects
  PUBLIC
    api::auth
)
```

In a `vix.app` project, Vix uses the active module declarations from the manifest to decide which module targets should be loaded into the generated application build. In a classic CMake project, the module loader can load module folders through the existing root build file.

## Backend route registration

A generated backend module has a module class with a stable route registration entry point.

```cpp
class AuthModule
{
public:
  static const char *name();
  static void register_routes(vix::App &app);
};
```

The implementation delegates to the module controller.

```cpp
void AuthModule::register_routes(vix::App &app)
{
  controllers::AuthController::register_routes(app);
}
```

The controller registers the actual routes.

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

This keeps the generated application bootstrap stable. The app does not need to know every controller from every module. Enabled modules are connected through the generated registration bridge.

## Custom module paths

The default convention is `modules/<name>`, but `vix.app` can point a module to another path.

```ini
[module.auth]
enabled = true
path = "features/auth"
kind = "backend"
depends = []
```

This is useful when an existing project already has a feature directory structure. The recommended default remains `modules/<name>` because it is easy to scan, but the manifest can describe a different layout when the project needs it.

The path is relative to the project root unless an absolute path is explicitly used. For shared projects, relative paths are easier to move between machines and CI environments.

## Naming

Module names may contain letters, numbers, underscores, and hyphens. Vix normalizes hyphens to underscores for generated targets, namespaces, and class names.

```txt
user-profile -> user_profile
```

A module should be named after the feature it owns. Names like `auth`, `projects`, `orders`, `billing`, and `packages` are clear. Names like `utils`, `misc`, or `helpers` should be used carefully because they often collect unrelated code without a strong boundary.

A good module name tells another developer what part of the application they are looking at before they open the files.

## Complete example

A backend with several modules may look like this:

```txt
api/
  include/
  src/
  modules/
    auth/
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

    projects/
      include/projects/
        ProjectsModule.hpp
        controllers/
          ProjectsController.hpp
      src/
        ProjectsModule.cpp
        controllers/
          ProjectsController.cpp
      migrations/
      tests/
        test_projects.cpp
      CMakeLists.txt
      vix.module

  vix.app
```

The main application owns startup, middleware, shared routes, resources, and runtime configuration. Each module owns the feature-specific code that belongs to it.

## Next step

Continue with backend modules to see how routed modules are generated, registered, and connected to the main Vix application.

[Backend Modules](/app-modules/backend-modules)
