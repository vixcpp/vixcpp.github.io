# Manifest Reference

This page documents the fields supported by `vix.app`.

A `vix.app` file describes one application target. Vix reads it from the project root, resolves the target name, source files, include directories, linked libraries, registry dependencies, runtime resources, and optional internal modules, then builds the application through the normal Vix workflow.

```bash id="exsj9d"
vix build
vix run
```

The manifest is intentionally readable. It is not meant to become a large build script. It should describe the shape of the application clearly enough that another developer can open the project root and understand what is being built.

## Basic shape

A minimal manifest contains a name and source files.

```ini id="c2o4n4"
name = "hello"

sources = [
  "src/main.cpp",
]
```

Most real applications also declare the target type, C++ standard, include directories, Vix package, linked targets, and output directory.

```ini id="npbwgh"
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

Paths are interpreted relative to the project root. The generated build files are managed by Vix under `.vix/generated/app/`, but the source of truth remains `vix.app`.

## Comments

Comments start with `#`.

```ini id="hvpjdl"
# Vix application manifest
name = "hello"
```

Use comments for context that helps future readers. Avoid turning the manifest into long prose; the documentation belongs in the project README or docs.

## `name`

`name` defines the application or target name.

```ini id="w9td1k"
name = "api"
```

This field is required. Vix uses it as the target name when generating the application build input. Keep it stable, because other generated files, tasks, and production configuration may refer to the same name.

## `type`

`type` describes the C++ target shape.

```ini id="cyu70b"
type = "executable"
```

Supported values include:

```txt id="apopad"
executable
static
static-library
shared
shared-library
library
```

Use `executable` for applications, backends, games, command-line tools, and anything that should run with `vix run`.

```ini id="otf8ce"
type = "executable"
```

Use `static-library` when the project produces reusable code that should be linked into another target.

```ini id="pplfwd"
type = "static-library"
```

Use `shared-library` when the output must be a dynamic library.

```ini id="xw0w4x"
type = "shared-library"
```

For clarity, prefer the full names `static-library` and `shared-library` instead of the shorter aliases.

## `standard`

`standard` selects the C++ standard used by the target.

```ini id="krcn6m"
standard = "c++20"
```

Common values are:

```txt id="fqsjnj"
c++11
c++14
c++17
c++20
c++23
c++26
```

When omitted, Vix uses `c++20`. Generated Vix applications use `c++20` unless the template has a reason to choose a different standard.

## `sources`

`sources` lists the C++ source files that belong to the target.

```ini id="bssvwy"
sources = [
  "src/main.cpp",
  "src/app/AppBootstrap.cpp",
  "src/presentation/routes/RouteRegistry.cpp",
]
```

This field is required for a normal application target. Every path is relative to the project root.

A small project may only need one source file:

```ini id="j7m0zu"
sources = [
  "src/main.cpp",
]
```

A backend project usually grows into several source files:

```ini id="euwav9"
sources = [
  "src/main.cpp",
  "src/api/app/AppBootstrap.cpp",
  "src/api/support/HttpResponses.cpp",
  "src/api/presentation/routes/RouteRegistry.cpp",
  "src/api/presentation/controllers/HomeController.cpp",
  "src/api/presentation/controllers/HealthController.cpp",
]
```

Keep this list explicit. It makes the application target easy to inspect and avoids hiding important files behind implicit rules.

## `include_dirs`

`include_dirs` declares include roots for the target.

```ini id="la5fqk"
include_dirs = [
  "include",
  "src",
]
```

Use `include` for public headers and `src` when application-internal headers are organized inside the source tree.

```cpp id="ch9oru"
#include <api/app/AppBootstrap.hpp>
```

The include path should match the way the code is written. A clean include layout makes the project easier to move, test, and split into modules later.

## `defines`

`defines` adds preprocessor definitions to the target.

```ini id="urxe68"
defines = [
  "VIX_BACKEND_APP=1",
  "VIX_APP_NAME=api",
]
```

Definitions can be used by generated templates, feature switches, or application-specific compile-time configuration.

```ini id="i0fltu"
defines = [
  "VIX_USE_ORM=1",
  "VIX_SANITIZERS=1",
]
```

Keep definitions meaningful. A manifest with too many compile-time switches becomes hard to understand, especially when the same behavior could be controlled through runtime configuration.

## `packages`

`packages` declares external packages that should be made available to the application build.

```ini id="br9xu3"
packages = [
  "vix",
]
```

For most Vix applications, the package list starts with `vix`. The application then selects the exact targets it needs through `links`.

Package entries can also include requirement and component information.

```ini id="kew7a3"
packages = [
  "vix",
  "OpenSSL:REQUIRED",
  "Qt6:COMPONENTS=Widgets,Network:REQUIRED",
]
```

The component and required markers are interpreted from the package string. Whitespace around component names is trimmed.

## `links`

`links` declares the targets or libraries linked into the application.

```ini id="gxuole"
links = [
  "vix::vix",
]
```

This is different from `packages`. A package makes something available; `links` says what the target actually uses.

A basic Vix application often links:

```ini id="pbkpk2"
links = [
  "vix::vix",
]
```

A backend using ORM may link:

```ini id="u6ohp4"
links = [
  "vix::vix",
  "vix::orm",
]
```

A game project may link:

```ini id="pixb1y"
links = [
  "vix::game",
  "vix::io",
]
```

The list should stay honest. Link the modules the application uses, not every module that exists in the SDK.

## `deps`

`deps` declares dependencies from the Vix Registry.

```ini id="r3mxya"
deps = [
  "adastra/logger",
  "tools/json@1.2.0",
]
```

Accepted registry dependency shapes are:

```txt id="s97b95"
namespace/name
namespace/name@version
@namespace/name
@namespace/name@version
```

When Vix sees registry dependencies in `vix.app`, it syncs them into the project dependency state and resolves the lockfile. This lets the application manifest remain the place where the app shape is described while still keeping the normal Vix dependency workflow.

After changing registry dependencies, run:

```bash id="wxia0j"
vix install
vix build
```

## `compile_options`

`compile_options` forwards raw compiler options to the target.

```ini id="yat9qx"
compile_options = [
  "$<$<CXX_COMPILER_ID:MSVC>:/W4>",
  "$<$<CXX_COMPILER_ID:MSVC>:/permissive->",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-Wall>",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-Wextra>",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-Wpedantic>",
]
```

Generated backend templates use this field for warning levels and optional sanitizer flags.

```ini id="nlwpe7"
compile_options = [
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-g3>",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-fno-omit-frame-pointer>",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-fsanitize=address,undefined>",
]
```

Use this field carefully. It is powerful because it reaches the compiler directly, but that also means it can make the project less portable when used without conditions.

## `link_options`

`link_options` forwards raw linker options to the target.

```ini id="izqwsl"
link_options = [
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-fsanitize=address,undefined>",
]
```

Static runtime options can also be represented here:

```ini id="yvqu1y"
link_options = [
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-static-libstdc++>",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-static-libgcc>",
]
```

Most applications do not need custom link options at the beginning. Add them only when the project has a clear reason.

## `compile_features`

`compile_features` declares target compile features.

```ini id="hgqni4"
compile_features = [
  "cxx_std_20",
]
```

This is useful when the project wants to be explicit about the language feature level used by the target. In many Vix app manifests, `standard = "c++20"` is enough, but generated templates may also include `compile_features` for clarity.

## `resources`

`resources` copies runtime files next to the built target.

```ini id="fsk6nl"
resources = [
  ".env=.env",
  "public=public",
  "views=views",
  "storage=storage",
]
```

Each entry accepts one of two forms:

```txt id="rkkgzx"
source
source=destination
```

When only `source` is provided, Vix copies it using the source basename. When `source=destination` is provided, Vix copies the source into the given destination path beside the built target.

For a game project:

```ini id="vc5p7o"
resources = [
  "assets=assets",
  "game.package.json=game.package.json",
]
```

For a backend project:

```ini id="re5vty"
resources = [
  ".env=.env",
  "public=public",
  "views=views",
  "storage=storage",
]
```

Resources are for files the program needs at runtime. Source files and headers should stay in `sources` and `include_dirs`.

## `output_dir`

`output_dir` controls where the target output is placed inside the build tree.

```ini id="zg0bm6"
output_dir = "bin"
```

Generated Vix applications usually use `bin`. This keeps the executable and copied resources together in a predictable runtime location.

```txt id="btvgtv"
bin/
  api
  .env
  public/
  views/
  storage/
```

Use a simple output directory name. A deeply nested output path makes local development harder without adding much value.

## `modules`

`modules` is the older compact list of internal application modules.

```ini id="mj8fqx"
modules = [
  "auth",
  "projects",
]
```

Each entry maps to an internal application module target using the current application name as the prefix. For new Vix application modules, prefer full `[module.<name>]` sections because they carry the enabled state, path, kind, and internal dependencies in one place.

## `[module.<name>]`

Application modules are declared with section headers.

```ini id="nxu1rd"
[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = []
```

The section name is the stable module name. In this example, the module is `auth`.

```ini id="b6yo8i"
[module.projects]
enabled = true
path = "modules/projects"
kind = "backend"
depends = [
  "auth",
]
```

Application modules are especially useful in backend projects where features such as authentication, projects, builds, packages, logs, registry, or deployments need to grow independently without turning the backend into one large source folder.

## `module.<name>.enabled`

`enabled` controls whether the module is wired into the application.

```ini id="p56rs3"
[module.auth]
enabled = true
```

A disabled module remains declared, but it is not linked into the generated application target.

```ini id="jvm9pz"
[module.billing]
enabled = false
path = "modules/billing"
kind = "backend"
```

This is useful when a module exists in the project but should not participate in the current build.

## `module.<name>.path`

`path` points to the module directory relative to the project root.

```ini id="l5iipk"
[module.auth]
path = "modules/auth"
```

When omitted, the default path follows the module name:

```txt id="t5rnix"
modules/<name>
```

A module named `auth` therefore defaults to:

```txt id="d1kfau"
modules/auth
```

## `module.<name>.kind`

`kind` describes the module role.

```ini id="ei2sju"
[module.auth]
kind = "backend"
```

Common values are:

```txt id="d9nedf"
backend
library
frontend
```

Backend modules can be used by Vix to generate backend module registration code. Library modules are useful for reusable internal code. Frontend is reserved for project structures that need to describe frontend-facing modules from the same manifest.

## `module.<name>.depends`

`depends` declares internal module dependencies by module name.

```ini id="lfz8lv"
[module.projects]
enabled = true
path = "modules/projects"
kind = "backend"
depends = [
  "auth",
]
```

This tells Vix that `projects` depends on `auth`. Dependencies should be explicit. When a module uses another module’s public API, the relationship belongs in the manifest instead of being hidden in source files.

A module with no internal dependencies can use an empty list:

```ini id="cyw254"
depends = []
```

## Complete backend example

```ini id="a0mv1z"
# Vix backend application manifest
# This file describes one executable backend target.

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

This manifest describes one backend executable, links the base Vix target, copies runtime resources, and declares two internal backend modules.

## Complete game example

```ini id="twk9d4"
# Vix game manifest

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

The manifest stays small because the game target only needs one source file, the game modules, and runtime assets.

## Field summary

| Field              |    Type | Purpose                                                     |
| ------------------ | ------: | ----------------------------------------------------------- |
| `name`             |  string | Application or target name                                  |
| `type`             |  string | Target shape: executable, static library, or shared library |
| `standard`         |  string | C++ standard, such as `c++20`                               |
| `sources`          |   array | Source files relative to the project root                   |
| `include_dirs`     |   array | Include directories relative to the project root            |
| `defines`          |   array | Preprocessor definitions                                    |
| `packages`         |   array | Packages made available to the target                       |
| `deps`             |   array | Vix Registry dependencies                                   |
| `links`            |   array | Targets or libraries linked into the application            |
| `compile_options`  |   array | Raw compiler options                                        |
| `link_options`     |   array | Raw linker options                                          |
| `compile_features` |   array | Compile feature entries                                     |
| `resources`        |   array | Runtime files copied beside the built target                |
| `output_dir`       |  string | Output directory inside the build tree                      |
| `modules`          |   array | Compact internal module list                                |
| `[module.<name>]`  | section | Full internal application module definition                 |

## Recommended order

Keep manifests in a predictable order. It makes diffs easier to review and helps readers understand the target from top to bottom.

```ini id="iyok4r"
name = "api"
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

The exact order is not the most important part of the file, but consistency matters. Put identity first, then source layout, then compile behavior, then packages and links, then runtime resources, then internal modules.

## Validation

A manifest must at least describe a valid target name and source list. Invalid URLs, missing files, unsupported target types, or malformed registry dependencies will stop the Vix command with an error.

The fastest way to validate the manifest is to run:

```bash id="ulb654"
vix build
```

For projects using internal modules, also run:

```bash id="g5hny1"
vix modules check
```

This catches module structure and dependency issues before they turn into harder-to-read build errors.

## Next step

Continue with packages and links to understand how Vix packages, registry dependencies, and linked targets work together.

[Packages and Links](/guides/vix-app/packages-and-links)
