# vix.app

`vix.app` is the application manifest used by Vix projects that want a direct app-first workflow.

Instead of asking the user to maintain a hand-written build file for every generated application, Vix reads `vix.app`, understands the target, sources, includes, dependencies, resources, and internal modules, then generates the internal build project it needs under `.vix/generated/app/`. The user keeps working with the Vix commands they already know.

```bash id="llkbju"
vix build
vix run
```

For generated Vix applications, `vix.app` is the central file that describes what the application is and how it should be assembled. It is intentionally small enough to read quickly, but it still carries the important parts of a real C++ application: source files, include directories, linked Vix modules, external dependencies, compile options, copied resources, output location, and application modules.

## Why vix.app exists

A Vix application should be understandable from the project root. When a developer opens a generated backend, game, desktop, or app project, the important build shape should not be hidden behind a large custom build script. `vix.app` gives the project one readable manifest that says: this is the app name, these are the files, these are the libraries, these resources must be copied, and these internal modules are enabled.

A minimal application manifest looks like this:

```ini id="losx9m"
name = "hello"
type = "executable"
standard = "c++20"

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

output_dir = "bin"
```

With that file in place, the normal workflow stays simple:

```bash id="qpedwh"
vix build
vix run
```

Vix reads the manifest, generates the internal project, configures the build, and runs the application target.

## How Vix uses it

When Vix resolves a project, it keeps existing CMake projects working first. If a `CMakeLists.txt` exists, Vix uses the project as a normal CMake-based project. If there is no `CMakeLists.txt` and a `vix.app` file exists, Vix loads the application manifest and generates the internal project from it.

```txt id="yldkli"
project root
  ├─ vix.app
  ├─ vix.json
  └─ src/
```

The generated files are written under:

```txt id="c0ad4d"
.vix/generated/app/
```

The most important generated file is:

```txt id="m3mids"
.vix/generated/app/CMakeLists.txt
```

That file belongs to Vix. It can be inspected when debugging, but it should not be edited directly. The source of truth remains `vix.app`.

## Required fields

A usable `vix.app` needs two important pieces of information: the target name and the source files.

```ini id="bhytqa"
name = "hello"

sources = [
  "src/main.cpp",
]
```

When no standard is provided, Vix uses `c++20`. When no target type is provided, Vix treats the project as an executable application.

```ini id="wwtp5h"
standard = "c++20"
type = "executable"
```

## Application types

The `type` field describes the generated target shape. Most Vix applications use an executable target.

```ini id="qny2as"
type = "executable"
```

Library targets are also supported:

```ini id="uv8408"
type = "static-library"
```

```ini id="l5pelw"
type = "shared-library"
```

Backend applications can use a backend-oriented application kind while still producing an executable target.

```ini id="vc6lga"
name = "api"
type = "backend"
standard = "c++20"
```

In this case, Vix maps the target to an executable because a backend application still needs to run as a process. The backend kind gives Vix enough context to apply backend application behavior without asking the user to write a lower-level build file.

## Sources and includes

The `sources` field lists the C++ files that belong to the application target. Paths are written relative to the project root.

```ini id="q3f80k"
sources = [
  "src/main.cpp",
  "src/app/AppBootstrap.cpp",
  "src/presentation/routes/RouteRegistry.cpp",
]
```

The `include_dirs` field declares include roots for the target.

```ini id="khzcx4"
include_dirs = [
  "include",
  "src",
]
```

A backend template usually includes both `include` and `src`, because some application code is public to the app itself while other code stays organized under the source tree.

## Packages and links

`packages` and `links` are related, but they do different work.

`packages` asks Vix to make a package available to the generated project.

```ini id="gj7ep5"
packages = [
  "vix",
]
```

`links` tells Vix which targets or libraries must actually be linked into the application.

```ini id="wl4bcd"
links = [
  "vix::vix",
]
```

For Vix modules, this is where the application selects the parts it uses. A game project, for example, links the game and I/O modules:

```ini id="zbhs1p"
links = [
  "vix::game",
  "vix::io",
]
```

The important rule is simple: declaring a package does not automatically link every target from that package. The application still lists the target it wants in `links`.

## Registry dependencies

A `vix.app` file can also declare dependencies from the Vix Registry.

```ini id="lir8wh"
deps = [
  "adastra/logger",
  "tools/json@1.2.0",
]
```

When Vix sees registry dependencies in `vix.app`, it syncs them into `vix.json`, resolves them into `vix.lock`, and links them through the generated dependency file used by the build. This keeps the application manifest readable while still preserving the normal Vix dependency workflow.

After adding or changing registry dependencies, run:

```bash id="w25dw0"
vix install
vix build
```

## Defines and compile options

Preprocessor definitions are declared with `defines`.

```ini id="vg7azm"
defines = [
  "VIX_BACKEND_APP=1",
  "VIX_APP_NAME=api",
]
```

Raw compiler options can be added with `compile_options`.

```ini id="y2qvs8"
compile_options = [
  "$<$<CXX_COMPILER_ID:MSVC>:/W4>",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-Wall>",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-Wextra>",
]
```

Compile features can also be declared explicitly.

```ini id="xgl1ev"
compile_features = [
  "cxx_std_20",
]
```

Most projects do not need many compile options at the beginning. Generated templates include the defaults needed for a solid starting point, and the manifest can grow as the application becomes more specific.

## Resources

Applications often need files at runtime: `.env`, public assets, views, storage directories, game assets, or package metadata. The `resources` field copies those entries next to the built target.

```ini id="t7hw0q"
resources = [
  ".env=.env",
  "public=public",
  "views=views",
  "storage=storage",
]
```

Each entry has this shape:

```txt id="s1e3sp"
source=destination
```

The source is relative to the project root. The destination is relative to the runtime output directory. When the destination is omitted, Vix keeps the source basename.

## Output directory

The `output_dir` field controls where Vix places the built target inside the build tree.

```ini id="kmod5p"
output_dir = "bin"
```

Generated Vix applications normally use `bin`, which keeps the runnable program and copied runtime resources in a predictable place.

## App modules

`vix.app` also controls internal application modules. This is one of the most important parts of the application workflow, especially for backend projects that grow beyond a single folder.

A module is declared with a `[module.<name>]` section.

```ini id="c4lsnc"
[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = [
  "users",
]
```

Enabled modules are linked into the generated application target. Disabled modules remain in the manifest, but Vix does not wire them into the application build.

```ini id="nhiwu1"
[module.billing]
enabled = false
path = "modules/billing"
kind = "backend"
```

This makes it possible to keep a clear internal architecture while still controlling module activation from one place.

The `vix modules` command updates this part of the manifest.

```bash id="b2khky"
vix modules add auth
vix modules list
vix modules disable auth
vix modules enable auth
```

For backend modules, Vix can also generate application module registration files under `.vix/generated/app/`. The application can then register enabled backend modules through the generated module entry point.

## Backend example

A backend manifest usually has more source files and runtime resources than a minimal command-line application.

```ini id="igt9rg"
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
```

This is the kind of manifest generated for a structured Vix backend. It keeps the backend target readable from the root while leaving the application code organized in normal C++ folders.

## Game example

A game project uses the same manifest idea, but links the game modules and copies game assets.

```ini id="lfzyp6"
name = "space-demo"
type = "executable"
standard = "c++20"

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

output_dir = "bin"
```

The C++ entry point can stay focused on the game itself:

```cpp id="kiy6ab"
#include <vix/game/all.hpp>
#include <vix/print.hpp>

int main()
{
  vix::game::App app;
  app.set_title("space-demo");

  vix::print("game ready");

  return 0;
}
```

## Relationship with vix.json

`vix.app` describes the application target. `vix.json` describes project metadata, tasks, dependency state, production configuration, and other Vix project-level information.

A project can have both files:

```txt id="gebvi6"
vix.app    application target manifest
vix.json   project metadata, tasks, registry deps, production settings
vix.lock   resolved dependency lockfile
```

When `deps` are declared in `vix.app`, Vix syncs them into `vix.json` so the registry workflow remains consistent.

## Generated files

Vix can generate files under `.vix/generated/app/` while building or running an application manifest project.

```txt id="j9plxy"
.vix/generated/app/
  CMakeLists.txt
  include/
  vix_app_modules.cpp
```

These files are implementation details. They exist so Vix can turn a small application manifest into a complete build input. The project should be edited through `vix.app`, source files, module files, and normal Vix commands.

## Next step

Start with the getting started guide to create a small application and understand the basic workflow before moving into the full manifest reference.

[Getting Started](/guides/vix-app/getting-started)
