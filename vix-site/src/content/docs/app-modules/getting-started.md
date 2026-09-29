# Getting Started

This guide shows the first workflow for using application modules in a C++ project. The same commands work in a Vix application that uses `vix.app`, and they can also be used in an existing CMake project that wants a clearer internal module structure.

Application modules are created from the project root. They live under `modules/`, expose public headers through `include/<module>/`, keep private implementation under `src/`, and can be checked with the Vix CLI before the application is built.

## Start from the project root

Run module commands from the root of the project. In a `vix.app` project, that is the directory that contains `vix.app`.

```txt
api/
  src/
  include/
  vix.app
```

In an existing CMake project, that is the directory that contains the root `CMakeLists.txt`.

```txt
api/
  src/
  include/
  CMakeLists.txt
```

The module system uses the project root to decide where to create `modules/`, where to place the module loader, and how to detect the project name used for generated module targets.

## Initialize module support

Start by initializing the module layout.

```bash
vix modules init
```

This creates the standard module directory and the CMake loader used by the module system.

```txt
modules/
cmake/vix_modules.cmake
```

In a classic CMake project, Vix can patch the root `CMakeLists.txt` so the module loader is included by the existing build. In a `vix.app` project, the root CMake file is generated internally by Vix, so the command does not need to patch a user-written `CMakeLists.txt`.

The result is the same at the project level: the project now has a place where application modules can be added.

## Add a module

Create the first module with `vix modules add`.

```bash
vix modules add auth
```

The generated structure depends on the project Vix detects. In a backend-style `vix.app` project, the command creates a backend module with a module entry point, a controller, metadata, tests, and migration space.

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

In a simpler C++ project, the generated module is smaller.

```txt
modules/auth/
  include/auth/api.hpp
  src/auth.cpp
  tests/test_auth.cpp
  CMakeLists.txt
  vix.module
```

Module names are normalized before files are created. For example, `user-profile` becomes `user_profile`. This keeps CMake target names, namespaces, and include paths stable.

## List declared modules

In a `vix.app` project, modules are declared in the manifest. After adding a module, inspect the current module list.

```bash
vix modules list
```

A module declaration looks like this:

```ini
[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = []
```

The list command shows the module name, enabled state, kind, path, filesystem status, and dependencies. It is useful after adding modules or after editing `vix.app` by hand.

## Enable and disable modules

A module can stay declared while being removed from the active application wiring.

```bash
vix modules disable auth
```

This changes the module section in `vix.app`.

```ini
[module.auth]
enabled = false
path = "modules/auth"
kind = "backend"
depends = []
```

Enable it again with:

```bash
vix modules enable auth
```

Disabling a module does not delete its files. It only tells Vix that the module should not be wired into the generated application target. This is useful when a feature is still being prepared or when a team wants to keep the code on disk without making it part of the current build.

## Check the module layer

Run the module checks before building when modules are added, removed, enabled, disabled, or when dependencies change.

```bash
vix modules check
```

The check command validates the structure around the module system. It verifies that declared modules exist on disk, that enabled modules have the required build and metadata files, that enabled modules do not depend on disabled modules, that dependencies do not form cycles, and that routed modules do not reuse the same route prefix.

It also protects the public/private boundary. Public headers should include public module headers, not private files from another module’s `src/` directory.

A normal backend workflow is:

```bash
vix modules check
vix build
```

For a stronger local validation, run the project check after the module check.

```bash
vix modules check
vix check --tests --run
```

## Add a second module

A real application usually grows one feature at a time. After `auth`, a backend might add `projects`.

```bash
vix modules add projects
```

Then declare its dependency on `auth` in `vix.app`.

```ini
[module.projects]
enabled = true
path = "modules/projects"
kind = "backend"
depends = [
  "auth",
]
```

This makes the relationship visible from the root manifest. A reader can see that `projects` depends on `auth` without searching through implementation files.

After editing dependencies, run:

```bash
vix modules check
vix build
```

## Use modules in an existing CMake project

A project does not need to be generated by Vix to use application modules. In an existing CMake project, start the same way.

```bash
vix modules init
vix modules add auth
```

The module receives a CMake target and an alias target.

```txt
api_auth
api::auth
```

The exact project prefix comes from the project name detected by Vix, or from the value passed with `--project`.

```bash
vix modules add auth --project api
```

This lets an existing C++ project adopt the module layout gradually. The root project can keep its current build structure while modules follow the same public/private convention used by Vix applications.

## Common first workflow

For a new backend-style application, the first session usually looks like this:

```bash
vix modules init
vix modules add auth
vix modules list
vix modules check
vix build
```

Then add more modules as the application grows.

```bash
vix modules add projects
vix modules add builds
vix modules check
vix build
```

The workflow is intentionally small. The important part is not the number of commands, but the habit: create modules through the CLI, keep their declarations visible, check the module graph, then build the application.

## Next step

Continue with the CLI workflow to understand each `vix modules` subcommand and the options available for existing projects and `vix.app` projects.

[CLI Workflow](/app-modules/cli-workflow)
