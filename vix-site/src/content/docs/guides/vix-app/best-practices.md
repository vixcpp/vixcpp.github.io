# Best Practices

A good `vix.app` file should be easy to read from the project root. It should tell another developer what the application builds, which files are part of the target, which include roots are used, which Vix modules or packages are linked, which runtime files are copied, and which internal app modules belong to the application.

The manifest should not feel like a second programming language. It is a project description. Keep it explicit, stable, and close to the real shape of the application.

```bash id="vix-app-best-practices-workflow"
vix build
vix run
```

## Keep the manifest readable

The best `vix.app` files are not the shortest ones. They are the ones where every field has a reason to exist.

```ini id="vix-app-best-practices-readable"
name = "api"
type = "executable"
standard = "c++20"
output_dir = "bin"

sources = [
  "src/main.cpp",
  "src/api/app/AppBootstrap.cpp",
  "src/api/support/HttpResponses.cpp",
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

A developer should be able to open this file and understand the application target without opening generated files or guessing how the project is wired.

## Use a consistent field order

A consistent order makes manifests easier to review. Put the identity first, then the source layout, compile behavior, packages, dependencies, links, runtime resources, and finally internal modules.

```ini id="vix-app-best-practices-order"
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

This order is not only cosmetic. It helps the reader move from the target identity to the files, then from the files to the things the target needs to build and run.

## Prefer explicit source files

List source files explicitly.

```ini id="vix-app-best-practices-explicit-sources"
sources = [
  "src/main.cpp",
  "src/api/app/AppBootstrap.cpp",
  "src/api/presentation/routes/RouteRegistry.cpp",
]
```

Explicit source lists make changes visible in code review. When a new `.cpp` file becomes part of the application, the manifest records that decision.

Headers usually do not belong in `sources`. They should be reached through `include_dirs`.

```ini id="vix-app-best-practices-headers"
include_dirs = [
  "include",
  "src",
]
```

This keeps the manifest focused on compilation units instead of turning it into a list of every file in the project.

## Keep include roots clean

An include directory should be a stable root, not a path that points too deep into the project.

```ini id="vix-app-best-practices-good-include"
include_dirs = [
  "include",
]
```

With this layout:

```txt id="vix-app-best-practices-include-layout"
include/
  api/
    app/
      AppBootstrap.hpp
```

the code should include the header like this:

```cpp id="vix-app-best-practices-include-code"
#include <api/app/AppBootstrap.hpp>
```

Avoid include roots that depend on one specific folder.

```ini id="vix-app-best-practices-bad-include"
# Avoid this.
include_dirs = [
  "include/api/app",
]
```

A clean include root gives the project a stable public shape and makes it easier to split code into app modules later.

## Keep `resources` for runtime files

Use `resources` for files the program needs when it runs.

```ini id="vix-app-best-practices-resources"
resources = [
  ".env=.env",
  "public=public",
  "views=views",
  "storage=storage",
]
```

Do not use `resources` to fix source or header problems. Source files belong in `sources`, headers are found through `include_dirs`, and runtime files belong in `resources`.

A game project shows this separation clearly.

```ini id="vix-app-best-practices-game-resources"
sources = [
  "src/main.cpp",
]

resources = [
  "assets=assets",
  "game.package.json=game.package.json",
]
```

The C++ program is compiled. The assets and metadata are copied beside the executable.

## Use `output_dir = "bin"` for applications

For executable applications, use a simple output directory.

```ini id="vix-app-best-practices-output"
output_dir = "bin"
```

This keeps the runtime layout predictable.

```txt id="vix-app-best-practices-output-layout"
bin/
  api
  .env
  public/
  views/
  storage/
```

A backend should not require the developer to guess where the executable and runtime files are placed. A simple `bin` layout is enough for most applications.

Library targets can use a different output directory when it makes the target clearer.

```ini id="vix-app-best-practices-library-output"
name = "mathkit"
type = "static-library"
output_dir = "lib"
```

## Link only what the code uses

A manifest should not link every Vix module only because the SDK provides them. Link the targets the application actually uses.

```ini id="vix-app-best-practices-links-basic"
packages = [
  "vix",
]

links = [
  "vix::vix",
]
```

A backend using ORM can add ORM.

```ini id="vix-app-best-practices-links-orm"
links = [
  "vix::vix",
  "vix::orm",
]
```

A game should link the game-related targets it uses.

```ini id="vix-app-best-practices-links-game"
links = [
  "vix::game",
  "vix::io",
]
```

A short, honest link list is better than a large list that hides the real dependency shape of the application.

## Keep `packages`, `deps`, and `links` separate

These fields have different jobs.

```ini id="vix-app-best-practices-packages-deps-links"
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

`packages` makes a package available. `deps` declares Vix Registry dependencies. `links` tells the target what it actually links against.

Keeping those roles separate makes the manifest easier to debug when a dependency resolves correctly but the target is not linked, or when the link target exists but the package was never made available.

## Use compile options carefully

Most projects should not start with a large set of raw compiler and linker options. Add them when the project needs them, and keep platform-specific options guarded.

```ini id="vix-app-best-practices-compile-options"
compile_options = [
  "$<$<CXX_COMPILER_ID:MSVC>:/W4>",
  "$<$<CXX_COMPILER_ID:MSVC>:/permissive->",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-Wall>",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-Wextra>",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-Wpedantic>",
]
```

Sanitizer options should be kept together across compile and link options.

```ini id="vix-app-best-practices-sanitizers"
compile_options = [
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-fsanitize=address,undefined>",
]

link_options = [
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-fsanitize=address,undefined>",
]
```

Do not use raw options where a clearer manifest field exists. Include paths belong in `include_dirs`, libraries belong in `links`, and runtime files belong in `resources`.

## Keep application modules at the bottom

When a backend uses app modules, keep the main application target first and module declarations after it.

```ini id="vix-app-best-practices-modules-order"
name = "cloud"
type = "executable"
standard = "c++20"
output_dir = "bin"

sources = [
  "src/main.cpp",
  "src/cloud/app/AppBootstrap.cpp",
  "src/cloud/presentation/routes/RouteRegistry.cpp",
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

This keeps the file readable. The top describes the application shell. The bottom describes internal feature areas.

## Create modules for real feature areas

Use app modules when a feature has its own responsibility and will grow with its own routes, services, models, storage logic, or public API.

```txt id="vix-app-best-practices-module-candidates"
auth
projects
builds
packages
logs
registry
deployments
billing
```

Do not create a module for every small helper. A helper can stay in the main application or in a shared internal library. Modules are strongest when they represent real parts of the application.

## Make module dependencies explicit

When one module uses another module, declare the dependency.

```ini id="vix-app-best-practices-module-dep"
[module.projects]
enabled = true
path = "modules/projects"
kind = "backend"
depends = [
  "auth",
]
```

The source code should use the public module API.

```cpp id="vix-app-best-practices-module-include"
#include <auth/api.hpp>
```

Avoid private cross-module includes.

```cpp id="vix-app-best-practices-module-private"
#include "../auth/src/AuthService.hpp"
```

A module’s `src/` directory is an implementation detail. Other modules should use public headers and explicit dependencies.

## Keep disabled modules honest

A disabled module can remain declared while a feature is being prepared.

```ini id="vix-app-best-practices-disabled-module"
[module.billing]
enabled = false
path = "modules/billing"
kind = "backend"
depends = [
  "auth",
]
```

Do not leave an enabled module depending on a disabled module. If `projects` depends on `auth`, then `auth` should be enabled for that active application configuration.

```bash id="vix-app-best-practices-enable-module"
vix modules enable auth
vix modules check
```

The manifest should always describe a buildable application state.

## Do not edit generated files

When Vix uses `vix.app`, it generates internal build files under:

```txt id="vix-app-best-practices-generated"
.vix/generated/app/
```

Those files are not the project source of truth. Edit `vix.app`, then build again.

```bash id="vix-app-best-practices-regenerate"
vix build
```

Generated files are allowed to change as Vix evolves. The manifest is the stable file that belongs in the project.

## Keep `vix.app` focused

`vix.app` should describe the application target. Project tasks, scripts, frontend commands, production metadata, and reusable shortcuts belong in `vix.json`.

```json id="vix-app-best-practices-vix-json"
{
  "tasks": {
    "build": "vix build",
    "run": "vix run",
    "test": "vix tests",
    "check": "vix check --tests --run"
  }
}
```

This separation keeps both files useful. `vix.app` explains what is being built. `vix.json` explains how the project is operated.

## Use `vix::print` in Vix examples

In normal Vix application documentation, prefer `vix::print` over `std::cout`.

```cpp id="vix-app-best-practices-vix-print"
#include <vix/print.hpp>

int main()
{
  vix::print("Hello from Vix");
  return 0;
}
```

This keeps examples aligned with the Vix API and avoids teaching the project through unrelated standard output boilerplate. Notebook-style learning pages can still use `std::cout` when the goal is to teach familiar C++ basics.

## Keep examples minimal

Documentation and project templates should show the smallest complete example that explains the idea.

A minimal app does not need a large backend layout.

```ini id="vix-app-best-practices-minimal-example"
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

A backend example can be longer because the source layout matters.

```ini id="vix-app-best-practices-backend-example"
sources = [
  "src/main.cpp",
  "src/api/app/AppBootstrap.cpp",
  "src/api/support/HttpResponses.cpp",
  "src/api/presentation/routes/RouteRegistry.cpp",
  "src/api/presentation/middleware/MiddlewareRegistry.cpp",
  "src/api/presentation/controllers/HomeController.cpp",
  "src/api/presentation/controllers/HealthController.cpp",
]
```

The example should match the page. Do not add fields only to make the manifest look more advanced.

## Build after manifest changes

A change to `vix.app` is a project configuration change. Build after editing it.

```bash id="vix-app-best-practices-build-after-change"
vix build
```

For module-based backends, check modules first.

```bash id="vix-app-best-practices-module-build"
vix modules check
vix build
```

This catches missing files, wrong include roots, invalid links, resource mistakes, and module dependency issues early.

## Use checks before commits

For a small application:

```bash id="vix-app-best-practices-check-app"
vix build
vix tests
```

For a backend with app modules:

```bash id="vix-app-best-practices-check-backend"
vix modules check
vix check --tests --run
```

For a library:

```bash id="vix-app-best-practices-check-library"
vix build
```

A manifest change can affect more than compilation. It can change module wiring, resources, dependency resolution, and runtime layout. Run the workflow that matches the project type.

## Keep migration explicit

When moving an existing project to `vix.app`, make the switch clearly. If a root `CMakeLists.txt` still exists, Vix will use it first.

```txt id="vix-app-best-practices-resolution"
1. CMakeLists.txt
2. vix.app
```

During migration, it is fine to prepare the manifest while the old build file still exists. When the manifest becomes the intended source of truth, remove or rename the old root build file and validate the project with Vix.

```bash id="vix-app-best-practices-migration-check"
vix build
```

For module-based backends:

```bash id="vix-app-best-practices-migration-module-check"
vix modules check
vix build
```

The project should not stay forever with two competing build descriptions in the root.

## Avoid machine-specific paths

Keep paths relative to the project root.

```ini id="vix-app-best-practices-relative-paths"
sources = [
  "src/main.cpp",
]

include_dirs = [
  "include",
]

resources = [
  ".env=.env",
]
```

Avoid absolute paths.

```ini id="vix-app-best-practices-absolute-paths"
# Avoid this.
include_dirs = [
  "/home/user/project/include",
]
```

A manifest should work on another developer’s machine, in CI, and after the project is moved to another directory.

## Review the manifest like code

A `vix.app` change should be reviewed with the same care as source code. Ask what changed in the application shape.

```txt id="vix-app-best-practices-review"
Was a source file added?
Was an include root changed?
Was a new target linked?
Was a registry dependency added?
Was a runtime resource copied?
Was a module enabled, disabled, or given a new dependency?
```

This makes manifest changes easier to understand and reduces hidden build problems.

## A clean backend manifest

A clean backend manifest is explicit without becoming noisy.

```ini id="vix-app-best-practices-clean-backend"
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

This file gives the reader a complete picture: one backend executable, clear source layout, stable include roots, Vix link target, runtime resources, and internal modules.

## Final rule

A `vix.app` file should make the project easier to understand. When a field makes the manifest clearer, keep it. When a field only copies complexity from another place, question it.

The best manifest is not the one with the most options. It is the one that describes the application honestly and stays readable as the project grows.

## Next step

Return to the overview when you need the complete mental model of how `vix.app` fits into the Vix application workflow.

[Overview](/guides/vix-app/)
