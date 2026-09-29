# CMake Fallback

Vix keeps existing C++ projects working. When a project already has a root `CMakeLists.txt`, Vix treats that file as the active project input and preserves the existing build behavior. `vix.app` is used only when no root `CMakeLists.txt` is present.

This fallback matters because `vix.app` is an application manifest, not a forced replacement for every existing project. A project can adopt the Vix CLI without immediately changing its build description, and a new Vix application can use `vix.app` when the project is meant to follow the app-first workflow.

```bash id="vix-app-cmake-fallback-workflow"
vix build
vix run
```

The command stays the same. Vix decides which project input to use from the project root.

## Resolution order

Vix resolves the project in this order:

```txt id="vix-app-cmake-fallback-order"
1. CMakeLists.txt
2. vix.app
```

If a root `CMakeLists.txt` exists, Vix uses it.

If no root `CMakeLists.txt` exists and `vix.app` exists, Vix reads `vix.app`, generates the internal build input under `.vix/generated/app/`, and continues through the normal Vix workflow.

This rule is intentionally simple. It avoids surprising existing projects and makes the switch to `vix.app` explicit.

## Existing projects

An existing project can continue to build normally.

```txt id="vix-app-cmake-fallback-existing-layout"
project/
  CMakeLists.txt
  src/
    main.cpp
```

From the project root, the workflow stays:

```bash id="vix-app-cmake-fallback-existing-build"
vix build
```

In this case, `vix.app` is not required. The project already has an active build input, and Vix respects it.

## `vix.app` projects

A pure `vix.app` project does not keep a root `CMakeLists.txt`.

```txt id="vix-app-cmake-fallback-vix-app-layout"
hello/
  src/
    main.cpp
  vix.app
```

The manifest describes the application target:

```ini id="vix-app-cmake-fallback-vix-app-manifest"
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

Vix then uses the manifest when building or running the application.

```bash id="vix-app-cmake-fallback-vix-app-build"
vix build
vix run
```

## When both files exist

When both files exist in the project root, the root `CMakeLists.txt` wins.

```txt id="vix-app-cmake-fallback-both-layout"
project/
  CMakeLists.txt
  vix.app
  src/
    main.cpp
```

In this layout, Vix treats the project as an existing CMake project. The `vix.app` file may be present for migration work, review, or future conversion, but it is not the active project input.

This behavior prevents accidental project switches. A developer should not add a manifest and unknowingly change the build shape of an existing project.

## Switching to `vix.app`

To make `vix.app` the active project manifest, remove or rename the root `CMakeLists.txt` when the migration is ready.

A safe flow is:

```txt id="vix-app-cmake-fallback-switch-flow"
1. Create vix.app.
2. Map the application target, sources, includes, links, resources, and modules.
3. Review the manifest.
4. Move the old root CMakeLists.txt out of the way.
5. Run vix build.
6. Run vix run or the project checks.
```

After the switch, the project root should look like this:

```txt id="vix-app-cmake-fallback-after-switch"
project/
  src/
    main.cpp
  vix.app
```

Then build normally:

```bash id="vix-app-cmake-fallback-after-switch-build"
vix build
```

For module-based backends, run the module checks as well:

```bash id="vix-app-cmake-fallback-module-check"
vix modules check
vix build
```

## Generated files

When Vix uses `vix.app`, it generates the internal build input under:

```txt id="vix-app-cmake-fallback-generated-path"
.vix/generated/app/
```

These files are implementation details of the Vix workflow. The source of truth remains the root `vix.app` file.

Do not edit generated files to change the application. Edit `vix.app`, then run the normal command again.

```bash id="vix-app-cmake-fallback-regenerate"
vix build
```

When `vix.app` changes, Vix can refresh the generated project before the next build or run.

## Why fallback exists

The fallback exists because Vix supports two kinds of projects.

The first kind is an existing C++ project with its own root build file. Vix should not break that project or reinterpret it without a clear signal.

The second kind is a Vix application project where the developer wants a smaller app-first manifest. In that case, `vix.app` describes the application target and Vix manages the generated build input internally.

Both workflows use the same CLI commands, but they have different project sources of truth.

## Backend migration example

During migration, a backend may temporarily contain both files.

```txt id="vix-app-cmake-fallback-backend-migration-layout"
api/
  CMakeLists.txt
  vix.app
  src/
  include/
  modules/
```

While `CMakeLists.txt` remains in the root, Vix uses it. When the manifest is ready, make the switch by moving the old root build file out of the way.

A backend `vix.app` may then look like this:

```ini id="vix-app-cmake-fallback-backend-manifest"
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

After the switch:

```bash id="vix-app-cmake-fallback-backend-check"
vix modules check
vix build
```

## When to keep the fallback

Keep the existing project input when the project has a complex custom build setup that is not naturally expressed in `vix.app`, or when the migration would hide important build decisions behind raw options.

Use `vix.app` when the project is an application with a clear target shape: sources, include roots, definitions, packages, links, resources, output directory, and optional app modules.

A good `vix.app` project should be easier to read than the build file it replaces. If the manifest becomes harder to understand, keep the existing project input until the application shape is clearer.

## Common mistakes

The most common mistake is creating `vix.app` and expecting Vix to use it while a root `CMakeLists.txt` still exists. Vix uses the existing project first.

Another mistake is editing files under `.vix/generated/app/`. Those files are generated by Vix. Edit the manifest instead.

A third mistake is using the fallback as a half-migration for too long. During review, it is fine to keep both files. Once the manifest becomes the intended source of truth, make the switch explicit so the project does not have two competing descriptions.

## Checking which path is active

A quick way to reason about the active path is to inspect the project root.

```txt id="vix-app-cmake-fallback-active-rule"
CMakeLists.txt exists  -> existing project path
vix.app only           -> vix.app path
```

Then run:

```bash id="vix-app-cmake-fallback-build-check"
vix build
```

If the project is meant to use app modules, also run:

```bash id="vix-app-cmake-fallback-modules-check"
vix modules check
```

## Recommended rule

For new Vix applications, use `vix.app` as the project manifest and do not add a root `CMakeLists.txt`.

For existing projects, keep the fallback until the migration is ready. When the project switches to `vix.app`, do it clearly and let the manifest become the only root application build description.

## Next step

Continue with troubleshooting to diagnose common `vix.app` issues such as missing sources, wrong include roots, inactive manifests, resource paths, and module wiring.

[Troubleshooting](/guides/vix-app/troubleshooting)
