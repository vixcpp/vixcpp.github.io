# CMake

A Vix test executable is still a normal CMake target. The `tests` module gives the C++ API used inside the test code, while CMake is responsible for building the executable and exposing it to the project test workflow.

This matters because `vix tests` needs something concrete to run. In a small project, that can be a native test executable. In a CMake-based project, it can also be a CTest entry created with `add_test()`. The important part is that the project builds a test target and makes it discoverable from the build directory.

## Basic test target

A minimal test target can be written like this:

```cmake
add_executable(my_project_tests
  tests/basic_tests.cpp
)

target_link_libraries(my_project_tests
  PRIVATE
    vix::tests
)

add_test(NAME my_project_tests COMMAND my_project_tests)
```

The executable contains the `main()` function that registers tests and calls the runner.

```cpp
#include <vix/tests.hpp>

int main()
{
  using namespace vix::tests;

  TestRegistry::instance().add(TestCase("basic arithmetic", []
  {
    Assert::equal(2 + 2, 4);
  }));

  return TestRunner::run_all_and_exit();
}
```

When the target is built, the executable can be run directly, by CTest, or through the Vix test command.

## Enable CTest

CTest entries are available only when testing is enabled in the CMake project.

```cmake
include(CTest)
```

or:

```cmake
enable_testing()
```

For most projects, `include(CTest)` is preferred because it follows the standard CMake testing workflow and respects `BUILD_TESTING`.

```cmake
include(CTest)

if(BUILD_TESTING)
  add_executable(my_project_tests
    tests/basic_tests.cpp
  )

  target_link_libraries(my_project_tests
    PRIVATE
      vix::tests
  )

  add_test(NAME my_project_tests COMMAND my_project_tests)
endif()
```

This keeps tests optional. A normal build can skip test targets, while a test build can enable them explicitly.

## Project test option

Vix can prepare tests by enabling CMake testing and a project-specific test option. The option name is based on the project directory name and follows this shape:

```txt
<PROJECT>_BUILD_TESTS
```

For a project directory named `my_project`, the option becomes:

```cmake
MY_PROJECT_BUILD_TESTS
```

A project can use that option to decide when its own test targets should be created.

```cmake
option(MY_PROJECT_BUILD_TESTS "Build my_project tests" OFF)

include(CTest)

if(BUILD_TESTING AND MY_PROJECT_BUILD_TESTS)
  add_executable(my_project_tests
    tests/basic_tests.cpp
  )

  target_link_libraries(my_project_tests
    PRIVATE
      vix::tests
  )

  add_test(NAME my_project_tests COMMAND my_project_tests)
endif()
```

This pattern is useful for projects that do not want test targets to appear in every build, but still want `vix tests` to be able to prepare and run them when needed.

## Test source layout

A simple project can keep test sources under `tests/`.

```txt
my_project/
├── CMakeLists.txt
├── src/
├── include/
└── tests/
    └── basic_tests.cpp
```

The `vix tests` command checks the `tests/` directory when it needs to know whether a project has test sources that can be prepared. Keeping test files in that directory makes the project easier to discover and keeps the build layout predictable.

## Native runner discovery

When CTest metadata is not available, Vix can look for a native test runner in common build locations. Names such as `tests`, `test`, `vix_tests`, `vix_tests_runner`, or targets ending with `_test` or `_tests` are treated as test-like executables.

A clear target name helps the command find the runner without extra configuration.

```cmake
add_executable(my_project_tests
  tests/basic_tests.cpp
)
```

The target name `my_project_tests` is easy to recognize, and the executable name makes its purpose clear in the build output.

## CTest discovery

When a build directory contains CTest metadata, `vix tests` can run CTest instead of a native runner.

```cmake
add_test(NAME parser.empty_object COMMAND my_project_tests)
```

CTest names are useful when filtering tests from the command line.

```bash
vix tests --test parser.empty_object
```

or:

```bash
vix tests -R parser.empty_object
```

A good CTest name should describe the behavior being checked. It should be stable enough to use in local workflows and CI filters.

## Complete example

```cmake
cmake_minimum_required(VERSION 3.20)

project(my_project LANGUAGES CXX)

option(MY_PROJECT_BUILD_TESTS "Build my_project tests" OFF)

add_library(my_project
  src/library.cpp
)

target_include_directories(my_project
  PUBLIC
    include
)

target_link_libraries(my_project
  PUBLIC
    vix::tests
)

include(CTest)

if(BUILD_TESTING AND MY_PROJECT_BUILD_TESTS)
  add_executable(my_project_tests
    tests/basic_tests.cpp
  )

  target_link_libraries(my_project_tests
    PRIVATE
      my_project
      vix::tests
  )

  add_test(NAME my_project_tests COMMAND my_project_tests)
endif()
```

This layout keeps the library target separate from the test executable. The test target links the code under test and the `tests` module, then exposes the executable through CTest.

## Run from Vix

After the project has a test target, run:

```bash
vix tests
```

To force a preset:

```bash
vix tests --preset release
```

To pass raw CTest arguments:

```bash
vix tests -- --output-on-failure
```

Arguments after `--` are passed to CTest, so this form is useful when the project needs behavior provided directly by CTest.

## Next step

Continue with the API reference for a compact overview of the public types and functions provided by the `tests` module.
