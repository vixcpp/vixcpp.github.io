# Using with CMake

Application modules can be used in a project that keeps a normal root `CMakeLists.txt`. This is useful when a C++ codebase already has its own build structure, or when the project does not want to adopt `vix.app` yet but still needs a clearer way to organize internal features.

In this mode, Vix does not replace the project build. It creates the `modules/` layout, writes a shared module loader under `cmake/`, and generates CMake targets for each module. The existing project remains responsible for its main target, options, dependencies, and build decisions.

## Basic idea

A CMake project can start with a layout like this:

```txt
api/
  CMakeLists.txt
  src/
  include/
```

After enabling modules, the project gains a module area:

```txt
api/
  CMakeLists.txt
  cmake/
    vix_modules.cmake
  modules/
    auth/
  src/
  include/
```

Each module has its own CMake target and an alias target. For a project named `api` and a module named `auth`, Vix generates:

```txt
api_auth
api::auth
```

The alias target is the name the rest of the project should use when linking against the module.

```cmake
target_link_libraries(api PRIVATE api::auth)
```

This keeps the module usable from normal CMake while preserving the same public and private layout used by Vix application projects.

## Initialize modules

Run the initialization command from the project root.

```bash
vix modules init
```

This creates:

```txt
modules/
cmake/vix_modules.cmake
```

When a root `CMakeLists.txt` exists, Vix can also patch it to include the module loader. The inserted block is marked so the operation stays idempotent.

```cmake
# VIX_MODULES_BEGIN
include(${CMAKE_CURRENT_LIST_DIR}/cmake/vix_modules.cmake)
# VIX_MODULES_END
```

The include is normally inserted after the root `project(...)` call. If your project has a custom CMake layout and you want to connect the loader manually, run:

```bash
vix modules init --no-patch
```

Then add the include yourself where it fits your build.

```cmake
include(${CMAKE_CURRENT_LIST_DIR}/cmake/vix_modules.cmake)
```

## Add a module

Create a module with:

```bash
vix modules add auth
```

In a classic CMake project, Vix creates a simple C++ module skeleton.

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

The public header lives under `include/auth/`.

```cpp
#include <auth/api.hpp>
```

The implementation stays under `src/`.

```txt
modules/auth/src/auth.cpp
```

This separation is the main contract of the module layout. Code outside the module should depend on the public headers and the module target, not on private source files.

## Link the module

By default, `vix modules add <name>` can add an auto-link block to the root `CMakeLists.txt` when it can detect the project target.

For a project named `api`, the generated link shape is:

```cmake
if (TARGET api::auth)
  if (TARGET api)
    target_link_libraries(api PRIVATE api::auth)
  endif()
endif()
```

This is helpful for simple projects where the root CMake project name and the main target name are the same. If your project uses a different main target name, or if you prefer to control linking manually, create the module without auto-linking.

```bash
vix modules add auth --no-link
```

Then link the module from your own CMake code.

```cmake
target_link_libraries(my_server PRIVATE api::auth)
```

The important part is the alias target. The generated module target may be named `api_auth`, but other targets should normally consume the module through `api::auth`.

## Project name detection

Vix uses the project name to generate module target names. In a CMake project, it tries to read the name from the root `project(...)` call.

```cmake
project(api)
```

This produces module names such as:

```txt
api_auth
api::auth
```

If the detected name is not the prefix you want, pass it explicitly.

```bash
vix modules add auth --project api
```

The same option can be used with `check` when the command needs to understand module target relationships.

```bash
vix modules check --project api
```

Use this when the directory name, CMake project name, and main target name do not all match.

## Module CMakeLists.txt

A simple generated module has its own `CMakeLists.txt`.

```txt
modules/auth/CMakeLists.txt
```

The generated target compiles the module implementation, exposes the public include directory, keeps the private source directory private, and creates an alias target.

Conceptually, the module behaves like this:

```cmake
add_library(api_auth)
add_library(api::auth ALIAS api_auth)

target_sources(api_auth
  PRIVATE
    src/auth.cpp
)

target_include_directories(api_auth
  PUBLIC
    ${CMAKE_CURRENT_LIST_DIR}/include
  PRIVATE
    ${CMAKE_CURRENT_LIST_DIR}/src
)

target_compile_features(api_auth PUBLIC cxx_std_20)
```

The exact generated file is owned by the module skeleton, so it can be edited when the module grows. For example, a module can add more source files, link another module, or add external libraries that only the module needs.

## Cross-module dependencies

When one module uses another module, the dependency should be visible in CMake.

```cmake
target_link_libraries(api_projects
  PUBLIC
    api::auth
)
```

This is better than relying only on include paths. The include statement shows what header is used, but the link relationship shows the build dependency.

A public header from `projects` may include a public header from `auth`.

```cpp
#include <auth/api.hpp>
```

When that happens, the `projects` module should declare the dependency through its target.

```cmake
target_link_libraries(api_projects
  PUBLIC
    api::auth
)
```

This makes the relationship clear to CMake, to Vix checks, and to developers reading the project.

## Module checks

Run the module check command after adding modules or changing dependencies.

```bash
vix modules check
```

In a CMake project, the check command focuses on the module folder structure and the public/private dependency rules. It scans public headers under `modules/<name>/include/<name>/`, checks that public headers do not include private implementation paths, and verifies that cross-module includes are backed by explicit module dependencies.

For example, this is the kind of include that should be avoided from a public header:

```cpp
#include "../src/AuthStore.hpp"
```

Public headers should include public headers.

```cpp
#include <auth/api.hpp>
```

And the CMake dependency should be declared.

```cmake
target_link_libraries(api_projects
  PUBLIC
    api::auth
)
```

This keeps the module boundary useful instead of turning `modules/` into another flat source tree.

## Manual integration

Some CMake projects have custom structure, multiple main targets, generated sources, special options, or non-standard build order. In those projects, use the module generator without patching the root files.

```bash
vix modules init --no-patch
vix modules add auth --no-link
```

Then connect the module loader and module targets where they belong in your build.

```cmake
include(${CMAKE_CURRENT_LIST_DIR}/cmake/vix_modules.cmake)

target_link_libraries(my_server PRIVATE api::auth)
```

This keeps Vix responsible for the module scaffold and module conventions, while your existing CMake project remains responsible for the final build shape.

## Difference from vix.app mode

In a `vix.app` project, enabled modules are declared in the root manifest.

```ini
[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = []
```

The generated Vix build then loads only the enabled modules.

In a classic CMake project, there is no `vix.app` module graph unless you create one separately. The module loader works from the CMake side, and the project decides which module targets are linked into which application targets.

That means commands such as `vix modules enable`, `vix modules disable`, and `vix modules list` are mainly for `vix.app` projects. In a CMake-first project, the active state of a module is usually controlled by whether the module is loaded and linked by CMake.

## Recommended workflow

For a simple CMake project, the normal workflow is:

```bash
vix modules init
vix modules add auth
vix modules check
vix build
```

For a custom CMake project, use the manual mode:

```bash
vix modules init --no-patch
vix modules add auth --no-link
```

Then connect the generated module loader and alias targets in your own CMake files.

```cmake
include(${CMAKE_CURRENT_LIST_DIR}/cmake/vix_modules.cmake)

target_link_libraries(my_server PRIVATE api::auth)
```

This gives the project the module layout without forcing the project to become a generated Vix application.

## Next step

Continue with dependencies and checks to understand how module relationships are validated and how the CLI catches unsafe module boundaries.

[Dependencies and Checks](/app-modules/dependencies-and-checks)
