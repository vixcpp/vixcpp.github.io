# Sources and Includes

`sources` and `include_dirs` describe the C++ files that make up the application target. They are two separate parts of the same idea: `sources` tells Vix what must be compiled, while `include_dirs` tells the compiler where headers can be found when those source files include them.

In a `vix.app` project, these paths are written relative to the project root. The manifest stays in the root of the application, and Vix uses it as the source of truth when running normal commands.

```bash id="o03dwj"
vix build
vix run
```

A clear source layout makes the project easier to read. A developer should be able to open `vix.app`, look at the source list, and understand the main shape of the application without searching through generated files.

## Basic example

A small application may only need one source file and one include root.

```ini id="n6u3zy"
name = "hello"
type = "executable"
standard = "c++20"

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

In this layout, `src/main.cpp` is compiled as part of the application target, and headers under `src/` can be included from the source files.

```txt id="jf7f8u"
hello/
  src/
    main.cpp
  vix.app
```

## Source files

The `sources` field should contain C++ translation units, usually `.cpp` files.

```ini id="dysadf"
sources = [
  "src/main.cpp",
  "src/app/AppBootstrap.cpp",
  "src/presentation/routes/RouteRegistry.cpp",
]
```

Headers normally do not need to be listed in `sources`. They are included by the `.cpp` files and found through `include_dirs`. Keeping the list focused on source files makes the manifest easier to maintain.

```txt id="qoqvwj"
src/main.cpp                         compiled
src/app/AppBootstrap.cpp             compiled
include/api/app/AppBootstrap.hpp      included, not listed as a source
```

The source list should be explicit. Vix applications avoid hiding important project structure behind broad automatic file discovery. This makes builds more predictable and makes code review easier when a new file becomes part of the application.

## Include directories

The `include_dirs` field contains directories, not individual header files.

```ini id="mctfpe"
include_dirs = [
  "include",
  "src",
]
```

Each entry becomes an include root. If the project has this file:

```txt id="vkf91q"
include/api/app/AppBootstrap.hpp
```

and `include` is listed in `include_dirs`, the source code should include it like this:

```cpp id="t2mxzo"
#include <api/app/AppBootstrap.hpp>
```

The include path should describe the structure of the project. Avoid include paths that only work from one source file’s local directory. A project is easier to move and reorganize when headers are included from stable roots.

## Application headers

A common Vix application layout separates public or shared headers from implementation files.

```txt id="f5e4ks"
api/
  include/
    api/
      app/
        AppBootstrap.hpp
      support/
        HttpResponses.hpp
  src/
    main.cpp
    api/
      app/
        AppBootstrap.cpp
      support/
        HttpResponses.cpp
  vix.app
```

The manifest then exposes both `include` and `src` as include roots.

```ini id="mu51ar"
sources = [
  "src/main.cpp",
  "src/api/app/AppBootstrap.cpp",
  "src/api/support/HttpResponses.cpp",
]

include_dirs = [
  "include",
  "src",
]
```

This lets application code include public headers from `include/` and internal headers from `src/` when needed.

```cpp id="u8gz3s"
#include <api/app/AppBootstrap.hpp>
#include <api/support/HttpResponses.hpp>
```

Use `include/` for headers that describe the application’s stable internal API. Use `src/` for headers that are only part of the implementation. The distinction does not need to be heavy, but it helps when the project grows.

## Backend source layout

Generated backend applications use a more structured source list because the backend already has a few clear responsibilities: application bootstrap, route registration, middleware registration, support helpers, and controllers.

```ini id="mpsm4r"
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
```

This keeps the entry point small. `src/main.cpp` starts the application, while the real backend organization lives under named folders. When the backend grows, the root source list should still remain readable. Large feature areas can move into Vix app modules instead of making the main application target absorb everything.

## Game source layout

A small game project may only compile `src/main.cpp`, while runtime files are copied through `resources`.

```ini id="raq0yc"
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

In this case, the source layout is intentionally small. Game assets and package metadata are not source files, so they belong in `resources`, not in `sources`.

## Headers are not resources

Headers and runtime resources serve different purposes. Headers are part of compilation and should be reachable through `include_dirs`. Runtime resources are files the built program needs when it runs.

```ini id="p0slrd"
include_dirs = [
  "include",
]

resources = [
  "assets=assets",
  ".env=.env",
]
```

Do not put headers in `resources` to make includes work. If a source file cannot find a header, the include root is the part that needs to be corrected.

## Paths are relative to the project root

All source and include paths are interpreted relative to the directory that contains `vix.app`.

```txt id="k7v27b"
api/
  vix.app
  src/
    main.cpp
  include/
    api/
      app.hpp
```

The manifest should use:

```ini id="k6eo3c"
sources = [
  "src/main.cpp",
]

include_dirs = [
  "include",
]
```

Avoid absolute paths in application manifests. A project with absolute paths becomes tied to one machine and is harder to share, test, or build in CI.

## Source files and internal modules

When a project uses Vix app modules, the main application source list should stay focused on the application entry point and core wiring. Module source files belong to the module itself.

```ini id="pb3mlw"
sources = [
  "src/main.cpp",
  "src/api/app/AppBootstrap.cpp",
  "src/api/presentation/routes/RouteRegistry.cpp",
]

include_dirs = [
  "include",
  "src",
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
```

A module such as `auth` should keep its own public headers and private implementation under its module directory.

```txt id="fb1rkf"
modules/auth/
  include/
    auth/
      api.hpp
  src/
    AuthModule.cpp
```

The main app should not manually list every module implementation file in `sources`. Declaring the module in `vix.app` gives Vix enough information to wire the module through the application module workflow.

## Include style for modules

A module public header should be included through its public module name.

```cpp id="n7wawo"
#include <auth/api.hpp>
```

This is clearer than reaching into the module’s private implementation tree.

```cpp id="auq3cc"
// Avoid this for cross-module usage.
#include "../modules/auth/src/AuthService.hpp"
```

Cross-module usage should go through public headers and explicit dependencies. When `projects` uses `auth`, the relationship belongs in the module declaration.

```ini id="j0hwso"
[module.projects]
enabled = true
path = "modules/projects"
kind = "backend"
depends = [
  "auth",
]
```

This keeps module boundaries visible in the manifest instead of hiding them inside relative include paths.

## Common mistakes

The most common source issue is listing the wrong root in `include_dirs`. If a header is located at:

```txt id="ke7zsl"
include/api/server/App.hpp
```

and the code says:

```cpp id="s3yboj"
#include <api/server/App.hpp>
```

then the include directory should be:

```ini id="j4nxu6"
include_dirs = [
  "include",
]
```

It should not be:

```ini id="y0rdku"
include_dirs = [
  "include/api/server",
]
```

The second form forces the source code to include headers from too deep inside the tree, which makes the layout harder to understand.

Another common issue is adding a new `.cpp` file and forgetting to add it to `sources`. If the file contains implementation code needed by the application, it must be listed.

```ini id="l7ea7n"
sources = [
  "src/main.cpp",
  "src/api/app/AppBootstrap.cpp",
  "src/api/presentation/controllers/UsersController.cpp",
]
```

A header-only helper does not need to be listed as a source, but the directory that contains it must still be reachable through `include_dirs`.

## A clean backend example

```txt id="ls89wi"
api/
  include/
    api/
      app/
        AppBootstrap.hpp
      support/
        HttpResponses.hpp
  src/
    main.cpp
    api/
      app/
        AppBootstrap.cpp
      support/
        HttpResponses.cpp
      presentation/
        routes/
          RouteRegistry.cpp
        middleware/
          MiddlewareRegistry.cpp
        controllers/
          HomeController.cpp
          HealthController.cpp
  modules/
    auth/
    projects/
  vix.app
```

```ini id="um0gno"
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

packages = [
  "vix",
]

links = [
  "vix::vix",
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
```

This layout keeps the main application target readable while leaving space for feature modules to grow independently.

## Checking the manifest

After changing `sources` or `include_dirs`, build the project.

```bash id="tt3mry"
vix build
```

For projects using app modules, also run the module checks.

```bash id="y58k5d"
vix modules check
```

A missing source file, incorrect include root, or invalid module boundary is easier to fix when caught immediately after editing the manifest.

## Next step

Continue with compile options to see how compiler flags and target features are declared when the default application settings are not enough.

[Compile Options](/guides/vix-app/compile-options)
