# Manifest

The application template uses `vix.app` to describe the C++ target that Vix should build. This file is the source of truth for the app-first workflow. It tells Vix the target name, target type, C++ standard, source files, include directories, packages, linked targets, compile options, runtime resources, and output directory.

A generated application is still a normal C++ project. The difference is that the root build description is written as a small manifest instead of a hand-written root `CMakeLists.txt`.

```txt
hello/
  src/
    main.cpp
    app/
      ModuleRegistry.cpp
  include/
    app/
      ModuleRegistry.hpp
  vix.app
```

When the project is built, Vix reads `vix.app`, generates the internal CMake input under `.vix/generated/app/`, and continues through the normal build workflow.

```bash
vix build
```

The generated files are part of the build workflow. The file you edit is `vix.app`.

## Basic manifest

A generated application manifest usually follows this shape:

```ini
name = "hello"
type = "executable"
standard = "c++20"
output_dir = "bin"

sources = [
  "src/main.cpp",
  "src/app/ModuleRegistry.cpp",
]

include_dirs = [
  "include",
  "src",
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
  "config=config",
]
```

The exact file can change depending on selected features, but the important idea stays the same: the manifest describes one application target. Source files belong in `sources`, include roots belong in `include_dirs`, Vix or external packages are loaded through `packages`, linked targets go in `links`, and runtime files are copied through `resources`.

## `name`

The `name` field becomes the application target name.

```ini
name = "hello"
```

Use a stable project name. Vix uses this name when generating the internal build target, locating the executable, and wiring the normal `vix build` and `vix run` workflow.

For a small application, the name usually matches the project directory.

```txt
hello/
  vix.app
```

## `type`

The application template builds an executable.

```ini
type = "executable"
```

This is the right target type for an application that should run with:

```bash
vix run
```

Other target types exist for library projects, but the application template is meant to produce a runnable program.

## `standard`

The `standard` field selects the C++ language standard.

```ini
standard = "c++20"
```

Generated Vix applications use C++20 by default. This keeps the template modern while staying practical for current C++ projects.

The manifest can also include the matching CMake compile feature.

```ini
compile_features = [
  "cxx_std_20",
]
```

The `standard` value keeps the manifest readable. The compile feature gives the generated build a direct CMake-level requirement.

## `sources`

The `sources` list contains the C++ implementation files that belong to the application target.

```ini
sources = [
  "src/main.cpp",
  "src/app/ModuleRegistry.cpp",
]
```

When you add another `.cpp` file to the application, add it to this list.

```ini
sources = [
  "src/main.cpp",
  "src/app/ModuleRegistry.cpp",
  "src/services/HealthService.cpp",
]
```

Do not put headers, assets, `.env` files, or HTML files in `sources`. This list is for files that should be compiled into the executable.

## `include_dirs`

The `include_dirs` list tells the compiler where public and project headers can be found.

```ini
include_dirs = [
  "include",
  "src",
]
```

The generated application uses `include` for public project headers and may also include `src` when the project keeps internal headers near implementation files.

A header such as:

```txt
include/app/ModuleRegistry.hpp
```

can then be included as:

```cpp
#include <app/ModuleRegistry.hpp>
```

Add include directories only when they describe real header roots. Do not use `include_dirs` to reach into random implementation folders from another module or feature.

## `packages`

The `packages` field loads packages that the generated CMake project should make available.

```ini
packages = [
  "vix",
]
```

For the application template, the base Vix package is required because the generated app uses `vix::App`, routing, responses, tests, and the normal Vix runtime APIs.

`packages` makes the package available. It does not decide which target is linked into the application. That belongs to `links`.

## `links`

The `links` field selects the CMake targets linked into the application executable.

```ini
links = [
  "vix::vix",
]
```

For a normal application, `vix::vix` is the main target. Other templates link different targets. A game project links `vix::game` and `vix::io`; a backend with ORM support can also link `vix::orm`.

Keep the distinction clear:

```txt
packages  -> make packages available
links     -> link targets into this executable
```

## Feature defines

When selected features are enabled during project creation, the manifest can include definitions.

```ini
defines = [
  "VIX_USE_ORM=1",
  "VIX_SANITIZERS=1",
  "VIX_LINK_STATIC=1",
]
```

These definitions give generated code and build logic a stable way to know which options were selected.

Only keep definitions that the project actually uses. A manifest should describe the application clearly, not collect unused flags.

## Compile and link options

The application template can include compile and link options when selected features require them.

```ini
compile_options = [
  "$<$<CXX_COMPILER_ID:MSVC>:/W4>",
  "$<$<CXX_COMPILER_ID:MSVC>:/permissive->",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-Wall>",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-Wextra>",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-Wpedantic>",
]
```

When sanitizers are enabled, the manifest can also include sanitizer-related options.

```ini
compile_options = [
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-g3>",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-fno-omit-frame-pointer>",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-fsanitize=address,undefined>",
]

link_options = [
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-fsanitize=address,undefined>",
]
```

These fields are useful, but they should stay readable. If the project needs a large amount of custom build logic, a normal CMake project may be a better fit until the application shape becomes clearer.

## `resources`

Runtime files belong in `resources`.

```ini
resources = [
  ".env=.env",
  "config=config",
]
```

A resource entry copies a file or directory beside the built target. This matters because the application runs from the build output, not directly from the source tree.

The syntax is:

```txt
source=destination
```

The source path is relative to the project root. The destination path is relative to the runtime output directory.

For example:

```ini
resources = [
  ".env=.env",
  "config=config",
]
```

can produce a runtime layout like this:

```txt
bin/
  hello
  .env
  config/
```

Do not use `resources` for C++ source files. C++ files belong in `sources`.

## `output_dir`

The application template usually writes the executable to `bin`.

```ini
output_dir = "bin"
```

This gives the application a predictable runtime directory. It also works well with resources because files such as `.env` or `config/` can be copied beside the executable.

```txt
bin/
  hello
  .env
  config/
```

Use a relative output directory. Avoid absolute paths that only work on one machine.

```ini
# Good
output_dir = "bin"

# Avoid
output_dir = "/home/user/build-output/bin"
```

## App modules

The application template is ready to grow with application modules. When modules are added, they are declared in the same `vix.app` file.

```ini
[module.auth]
enabled = true
path = "modules/auth"
kind = "service"
depends = []
```

The module registry gives the generated application one stable place to connect active modules.

```cpp
app::ModuleRegistry::register_all(app);
```

When the generated module bridge is used, it can be called from the registry.

```cpp
vix::app_generated::register_app_modules(app);
```

This keeps the manifest as the visible module graph and keeps `main.cpp` from becoming a manual list of feature modules.

## Generated CMake input

When Vix uses `vix.app`, it generates internal build files under:

```txt
.vix/generated/app/
```

Those files are not the source of truth. They exist so the normal CMake-based build pipeline can compile the project from the manifest.

Do not edit generated files to change the application. Edit `vix.app`, then build again.

```bash
vix build
```

## CMake fallback

A root `CMakeLists.txt` changes project resolution. Vix checks for an existing CMake project before using `vix.app`.

```txt
1. CMakeLists.txt
2. vix.app
```

This means that if both files exist at the project root, the root `CMakeLists.txt` wins.

```txt
hello/
  CMakeLists.txt
  vix.app
```

That behavior protects existing CMake projects. For a pure app-first application, do not keep a root `CMakeLists.txt` unless you intentionally want Vix to treat the project as a CMake project.

## Common mistakes

The most common mistake is adding a new `.cpp` file and forgetting to add it to `sources`.

```ini
sources = [
  "src/main.cpp",
  "src/app/ModuleRegistry.cpp",
  "src/services/HealthService.cpp",
]
```

Another mistake is using `resources` for files that should be compiled. Resources are copied beside the target; they are not compiled into it.

A third mistake is editing `.vix/generated/app/` instead of `vix.app`. Generated files can be replaced on the next build. The manifest is the file that should be edited.

## Recommended rule

Keep the application manifest small and clear. It should describe the executable target, the source files, the include roots, the linked Vix targets, the runtime resources, and the output directory. When the project grows into modules, declare those modules in the same file and let the generated build wiring follow the manifest.

## Next step

Continue with the backend template to see how Vix generates a more structured application shell with `AppBootstrap`, route registry, middleware registry, controllers, runtime resources, and production metadata.

[Backend Template](/templates/backend)
