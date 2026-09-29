# Migrating from CMake

`vix.app` gives a Vix project a smaller application manifest. It is meant for projects where the build description should stay close to the application itself: target name, source files, include directories, linked Vix modules, resources, output directory, and optional app modules.

Existing CMake projects can still be built by Vix. Migration is not required for every project. Move to `vix.app` when the project is better served by an app-first manifest and the build shape is simple enough to describe clearly from the project root.

```bash id="vix-app-migration-build"
vix build
vix run
```

The daily workflow stays the same. The difference is that the project source of truth becomes `vix.app`.

## How Vix chooses the project

When Vix resolves a project, it looks for the existing project build file first. If `CMakeLists.txt` exists, Vix keeps the current behavior and uses it.

If no `CMakeLists.txt` is present and `vix.app` exists, Vix reads `vix.app`, generates the internal build input under `.vix/generated/app/`, and continues through the normal Vix build workflow.

```txt id="vix-app-migration-resolution"
1. CMakeLists.txt
2. vix.app
```

This is important during migration. If both files exist in the same project root, the existing CMake project wins. To make `vix.app` the active project manifest, the old root build file must be removed, renamed, or kept on another branch once the migration is ready.

## Start with the project shape

Before writing the new manifest, identify the shape of the project:

```txt id="vix-app-migration-checklist"
target name
target type
C++ standard
source files
include directories
preprocessor definitions
linked targets
runtime resources
output directory
```

A good migration does not start by copying every build detail. It starts by describing what the application really is. Most Vix applications need fewer fields than a traditional build script because Vix already owns the command workflow around the project.

## Minimal migrated app

A small executable can usually become a short `vix.app`.

```ini id="vix-app-migration-minimal"
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

A matching source file can use the normal Vix output helper.

```cpp id="vix-app-migration-minimal-main"
#include <vix/print.hpp>

int main()
{
  vix::print("Hello from Vix");
  return 0;
}
```

After the old root build file is no longer active, the application can be built and run through Vix.

```bash id="vix-app-migration-minimal-run"
vix build
vix run
```

## Map the target name and type

The first fields describe the target identity.

```ini id="vix-app-migration-identity"
name = "api"
type = "executable"
standard = "c++20"
output_dir = "bin"
```

Use `executable` for applications, backends, games, command-line tools, and servers.

```ini id="vix-app-migration-executable"
type = "executable"
```

Use `static-library` or `shared-library` only when the project output is reusable code rather than a runnable program.

```ini id="vix-app-migration-library-types"
type = "static-library"
```

```ini id="vix-app-migration-shared-library"
type = "shared-library"
```

For most application migrations, the target type should be `executable`.

## Map source files

Move implementation files into `sources`.

```ini id="vix-app-migration-sources"
sources = [
  "src/main.cpp",
  "src/api/app/AppBootstrap.cpp",
  "src/api/support/HttpResponses.cpp",
  "src/api/presentation/routes/RouteRegistry.cpp",
]
```

List the `.cpp` files that are compiled into the application. Headers usually do not belong in this list. They should be found through `include_dirs`.

Keep the list explicit. It makes the migration easier to review because every compiled file is visible from the manifest.

## Map include directories

Move include roots into `include_dirs`.

```ini id="vix-app-migration-includes"
include_dirs = [
  "include",
  "src",
]
```

If the project has this header:

```txt id="vix-app-migration-header-path"
include/api/app/AppBootstrap.hpp
```

then source code should include it from the include root.

```cpp id="vix-app-migration-header-include"
#include <api/app/AppBootstrap.hpp>
```

Avoid adding include directories that point too deep into the tree. The include root should describe the project structure, not one specific file.

## Map definitions

Move preprocessor definitions into `defines`.

```ini id="vix-app-migration-defines"
defines = [
  "VIX_BACKEND_APP=1",
  "VIX_APP_NAME=api",
]
```

Feature flags can also live here when they are part of the application build.

```ini id="vix-app-migration-feature-defines"
defines = [
  "VIX_BACKEND_APP=1",
  "VIX_APP_NAME=api",
  "VIX_USE_ORM=1",
]
```

Keep this list small. Runtime configuration should normally stay in `.env` or another runtime configuration file, while `defines` should be used for compile-time decisions.

## Map packages and links

A normal Vix application starts with the `vix` package and links the Vix targets it uses.

```ini id="vix-app-migration-packages-links"
packages = [
  "vix",
]

links = [
  "vix::vix",
]
```

A backend using ORM can add the ORM target.

```ini id="vix-app-migration-orm-links"
packages = [
  "vix",
]

links = [
  "vix::vix",
  "vix::orm",
]
```

A game project links the game and I/O modules.

```ini id="vix-app-migration-game-links"
packages = [
  "vix",
]

links = [
  "vix::game",
  "vix::io",
]
```

The package makes the SDK available. The link list says what the target actually uses.

## Map registry dependencies

If the project uses Vix Registry dependencies, declare them in `deps`.

```ini id="vix-app-migration-deps"
deps = [
  "adastra/logger@1.0.0",
]
```

Then link the target exported by that dependency.

```ini id="vix-app-migration-deps-links"
links = [
  "vix::vix",
  "adastra::logger",
]
```

After changing registry dependencies, resolve them and build.

```bash id="vix-app-migration-install-build"
vix install
vix build
```

The dependency entry describes what Vix should resolve. The link entry describes what the application target uses.

## Map resources

Files needed at runtime belong in `resources`.

```ini id="vix-app-migration-resources"
resources = [
  ".env=.env",
  "public=public",
  "views=views",
  "storage=storage",
]
```

For a game project:

```ini id="vix-app-migration-game-resources"
resources = [
  "assets=assets",
  "game.package.json=game.package.json",
]
```

Do not put source files or headers in `resources`. Source files belong in `sources`, and headers are found through `include_dirs`. Resources are copied beside the built target so the program can read them when it runs.

## Move large backend features into app modules

Migration is a good moment to separate large backend features into app modules. The main application target should keep the entry point, bootstrap, route registry, middleware registry, and shared support files. Feature areas can move under `modules/`.

```ini id="vix-app-migration-modules"
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
```

Initialize the module workflow from the project root.

```bash id="vix-app-migration-modules-commands"
vix modules init
vix modules add auth
vix modules add projects
vix modules add builds
vix modules check
```

Do this when the feature boundaries are real. Do not create a module for every small helper file.

## Backend migration example

This is a complete migrated backend manifest.

```ini id="vix-app-migration-backend-complete"
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

The manifest now describes the backend target and its internal modules in one place. Vix owns the generated build files, and the developer continues to use the CLI.

## Game migration example

A game migration is usually smaller because the target shape is direct.

```ini id="vix-app-migration-game-complete"
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

Build and run it with the same workflow.

```bash id="vix-app-migration-game-run"
vix build
vix run
```

## Switching the project to `vix.app`

Because Vix preserves existing CMake projects first, the switch should be explicit.

A safe migration flow is:

```txt id="vix-app-migration-switch-flow"
1. Create vix.app.
2. Map sources, include directories, definitions, links, resources, and modules.
3. Review the manifest.
4. Move the old root build file out of the way when ready.
5. Run vix build.
6. Run vix run or the project test workflow.
```

The command workflow after the switch remains simple.

```bash id="vix-app-migration-final-check"
vix build
vix run
```

For module-based backends:

```bash id="vix-app-migration-final-module-check"
vix modules check
vix build
```

## Keep the old file during review

During review, it is reasonable to keep the old build file on the branch while the new manifest is being written. Just remember that Vix will not use `vix.app` as long as the old root build file is still active.

When the manifest is ready, make the switch in one clear commit. This makes the migration easier to understand in project history.

## What to migrate later

Do not migrate everything at once when the project is large. Start with the main target and the files needed to build it. Then move runtime files into `resources`. After that, introduce app modules for real backend features.

A calm migration is better than a large rewrite. The goal is to make the project easier to understand, not to change its architecture for no reason.

## When to keep the existing project

Keep the existing project build file when the project depends on heavy custom build behavior that is not naturally expressed in `vix.app`, or when the project is a low-level library with very specific platform logic.

Vix can still build existing projects. `vix.app` is best when the application can be described as a clear target with explicit sources, include roots, links, resources, and modules.

## Common mistakes

The first mistake is creating `vix.app` and expecting Vix to use it while `CMakeLists.txt` still exists in the root. Vix preserves the existing project first. Remove or rename the old root build file when the migration is ready.

The second mistake is copying too much build logic into `compile_options` and `link_options`. Start with the target shape, sources, includes, packages, links, and resources. Add raw options only when they are truly needed.

The third mistake is putting test files, headers, assets, and runtime files all into `sources`. The manifest has separate fields for separate jobs. Use them that way.

## Recommended final check

For a small application:

```bash id="vix-app-migration-recommended-app"
vix build
vix run
```

For a backend with modules:

```bash id="vix-app-migration-recommended-backend"
vix modules check
vix check --tests --run
```

For a library:

```bash id="vix-app-migration-recommended-library"
vix build
```

Once the project builds cleanly and the manifest is readable, the migration is complete.

## Next step

Continue with CMake fallback to understand how Vix behaves when a project keeps an existing root build file instead of switching to `vix.app`.

[CMake Fallback](/guides/vix-app/cmake-fallback)
