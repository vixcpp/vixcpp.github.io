# Library Template

The library template creates a small C++ library project. It is meant for reusable code: headers, examples, tests, and project metadata that can be built and checked without turning the project into an application.

Use this template when the project should produce a library rather than a program that runs with `vix run`.

```bash id="library-template-create"
vix new mathkit --lib
```

After creation, the normal first workflow is:

```bash id="library-template-first-workflow"
cd mathkit
vix build --build-target all
vix build --build-target all -- -Dmathkit_BUILD_TESTS=ON
vix tests
```

## What this template is for

The library template is for C++ code that should be reused by other projects. A generated library project starts with a public header, a basic test, an example program, project metadata, and build files that make the library easy to compile and validate.

This template is different from the application, backend, web, Vue, and game templates. Those templates start from something that runs as a process. The library template starts from an API surface. Its first responsibility is to expose clean headers and keep reusable code independent from a specific application runtime.

```txt id="library-template-purpose-map"
include/   -> public library headers
tests/     -> validation code
examples/  -> small usage examples
vix.json   -> project metadata and tasks
```

## Generated project shape

A generated library project named `mathkit` follows this general shape:

```txt id="library-template-layout"
mathkit/
  include/
    mathkit/
      mathkit.hpp

  tests/
    test_basic.cpp

  examples/
    basic.cpp
    CMakeLists.txt

  CMakeLists.txt
  CMakePresets.json
  README.md
  vix.json
```

The generated layout is intentionally simple. It gives the project one public include root, one starter header, one test file, and one example program. That is enough to start a reusable library without forcing an application structure onto the project.

## Public headers

The public API lives under `include/`.

```txt id="library-template-include-layout"
include/
  mathkit/
    mathkit.hpp
```

This layout gives users a stable include path.

```cpp id="library-template-include-example"
#include <mathkit/mathkit.hpp>
```

The directory under `include/` should match the library name. That avoids collisions with other libraries and makes the include style predictable when the library is consumed by another project.

For small header-only libraries, the generated starter header can be enough at the beginning. As the library grows, split the API into more headers under the same namespace directory.

```txt id="library-template-include-growth"
include/
  mathkit/
    mathkit.hpp
    add.hpp
    multiply.hpp
    version.hpp
```

## Header-only starting point

The generated library template is centered on a header-only starting point. That means the first version of the library can expose its behavior directly through headers without requiring a separate compiled implementation file.

This is useful for small utilities, type definitions, templates, lightweight algorithms, and libraries where the public API is still taking shape. It also makes the first example and test easy to understand because the library can be included directly.

A real project can still grow beyond this shape later. If the library needs `.cpp` implementation files, add them deliberately and keep the build target updated.

## Tests

The generated project includes a test file.

```txt id="library-template-tests-layout"
tests/
  test_basic.cpp
```

Tests validate that the library can be included and used correctly.

Run the test workflow with:

```bash id="library-template-tests-command"
vix tests
```

Before running tests, build the project with the test option enabled when the generated build expects it.

```bash id="library-template-enable-tests"
vix build --build-target all -- -Dmathkit_BUILD_TESTS=ON
```

The exact project name appears in the build option. For a project named `mathkit`, the option is:

```txt id="library-template-test-option"
mathkit_BUILD_TESTS
```

For another project, replace `mathkit` with that project name.

## Examples

The generated project includes an example program.

```txt id="library-template-examples-layout"
examples/
  basic.cpp
  CMakeLists.txt
```

Examples are not tests. They show how the library is meant to be used from a small external program.

A good example should stay short and practical. It should include the public header and use the library the same way another project would.

```cpp id="library-template-example-include"
#include <mathkit/mathkit.hpp>
```

The example directory also has its own `CMakeLists.txt`, so the example can be built as a small consumer of the library.

## Build files

A generated library project includes normal CMake build files.

```txt id="library-template-build-files"
CMakeLists.txt
CMakePresets.json
```

This is useful for libraries because many C++ projects consume libraries through CMake targets, examples, install rules, tests, and package-style workflows.

The Vix CLI can still drive the build.

```bash id="library-template-build"
vix build --build-target all
```

The important point is that the library template is not an app-first runtime template. It is a reusable C++ library shape, so the generated build files are part of how the library exposes and validates its target.

## `vix.json`

The generated project includes `vix.json`.

```txt id="library-template-vix-json-file"
vix.json
```

This file describes project metadata and task shortcuts. It belongs to the Vix workflow around the library.

A generated library can expose tasks for building, testing, and checking the project. The exact task set can evolve, but the role stays the same: `vix.json` describes project workflow, not the public C++ API.

```txt id="library-template-vix-json-role"
vix.json  -> project metadata and tasks
include/  -> public library API
tests/    -> validation code
examples/ -> usage examples
```

## README

The generated README gives the project a local starting guide.

```txt id="library-template-readme-file"
README.md
```

It should explain what the library is, how to include it, how to build it, how to run tests, and how to try the example.

The README belongs to the generated project itself. These documentation pages explain the template in more detail.

## Build workflow

A normal first build compiles all available targets.

```bash id="library-template-build-all"
vix build --build-target all
```

For tests, enable the generated test option and build again.

```bash id="library-template-build-tests"
vix build --build-target all -- -Dmathkit_BUILD_TESTS=ON
```

Then run the tests.

```bash id="library-template-run-tests"
vix tests
```

This workflow is different from application templates. A library does not usually have a main runtime command. The important checks are whether the library target builds, whether examples compile, and whether tests pass.

## Adding headers

Add public headers under the library include directory.

```txt id="library-template-add-headers"
include/
  mathkit/
    mathkit.hpp
    vector.hpp
    matrix.hpp
```

Then include them through the public include path.

```cpp id="library-template-add-headers-include"
#include <mathkit/vector.hpp>
#include <mathkit/matrix.hpp>
```

Do not place public headers directly under `src/` when the header is meant to be consumed by another project. The public API should live under `include/<library>/`.

## Adding implementation files

A header-only library can stay header-only. When the project needs compiled implementation files, add a source directory deliberately.

```txt id="library-template-add-sources"
src/
  vector.cpp
  matrix.cpp
```

Then update the build target so those files are compiled into the library.

The rule is simple: public headers define the API, and implementation files provide compiled code when the library needs it. Do not mix those responsibilities by hiding public API inside private source paths.

## Library API boundary

The library template is useful because it encourages a clean API boundary.

```txt id="library-template-api-boundary"
include/mathkit/  public API
src/              private implementation, when used
tests/            validation
examples/         usage from outside the library
```

Tests can reach the library through its public headers. Examples should do the same. This gives the project early feedback about whether the public API is actually usable.

A library that only works when examples include private files is not ready to be consumed cleanly.

## Difference from the application template

The application template creates something that runs.

```txt id="library-template-app-difference"
application template -> executable application
library template     -> reusable C++ library
```

An application has an entry point and is normally started with `vix run`. A library exposes headers and targets that other code can use. It is validated through builds, examples, and tests.

Use the application template when the project is the final program. Use the library template when the project is reusable code.

## Difference from backend, web, Vue, and game templates

Backend, web, Vue, and game templates all create runnable project shapes.

```txt id="library-template-template-difference"
backend -> HTTP API service
web     -> server-rendered HTML app
Vue     -> Vue frontend with Vix backend
game    -> Vix game runtime
library -> reusable C++ code
```

The library template does not create controllers, middleware registries, views, public assets, a Vue frontend, game scenes, or runtime resources. It starts from the public C++ API.

## Consuming the library

A generated library should be easy to consume from another C++ project. The consumer should include the public header and link the library target exposed by the build.

```cpp id="library-template-consumer-code"
#include <mathkit/mathkit.hpp>
```

The exact target name and installation shape are controlled by the generated build files. The documentation for the generated project should show the expected consumer usage once the library API becomes stable.

## Common mistakes

The most common mistake is treating the library like an application. A library does not need an application entry point unless it is only an example or test target.

Another mistake is putting public headers in private source directories. Headers that users include should live under `include/<library>/`.

A third mistake is writing examples that depend on private files. Examples should use the library through the same public API that a real consumer would use.

A fourth mistake is changing the project name but forgetting that generated build options often include the project name, such as `mathkit_BUILD_TESTS`.

A fifth mistake is running only the build and never compiling examples or tests. A library can compile by itself and still be difficult to consume. Examples and tests help catch that early.

## Recommended rule

Use the library template when the project should expose reusable C++ code. Keep public headers under `include/<library>/`, keep examples small, keep tests close to the public API, and use the build workflow to validate that the library can be compiled and consumed cleanly.

## Next step

Continue with the generated layout to see each file created by the library template and how the public header, tests, examples, build files, and project metadata fit together.

[Generated Layout](/templates/library/layout)
