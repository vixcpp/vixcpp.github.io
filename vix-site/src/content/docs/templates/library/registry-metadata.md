# Registry Metadata

The library template can carry registry-oriented metadata in `vix.json`. This metadata describes the project from the Vix workflow point of view: its name, version, dependencies, task shortcuts, and the information that can later help tooling understand how the package should be built, tested, and consumed.

A C++ library has two sides. The CMake target describes how the compiler sees the library. The registry metadata describes how Vix sees the project around that target.

```txt id="library-registry-metadata-map"
CMakeLists.txt  -> C++ target and package shape
include/        -> public library API
vix.json        -> Vix metadata, dependencies, and tasks
README.md       -> human project guide
```

## `vix.json`

The generated library project includes a root `vix.json`.

```txt id="library-registry-vix-json-file"
vix.json
```

For a library, this file should stay small and practical. It should identify the package, keep dependency information visible, and expose useful project tasks without becoming a second build system.

A simple library metadata file can look like this:

```json id="library-registry-vix-json-basic"
{
  "name": "mathkit",
  "version": "0.1.0",
  "type": "library",
  "description": "Small reusable C++ math utilities.",
  "license": "MIT",
  "deps": [],
  "tasks": {
    "build": "vix build --build-target all",
    "test": "vix tests",
    "check": "vix build --build-target all -- -Dmathkit_BUILD_TESTS=ON && vix tests"
  }
}
```

This file does not replace `CMakeLists.txt`. It gives Vix a project-level description and a repeatable command surface.

## Package name

The `name` field is the library identity.

```json id="library-registry-name"
{
  "name": "mathkit"
}
```

For a generated library, the name usually matches the project directory and the public include directory.

```txt id="library-registry-name-layout"
mathkit/
  include/
    mathkit/
      mathkit.hpp
```

That alignment keeps the project easy to understand. The project name, include path, target name, and documentation should not look like four unrelated names unless there is a clear reason.

## Version

The `version` field describes the package version.

```json id="library-registry-version"
{
  "version": "0.1.0"
}
```

For a new library, `0.1.0` is a reasonable starting point. It communicates that the package exists, but the API may still change while the project is young.

The version belongs to the library. It does not need to match the Vix CLI version. It should follow the release rhythm of the library itself.

## Type

A library project can declare its type.

```json id="library-registry-type"
{
  "type": "library"
}
```

This helps tooling and readers understand the project shape. A library is not a backend service, not a server-rendered web app, not a Vue frontend project, and not a game runtime. Its main product is reusable C++ code.

That distinction matters because the workflow is different. A library is usually checked by building targets, compiling examples, and running tests. It is not normally started with `vix run`.

## Description

A short description is useful when the package is listed, searched, or reviewed.

```json id="library-registry-description"
{
  "description": "Small reusable C++ math utilities."
}
```

The description should be concrete. It should say what the library provides, not use vague marketing language.

Good descriptions are usually simple:

```txt id="library-registry-good-descriptions"
Small reusable C++ math utilities.
Header-only string helpers for C++20 projects.
A lightweight geometry library for application code and tests.
```

Avoid descriptions that do not explain the library:

```txt id="library-registry-weak-descriptions"
A powerful next-generation toolkit.
A seamless developer experience.
A robust and scalable solution.
```

A library description should help another developer decide whether the package is relevant.

## License

The `license` field documents the project license.

```json id="library-registry-license"
{
  "license": "MIT"
}
```

This field should match the actual license file in the repository. If the project has a `LICENSE` file, the metadata should not disagree with it.

```txt id="library-registry-license-files"
LICENSE      project license text
vix.json     license metadata
```

Keep this boring and accurate. Registry metadata should not make legal claims that the repository does not support.

## Dependencies

The `deps` field describes Vix registry dependencies.

```json id="library-registry-deps-empty"
{
  "deps": []
}
```

A new library can start with no registry dependencies. When the library needs another Vix package, add it deliberately.

```json id="library-registry-deps-example"
{
  "deps": ["adastra/strings@0.2.0"]
}
```

Dependencies should be added because the public or private implementation needs them, not because the project might need them later. A reusable library becomes harder to consume when it carries unnecessary dependencies.

## Dependency and CMake target

Registry dependencies and CMake target links are related, but they are not the same thing.

The registry dependency tells Vix which package should be resolved.

```json id="library-registry-dep-vix-json"
{
  "deps": ["adastra/strings@0.2.0"]
}
```

The CMake target decides how the library links or exposes that dependency.

```cmake id="library-registry-dep-cmake"
target_link_libraries(mathkit PUBLIC adastra::strings)
```

Use a public link when the dependency appears in public headers. Use a private link when it is only used inside implementation files.

```cmake id="library-registry-public-private"
target_link_libraries(mathkit PUBLIC other::public_api)
target_link_libraries(mathkit PRIVATE other::implementation_detail)
```

This keeps the package honest for consumers. Registry metadata resolves packages, while the CMake target tells the compiler and linker how those packages are used.

## Tasks

A library can expose common workflow commands through `tasks`.

```json id="library-registry-tasks"
{
  "tasks": {
    "build": "vix build --build-target all",
    "test": "vix tests",
    "check": "vix build --build-target all -- -Dmathkit_BUILD_TESTS=ON && vix tests"
  }
}
```

Tasks should be useful and easy to read. They should not hide surprising behavior behind a short name.

For a library, the most useful tasks are usually:

```txt id="library-registry-useful-tasks"
build   compile the library and examples
test    run the test suite
check   build with tests enabled, then run tests
```

A library does not need many tasks at the beginning. Add task shortcuts when they make the daily workflow clearer.

## Build task

The build task should compile the library project.

```json id="library-registry-build-task"
{
  "tasks": {
    "build": "vix build --build-target all"
  }
}
```

For a library, `--build-target all` is useful because the project may contain the library target, examples, and optional test targets.

The exact build shape belongs to the CMake files. The task only gives the developer a short command to run the normal build.

## Test task

The test task should run the tests.

```json id="library-registry-test-task"
{
  "tasks": {
    "test": "vix tests"
  }
}
```

When the generated build uses a project-specific option for tests, the test targets must be built with that option enabled before the test runner has something to run.

```bash id="library-registry-enable-tests"
vix build --build-target all -- -Dmathkit_BUILD_TESTS=ON
vix tests
```

This is why a `check` task is often more useful than a plain `test` task for local validation.

## Check task

A good check task builds the library with tests enabled, then runs the test suite.

```json id="library-registry-check-task"
{
  "tasks": {
    "check": "vix build --build-target all -- -Dmathkit_BUILD_TESTS=ON && vix tests"
  }
}
```

The project name appears in the test option.

```txt id="library-registry-test-option"
mathkit_BUILD_TESTS
```

For another library, the option should use that library name.

```txt id="library-registry-test-option-rule"
<project>_BUILD_TESTS
```

Keep generated tasks aligned with the real project name. A stale test option is confusing and can make the command appear broken even when the library itself is fine.

## Registry metadata and public API

Registry metadata should support the public API, not replace it.

The public API lives under:

```txt id="library-registry-public-api-path"
include/mathkit/
```

A consumer includes the library through that path.

```cpp id="library-registry-public-api-include"
#include <mathkit/mathkit.hpp>
```

The registry metadata can describe the package, version, license, and dependencies, but the quality of the library still depends on the public headers, CMake target, examples, and tests.

A package with good metadata but unclear headers is still hard to use.

## Registry metadata and examples

Examples should match the package shape that metadata describes.

If `vix.json` says the package is named `mathkit`, examples should not look like they are using a different library.

```cpp id="library-registry-example-include"
#include <mathkit/mathkit.hpp>
```

The example target should link the library target.

```cmake id="library-registry-example-link"
target_link_libraries(mathkit_basic PRIVATE mathkit)
```

This makes examples useful during review. They show whether the package identity, include path, and target name are coherent.

## Registry metadata and tests

Tests should also use the public identity of the package.

```cpp id="library-registry-test-include"
#include <mathkit/mathkit.hpp>
```

A test should not pass only because it reaches into private files. Registry metadata is meant to describe a reusable package, so the tests should validate the reusable surface.

```txt id="library-registry-test-rule"
metadata says package name -> public include path should match
metadata says dependency   -> target links should match
metadata says library      -> tests should use public headers
```

This keeps the project aligned from metadata to actual C++ usage.

## CMake package metadata

Some metadata belongs in CMake instead of `vix.json`.

CMake target metadata includes things such as:

```txt id="library-registry-cmake-metadata"
target name
include directories
compile features
public and private dependencies
install rules
exported target namespace
package config files
```

For example:

```cmake id="library-registry-cmake-target"
add_library(mathkit INTERFACE)

target_include_directories(mathkit INTERFACE
  ${CMAKE_CURRENT_SOURCE_DIR}/include
)

target_compile_features(mathkit INTERFACE cxx_std_20)
```

That information belongs to the C++ build. Vix metadata should not duplicate it unless Vix needs a project-level summary.

## Registry readiness

A library is not ready for registry use just because it has a `vix.json` file. The package should also have a clear public API, a stable include path, useful examples, tests, and a build target that can be consumed cleanly.

A practical readiness check looks like this:

```txt id="library-registry-readiness"
public headers are under include/<name>/
examples include public headers
tests include public headers
library target exposes the right include directory
required compile features are attached to the target
dependencies are declared in vix.json and linked in CMake
README explains basic usage
license metadata matches the repository license
```

This is the level of consistency that makes a library useful outside its original project.

## Publishing mindset

Before thinking about publishing, make the local package shape clean. A registry can help a package be found and resolved, but it cannot fix a confusing API, a broken target, missing examples, or unclear dependency boundaries.

The best preparation for registry use is a boring, predictable project:

```txt id="library-registry-boring-package"
include/<name>/      public headers
CMakeLists.txt       clear target
examples/            small consumer programs
tests/               behavior checks
README.md            usage guide
vix.json             metadata and tasks
LICENSE              license text
```

When this shape is clear, registry metadata becomes a natural description of the project instead of a patch over an unclear package.

## Common mistakes

The most common mistake is treating `vix.json` as the build target. It is not. The library target, include directories, compile features, and CMake package shape belong in `CMakeLists.txt`.

Another mistake is adding dependencies to `deps` without linking them correctly in the CMake target. The package can be resolved by Vix and still fail to compile if the target does not use the dependency properly.

A third mistake is writing a package name that does not match the include path, target name, examples, or README. A reusable library should have one coherent identity.

A fourth mistake is exposing registry metadata before the public API is stable enough to use. Metadata helps discovery, but the package still needs clean headers, examples, and tests.

A fifth mistake is keeping stale task commands after renaming the project. Build options such as `mathkit_BUILD_TESTS` should be updated when the project name changes.

## Recommended rule

Use `vix.json` to describe the library as a Vix project: name, version, type, description, license, dependencies, and useful tasks. Use CMake to describe the C++ target. Keep public headers under `include/<name>/`, keep examples and tests on the public API, and make sure the metadata matches the actual package shape before the library is treated as registry-ready.

## Next step

Continue with best practices to see how to keep the library API, examples, tests, CMake target, and metadata clean as the project grows.

[Best Practices](/templates/library/registry-metadata)
