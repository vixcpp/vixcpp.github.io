# Troubleshooting

This page helps diagnose common `vix.app` issues. Most problems come from one of a few places: Vix is not using the manifest you think it is using, a source file is missing from `sources`, an include root is too deep or too shallow, a runtime file was not copied through `resources`, a linked target is missing, or an app module declaration does not match the module structure.

Start with the normal workflow.

```bash id="vix-app-troubleshooting-basic"
vix build
```

For module-based backends, run the module check before building.

```bash id="vix-app-troubleshooting-module-check"
vix modules check
vix build
```

The goal is to fix the manifest, not the generated files. When a project uses `vix.app`, the root manifest is the source of truth.

## Vix is not using `vix.app`

If the project root still contains `CMakeLists.txt`, Vix will use that file first. `vix.app` is used only when no root `CMakeLists.txt` is present.

```txt id="vix-app-troubleshooting-resolution"
1. CMakeLists.txt
2. vix.app
```

This is intentional. It protects existing projects from changing behavior just because a `vix.app` file was added during migration.

Check the project root.

```bash id="vix-app-troubleshooting-ls"
ls
```

If both files exist, the existing project input is active.

```txt id="vix-app-troubleshooting-both"
project/
  CMakeLists.txt
  vix.app
  src/
```

To make `vix.app` active, remove or rename the root `CMakeLists.txt` when the migration is ready.

```txt id="vix-app-troubleshooting-vix-app-only"
project/
  vix.app
  src/
```

Then build again.

```bash id="vix-app-troubleshooting-build-after-switch"
vix build
```

## Missing or invalid `name`

A `vix.app` file must define a target name.

```ini id="vix-app-troubleshooting-name"
name = "api"
```

If the name is empty or missing, Vix cannot generate a usable application target.

```ini id="vix-app-troubleshooting-missing-name"
# Wrong.
type = "executable"

sources = [
  "src/main.cpp",
]
```

Fix it by adding a stable name near the top of the manifest.

```ini id="vix-app-troubleshooting-name-fix"
name = "api"
type = "executable"

sources = [
  "src/main.cpp",
]
```

Keep this name stable. It may be used by generated wiring, tasks, service configuration, and module target names.

## Unsupported target type

The `type` field must describe a supported target shape.

```ini id="vix-app-troubleshooting-type"
type = "executable"
```

Supported values include:

```txt id="vix-app-troubleshooting-type-values"
executable
static-library
shared-library
```

Shorter aliases such as `static`, `shared`, and `library` are accepted, but the full names are clearer in documentation and project manifests.

If the project should run with `vix run`, use:

```ini id="vix-app-troubleshooting-executable"
type = "executable"
```

Use a library type only when the project produces reusable code instead of a runnable program.

## Source file not found

If the build fails because a source file cannot be found, check the `sources` list first.

```ini id="vix-app-troubleshooting-sources"
sources = [
  "src/main.cpp",
  "src/api/app/AppBootstrap.cpp",
]
```

Every path is relative to the project root, not the generated build directory.

```txt id="vix-app-troubleshooting-source-root"
api/
  vix.app
  src/
    main.cpp
    api/
      app/
        AppBootstrap.cpp
```

A common mistake is writing a path from the wrong directory.

```ini id="vix-app-troubleshooting-source-wrong"
# Wrong when vix.app is already at the project root.
sources = [
  "api/src/main.cpp",
]
```

The correct path should start from the directory that contains `vix.app`.

```ini id="vix-app-troubleshooting-source-correct"
sources = [
  "src/main.cpp",
]
```

After fixing the path, build again.

```bash id="vix-app-troubleshooting-source-build"
vix build
```

## New `.cpp` file is not compiled

If you added a new implementation file and the linker reports missing symbols, the file may not be listed in `sources`.

```txt id="vix-app-troubleshooting-missing-cpp-layout"
src/
  main.cpp
  api/
    support/
      HttpResponses.cpp
```

Add the new file explicitly.

```ini id="vix-app-troubleshooting-add-cpp"
sources = [
  "src/main.cpp",
  "src/api/support/HttpResponses.cpp",
]
```

Headers do not usually belong in `sources`, but `.cpp` files that contain implementation code must be listed.

## Header cannot be found

If the compiler cannot find a header, check `include_dirs`.

```ini id="vix-app-troubleshooting-include-dirs"
include_dirs = [
  "include",
  "src",
]
```

If the header is here:

```txt id="vix-app-troubleshooting-header-path"
include/api/app/AppBootstrap.hpp
```

the source should include it like this:

```cpp id="vix-app-troubleshooting-header-include"
#include <api/app/AppBootstrap.hpp>
```

and the include directory should be:

```ini id="vix-app-troubleshooting-header-include-dir"
include_dirs = [
  "include",
]
```

Do not point the include directory too deep into the tree.

```ini id="vix-app-troubleshooting-include-too-deep"
# Avoid this.
include_dirs = [
  "include/api/app",
]
```

A deep include root makes the include style unstable and harder to understand.

## Do not fix includes with resources

`resources` does not help the compiler find headers. Resources are copied beside the built target for runtime use.

```ini id="vix-app-troubleshooting-wrong-resource-header"
# Wrong.
resources = [
  "include=include",
]
```

Fix include problems with `include_dirs`.

```ini id="vix-app-troubleshooting-correct-header"
include_dirs = [
  "include",
]
```

Use `resources` only for files the program needs when it runs.

## Linked target is missing

If the build fails because a target or library is missing, check `packages` and `links`.

```ini id="vix-app-troubleshooting-packages-links"
packages = [
  "vix",
]

links = [
  "vix::vix",
]
```

The package makes something available. The link entry connects the application target to a specific target.

If the code uses ORM, the manifest should link ORM.

```ini id="vix-app-troubleshooting-orm-link"
packages = [
  "vix",
]

links = [
  "vix::vix",
  "vix::orm",
]
```

If the project uses the game runtime, link the game targets instead.

```ini id="vix-app-troubleshooting-game-links"
packages = [
  "vix",
]

links = [
  "vix::game",
  "vix::io",
]
```

Do not link every module by default. Link the targets the application actually uses.

## Registry dependency does not resolve

Registry dependencies belong in `deps`.

```ini id="vix-app-troubleshooting-deps"
deps = [
  "adastra/logger@1.0.0",
]
```

Accepted forms are:

```txt id="vix-app-troubleshooting-deps-forms"
namespace/name
namespace/name@version
@namespace/name
@namespace/name@version
```

After changing registry dependencies, resolve them and build.

```bash id="vix-app-troubleshooting-deps-install"
vix install
vix build
```

A dependency entry does not replace `links`. If the package exports a target that the application uses, the target should still be listed in `links`.

```ini id="vix-app-troubleshooting-deps-links"
deps = [
  "adastra/logger@1.0.0",
]

links = [
  "vix::vix",
  "adastra::logger",
]
```

The exact exported target name comes from the dependency itself.

## Runtime file is missing

If the application builds but cannot find `.env`, `public`, `views`, `storage`, assets, or package metadata at runtime, check `resources`.

```ini id="vix-app-troubleshooting-resources"
resources = [
  ".env=.env",
  "public=public",
  "views=views",
  "storage=storage",
]
```

Resources are copied beside the built target, usually under the configured `output_dir`.

```ini id="vix-app-troubleshooting-output-resources"
output_dir = "bin"

resources = [
  ".env=.env",
  "public=public",
]
```

A backend runtime layout should look like this:

```txt id="vix-app-troubleshooting-runtime-layout"
bin/
  api
  .env
  public/
```

If the source path is wrong, Vix cannot copy the file. Remember that resource source paths are relative to the project root.

## Resource copied to the wrong place

Use `source=destination` when the runtime path should differ from the source path.

```ini id="vix-app-troubleshooting-resource-destination"
resources = [
  "config/dev.env=.env",
  "frontend/dist=public",
]
```

The left side is the project file or directory. The right side is where it should appear beside the built target.

```txt id="vix-app-troubleshooting-resource-result"
bin/
  app
  .env
  public/
```

Keep destination paths simple. A runtime layout that is easy to inspect is easier to debug.

## `vix run` does not work for a library

`vix run` is for executable targets. If the manifest describes a library, build it instead.

```ini id="vix-app-troubleshooting-library"
name = "mathkit"
type = "static-library"
```

Use:

```bash id="vix-app-troubleshooting-library-build"
vix build
```

If the project should run as a program, change the target type.

```ini id="vix-app-troubleshooting-executable-fix"
type = "executable"
```

A project with `main()` normally should be an executable target.

## Module does not appear in the list

If `vix modules list` does not show a module, check that the module section is declared in `vix.app`.

```ini id="vix-app-troubleshooting-module-section"
[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = []
```

Then run:

```bash id="vix-app-troubleshooting-module-list"
vix modules list
```

If the module was created manually, make sure the section name is correct and the file is saved at the project root.

## Module path is wrong

The `path` field is relative to the project root.

```ini id="vix-app-troubleshooting-module-path"
[module.auth]
path = "modules/auth"
```

The matching folder should exist.

```txt id="vix-app-troubleshooting-module-layout"
modules/
  auth/
    include/
    src/
```

If the module folder is missing, create it through the CLI.

```bash id="vix-app-troubleshooting-module-add"
vix modules add auth
```

Then check the project.

```bash id="vix-app-troubleshooting-module-path-check"
vix modules check
```

## Module dependency is missing

If one module uses another module, declare the dependency.

```ini id="vix-app-troubleshooting-module-dep"
[module.projects]
enabled = true
path = "modules/projects"
kind = "backend"
depends = [
  "auth",
]
```

This tells Vix that `projects` is allowed to use the public API of `auth`.

The source should include the public header.

```cpp id="vix-app-troubleshooting-module-public-include"
#include <auth/api.hpp>
```

Avoid private cross-module includes.

```cpp id="vix-app-troubleshooting-module-private-include"
// Avoid this.
#include "../auth/src/AuthService.hpp"
```

Cross-module usage should go through public headers and explicit dependencies.

## Enabled module depends on disabled module

If an enabled module depends on another module, the dependency should also be enabled.

```ini id="vix-app-troubleshooting-disabled-dep"
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

This is not a healthy active configuration because `projects` depends on a module that is not active.

Fix it by enabling the dependency:

```bash id="vix-app-troubleshooting-enable-dep"
vix modules enable auth
vix modules check
```

or by removing the dependency from the module that no longer uses it.

## Generated files were edited manually

When Vix uses `vix.app`, generated build files are written under:

```txt id="vix-app-troubleshooting-generated"
.vix/generated/app/
```

Do not edit these files to change the application. They are generated output.

Edit `vix.app` instead, then run:

```bash id="vix-app-troubleshooting-regenerate"
vix build
```

If the generated files look stale after a manifest change, run a clean build workflow or remove the generated directory and build again.

```bash id="vix-app-troubleshooting-clean-generated"
rm -rf .vix/generated/app
vix build
```

## `vix.app` changed but dev output did not change

When `vix.app` changes, the project configuration has changed. Rebuild the project so Vix can refresh the generated app project and module wiring.

```bash id="vix-app-troubleshooting-config-change"
vix build
```

For module-based backends, check modules first.

```bash id="vix-app-troubleshooting-config-module"
vix modules check
vix build
```

Normal source changes can use the fast rebuild path, but manifest changes should be treated as configuration changes.

## Compile option breaks one compiler

Raw compiler options can be platform-specific. Use conditional entries when an option should only apply to a compiler family.

```ini id="vix-app-troubleshooting-compiler-options"
compile_options = [
  "$<$<CXX_COMPILER_ID:MSVC>:/W4>",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-Wall>",
]
```

Avoid unconditional flags that only work on one compiler.

```ini id="vix-app-troubleshooting-bad-compiler-option"
# Avoid this in portable manifests.
compile_options = [
  "-Wall",
]
```

For sanitizer builds, keep compile and link flags together.

```ini id="vix-app-troubleshooting-sanitizers"
compile_options = [
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-fsanitize=address,undefined>",
]

link_options = [
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-fsanitize=address,undefined>",
]
```

## Output directory is confusing

For applications, use a simple output directory.

```ini id="vix-app-troubleshooting-output-dir"
output_dir = "bin"
```

This keeps the executable and runtime resources close together.

```txt id="vix-app-troubleshooting-output-dir-layout"
bin/
  api
  .env
  public/
```

Avoid deeply nested output paths unless the project has a clear reason.

```ini id="vix-app-troubleshooting-output-dir-bad"
# Avoid unless necessary.
output_dir = "runtime/linux/debug/bin"
```

The output directory should make the runtime easier to find, not harder.

## Full backend check

For a backend with modules, use this sequence when the error is unclear.

```bash id="vix-app-troubleshooting-backend-full-check"
vix modules list
vix modules check
vix build
vix tests
```

This checks the module declarations, module structure, build manifest, and test suite in a predictable order.

For a stronger single workflow:

```bash id="vix-app-troubleshooting-backend-check"
vix check --tests --run
```

Use the longer sequence when you need to see where the failure starts.

## Quick diagnosis table

| Symptom                          | Check first                               |
| -------------------------------- | ----------------------------------------- |
| `vix.app` seems ignored          | Root `CMakeLists.txt` still exists        |
| Source file missing              | `sources` path relative to project root   |
| Header not found                 | `include_dirs` root and include style     |
| Link target missing              | `packages`, `deps`, and `links`           |
| Runtime file missing             | `resources` and `output_dir`              |
| Module not listed                | `[module.<name>]` section in `vix.app`    |
| Module boundary error            | `depends` and public include layout       |
| Library cannot run               | `type` is not `executable`                |
| Generated file changes disappear | Edit `vix.app`, not `.vix/generated/app/` |

## A known-good minimal app

When the project is difficult to diagnose, reduce it to a minimal known-good shape.

```ini id="vix-app-troubleshooting-known-good"
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

```cpp id="vix-app-troubleshooting-known-good-main"
#include <vix/print.hpp>

int main()
{
  vix::print("Hello from Vix");
  return 0;
}
```

Then build and run.

```bash id="vix-app-troubleshooting-known-good-run"
vix build
vix run
```

Once this works, add the real source files, include directories, links, resources, and modules back in small steps.

## Next step

Continue with best practices to keep `vix.app` readable and predictable as the project grows.

[Best Practices](/guides/vix-app/best-practices)
