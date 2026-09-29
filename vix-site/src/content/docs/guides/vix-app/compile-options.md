# Compile Options

`compile_options`, `link_options`, and `compile_features` give a `vix.app` project a controlled way to adjust how the target is compiled and linked. Most applications should start without many custom flags. Vix already gives the project a normal build workflow, and the manifest should only add options when they express a real project decision: warning level, sanitizer mode, static runtime behavior, or a required language feature.

```bash id="vix-app-compile-build"
vix build
```

These fields should stay readable. A `vix.app` file is not meant to become a large build script. It should describe the application clearly enough that another developer can understand why each option exists.

## Basic shape

A simple application often only needs the C++ standard.

```ini id="vix-app-compile-basic"
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
```

For many projects, this is enough. Add compile options only when the project needs a stricter warning policy, diagnostic mode, sanitizer build, or platform-specific compiler behavior.

## `standard`

`standard` selects the C++ standard used by the target.

```ini id="vix-app-compile-standard"
standard = "c++20"
```

Generated Vix applications use `c++20` by default because it is a practical baseline for modern C++ projects. A project can move to a newer standard when the source code actually depends on it.

```ini id="vix-app-compile-cpp23"
standard = "c++23"
```

Keep this field aligned with the codebase. Do not raise the standard only because a newer value exists; use it when the project benefits from the language features.

## `compile_features`

`compile_features` declares target-level language features.

```ini id="vix-app-compile-features"
compile_features = [
  "cxx_std_20",
]
```

In most Vix applications, `standard = "c++20"` already describes the language level clearly. `compile_features` is useful when a project wants to be explicit about the feature requirement attached to the target.

A generated application may include both:

```ini id="vix-app-compile-standard-and-feature"
standard = "c++20"

compile_features = [
  "cxx_std_20",
]
```

This is acceptable because the intent is clear. The manifest says which C++ standard the project uses and also records the target feature requirement.

## `compile_options`

`compile_options` forwards compiler options to the application target.

```ini id="vix-app-compile-options-field"
compile_options = [
  "$<$<CXX_COMPILER_ID:MSVC>:/W4>",
  "$<$<CXX_COMPILER_ID:MSVC>:/permissive->",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-Wall>",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-Wextra>",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-Wpedantic>",
]
```

This example uses conditional expressions so MSVC receives MSVC options and GCC or Clang receive Unix-style warning flags. This is the pattern used by generated backend templates because it keeps the manifest portable across common compilers.

Use this field for options that affect compilation only: warnings, debug information, sanitizer compile flags, or compiler-specific behavior. Do not use it for linked libraries, include directories, or runtime resources; those have their own fields.

## Warning options

A serious project should usually compile with useful warnings enabled.

```ini id="vix-app-compile-warnings"
compile_options = [
  "$<$<CXX_COMPILER_ID:MSVC>:/W4>",
  "$<$<CXX_COMPILER_ID:MSVC>:/permissive->",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-Wall>",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-Wextra>",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-Wpedantic>",
]
```

Warnings should help the codebase stay clean without making normal development painful. Start with a small, understandable warning policy before adding stricter flags.

## Sanitizer options

Sanitizers are useful during development because they catch memory errors and undefined behavior early. A generated backend can enable sanitizer flags when the developer selected that feature.

```ini id="vix-app-compile-sanitizers"
defines = [
  "VIX_SANITIZERS=1",
]

compile_options = [
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-g3>",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-fno-omit-frame-pointer>",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-O1>",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-fsanitize=address,undefined>",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-fno-sanitize-recover=undefined>",
]

link_options = [
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-g>",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-fsanitize=address,undefined>",
]
```

The sanitizer compile flag and sanitizer link flag should be kept together. If the source is compiled with sanitizer instrumentation but the target is not linked with the matching sanitizer options, the build may fail or the runtime behavior may not match what the developer expects.

## `link_options`

`link_options` forwards options to the link step.

```ini id="vix-app-link-options"
link_options = [
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-fsanitize=address,undefined>",
]
```

Use this field for linker behavior, not for libraries. Libraries and SDK targets belong in `links`.

```ini id="vix-app-links-not-link-options"
links = [
  "vix::vix",
  "vix::orm",
]
```

A clean manifest keeps those concerns separate. `links` says what the application uses. `link_options` says how the final target should be linked.

## Static runtime options

Some generated projects may choose static runtime options.

```ini id="vix-app-static-runtime"
defines = [
  "VIX_LINK_STATIC=1",
]

link_options = [
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-static-libstdc++>",
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-static-libgcc>",
]
```

A full static build can be represented separately.

```ini id="vix-app-full-static"
defines = [
  "VIX_LINK_FULL_STATIC=1",
]

link_options = [
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-static>",
]
```

Use static linking intentionally. It can be useful for deployment, but it also changes how the program depends on the system and can make some platform issues harder to diagnose.

## Backend example

A backend manifest can combine warnings, optional feature definitions, and target links.

```ini id="vix-app-compile-backend-example"
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
```

This example keeps the compile options focused on warnings. The backend identity is handled through `defines`, the SDK through `packages` and `links`, and runtime files through `resources`.

## Game example

A game manifest often does not need custom compile options at the beginning.

```ini id="vix-app-compile-game-example"
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

The manifest stays small because the project does not yet need custom compiler behavior. Add warning or diagnostic options when the game codebase grows enough to benefit from them.

## Example C++ file

A small application using Vix output helpers can stay simple.

```cpp id="vix-app-compile-cpp-example"
#include <vix/print.hpp>

int main()
{
  vix::print("Hello from Vix");
  return 0;
}
```

The compile configuration belongs in `vix.app`; the source file remains focused on application code.

## What not to put in compile options

Do not use `compile_options` for include paths.

```ini id="vix-app-compile-wrong-include"
# Avoid this.
compile_options = [
  "-Iinclude",
]
```

Use `include_dirs` instead.

```ini id="vix-app-compile-correct-include"
include_dirs = [
  "include",
]
```

Do not use `compile_options` for linked libraries.

```ini id="vix-app-compile-wrong-link"
# Avoid this.
compile_options = [
  "-lvix",
]
```

Use `links` instead.

```ini id="vix-app-compile-correct-link"
links = [
  "vix::vix",
]
```

Do not use `compile_options` for runtime files.

```ini id="vix-app-compile-wrong-resource"
# Avoid this.
compile_options = [
  "-DPUBLIC_DIR=public",
]
```

When the program needs files at runtime, copy them through `resources`.

```ini id="vix-app-compile-correct-resource"
resources = [
  "public=public",
]
```

## Recommended order

Keep compile-related fields near the source layout.

```ini id="vix-app-compile-order"
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

links = [
]

resources = [
]
```

This order lets a reader move from target identity, to source layout, to compile behavior, to packages and runtime files.

## Common mistakes

The first common mistake is adding platform-specific flags without conditions. A flag that works on one compiler may fail on another. Conditional expressions keep the manifest portable.

```ini id="vix-app-compile-portable"
compile_options = [
  "$<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-Wall>",
]
```

The second mistake is mixing compile and link flags. Sanitizers are a good example: the compile flags belong in `compile_options`, and the matching link flags belong in `link_options`.

The third mistake is adding too many flags too early. A small project should stay simple. Add options when they solve a real problem and leave a clear trace of the decision in the manifest.

## Checking changes

After editing compile or link options, build the project.

```bash id="vix-app-compile-check"
vix build
```

When the project uses tests, run the checks as well.

```bash id="vix-app-compile-tests"
vix check --tests --run
```

If a flag breaks only on one compiler, look at the condition around that flag first. If the application links but fails at runtime, check whether the issue belongs to `link_options`, `links`, or `resources`.

## Next step

Continue with resources to understand how runtime files such as `.env`, `public`, `views`, assets, and package metadata are copied beside the built target.

[Resources](/guides/vix-app/resources)
