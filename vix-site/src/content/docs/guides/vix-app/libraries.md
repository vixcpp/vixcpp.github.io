# Libraries

`vix.app` can describe executable applications, but it can also describe library targets. A library target is useful when the project is not meant to start a process by itself, but to provide reusable C++ code that another application, module, or package can link against.

Most Vix projects begin as applications, so `type = "executable"` is the common default. Use a library target when the output of the project is the code itself.

```ini id="vix-app-library-type"
type = "static-library"
```

A library project is still built with the normal Vix workflow.

```bash id="vix-app-library-build"
vix build
```

## Static libraries

A static library is linked into another target at build time. It is a good fit for reusable code, internal packages, utility layers, shared domain logic, or code that should become part of the final executable.

```ini id="vix-app-static-library-basic"
name = "mathkit"
type = "static-library"
standard = "c++20"

sources = [
  "src/add.cpp",
  "src/multiply.cpp",
]

include_dirs = [
  "include",
]

packages = [
  "vix",
]

links = [
  "vix::vix",
]
```

A simple layout for this project could look like this:

```txt id="vix-app-static-library-layout"
mathkit/
  include/
    mathkit/
      math.hpp
  src/
    add.cpp
    multiply.cpp
  vix.app
```

The public headers live under `include/`, and the implementation files live under `src/`. This keeps the library clear for users: they include from the public namespace, while implementation details stay in the source tree.

```cpp id="vix-app-library-include-example"
#include <mathkit/math.hpp>
```

## Shared libraries

A shared library is built as a dynamic library. Use it when the output needs to be loaded dynamically, distributed as a runtime library, or separated from the final executable for deployment reasons.

```ini id="vix-app-shared-library-basic"
name = "plugin"
type = "shared-library"
standard = "c++20"

sources = [
  "src/plugin.cpp",
]

include_dirs = [
  "include",
]

packages = [
  "vix",
]

links = [
  "vix::vix",
]
```

A shared library should have a stable public header surface. The code that consumes it should not need to know how the library is implemented internally.

```txt id="vix-app-shared-library-layout"
plugin/
  include/
    plugin/
      plugin.hpp
  src/
    plugin.cpp
  vix.app
```

Use a shared library only when the project needs that runtime shape. For normal reusable code inside an application, a static library or an internal module is usually simpler.

## Supported library type values

`vix.app` accepts these library-related type values:

```txt id="vix-app-library-type-values"
static
static-library
shared
shared-library
library
```

For documentation and project manifests, prefer the explicit forms.

```ini id="vix-app-prefer-static"
type = "static-library"
```

```ini id="vix-app-prefer-shared"
type = "shared-library"
```

The short forms are accepted, but the full names are easier to read during review.

## Library source layout

A clean library layout separates public headers from private implementation files.

```txt id="vix-app-library-clean-layout"
mathkit/
  include/
    mathkit/
      add.hpp
      multiply.hpp
  src/
    add.cpp
    multiply.cpp
  tests/
  vix.app
```

The manifest lists the implementation files in `sources`.

```ini id="vix-app-library-sources"
sources = [
  "src/add.cpp",
  "src/multiply.cpp",
]
```

The manifest lists the public include root in `include_dirs`.

```ini id="vix-app-library-includes"
include_dirs = [
  "include",
]
```

Headers are normally not listed in `sources`. They are reached through the include directory and included by the source files or by applications that consume the library.

## Public headers

A library should expose headers from a stable public path.

```cpp id="vix-app-library-public-include"
#include <mathkit/add.hpp>
```

This works when the project has:

```txt id="vix-app-library-public-header-path"
include/mathkit/add.hpp
```

and the manifest declares:

```ini id="vix-app-library-public-include-dir"
include_dirs = [
  "include",
]
```

Avoid include styles that depend on relative source locations.

```cpp id="vix-app-library-bad-relative-include"
// Avoid this in public code.
#include "../src/internal/AddImpl.hpp"
```

Relative implementation paths make the library harder to consume and harder to reorganize. Public code should include public headers. Private implementation details should stay under `src/`.

## Linking from a library

A library can link Vix SDK targets or external package targets when its implementation depends on them.

```ini id="vix-app-library-links"
packages = [
  "vix",
]

links = [
  "vix::vix",
]
```

For a data-oriented library, the target list may include a more specific Vix module.

```ini id="vix-app-library-data-links"
packages = [
  "vix",
]

links = [
  "vix::orm",
]
```

The same rule applies here as in applications: link what the code uses. Do not link every available module only because the SDK provides it.

## Registry dependencies

A library can declare Vix Registry dependencies through `deps`.

```ini id="vix-app-library-deps"
deps = [
  "adastra/logger@1.0.0",
]
```

The dependency is resolved by Vix, while `links` should name the target exported by that dependency.

```ini id="vix-app-library-deps-links"
deps = [
  "adastra/logger@1.0.0",
]

links = [
  "adastra::logger",
]
```

The dependency entry describes what the project needs from the registry. The link entry describes what the library target actually links against.

## Static library example

```ini id="vix-app-static-library-complete"
name = "mathkit"
type = "static-library"
standard = "c++20"
output_dir = "lib"

sources = [
  "src/add.cpp",
  "src/multiply.cpp",
]

include_dirs = [
  "include",
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
```

This manifest builds reusable code into a static library. The output directory is set to `lib` because the target is not an application executable.

## Shared library example

```ini id="vix-app-shared-library-complete"
name = "plugin"
type = "shared-library"
standard = "c++20"
output_dir = "lib"

sources = [
  "src/plugin.cpp",
]

include_dirs = [
  "include",
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
```

This manifest builds a dynamic library. Keep the public headers stable and avoid exposing private implementation details through the include tree.

## Libraries and `vix run`

A library target can be built, but it is not an application entry point. `vix run` is meant for executable targets.

```bash id="vix-app-library-build-only"
vix build
```

Use `type = "executable"` when the project should produce a program that can be launched directly.

```ini id="vix-app-library-executable"
type = "executable"
```

Use a library type when the project exists to be consumed by another target.

```ini id="vix-app-library-static"
type = "static-library"
```

## Libraries versus app modules

A library target and a Vix app module solve different problems.

A library target is the main output of a project. It is useful when the whole project exists to produce reusable code.

```ini id="vix-app-library-main-target"
name = "mathkit"
type = "static-library"
```

An app module is an internal part of an application. It lives inside a larger app and is declared through `[module.<name>]`.

```ini id="vix-app-library-module-example"
name = "api"
type = "executable"

[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = []
```

For a backend application with features such as `auth`, `projects`, `builds`, or `packages`, use app modules. For a standalone reusable package such as `mathkit`, use a library target.

## Resources in library projects

Most library projects do not need `resources`. Runtime files usually belong to applications, not libraries.

```ini id="vix-app-library-no-resources"
name = "mathkit"
type = "static-library"
standard = "c++20"

sources = [
  "src/add.cpp",
]

include_dirs = [
  "include",
]
```

Add resources only when the library genuinely needs files beside its output, for example test data, generated metadata, or plugin assets.

```ini id="vix-app-library-resources"
resources = [
  "data=data",
]
```

Do not use resources for public headers. Headers belong under `include_dirs`.

## Common mistakes

The most common mistake is using a library type for a project that has a `main()` function and should run as an application.

```ini id="vix-app-library-wrong-executable"
# Wrong for a runnable app.
type = "static-library"
```

For a runnable program, use:

```ini id="vix-app-library-correct-executable"
type = "executable"
```

Another mistake is listing headers as source files. A normal library should list `.cpp` files in `sources` and expose headers through `include_dirs`.

```ini id="vix-app-library-correct-sources"
sources = [
  "src/add.cpp",
]

include_dirs = [
  "include",
]
```

A third mistake is exposing private implementation headers as public API. Keep public headers under `include/<library-name>/` and private details under `src/`.

## Checking a library manifest

After editing the library manifest, build the project.

```bash id="vix-app-library-check-build"
vix build
```

A missing source file, incorrect include root, or wrong target type usually appears immediately during the build. Keep the manifest small and explicit so these errors are easy to find.

## Recommended default

Use `static-library` for reusable code unless the project has a clear reason to produce a dynamic library.

```ini id="vix-app-library-recommended"
type = "static-library"
```

Use `shared-library` when runtime loading or dynamic distribution is part of the project design.

```ini id="vix-app-library-recommended-shared"
type = "shared-library"
```

Use `executable` for applications, backends, games, tools, and servers.

```ini id="vix-app-library-recommended-executable"
type = "executable"
```

## Next step

Continue with examples to see complete `vix.app` manifests for applications, backends, games, and libraries.

[Examples](/guides/vix-app/examples)
