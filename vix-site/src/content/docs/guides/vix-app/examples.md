# Examples

This page collects complete `vix.app` examples for common Vix projects. The goal is not to show every field in every manifest, but to show the shapes that appear in real applications: a small executable, a backend, a game, a library, a project with registry dependencies, and a backend organized with app modules.

A `vix.app` file lives at the project root and is used by the normal Vix workflow.

```bash id="vix-app-examples-workflow"
vix build
vix run
```

Use these examples as starting points, then remove what the project does not need. A good manifest should stay readable.

## Minimal executable

This is the smallest useful Vix application shape. It builds one executable from `src/main.cpp`, uses C++20, links the base Vix target, and places the result in `bin`.

```ini id="vix-app-example-minimal"
name = "hello"
type = "executable"
standard = "c++20"
output_dir = "bin"

sources = [
  "src/main.cpp",
]

include_dirs = [
  "src",
]

packages = [
  "vix",
]

links = [
  "vix::vix",
]
```

A matching `src/main.cpp` can stay simple.

```cpp id="vix-app-example-minimal-main"
#include <vix/print.hpp>

int main()
{
  vix::print("Hello from Vix");
  return 0;
}
```

Run it with:

```bash id="vix-app-example-minimal-run"
vix run
```

## Small app with headers

When the app starts to grow, keep headers in a clear include root and list implementation files explicitly in `sources`.

```txt id="vix-app-example-headers-layout"
hello/
  include/
    hello/
      greeting.hpp
  src/
    main.cpp
    greeting.cpp
  vix.app
```

```ini id="vix-app-example-headers-manifest"
name = "hello"
type = "executable"
standard = "c++20"
output_dir = "bin"

sources = [
  "src/main.cpp",
  "src/greeting.cpp",
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

The source can include the public header through the project include root.

```cpp id="vix-app-example-headers-main"
#include <hello/greeting.hpp>
#include <vix/print.hpp>

int main()
{
  vix::print(hello::greeting());
  return 0;
}
```

## Backend application

A backend is normally an executable target. The backend identity comes from the source layout, compile definitions, linked Vix modules, resources, and project metadata around the application.

```ini id="vix-app-example-backend"
# Vix backend application manifest
# This file describes one executable backend target.

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

compile_options = [
  "$<$<CXX_COMPILER_ID:MSVC>:/W4>",
  "$<$<CXX_COMPILER_ID:MSVC>:/permissive->",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-Wall>",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-Wextra>",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-Wpedantic>",
]

compile_features = [
  "cxx_std_20",
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

This manifest keeps the backend entry point and core wiring in the main application target. Runtime files are copied beside the executable so the backend can start from the normal Vix workflow.

```bash id="vix-app-example-backend-run"
vix build
vix run
```

## Backend with ORM

When the backend uses ORM, make both parts visible: the compile-time feature definition and the linked Vix target.

```ini id="vix-app-example-backend-orm"
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
  "VIX_USE_ORM=1",
]

packages = [
  "vix",
]

links = [
  "vix::vix",
  "vix::orm",
]

resources = [
  ".env=.env",
  "public=public",
  "views=views",
  "storage=storage",
]
```

The manifest should show what the code actually uses. Do not link `vix::orm` unless the application needs it.

## Backend with app modules

For a larger backend, keep the main application target focused on the app shell, then declare internal feature modules below the main fields.

```ini id="vix-app-example-backend-modules"
name = "cloud"
type = "executable"
standard = "c++20"
output_dir = "bin"

sources = [
  "src/main.cpp",
  "src/cloud/app/AppBootstrap.cpp",
  "src/cloud/support/HttpResponses.cpp",
  "src/cloud/presentation/routes/RouteRegistry.cpp",
  "src/cloud/presentation/middleware/MiddlewareRegistry.cpp",
  "src/cloud/presentation/controllers/HomeController.cpp",
  "src/cloud/presentation/controllers/HealthController.cpp",
]

include_dirs = [
  "include",
  "src",
]

defines = [
  "VIX_BACKEND_APP=1",
  "VIX_APP_NAME=cloud",
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

[module.builds]
enabled = true
path = "modules/builds"
kind = "backend"
depends = [
  "projects",
]

[module.packages]
enabled = true
path = "modules/packages"
kind = "backend"
depends = [
  "projects",
]
```

The application still builds as one backend executable. The modules describe the internal feature structure and make dependencies visible from the project root.

Useful commands for this shape:

```bash id="vix-app-example-modules-commands"
vix modules list
vix modules check
vix build
```

## Game application

A Vix game project is also an executable, but it links the game runtime and copies assets beside the built target.

```ini id="vix-app-example-game"
# Vix game manifest
# This file is read by Vix as the game application target.

name = "space-demo"
type = "executable"
standard = "c++20"
output_dir = "bin"

sources = [
  "src/main.cpp",
]

include_dirs = [
  "src",
]

compile_features = [
  "cxx_std_20",
]

packages = [
  "vix",
]

links = [
  "vix::game",
  "vix::io",
]

resources = [
  "assets=assets",
  "game.package.json=game.package.json",
]
```

A small game entry point can use `vix::print` for output.

```cpp id="vix-app-example-game-main"
#include <vix/game/all.hpp>
#include <vix/print.hpp>

class MainScene final : public vix::game::Scene
{
public:
  vix::game::GameBoolResult on_load() override
  {
    vix::print("Main scene loaded");
    return vix::game::Scene::on_load();
  }

  void on_update(const vix::game::Frame &frame) override
  {
    vix::print("frame:", frame.index);

    if (frame.index >= 5)
    {
      app().stop();
    }
  }
};

int main()
{
  vix::game::App app;
  app.set_title("space-demo");

  vix::game::GameRuntime runtime(app);

  auto runtime_init = runtime.init();
  if (!runtime_init)
  {
    vix::print("runtime init failed:", runtime_init.error().message());
    return 1;
  }

  auto scene = app.scenes().create<MainScene>("main");
  if (!scene)
  {
    vix::print("scene creation failed:", scene.error().message());
    return 1;
  }

  auto active = app.scenes().set_active("main");
  if (!active)
  {
    vix::print("scene activation failed:", active.error().message());
    return 1;
  }

  auto result = app.run();
  if (!result)
  {
    vix::print("game failed:", result.error().message());
    return 1;
  }

  return 0;
}
```

## Vue frontend with Vix backend

In a Vue + Vix project, `vix.app` describes the C++ backend target. Frontend commands belong in `vix.json`, while the backend can serve or proxy API routes during development.

```ini id="vix-app-example-vue-backend"
name = "dashboard"
type = "executable"
standard = "c++20"
output_dir = "bin"

sources = [
  "src/main.cpp",
]

include_dirs = [
  "src",
]

packages = [
  "vix",
]

links = [
  "vix::vix",
]

resources = [
  "frontend/dist=public",
]
```

This keeps the C++ target small. The frontend remains a frontend project, and the backend manifest only declares what the C++ app needs to build and run.

A project task file can handle the frontend workflow separately.

```json id="vix-app-example-vue-tasks"
{
  "tasks": {
    "frontend:install": {
      "description": "Install Vue dependencies",
      "command": "npm install",
      "cwd": "frontend"
    },
    "frontend:dev": {
      "description": "Start Vue dev server",
      "command": "npm run dev",
      "cwd": "frontend"
    },
    "frontend:build": {
      "description": "Build Vue frontend",
      "command": "npm run build",
      "cwd": "frontend"
    },
    "backend:dev": {
      "description": "Start Vix backend",
      "command": "vix run"
    },
    "backend:build": {
      "description": "Build Vix backend",
      "command": "vix build"
    }
  }
}
```

## Static library

Use a static library target when the project produces reusable code instead of a runnable app.

```ini id="vix-app-example-static-library"
name = "mathkit"
type = "static-library"
standard = "c++20"
output_dir = "lib"

sources = [
  "src/add.cpp",
  "src/multiply.cpp",
]

include_dirs = [
  "include",
]

compile_features = [
  "cxx_std_20",
]

packages = [
  "vix",
]

links = [
  "vix::vix",
]
```

A clean layout for this project is:

```txt id="vix-app-example-static-library-layout"
mathkit/
  include/
    mathkit/
      math.hpp
  src/
    add.cpp
    multiply.cpp
  vix.app
```

Build it with:

```bash id="vix-app-example-library-build"
vix build
```

A library target is built, but it is not meant to be launched with `vix run`.

## Shared library

Use a shared library when the output must be loaded or distributed as a dynamic library.

```ini id="vix-app-example-shared-library"
name = "plugin"
type = "shared-library"
standard = "c++20"
output_dir = "lib"

sources = [
  "src/plugin.cpp",
]

include_dirs = [
  "include",
]

compile_features = [
  "cxx_std_20",
]

packages = [
  "vix",
]

links = [
  "vix::vix",
]
```

A shared library should expose a stable public header surface and keep implementation details under `src/`.

## Registry dependency

The `deps` field declares Vix Registry dependencies. The `links` field still names the target that the application uses.

```ini id="vix-app-example-registry-dep"
name = "api"
type = "executable"
standard = "c++20"
output_dir = "bin"

sources = [
  "src/main.cpp",
]

include_dirs = [
  "include",
  "src",
]

packages = [
  "vix",
]

deps = [
  "adastra/logger@1.0.0",
]

links = [
  "vix::vix",
  "adastra::logger",
]
```

After changing registry dependencies, resolve them before building.

```bash id="vix-app-example-registry-commands"
vix install
vix build
```

The dependency entry says what Vix should resolve. The link entry says what the application target actually uses.

## Resources with custom destinations

Use `source=destination` when the runtime layout should be different from the source layout.

```ini id="vix-app-example-custom-resources"
name = "server"
type = "executable"
standard = "c++20"
output_dir = "bin"

sources = [
  "src/main.cpp",
]

include_dirs = [
  "src",
]

packages = [
  "vix",
]

links = [
  "vix::vix",
]

resources = [
  "config/dev.env=.env",
  "frontend/dist=public",
  "storage=storage",
]
```

This is useful when the project keeps files in development-specific locations, but the running application expects a simpler layout beside the executable.

## Development diagnostics

A backend template can include warning and sanitizer options when the project needs stronger local diagnostics.

```ini id="vix-app-example-sanitizers"
name = "api"
type = "executable"
standard = "c++20"
output_dir = "bin"

sources = [
  "src/main.cpp",
]

include_dirs = [
  "include",
  "src",
]

defines = [
  "VIX_BACKEND_APP=1",
  "VIX_APP_NAME=api",
  "VIX_SANITIZERS=1",
]

compile_options = [
  "$<$<CXX_COMPILER_ID:MSVC>:/W4>",
  "$<$<CXX_COMPILER_ID:MSVC>:/permissive->",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-Wall>",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-Wextra>",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-Wpedantic>",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-g3>",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-fno-omit-frame-pointer>",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-O1>",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-fsanitize=address,undefined>",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-fno-sanitize-recover=undefined>",
]

link_options = [
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-g>",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-fsanitize=address,undefined>",
]

packages = [
  "vix",
]

links = [
  "vix::vix",
]
```

Keep diagnostic options intentional. They are useful during development, but they should not make the manifest harder to read than the project itself.

## Recommended manifest order

For most projects, this order is easy to review.

```ini id="vix-app-example-recommended-order"
name = "app"
type = "executable"
standard = "c++20"
output_dir = "bin"

sources = [
]

include_dirs = [
]

defines = [
]

compile_options = [
]

link_options = [
]

compile_features = [
]

packages = [
]

deps = [
]

links = [
]

resources = [
]

[module.name]
enabled = true
path = "modules/name"
kind = "backend"
depends = []
```

The target identity comes first. Source layout follows. Compile behavior comes next. Packages, registry dependencies, links, resources, and app modules come after that.

## Choosing the right example

Start with the minimal executable when learning the manifest. Use the backend example for a server-style application. Use the module example when the backend has real feature areas that need boundaries. Use the game example when the program needs the game runtime and assets. Use a library example when the project produces reusable code instead of an application process.

After editing an example into your project, run:

```bash id="vix-app-example-final-check"
vix build
```

For module-based backends, run:

```bash id="vix-app-example-final-module-check"
vix modules check
vix build
```

## Next step

Continue with migration from CMake to understand how an existing project can move toward a `vix.app` workflow without changing the way developers use `vix build` and `vix run`.

[Migrating from CMake](/guides/vix-app/migration-from-cmake)
