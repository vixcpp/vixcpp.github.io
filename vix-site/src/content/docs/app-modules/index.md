# Application Modules

Application modules are an organization layer for C++ projects that need clear internal boundaries. A module represents one part of an application, such as `auth`, `projects`, `builds`, `packages`, `billing`, or `logs`. It gives that part of the codebase its own directory, public headers, private implementation, tests, metadata, and build target.

This system is designed for Vix applications, but it is not limited to projects generated from Vix templates. A project can use `vix modules` with a `vix.app` manifest, with a normal CMake project, or with an existing C++ codebase that wants a cleaner feature structure without adopting the full generated backend layout.

## Why modules exist

A backend often starts with a small source tree. At the beginning, one `src/` directory, a few controllers, and a route registry may be enough. As the project grows, features begin to form their own internal logic. Authentication needs routes, services, validation, and sometimes migrations. Projects may depend on authentication. Builds and packages may depend on projects. Logs and billing may be shared by several features.

Without a module layer, these parts usually end up inside the same application tree. The project can still compile, but it becomes harder to see which feature owns which files and which feature depends on another one. Application modules make those relationships visible from the project structure and, when the project uses `vix.app`, from the root manifest.

```txt
api/
  src/
  include/
  modules/
    auth/
    projects/
    builds/
  vix.app
```

The application remains one application. Modules do not force every feature to become a separate service or package. They give large application code a stable internal shape while keeping the build and runtime workflow centered on the main project.

## Basic workflow

The module workflow starts from the project root.

```bash
vix modules init
```

This creates the standard module directory and the CMake loader used by the module system.

```txt
modules/
cmake/vix_modules.cmake
```

A module can then be added with:

```bash
vix modules add auth
```

For a backend-style project, this creates a routed module skeleton with a module entry point, a controller, tests, metadata, and optional migration space.

```txt
modules/auth/
  include/auth/AuthModule.hpp
  include/auth/controllers/AuthController.hpp
  src/AuthModule.cpp
  src/controllers/AuthController.cpp
  migrations/
  tests/test_auth.cpp
  CMakeLists.txt
  vix.module
```

For a simpler C++ module, the generated layout is smaller.

```txt
modules/auth/
  include/auth/api.hpp
  src/auth.cpp
  tests/test_auth.cpp
  CMakeLists.txt
  vix.module
```

The exact skeleton depends on the project Vix detects. A backend `vix.app` project receives backend modules. A regular application can receive routed service modules. A classic CMake project can receive plain C++ modules that expose an alias target such as `api::auth`.

WebSocket modules are generated with the same command group.

```bash
vix modules add live_chat --websocket --workflow attached
vix modules add --websocket --name notifications --workflow bridge
```

The module name can be positional or provided through `--name`. WebSocket workflows include `attached`, `standalone`, `bridge`, and `client`; only `client` is non-runtime support code.

## Modules in vix.app projects

In a `vix.app` project, modules are declared in the application manifest with `[module.<name>]` sections.

```ini
[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = []
```

This declaration makes the module part of the application model. The `enabled` field controls whether the module is active, `path` points to the module directory, `kind` describes the role of the module, and `depends` records internal module dependencies.

When a module is disabled, it remains declared but is not wired into the generated application target.

```bash
vix modules disable auth
vix modules enable auth
```

This is useful when a feature is being prepared, reviewed, or temporarily removed from the active build without deleting its files.

## Modules in CMake projects

Application modules can also be used in projects that keep a root `CMakeLists.txt`. In that mode, `vix modules init` can add the module loader to the existing CMake project, and `vix modules add <name>` can create a module target.

Each module has a real CMake target and an alias target.

```txt
api_auth
api::auth
```

This lets an existing C++ project adopt the module layout without moving immediately to `vix.app`. The project can keep its current build decisions while using `modules/<name>/include/<name>/...` for public headers and `modules/<name>/src/...` for private implementation.

## Public and private boundaries

A module has a public side and a private side. Public headers live under `include/<module>/`. Code outside the module should include those headers.

```cpp
#include <auth/AuthModule.hpp>
```

Implementation files live under `src/`. They belong to the module target, but they are not part of the public surface that other modules should include directly.

```txt
modules/auth/
  include/auth/      public headers
  src/               private implementation
```

This boundary is important because it keeps dependencies honest. When one module uses another module, that relationship should be visible as an explicit dependency instead of being hidden behind a private include path.

## Checking module structure

The module check command validates the structure of the module layer.

```bash
vix modules check
```

It verifies the parts that usually become fragile as an application grows: declared modules must have folders, enabled modules must have the files needed by the build, enabled modules cannot depend on disabled modules, dependencies must not form cycles, route prefixes must not collide, and public headers must not include private implementation paths.

Run it before building when module declarations or module dependencies change.

```bash
vix modules check
vix build
```

For backend applications, this gives a clear local workflow: validate the module graph, then compile the application.

## How modules are registered

Generated Vix applications and backends contain a stable integration point for modules. In a simple application, `main.cpp` calls a module registry. In a backend template, `AppBootstrap` registers middleware, routes, and then application modules.

```txt
main.cpp
  -> AppBootstrap
      -> MiddlewareRegistry
      -> RouteRegistry
      -> generated app modules
```

The generated registration bridge is built from the active module declarations. This keeps `main.cpp` and the application bootstrap stable while the project grows. Adding a module should not require manually editing the startup sequence every time.

## When to use application modules

Use modules when a feature has enough responsibility to deserve its own boundary. A small project does not need to split everything immediately. The module layer becomes useful when the codebase has several features, when dependencies between features matter, or when a team needs a consistent place to put feature-specific routes, services, tests, and migrations.

A good module should represent a real part of the application. Names like `auth`, `orders`, `projects`, `billing`, and `packages` are better than names that describe folders or tools. The module name should tell another developer what part of the product or backend the module owns.

## Next step

Continue with the getting started guide to initialize module support, add the first module, inspect the generated files, and run the module checks.

[Getting Started](/app-modules/getting-started)
