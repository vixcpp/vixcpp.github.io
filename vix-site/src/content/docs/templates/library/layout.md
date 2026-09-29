# Generated Layout

The library template generates a small reusable C++ project. The layout is centered on a public include directory, a test target, an example program, and normal build metadata. Unlike application templates, the library template does not start from a runtime process. It starts from an API that another project should be able to include and use.

A generated library named `mathkit` follows this general shape:

```txt id="library-layout-root"
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

The layout is intentionally small. A library should begin with a clear public header, a test that proves the header can be used, and an example that shows how a consumer would include it.

## `include/`

The public API lives under `include/`.

```txt id="library-layout-include"
include/
  mathkit/
    mathkit.hpp
```

The nested directory should match the library name. This gives consumers a stable include path and avoids collisions with other libraries.

```cpp id="library-layout-include-style"
#include <mathkit/mathkit.hpp>
```

Public headers should stay in this tree. If a header is meant to be used by another project, it belongs under `include/<library>/`, not inside a private source directory.

## `include/<name>/<name>.hpp`

The generated starter header is:

```txt id="library-layout-main-header"
include/mathkit/mathkit.hpp
```

For a small header-only library, this file can contain the first public functions, constants, types, or inline utilities.

A simple starter header may look like this:

```cpp id="library-layout-header-example"
#pragma once

namespace mathkit
{
  inline int add(int a, int b)
  {
    return a + b;
  }
}
```

As the library grows, this header can remain the main entry point and include smaller headers.

```cpp id="library-layout-main-header-growth"
#pragma once

#include <mathkit/add.hpp>
#include <mathkit/multiply.hpp>
#include <mathkit/version.hpp>
```

That keeps the public API easy to include while still allowing the project to split code into focused files.

## Header growth

A larger library can add more public headers under the same namespace directory.

```txt id="library-layout-include-growth"
include/
  mathkit/
    mathkit.hpp
    add.hpp
    multiply.hpp
    vector.hpp
    matrix.hpp
    version.hpp
```

The include style remains stable.

```cpp id="library-layout-include-growth-style"
#include <mathkit/vector.hpp>
#include <mathkit/matrix.hpp>
```

Keep the directory structure predictable. A consumer should not need to know the internal build layout to include the public API.

## `tests/`

Tests live under:

```txt id="library-layout-tests-dir"
tests/
  test_basic.cpp
```

The generated test validates that the library can be included and that the starter behavior works.

A basic test should include the public header, not private implementation files.

```cpp id="library-layout-test-example"
#include <mathkit/mathkit.hpp>

#include <vix/tests/tests.hpp>

int main()
{
  using namespace vix::tests;

  auto &registry = TestRegistry::instance();
  registry.clear();

  registry.add(TestCase("mathkit basic test", [] {
    Assert::equal(mathkit::add(2, 2), 4);
  }));

  return TestRunner::run_all_and_exit();
}
```

Tests are useful because they check the library from the same direction as a real user: through the public API.

## Test workflow

The generated library build can expose a project-specific test option.

```txt id="library-layout-test-option"
mathkit_BUILD_TESTS
```

A normal local check is:

```bash id="library-layout-test-workflow"
vix build --build-target all
vix build --build-target all -- -Dmathkit_BUILD_TESTS=ON
vix tests
```

The project name appears in the build option. For another library, replace `mathkit` with that library name.

## `examples/`

Examples live under:

```txt id="library-layout-examples-dir"
examples/
  basic.cpp
  CMakeLists.txt
```

Examples are not the same as tests. A test checks correctness. An example shows how the library is meant to be used from a small external program.

A generated example can include the public header.

```cpp id="library-layout-example-cpp"
#include <mathkit/mathkit.hpp>

#include <iostream>

int main()
{
  std::cout << mathkit::add(2, 3) << "\n";
  return 0;
}
```

The example should behave like a consumer. It should not include private files or depend on internal paths that another project would not have.

## `examples/CMakeLists.txt`

The example directory has its own build file.

```txt id="library-layout-examples-cmake"
examples/
  CMakeLists.txt
```

This makes the example a small consumer of the library target. That matters because examples can catch problems that tests sometimes miss: missing include directories, unclear target names, bad public headers, or API usage that only works inside the library tree.

Keep examples small. Their job is to demonstrate usage, not to become a second application framework inside the library project.

## `CMakeLists.txt`

The library template generates a root CMake file.

```txt id="library-layout-cmakelists"
CMakeLists.txt
```

For a library project, this file is part of the public build shape. It declares the library target, include directories, options, examples, tests, and any other build rules needed by the project.

This is different from a pure `vix.app` application. A library often needs a more traditional CMake target because it may be consumed by other C++ projects, tested separately, or used from examples.

Vix can still drive the build.

```bash id="library-layout-vix-build"
vix build --build-target all
```

The CLI gives the workflow a common entry point, while the library keeps a build shape that C++ consumers understand.

## `CMakePresets.json`

The generated project can include CMake presets.

```txt id="library-layout-presets"
CMakePresets.json
```

Presets make common build configurations repeatable. They can describe generator choices, build directories, cache variables, and release or development modes.

A library benefits from this because it may be built in different contexts: local development, tests, examples, CI, or downstream consumption.

The developer can still use Vix commands for the normal workflow, but the presets keep the underlying build configuration explicit.

## `vix.json`

The root `vix.json` describes Vix project metadata and tasks.

```txt id="library-layout-vix-json"
vix.json
```

This file does not define the public C++ API. It gives Vix a project-level description and can expose task shortcuts.

```json id="library-layout-vix-json-example"
{
  "name": "mathkit",
  "deps": [],
  "tasks": {
    "build": "vix build --build-target all",
    "test": "vix tests",
    "check": "vix build --build-target all -- -Dmathkit_BUILD_TESTS=ON && vix tests"
  }
}
```

The exact task list can evolve, but the responsibility stays the same: `vix.json` describes workflow around the project. Public library code belongs under `include/`, and build target rules belong in the generated build files.

## `README.md`

The generated README belongs to the library project itself.

```txt id="library-layout-readme"
README.md
```

It should explain what the library does, how to include it, how to build it, how to run tests, and how to try the example. The README is the first project-local guide for someone opening the generated repository.

These documentation pages explain the template. The generated README explains the specific library project.

## File responsibilities

The generated library layout has clear responsibilities.

```txt id="library-layout-responsibilities"
include/mathkit/       public C++ API
tests/                 validation code
examples/              small consumer programs
CMakeLists.txt         library build target and options
CMakePresets.json      repeatable build configurations
vix.json               Vix project metadata and tasks
README.md              project-local guide
```

This separation is what makes the library template useful. A reusable library should not hide its API in application files or make examples depend on private internals.

## Adding more public headers

Add new public headers under the library include directory.

```txt id="library-layout-add-public-headers"
include/
  mathkit/
    mathkit.hpp
    statistics.hpp
    geometry.hpp
```

Then include them from the main header when they are part of the common public surface.

```cpp id="library-layout-include-from-main"
#pragma once

#include <mathkit/statistics.hpp>
#include <mathkit/geometry.hpp>
```

A consumer can either include the main header or include a focused header directly.

```cpp id="library-layout-public-header-use"
#include <mathkit/statistics.hpp>
```

Use this structure to keep the API readable as the library grows.

## Adding private implementation files

The generated starter can be header-only. When the library needs compiled implementation files, add a `src/` directory.

```txt id="library-layout-add-src"
src/
  statistics.cpp
  geometry.cpp
```

The public headers remain under `include/`.

```txt id="library-layout-public-private"
include/mathkit/statistics.hpp   public API
src/statistics.cpp               private implementation
```

Then update the root build target so those implementation files are compiled into the library.

The principle is simple: headers under `include/<library>/` define what other projects can use. Files under `src/` support the implementation.

## Adding more tests

As the public API grows, add tests beside the starter test.

```txt id="library-layout-add-tests"
tests/
  test_basic.cpp
  test_statistics.cpp
  test_geometry.cpp
```

Tests should continue to include public headers.

```cpp id="library-layout-test-public-api"
#include <mathkit/statistics.hpp>
```

This keeps tests aligned with real usage. A library is healthier when its tests prove the public API instead of depending on private implementation details.

## Adding more examples

Examples should show real usage patterns.

```txt id="library-layout-add-examples"
examples/
  basic.cpp
  statistics.cpp
  geometry.cpp
  CMakeLists.txt
```

A good example is small, complete, and focused on one idea. It should be easy for someone to copy into their own project and understand what the library expects.

Do not turn examples into a second test suite. Tests should assert behavior. Examples should teach usage.

## Header-only versus compiled library

The generated template starts well for a header-only library. That is a practical default for small reusable C++ code, templates, inline helpers, and early APIs.

When implementation files become useful, the project can become a compiled library without changing the public include style. The consumer should still include headers from:

```txt id="library-layout-public-api-path"
include/mathkit/
```

The internal build can grow, but the public API path should remain stable.

## Difference from app-first templates

The application, backend, web, Vue, and game templates all create projects that run as processes. They are centered on an executable target.

The library template is centered on reusable code.

```txt id="library-layout-template-difference"
application/backend/web/vue/game  -> executable project
library                           -> reusable C++ API
```

That is why the layout uses `include/`, examples, tests, and root CMake build files instead of a `vix.app` runtime manifest.

## Common mistakes

The most common mistake is putting the public API in `src/`. Code under `src/` is usually private implementation. Public headers should live under `include/<library>/`.

Another mistake is writing examples that include private files. Examples should use the library the same way an external project would.

A third mistake is treating the library as if it should have one main application entry point. A library can have examples and tests with `main()`, but the library itself should expose reusable code.

A fourth mistake is forgetting to update the build target when compiled `.cpp` files are added. Header-only files can be included directly, but compiled implementation files must be part of the library target.

A fifth mistake is running tests without enabling the generated test option when the build uses a project-specific flag such as `mathkit_BUILD_TESTS`.

## Recommended rule

Keep the public API under `include/<library>/`, keep tests focused on public behavior, keep examples small and consumer-like, and let the build files describe the library target clearly. When the library grows from header-only to compiled code, keep the public include path stable and add private implementation files deliberately.

## Next step

Continue with the public API page to understand how the generated library exposes headers and how the include structure should grow.

[Public API](/templates/library/layout)
