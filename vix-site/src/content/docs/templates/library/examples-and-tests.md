# Examples and Tests

The library template generates both examples and tests because a reusable C++ library needs two kinds of feedback. Tests check that the library behaves correctly. Examples show how the library is meant to be used by another project.

They are related, but they do not have the same job. A test should fail when behavior is wrong. An example should stay small, readable, and close to real consumer code.

```txt id="library-examples-tests-map"
tests/      -> validate behavior
examples/   -> show usage
include/    -> public API used by both
```

## Generated test file

A generated library project includes a starter test.

```txt id="library-examples-tests-test-file"
tests/
  test_basic.cpp
```

The test should include the public library header and validate a small piece of behavior.

```cpp id="library-examples-tests-basic-test"
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

The important part is the include style.

```cpp id="library-examples-tests-public-include"
#include <mathkit/mathkit.hpp>
```

The test reaches the library through the same public API that another project would use. That keeps the test useful as the library grows.

## Test workflow

A generated library usually exposes a project-specific build option for tests.

```txt id="library-examples-tests-option"
mathkit_BUILD_TESTS
```

For a project named `mathkit`, a normal local test workflow is:

```bash id="library-examples-tests-workflow"
vix build --build-target all
vix build --build-target all -- -Dmathkit_BUILD_TESTS=ON
vix tests
```

The first command builds the project. The second command enables and builds the test targets. The third command runs the tests through Vix.

When the project name changes, the test option changes with it.

```txt id="library-examples-tests-option-rule"
<project>_BUILD_TESTS
```

For a library named `strings`, the option would be:

```bash id="library-examples-tests-other-project"
vix build --build-target all -- -Dstrings_BUILD_TESTS=ON
```

## What tests should cover

Tests should protect the public behavior of the library. They should check functions, types, error handling, edge cases, and small integration paths that matter to the API.

Good library tests usually include the public headers.

```cpp id="library-examples-tests-focused-include"
#include <mathkit/statistics.hpp>
```

Then they assert behavior through the public functions or types.

```cpp id="library-examples-tests-focused-test"
registry.add(TestCase("mean of values", [] {
  std::vector<int> values{2, 4, 6};
  Assert::equal(mathkit::mean(values), 4);
}));
```

A test should not depend on private implementation files unless the project intentionally has internal tests. For most library checks, test the library the way a user would use it.

## Adding more tests

As the library grows, add more test files under `tests/`.

```txt id="library-examples-tests-more-tests"
tests/
  test_basic.cpp
  test_statistics.cpp
  test_geometry.cpp
  test_errors.cpp
```

Each test file should focus on a small area of the public API.

```cpp id="library-examples-tests-statistics"
#include <mathkit/statistics.hpp>

#include <vix/tests/tests.hpp>

int main()
{
  using namespace vix::tests;

  auto &registry = TestRegistry::instance();
  registry.clear();

  registry.add(TestCase("minimum value", [] {
    Assert::equal(mathkit::min({3, 1, 2}), 1);
  }));

  return TestRunner::run_all_and_exit();
}
```

When new test `.cpp` files are added, the build file must know about them. The source file can exist in `tests/`, but it will not become a test target unless the build configuration includes it.

## Generated example files

A generated library project also includes an example directory.

```txt id="library-examples-tests-examples-dir"
examples/
  basic.cpp
  CMakeLists.txt
```

The example is a small consumer program. It should include the public header and use the library directly.

```cpp id="library-examples-tests-basic-example"
#include <mathkit/mathkit.hpp>

#include <iostream>

int main()
{
  std::cout << mathkit::add(2, 3) << "\n";
  return 0;
}
```

This is different from a test. The example is not trying to cover every edge case. It shows the shortest useful way to use the library.

## Example CMake file

The example directory has its own `CMakeLists.txt`.

```txt id="library-examples-tests-example-cmake-file"
examples/
  CMakeLists.txt
```

This lets the example behave like an external consumer of the library target. That is important because a library can appear to work inside its own source tree while still being awkward or broken for real users.

An example CMake file should stay focused: create the example executable, include or link the library target, and avoid depending on private paths.

```cmake id="library-examples-tests-example-cmake"
cmake_minimum_required(VERSION 3.20)

project(mathkit_example LANGUAGES CXX)

add_executable(mathkit_basic basic.cpp)

target_link_libraries(mathkit_basic PRIVATE mathkit)
```

The exact target name depends on the generated library build, but the principle is the same. The example should consume the library through the public target and public headers.

## What examples should show

Examples should teach usage. A good example is small enough to read quickly, but complete enough to compile and run.

Good examples usually show:

```txt id="library-examples-tests-good-examples"
how to include the library
how to create the main type
how to call one or two important functions
how to handle the normal result
```

Avoid turning examples into large applications. A large example is harder to maintain and can hide the actual API behind unrelated setup code.

For a library, one clear example is better than many large examples that nobody can quickly understand.

## Adding more examples

When the library grows, add examples that match real usage patterns.

```txt id="library-examples-tests-more-examples"
examples/
  basic.cpp
  statistics.cpp
  geometry.cpp
  CMakeLists.txt
```

Each example should have one reason to exist.

```cpp id="library-examples-tests-statistics-example"
#include <mathkit/statistics.hpp>

#include <iostream>
#include <vector>

int main()
{
  std::vector<int> values{2, 4, 6};

  std::cout << "mean: " << mathkit::mean(values) << "\n";

  return 0;
}
```

Then update the example build file so the new example is compiled.

```cmake id="library-examples-tests-more-examples-cmake"
add_executable(mathkit_statistics statistics.cpp)
target_link_libraries(mathkit_statistics PRIVATE mathkit)
```

Compiling examples is useful because it checks whether the public API is comfortable to use outside the tests.

## Tests and examples use the public API

Both tests and examples should normally include headers from `include/<library>/`.

```txt id="library-examples-tests-public-api-rule"
include/mathkit/  -> public API
tests/            -> validates public behavior
examples/         -> demonstrates public usage
```

This keeps the project honest. If an example only works by including files from `src/`, the public API is probably not clear enough.

Avoid this style in examples:

```cpp id="library-examples-tests-bad-private-include"
#include "../src/internal/Parser.hpp"
```

Prefer public includes:

```cpp id="library-examples-tests-good-public-include"
#include <mathkit/parser.hpp>
```

A reusable library should make the right include path obvious.

## Header-only libraries

For a header-only library, tests and examples can include the public headers directly. There may be no `src/` directory at all.

```txt id="library-examples-tests-header-only"
include/
  mathkit/
    mathkit.hpp

tests/
  test_basic.cpp

examples/
  basic.cpp
```

This is a good starting shape for small utilities, template-heavy code, and early APIs.

The public header should still be treated seriously. Header-only does not mean informal. The include path, namespace, examples, and tests should already look like a real library.

## Compiled libraries

When the library adds `.cpp` implementation files, the public API still belongs under `include/`.

```txt id="library-examples-tests-compiled-library"
include/
  mathkit/
    statistics.hpp

src/
  statistics.cpp

tests/
  test_statistics.cpp

examples/
  statistics.cpp
```

Tests and examples should continue to include the public header.

```cpp id="library-examples-tests-compiled-include"
#include <mathkit/statistics.hpp>
```

The build target should compile the implementation file and expose the include directory correctly. This lets tests and examples stay close to real consumer usage.

## Running examples

Examples can be built with the normal build workflow when the project includes them in the build.

```bash id="library-examples-tests-build-examples"
vix build --build-target all
```

The exact command to run an example depends on the generated build output and target names. The important point is that examples should compile during local checks, even when they are not part of the test runner.

When an example fails to compile, treat it as a useful signal. It may mean the public header is missing an include, the target does not expose the right include directory, or the example is using an API that is no longer current.

## Local check before commit

For a library, a good local check should build the library, build examples, enable tests, and run tests.

```bash id="library-examples-tests-before-commit"
vix build --build-target all
vix build --build-target all -- -Dmathkit_BUILD_TESTS=ON
vix tests
```

This is stronger than only compiling the library target. A reusable library must be buildable, testable, and usable from a small consumer program.

## Keeping tests readable

A test should explain one behavior clearly. Prefer several focused test cases over one large test that checks many unrelated things.

```cpp id="library-examples-tests-readable"
registry.add(TestCase("add returns the sum", [] {
  Assert::equal(mathkit::add(2, 3), 5);
}));

registry.add(TestCase("add works with zero", [] {
  Assert::equal(mathkit::add(0, 3), 3);
}));
```

This makes failures easier to understand. When a test fails, the name should tell the developer what behavior broke.

## Keeping examples readable

An example should avoid unnecessary abstractions. It is not the place to demonstrate every possible design pattern. It should show the shortest useful path from include to result.

```cpp id="library-examples-tests-readable-example"
#include <mathkit/mathkit.hpp>

#include <iostream>

int main()
{
  std::cout << mathkit::add(2, 3) << "\n";
  return 0;
}
```

A reader should be able to copy the shape into another project without carrying a large amount of unrelated code.

## Common mistakes

The most common mistake is writing examples that depend on private implementation files. Examples should use the public API because they are meant to show how another project consumes the library.

Another mistake is using tests as examples. Tests can be dense because they assert behavior. Examples should be calmer and easier to read.

A third mistake is adding a test file without updating the build configuration. A file under `tests/` is not automatically useful unless the build knows how to compile and run it.

A fourth mistake is changing the library name and forgetting the project-specific test option. If the project is no longer named `mathkit`, the test option should not still be `mathkit_BUILD_TESTS`.

A fifth mistake is only building the library target and never compiling the examples. Examples are one of the best ways to catch problems in the public API.

## Recommended rule

Use tests to protect behavior and examples to teach usage. Keep both of them close to the public API. Add tests when behavior matters, add examples when usage needs to be shown, and make sure the build workflow compiles both before the library is considered healthy.

## Next step

Continue with the CMake integration page to understand why the library template uses root build files and how the library target is exposed to examples, tests, and consumers.

[CMake Integration](/templates/library/cmake-package)
