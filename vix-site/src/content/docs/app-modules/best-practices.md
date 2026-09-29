# Best Practices

Application modules work best when they make the structure of a project easier to understand. They should give important features a clear home, make dependencies visible, and keep the main application from becoming a place where every feature is wired by hand.

The goal is not to split a project into as many folders as possible. A good module represents a real part of the application. It has a reason to exist, owns its files, exposes a small public surface, and depends on other modules only when that relationship is part of the application design.

## Start with the application shape

Begin with the application itself. The main application should own startup, configuration, middleware, shared routes, runtime resources, and the final executable. Modules should own feature-specific code.

In a backend, this usually means the application shell stays responsible for the startup flow.

```txt
main.cpp
  -> AppBootstrap
      -> MiddlewareRegistry
      -> RouteRegistry
      -> generated app modules
      -> app.run(...)
```

Feature-specific code can then move into modules.

```txt
modules/
  auth/
  projects/
  builds/
  packages/
```

This keeps the application readable. The backend has one startup path, while each feature has its own place to grow.

## Create modules for real features

Create a module when a feature has enough responsibility to deserve ownership. Good module names usually describe product or backend features.

```txt
auth
projects
builds
packages
billing
logs
deployments
```

These names tell a developer what part of the system the module owns. They also make the module graph easier to read from `vix.app`.

```ini
[module.projects]
enabled = true
path = "modules/projects"
kind = "backend"
depends = [
  "auth",
]
```

Avoid creating modules only because a folder has many files. A large folder may need cleanup, but that does not always mean it needs to become a module. A module should create a useful boundary, not only a deeper directory.

## Avoid weak module names

Names such as `utils`, `helpers`, `common`, `shared`, and `misc` should be used carefully. They often become places where unrelated code is placed because no clear owner exists.

A module should make ownership more obvious. If a helper belongs to authentication, keep it inside `auth`. If a type belongs to projects, keep it inside `projects`. If something is truly shared, give it a name that describes the responsibility.

```txt
identity
permissions
storage
events
```

A clear shared module is better than a vague shared module. The name should explain why the code exists.

## Keep public headers small

A module’s public headers live under `include/<module>/`.

```txt
modules/auth/
  include/auth/
    AuthModule.hpp
```

Code outside the module should include public headers through the module path.

```cpp
#include <auth/AuthModule.hpp>
```

Keep these headers focused. Public headers are the part of the module that other code is allowed to depend on, so they should expose stable concepts rather than private implementation details.

Private implementation should stay under `src/`.

```txt
modules/auth/
  src/
    AuthService.cpp
    AuthStore.cpp
```

When a public header starts exposing too much internal detail, the module becomes harder to change. Prefer a small public interface and keep implementation decisions private.

## Do not include private files from another module

A module should not reach into another module’s `src/` directory.

```cpp
#include "../../auth/src/AuthStore.hpp"
```

That kind of include creates a hidden dependency on private implementation. It may compile for a while, but it makes refactoring difficult because another module is now depending on files that were not meant to be public.

Expose the needed type or function through a public header.

```txt
modules/auth/include/auth/AuthStore.hpp
```

Then include it through the public path.

```cpp
#include <auth/AuthStore.hpp>
```

After that, declare the module dependency.

```cmake
target_link_libraries(api_projects
  PUBLIC
    api::auth
)
```

The include path and the build dependency should tell the same story.

## Make dependencies explicit

When one module depends on another, declare that relationship in `vix.app`.

```ini
[module.projects]
enabled = true
path = "modules/projects"
kind = "backend"
depends = [
  "auth",
]
```

The dependency should also exist at the CMake target level when the module uses another module’s public headers or symbols.

```cmake
target_link_libraries(api_projects
  PUBLIC
    api::auth
)
```

This gives the project two useful signals. The manifest shows the application architecture, and CMake shows the build relationship. When those two agree, the module graph is easier to review and easier to debug.

## Keep dependency direction simple

A module graph should be easy to read. If `projects` depends on `auth`, that relationship is clear.

```txt
projects -> auth
```

A cycle is harder to reason about.

```txt
auth -> projects -> auth
```

Cycles usually mean two features know too much about each other. When that happens, look for the concept that should sit below both modules. Sometimes the answer is a smaller shared module such as `identity`, `permissions`, or `events`. Sometimes the answer is to move a function behind a better public API so only one direction is needed.

The right shape depends on the application, but the direction should remain understandable.

## Use disabled modules deliberately

A disabled module remains declared but is not wired into the active application target.

```ini
[module.billing]
enabled = false
path = "modules/billing"
kind = "backend"
depends = [
  "auth",
]
```

This is useful for work in progress, migration, or features that should stay in the repository without being part of the current build. It should not become a hiding place for abandoned code.

When a module is disabled, keep the reason clear in the project history or in the surrounding work. If the module will be used later, keep it checked and structurally valid. If it has no future, remove it instead of leaving a permanent inactive feature in the tree.

## Keep route ownership clear

Backend modules should own clear route prefixes.

```txt
auth      -> /api/auth
projects  -> /api/projects
builds    -> /api/builds
packages  -> /api/packages
```

The route prefix lives in `vix.module`.

```ini
name = "auth"
kind = "backend"

[routes]
prefix = "/api/auth"

[tests]
enabled = true
```

The prefix does not need to describe every route in the module. It gives the module a stable HTTP namespace and helps the check command detect conflicts.

Avoid two modules sharing the same prefix. If two features both want the same route area, the ownership probably needs to be clarified before more code is added.

## Keep the application bootstrap stable

Generated Vix applications and backends use a stable registration point for modules.

```cpp
vix::app_generated::register_app_modules(app);
```

Do not add every module controller manually to `main.cpp` or `AppBootstrap.cpp` when the project already uses generated registration. The root manifest should decide which modules are enabled, and Vix should generate the bridge that connects them.

The startup code should stay focused on application startup. Modules should own feature registration through their module entry points.

```cpp
AuthModule::register_routes(app);
```

When startup code becomes a long list of feature-specific includes, the application shell is starting to absorb responsibilities that belong to modules.

## Treat generated files as output

Generated files under `.vix/generated/app/` belong to Vix.

```txt
.vix/generated/app/
```

They can be inspected when debugging, but they should not be edited as the source of truth. Change the root manifest, module files, or module metadata instead.

```txt
vix.app
modules/auth/
modules/auth/vix.module
```

This keeps the project reproducible. Another developer should be able to clone the project, run the normal commands, and get the same generated build and registration files.

## Keep module manifests small

The `vix.module` file should describe the module, not the whole application.

```ini
name = "auth"
kind = "backend"

[routes]
prefix = "/api/auth"

[tests]
enabled = true
```

Application-level activation belongs in `vix.app`.

```ini
[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = []
```

Keeping these responsibilities separate makes the project easier to understand. The root manifest describes the application graph. The module manifest describes the module itself.

## Use CMake integration carefully

In CMake-first projects, use `vix modules` to create the module layout and targets, but let the existing project keep control of its build design.

```bash
vix modules init
vix modules add auth
```

For simple projects, automatic patching and linking may be enough. For custom CMake projects, prefer manual integration.

```bash
vix modules init --no-patch
vix modules add auth --no-link
```

Then connect the loader and targets where they belong.

```cmake
include(${CMAKE_CURRENT_LIST_DIR}/cmake/vix_modules.cmake)

target_link_libraries(my_server PRIVATE api::auth)
```

This avoids fighting the project’s existing build system while still giving the codebase a consistent module structure.

## Check modules before building

Run the module check whenever the module graph changes.

```bash
vix modules check
```

This should become a normal part of the workflow before builds and before commits.

```bash
vix modules check
vix build
```

For stronger validation, run:

```bash
vix modules check
vix check --tests --run
```

The check command catches structural problems before they become confusing compile errors. It is especially useful after adding a module, moving a module, changing dependencies, editing `vix.app`, or changing route prefixes.

## Let tests follow the module

A module should keep tests close to the code it owns.

```txt
modules/auth/
  tests/
    test_auth.cpp
```

Use root-level tests for application-wide behavior, startup checks, or workflows that cross several modules.

```txt
tests/
  test_basic.cpp
```

This keeps responsibility clear. Authentication tests belong near authentication. Project tests belong near projects. Application integration tests belong at the application level.

## Do not over-module too early

A small project does not need a module for every route. Start with the application shell and add modules when features become large enough to benefit from a boundary.

A good moment to create a module is when a feature starts to have its own routes, services, tests, migrations, or dependencies. Before that, keeping the code in the main application tree may be simpler.

The module system should reduce confusion. If adding a module makes the project harder to read, wait until the feature shape is clearer.

## Recommended rule

Use modules for application features with real ownership. Keep their public headers clean, keep implementation private, declare dependencies explicitly, and run checks before builds. A good module should make the codebase easier to explain to another developer.

## Next step

Continue with troubleshooting to diagnose common module problems such as missing declarations, inactive modules, duplicate route prefixes, and unsafe includes.

[Troubleshooting](/app-modules/troubleshooting)
