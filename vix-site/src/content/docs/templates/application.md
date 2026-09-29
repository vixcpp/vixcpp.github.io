# Application Template

The application template is the default starting point for a small Vix application. It creates a C++ project that can be built and run through the normal Vix workflow, while keeping the project structure simple enough to understand at a glance.

This template is useful when you want a clean Vix application without the heavier production backend layout. It gives you an executable target, a `vix.app` manifest, a `vix.json` project file, a minimal HTTP entry point, a basic test, and a module registry that can later connect application modules.

```bash
vix new hello --app
```

After creation, the normal workflow is short.

```bash
cd hello
vix build
vix run
```

## What this template is for

Use the application template when the project should start as a small Vix app. It is a good fit for examples, internal tools, small HTTP services, experiments, prototypes, or applications that may later grow into a module-based backend.

The template does not try to impose the full backend structure. It does not create controllers, middleware registries, route registries, production service metadata, or server-rendered views. Those belong to the backend and web templates. The application template stays closer to the smallest useful Vix application shape.

At the same time, it is not a throwaway layout. The generated project already includes a stable module integration point, so the application can grow without rewriting the entry point when `vix modules` is introduced.

## Generated project shape

A generated application project follows a compact layout.

```txt
hello/
  include/
    app/
      ModuleRegistry.hpp
  src/
    main.cpp
    app/
      ModuleRegistry.cpp
  tests/
    test_basic.cpp
  vix.app
  vix.json
  README.md
```

The exact files may grow as Vix evolves, but the important structure remains the same: `src/main.cpp` starts the application, `include/app/` exposes the module registry, `src/app/` implements it, and `vix.app` describes the executable target that Vix should build.

## Entry point

The generated `main.cpp` is intentionally small. It creates the Vix application, registers the base route, delegates module wiring to the module registry, then starts the server.

The entry point should stay focused on startup. As the project grows, feature-specific code should move into application modules or into project-owned source files instead of turning `main.cpp` into a long list of route handlers.

```txt
src/main.cpp
```

A small entry point makes the project easier to read. A developer can open the application and quickly see where startup begins, without having to understand every feature at the same time.

## Module registry

The application template includes a module registry.

```txt
include/app/ModuleRegistry.hpp
src/app/ModuleRegistry.cpp
```

This registry gives the application one stable place where internal modules can be connected. By default, it can be empty or minimal, but it becomes important when the project starts using `vix modules`.

Instead of manually adding every future module to `main.cpp`, the application can delegate module registration through the registry.

```cpp
app::ModuleRegistry::register_all(app);
```

The registry can then connect to the generated module bridge.

```cpp
vix::app_generated::register_app_modules(app);
```

This is why the application template is a good starting point for projects that may grow later. It stays small on day one, but it already has a clean path toward application modules.

## Manifest

The application template uses `vix.app` as the application manifest.

```txt
vix.app
```

The manifest describes the C++ target: its name, target type, standard, source files, include directories, packages, links, resources, and output directory.

A small application manifest has this general shape:

```ini
name = "hello"
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

The manifest is the source of truth for the application target. Vix converts it into an internal CMake project under `.vix/generated/app/` when the project is built.

Generated files are build infrastructure. The file you edit is `vix.app`.

## Project metadata

The template also includes `vix.json`.

```txt
vix.json
```

This file is used for project metadata, tasks, and Vix workflow configuration. The application target itself belongs in `vix.app`; project commands and higher-level workflow settings belong in `vix.json`.

A project may use `vix.json` to expose common commands such as build, run, test, or check.

```json
{
  "tasks": {
    "build": "vix build",
    "run": "vix run",
    "test": "vix tests",
    "check": "vix check --tests --run"
  }
}
```

This keeps the application manifest clean. `vix.app` describes what is built. `vix.json` describes how the project is operated.

## Tests

The application template includes a basic test file.

```txt
tests/test_basic.cpp
```

The first test is intentionally small. Its job is to confirm that the generated project can compile and run tests through the Vix workflow.

Run the test suite with:

```bash
vix tests
```

For a stronger local validation, run:

```bash
vix check --tests --run
```

As the application grows, keep application-level tests under `tests/`. If the project later uses application modules, module-specific tests can live inside the module directories.

## Growing the application

The application template can grow in two natural directions.

For a small application, you can keep adding source files to the main project and list them in `vix.app`.

```ini
sources = [
  "src/main.cpp",
  "src/app/ModuleRegistry.cpp",
  "src/services/HealthService.cpp",
]
```

For a larger application, you can introduce application modules.

```bash
vix modules init
vix modules add auth
vix modules check
```

A module-based application can keep `main.cpp` stable while features such as `auth`, `projects`, `billing`, or `logs` grow under `modules/`.

```txt
hello/
  src/
  include/
  modules/
    auth/
    projects/
  vix.app
```

This gives the project a clean path from a small app to a more structured codebase without changing the basic Vix workflow.

## Difference from the backend template

The application template and backend template both create executable Vix projects, but they are not the same.

The application template is small. It gives you a simple entry point, a manifest, a test, and a module registry.

The backend template is more structured. It creates `AppBootstrap`, `RouteRegistry`, `MiddlewareRegistry`, controllers, response helpers, runtime directories, production metadata, and health routes.

Choose the application template when the project should start small. Choose the backend template when the project is already meant to be a structured API or production backend service.

## Recommended workflow

A normal first session looks like this:

```bash
vix new hello --app
cd hello

vix build
vix run
```

When tests matter:

```bash
vix tests
```

When the application starts using modules:

```bash
vix modules init
vix modules add auth
vix modules check
vix build
```

This workflow keeps the project simple at the beginning and gives it a clear path as it grows.

## Next step

Continue with the generated layout to see each file created by the application template and what role it plays in the project.

[Generated Layout](/templates/application/layout)
