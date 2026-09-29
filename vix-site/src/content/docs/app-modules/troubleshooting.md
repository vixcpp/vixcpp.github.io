# Troubleshooting

This page helps diagnose common problems when working with application modules. Most issues come from one of a few places: the project was not initialized for modules, the module exists on disk but is not declared in `vix.app`, a module is disabled, a dependency is missing, a route prefix is duplicated, or a public header is reaching into private implementation files.

Start with the module check command. It gives a clearer signal than waiting for a compiler error from generated files or indirect includes.

```bash
vix modules check
```

For module-based backends, the normal local workflow is:

```bash
vix modules check
vix build
```

When tests are part of the validation, run:

```bash
vix modules check
vix check --tests --run
```

## `modules/` folder not found

If the module command reports that the `modules/` folder is missing, the project has not been initialized for application modules yet.

Run the initialization command from the project root.

```bash
vix modules init
```

This creates:

```txt
modules/
cmake/vix_modules.cmake
```

In a `vix.app` project, Vix uses this module loader from the generated application build. In a CMake-first project, the loader can be included from the root `CMakeLists.txt`.

## Module already exists

If `vix modules add auth` reports that the module already exists, Vix found a folder at:

```txt
modules/auth/
```

This usually means the module was already created, copied from another branch, or partially generated during an earlier attempt.

Check the folder first.

```bash
ls modules/auth
```

A simple module should contain files such as:

```txt
include/auth/api.hpp
src/auth.cpp
tests/test_auth.cpp
CMakeLists.txt
vix.module
```

A backend module should contain files such as:

```txt
include/auth/AuthModule.hpp
include/auth/controllers/AuthController.hpp
src/AuthModule.cpp
src/controllers/AuthController.cpp
tests/test_auth.cpp
CMakeLists.txt
vix.module
```

If the folder is valid, do not recreate it. Register it in `vix.app` when the project uses the manifest workflow.

```ini
[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = []
```

Then run:

```bash
vix modules check
```

## Module folder exists but is not declared

In a `vix.app` project, a module folder can exist without being part of the application manifest.

```txt
modules/billing/
```

If `billing` is not declared in `vix.app`, it is not part of the active module graph. The check command may warn about this because the state can be intentional during migration, but it can also mean a module was copied or created without being registered.

Declare the module when it should belong to the application.

```ini
[module.billing]
enabled = true
path = "modules/billing"
kind = "backend"
depends = [
  "auth",
]
```

If the module should stay in the repository but not be active yet, declare it as disabled.

```ini
[module.billing]
enabled = false
path = "modules/billing"
kind = "backend"
depends = [
  "auth",
]
```

This keeps the project state explicit.

## Module declared but folder is missing

If `vix.app` declares a module but the folder does not exist, the manifest and filesystem are out of sync.

```ini
[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = []
```

The path must exist relative to the project root.

```txt
modules/auth/
```

Fix the issue by restoring the missing folder, correcting the `path`, or creating the module skeleton.

```bash
vix modules add auth
```

If the module was moved to another directory, update the path instead.

```ini
[module.auth]
enabled = true
path = "features/auth"
kind = "backend"
depends = []
```

Then run the check again.

```bash
vix modules check
```

## Enabled module is missing CMakeLists.txt

An enabled module must have a module build file.

```txt
modules/auth/CMakeLists.txt
```

This file creates the module target and alias target. Without it, the generated build cannot load the module correctly.

Restore the missing file from the module skeleton or recreate the module structure. For a backend module, the target should compile the module sources, expose the public include directory, keep the private source directory private, and link the Vix runtime target when needed.

After restoring the file, run:

```bash
vix modules check
vix build
```

## Enabled module is missing vix.module

An enabled module should also have a `vix.module` file.

```txt
modules/auth/vix.module
```

For a backend module, the file usually looks like this:

```ini
name = "auth"
kind = "backend"

[routes]
prefix = "/api/auth"

[tests]
enabled = true
```

For a simple module, it usually looks like this:

```ini
name = "auth"
kind = "module"

[exports]
include = "include"

[tests]
enabled = true
```

The module manifest describes the module itself. It is not the same as the root `vix.app` declaration.

## `vix modules list` says `vix.app` not found

`vix modules list`, `enable`, and `disable` operate on module declarations in `vix.app`. If the project does not have a root `vix.app`, those commands cannot list or change manifest-based module state.

For a CMake-first project, active module usage is usually controlled by CMake. The important workflow is:

```bash
vix modules init
vix modules add auth
vix modules check
```

Then link the module from CMake.

```cmake
target_link_libraries(my_server PRIVATE api::auth)
```

Use `vix modules list`, `enable`, and `disable` mainly in projects where `vix.app` is the source of truth for the active module graph.

## Module is not being registered

If a backend module exists but its routes are not available at runtime, check whether the module is enabled in `vix.app`.

```ini
[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = []
```

A disabled module remains on disk, but it is not wired into the generated application registration bridge.

```ini
[module.auth]
enabled = false
path = "modules/auth"
kind = "backend"
depends = []
```

Enable the module.

```bash
vix modules enable auth
```

Then run:

```bash
vix modules check
vix build
```

Also confirm that the application template calls the generated registration entry point.

```cpp
vix::app_generated::register_app_modules(app);
```

In generated backend projects, this call belongs in `AppBootstrap`. In generated application projects, it is usually called through `app::ModuleRegistry`.

## Routes compile but do not appear

If the project builds but the module route does not respond, confirm that the module entry point registers the controller.

```cpp
void AuthModule::register_routes(vix::App &app)
{
  controllers::AuthController::register_routes(app);
}
```

Then confirm that the controller registers the expected route.

```cpp
void AuthController::register_routes(vix::App &app)
{
  app.get("/api/auth", [](vix::Request &req, vix::Response &res)
  {
    (void)req;

    res.json({
      "ok", true,
      "module", "auth"
    });
  });
}
```

The route prefix in `vix.module` is useful for checks and ownership, but the actual route still has to be registered by the module code.

```ini
[routes]
prefix = "/api/auth"
```

## Duplicate route prefix

Backend modules should not claim the same route prefix.

```ini
[routes]
prefix = "/api/auth"
```

If two modules use the same prefix, the module check command reports a conflict. This often happens after copying a module folder and changing the module name without updating `vix.module`.

Give each routed module its own prefix.

```txt
auth      -> /api/auth
projects  -> /api/projects
builds    -> /api/builds
packages  -> /api/packages
```

Then run:

```bash
vix modules check
```

## Enabled module depends on a disabled module

An enabled module cannot depend on a module that is disabled.

```ini
[module.auth]
enabled = false
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

This state is invalid because `projects` is active but the dependency it needs is inactive.

Fix it by enabling the dependency:

```bash
vix modules enable auth
```

or by disabling the dependent module:

```bash
vix modules disable projects
```

Then check the graph again.

```bash
vix modules check
```

## Module depends on an undeclared module

A module dependency should point to another module declared in `vix.app`.

```ini
[module.projects]
enabled = true
path = "modules/projects"
kind = "backend"
depends = [
  "auth",
]
```

If `auth` is not declared, the module graph is incomplete.

Declare the missing module.

```ini
[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = []
```

Then run:

```bash
vix modules check
```

## Circular module dependency detected

A cycle means modules depend on each other in a loop.

```txt
auth -> projects -> auth
```

This usually means the boundary between the modules is not clear enough. One module may be reaching into another module because a shared concept has no proper home.

Break the cycle by making one direction clear.

```txt
projects -> auth
```

or by moving shared behavior into a lower-level module.

```txt
identity
auth -> identity
projects -> identity
```

After changing the graph, update `vix.app` and the module CMake target links, then run:

```bash
vix modules check
vix build
```

## Public header includes a private file

Public headers should not include files from another module’s `src/` directory.

```cpp
#include "../../auth/src/AuthStore.hpp"
```

That include makes private implementation part of another module’s public surface. It may compile, but it weakens the boundary between modules.

Move the needed type or function into a public header.

```txt
modules/auth/include/auth/AuthStore.hpp
```

Then include it through the module public path.

```cpp
#include <auth/AuthStore.hpp>
```

If another module uses that header, declare the dependency.

```cmake
target_link_libraries(api_projects
  PUBLIC
    api::auth
)
```

Then run:

```bash
vix modules check
```

## Cross-module include without explicit dependency

If a public header from `projects` includes a public header from `auth`, the dependency should also be visible in the module build file.

```cpp
#include <auth/api.hpp>
```

The `projects` module should link to `auth`.

```cmake
target_link_libraries(api_projects
  PUBLIC
    api::auth
)
```

Without the target dependency, the include may work only because include paths leaked from somewhere else. That makes the build fragile.

Declare the dependency, then run:

```bash
vix modules check
vix build
```

## Generated files were edited manually

Files under `.vix/generated/app/` are generated by Vix.

```txt
.vix/generated/app/
```

Do not edit generated registration or generated CMake files to add modules. Those changes can disappear on the next build.

Change the source files instead:

```txt
vix.app
modules/auth/
modules/auth/vix.module
modules/auth/CMakeLists.txt
```

Then rebuild.

```bash
vix modules check
vix build
```

The generated files should be treated as output, not as the project source of truth.

## vix.app is ignored because CMakeLists.txt exists

Vix resolves existing CMake projects first. If the project root contains both files, the root `CMakeLists.txt` wins.

```txt
api/
  CMakeLists.txt
  vix.app
```

Resolution order:

```txt
1. CMakeLists.txt
2. vix.app
```

This protects existing CMake projects from changing behavior just because a manifest was added during migration.

If the project is meant to use `vix.app` as the active application manifest, remove or move the root `CMakeLists.txt` when the migration is ready.

```txt
api/
  vix.app
  src/
  include/
  modules/
```

Then build again.

```bash
vix modules check
vix build
```

## Wrong project name in CMake targets

Vix uses the project name to generate module targets.

```txt
api_auth
api::auth
```

In CMake projects, the name is detected from the root `project(...)` call. If that name is not the prefix you want, pass the project name explicitly.

```bash
vix modules add auth --project api
```

For checks, use:

```bash
vix modules check --project api
```

This is useful when the directory name, CMake project name, and main target name do not match.

## Module name was normalized

Module names may contain hyphens, but Vix normalizes hyphens to underscores for generated identifiers.

```txt
user-profile -> user_profile
```

That affects generated folders, targets, namespaces, and class names.

```txt
modules/user_profile/
api_user_profile
api::user_profile
UserProfileModule
```

Use the normalized name when checking generated files or linking module targets.

## CMake project was not patched

If a CMake-first project does not load modules, check whether `cmake/vix_modules.cmake` is included from the root build.

```cmake
include(${CMAKE_CURRENT_LIST_DIR}/cmake/vix_modules.cmake)
```

If you used `--no-patch`, Vix created the loader but did not edit the root `CMakeLists.txt`.

```bash
vix modules init --no-patch
```

Add the include manually where it fits your project.

For custom CMake projects, this is often the better approach because the project keeps control of its build order.

## Auto-link used the wrong target

In a simple CMake project, `vix modules add <name>` can insert an auto-link block for the detected project target. This works best when the root CMake project name and the main target name are the same.

If the actual main target has another name, use manual linking.

```bash
vix modules add auth --no-link
```

Then link the module to the correct target.

```cmake
target_link_libraries(my_server PRIVATE api::auth)
```

This keeps module generation useful without forcing the project to follow a specific root target name.

## Recommended diagnosis order

When a module problem is unclear, use this order.

```txt
1. Run vix modules check.
2. Confirm the module folder exists.
3. Confirm the module is declared in vix.app when using vix.app mode.
4. Confirm enabled = true when the module should be active.
5. Confirm CMakeLists.txt and vix.module exist inside the module.
6. Confirm route prefixes are unique for routed modules.
7. Confirm public headers do not include private src/ paths.
8. Confirm cross-module includes have explicit dependencies.
9. Build again.
```

The commands are usually:

```bash
vix modules list
vix modules check
vix build
```

For a full local validation:

```bash
vix modules check
vix check --tests --run
```

## Next step

Return to best practices when the module structure works but the module graph is becoming hard to read.

[Best Practices](/app-modules/best-practices)
