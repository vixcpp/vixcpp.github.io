# Generated Layout

The application template generates a small Vix project with one executable target, a minimal HTTP entry point, a module registry, a basic test, and the project files needed by the Vix workflow.

The layout is intentionally compact. It gives the application enough structure to grow, but it does not create the full backend architecture used by the backend template.

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

  config/
    app.json

  .env.example
  README.md
  vix.app
  vix.json
```

Some versions or compatibility modes may also generate CMake support files such as `CMakePresets.json` or a fallback `CMakeLists.txt`. The normal app-first workflow is centered on `vix.app`.

## `src/main.cpp`

The application entry point lives in:

```txt
src/main.cpp
```

This file starts the Vix application. In the generated template, `main.cpp` stays small: it creates the app, registers a simple route, connects the module registry, and starts the server.

The entry point is not meant to become the place where every future feature is implemented. As the application grows, keep startup code in `main.cpp` and move feature code into project files or application modules.

```txt
src/main.cpp        application startup
```

A small entry point makes the project easier to understand. A developer can open the file and see how the app starts without reading the whole application.

## `include/app/ModuleRegistry.hpp`

The module registry public header lives in:

```txt
include/app/ModuleRegistry.hpp
```

This file declares the registry used to connect application modules.

```cpp
app::ModuleRegistry::register_all(app);
```

The registry gives the application one stable module integration point. This matters because a small app can later grow into a module-based project without turning `main.cpp` into a long list of module includes and manual registration calls.

## `src/app/ModuleRegistry.cpp`

The module registry implementation lives in:

```txt
src/app/ModuleRegistry.cpp
```

The default implementation is intentionally small. Its job is to provide one place where generated application modules can be connected.

When the project uses `vix modules`, the registry can delegate to the generated module bridge.

```cpp
vix::app_generated::register_app_modules(app);
```

This keeps module wiring away from the main entry point. The application starts in `main.cpp`, but module registration can evolve through the registry.

## `tests/test_basic.cpp`

The generated application includes a basic test file.

```txt
tests/test_basic.cpp
```

The first test is not meant to prove application behavior yet. It proves that the generated project can compile a test target and run the Vix test workflow.

Run tests with:

```bash
vix tests
```

For a stronger local check, run:

```bash
vix check --tests --run
```

As the application grows, keep application-level tests under `tests/`. If the project later uses application modules, module-specific tests can live under each module.

```txt
modules/auth/tests/test_auth.cpp
```

## `config/app.json`

The application template can include a default configuration file.

```txt
config/app.json
```

This file provides structured defaults for server settings, logging, WAF settings, and database configuration. It gives a small application a documented configuration shape without forcing the developer to build a production layout immediately.

A generated app config can include sections such as:

```json
{
  "server": {
    "port": 8080
  },
  "logging": {
    "async": true
  },
  "database": {
    "default": {
      "host": "localhost"
    }
  }
}
```

Runtime secrets and local environment values should still live in `.env` or `.env.example`, not directly in committed configuration files.

## `.env.example`

The template includes an example environment file.

```txt
.env.example
```

It documents the local environment variables expected by the generated application. For example, it may include the server port, database connection values, logging settings, and WAF mode.

```dotenv
SERVER_PORT=8080
DATABASE_ENGINE=mysql
DATABASE_DEFAULT_HOST=127.0.0.1
DATABASE_DEFAULT_PORT=3306
DATABASE_DEFAULT_USER=root
DATABASE_DEFAULT_PASSWORD=
DATABASE_DEFAULT_NAME=appdb
LOGGING_ASYNC=true
WAF_MODE=basic
```

For local development, copy it before running the application when the project expects a real `.env` file.

```bash
cp .env.example .env
```

Small applications may not need many environment variables at first, but keeping the example file makes the expected runtime configuration visible.

## `vix.app`

The main application target is described by:

```txt
vix.app
```

This is the source of truth for the app-first build workflow. It tells Vix which target to build, which source files belong to the executable, which include directories are available, which packages are loaded, which libraries are linked, and where the output should be placed.

A generated application manifest usually follows this shape:

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

When Vix builds the project, it converts `vix.app` into an internal CMake project under:

```txt
.vix/generated/app/
```

Those generated files are build output. The file to edit is `vix.app`.

## `vix.json`

Project metadata and workflow tasks live in:

```txt
vix.json
```

This file is different from `vix.app`. The manifest describes the application target. `vix.json` describes project-level metadata, dependency state, variables, tasks, and workflow shortcuts.

A small application may use tasks such as:

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

This keeps the manifest focused. Build target structure belongs in `vix.app`; project commands belong in `vix.json`.

## `README.md`

The generated README gives the project a local starting point.

```txt
README.md
```

It should explain how the project was generated, how to build it, how to run it, and where the important files live. The README is useful for the project itself, while the documentation pages explain the template in more depth.

## Optional CMake support files

The application template has support for CMake-related files for compatibility and fallback workflows.

```txt
CMakePresets.json
CMakeLists.txt
```

In the app-first workflow, `vix.app` is the important file. Vix reads the manifest and generates the internal CMake build input under `.vix/generated/app/`.

A root `CMakeLists.txt` changes project resolution. When a root `CMakeLists.txt` exists, Vix treats the project as an existing CMake project before it considers `vix.app`.

```txt
1. CMakeLists.txt
2. vix.app
```

For a pure `vix.app` application, do not keep a root `CMakeLists.txt` as the active project source unless that is intentional.

## How the pieces work together

The generated application has a small flow.

```txt
vix.app
  -> generated CMake project
      -> src/main.cpp
          -> app::ModuleRegistry
              -> generated app modules
```

The project files have separate responsibilities.

```txt
src/main.cpp                  starts the app
include/app/ModuleRegistry.hpp public module registry declaration
src/app/ModuleRegistry.cpp     module registry implementation
tests/test_basic.cpp           basic test target
config/app.json                structured default config
.env.example                   local environment example
vix.app                        application target manifest
vix.json                       project metadata and tasks
README.md                      project-local guide
```

This separation is what keeps the application template small but still ready to grow.

## Next step

Continue with the module registry page to understand why the application template includes a module integration point from the beginning.

[Module Registry](/templates/application/module-registry)
