# Project Types

`vix.app` describes the target that Vix should build for an application-style project. In most generated projects, that target is an executable, because the project is meant to be run with `vix run`. The same manifest format can also describe library targets when the project is meant to produce reusable code.

The important distinction is that `type` describes the C++ target shape, not the whole product category. A backend, a game, or a Vue + Vix project may all build an executable target, but they use different source layouts, linked Vix modules, resources, and project metadata.

## Executable applications

Most Vix applications use:

```ini id="b72kcz"
type = "executable"
```

An executable target produces a program that can be built and run directly:

```bash id="lyl451"
vix build
vix run
```

A minimal executable manifest looks like this:

```ini id="b8vvoa"
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

output_dir = "bin"
```

The `name` becomes the application target name. The `sources` list tells Vix which files belong to that target. The `links` list tells Vix which libraries are linked into the executable.

## Backend applications

A Vix backend is normally still an executable target. It runs as a process, exposes routes, reads runtime configuration, and may later be managed by production commands such as service, proxy, health, logs, or deploy.

For that reason, generated backend manifests use:

```ini id="sq8hqr"
type = "executable"
```

The backend identity comes from the project structure, source files, definitions, resources, linked modules, and project metadata around the app.

```ini id="k7a9vb"
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

This layout gives the backend a clear entry point while still keeping controllers, middleware, routes, support code, and application bootstrap code separated. When the backend grows, internal modules can be declared in the same `vix.app` file through `[module.<name>]` sections.

## Game applications

A Vix game project also builds an executable target. The difference is in the modules it links and the resources it needs at runtime.

```ini id="reob7d"
name = "space-demo"
type = "executable"
standard = "c++20"

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

output_dir = "bin"
```

The executable starts the game runtime, while `resources` keeps assets and game metadata available next to the built target. This keeps the build manifest focused on the C++ side without losing the runtime files needed by the game.

## Frontend + Vix backend projects

A frontend + Vix project usually has a frontend directory and a Vix backend executable. The backend remains described by `vix.app`, while frontend tasks and metadata live in `vix.json`.

The backend manifest may stay small:

```ini id="wgl8ac"
name = "dashboard"
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

output_dir = "bin"
```

The frontend workflow is then handled through project tasks, for example installing dependencies, running the dev server, or building the frontend. This keeps `vix.app` responsible for the C++ application target instead of turning it into a general project configuration file.

## Static libraries

A static library target can be used when the project produces reusable code that will be linked into another target.

```ini id="dzc2bc"
name = "mathkit"
type = "static-library"
standard = "c++20"

sources = [
  "src/add.cpp",
  "src/multiply.cpp",
]

include_dirs = [
  "include",
]

packages = [
  "vix",
]

links = [
  "vix::vix",
]
```

The accepted short form is also available:

```ini id="u5hsn9"
type = "static"
```

Static library projects are useful for internal packages, shared application logic, or code that should be built once and linked into an executable.

## Shared libraries

A shared library target produces a dynamic library.

```ini id="ki6dep"
name = "plugin"
type = "shared-library"
standard = "c++20"

sources = [
  "src/plugin.cpp",
]

include_dirs = [
  "include",
]

packages = [
  "vix",
]

links = [
  "vix::vix",
]
```

The accepted short form is:

```ini id="gsovw9"
type = "shared"
```

Use a shared library when the project is meant to be loaded dynamically or distributed as a runtime library. For normal Vix applications, `executable` remains the clearer default.

## Supported type values

`vix.app` accepts the common names for executable and library targets.

```txt id="qdd2nm"
executable
static
static-library
shared
shared-library
library
```

The `library` value maps to a library target. For clarity in documentation and project manifests, prefer the explicit forms:

```ini id="el7w3m"
type = "static-library"
```

or:

```ini id="fbsszf"
type = "shared-library"
```

For applications that should run with `vix run`, use:

```ini id="gego67"
type = "executable"
```

## How Vix chooses the project input

Vix keeps existing CMake projects working. When resolving a project for `vix build` or `vix run`, Vix first checks for a `CMakeLists.txt`. If one exists, the project is treated as a CMake project. If no `CMakeLists.txt` exists and `vix.app` is present, Vix loads the manifest and generates the internal application build files.

```txt id="h3yw7o"
1. CMakeLists.txt
2. vix.app
```

This means a `vix.app` project should not also keep a root `CMakeLists.txt` unless the intention is to use the CMake project directly. In a pure `vix.app` project, let Vix generate the internal files under `.vix/generated/app/`.

## Choosing the right type

Use `executable` for apps, backends, games, tools, servers, and anything the developer should run directly. Use `static-library` for reusable code that should be linked into another target. Use `shared-library` when the output must be loaded or distributed as a dynamic library.

The project family can still be expressed through the rest of the manifest. A backend is an executable with backend sources, backend defines, runtime resources, and often app modules. A game is an executable linked with `vix::game` and `vix::io`, with assets copied as resources. The target type stays simple while the project structure carries the meaning.

## Next step

Continue with the manifest reference to see every supported field in one place.

[Manifest Reference](/guides/vix-app/manifest-reference)
