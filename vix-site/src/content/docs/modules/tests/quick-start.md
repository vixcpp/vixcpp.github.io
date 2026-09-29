# Quick Start

The `tests` module is easiest to understand from a small executable. A test program registers one or more `TestCase` objects in the global registry, then calls the runner from `main()`. Each test is ordinary C++ code, and the test fails when an assertion throws.

Create a test file:

```txt
tests/basic_tests.cpp
```

Add a few test cases:

```cpp
#include <string>
#include <vix/tests.hpp>

int main()
{
  using namespace vix::tests;

  auto &registry = TestRegistry::instance();

  registry.add(TestCase("integer equality", []
  {
    Assert::equal(2 + 2, 4);
  }));

  registry.add(TestCase("string comparison", []
  {
    std::string name = "vix";
    Assert::equal(std::string("vix"), name);
  }));

  registry.add(TestCase("boolean condition", []
  {
    int value = 42;
    Assert::is_true(value > 0, "value should be positive");
  }));

  return TestRunner::run_all_and_exit();
}
```

The important part is the last line. `TestRunner::run_all_and_exit()` executes everything registered in `TestRegistry` and returns a process exit code. A successful run returns `0`; a failed run returns a non-zero value, which makes the test executable usable from the terminal, from CTest, and from CI.

## Run the tests

From a Vix project, run:

```bash
vix tests
```

The command looks for project tests and runs the available test target. When a native test runner is available, Vix uses it. When the project is configured through CTest, Vix can run the CTest suite instead.

To list discovered tests without executing them, run:

```bash
vix tests --list
```

To see the raw output from the underlying runner or CTest process, run:

```bash
vix tests --raw
```

## Use suites when tests grow

A few standalone test cases are enough for a small module. When several tests belong to the same area, group them with `TestSuite`.

```cpp
#include <string>
#include <vix/tests.hpp>

int main()
{
  using namespace vix::tests;

  TestSuite suite("strings");

  suite.add(TestCase("same value", []
  {
    Assert::equal(std::string("vix"), std::string("vix"));
  }));

  suite.add(TestCase("different values", []
  {
    Assert::not_equal(std::string("vix"), std::string("cpp"));
  }));

  TestRegistry::instance().add(std::move(suite));

  return TestRunner::run_all_and_exit();
}
```

A suite gives the output a clearer structure, but it does not change the assertion model. Each test still succeeds by returning normally and fails by throwing an exception.

## Watch mode

During development, the test command can watch project files and re-run tests after changes:

```bash
vix tests --watch
```

Watch mode is useful when working on a module because it keeps the feedback loop close to the code. The command watches C++ source files, headers, CMake files, and common project build files, then re-runs the tests after the changes settle.

## Run checks after tests

When tests are part of a broader verification workflow, use `--run` to execute runtime checks after the tests pass:

```bash
vix tests --run
```

The checks are only run when the test step succeeds. This keeps the workflow ordered: first verify the test suite, then continue with the runtime checks.

## Next step

Continue with assertions to understand how `Assert` reports failures and how to add useful messages to test output.
