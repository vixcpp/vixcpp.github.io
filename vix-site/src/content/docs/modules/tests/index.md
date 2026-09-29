# Tests

The `tests` module provides a small testing layer for Vix applications and libraries. It gives C++ code a direct way to define test cases, group related checks into suites, register them in one place, and run them through a simple runner that reports passed and failed tests.

The module is built around ordinary C++ objects instead of a separate macro language. A test is represented by `TestCase`, a group of tests is represented by `TestSuite`, and `TestRegistry` is the shared place where tests are collected before execution. Assertions are regular calls through `Assert`, and a failed assertion throws `AssertionError`. This keeps the testing workflow readable from normal C++ code and makes the execution model easy to understand.

## Basic model

A minimal test program includes the module header, registers one or more test cases, and lets the runner execute everything that has been added to the registry.

```cpp
#include <vix/tests.hpp>

int main()
{
  using namespace vix::tests;

  auto &registry = TestRegistry::instance();

  registry.add(TestCase("basic arithmetic", []
  {
    Assert::equal(2 + 2, 4);
  }));

  registry.add(TestCase("boolean check", []
  {
    Assert::is_true(true);
  }));

  return TestRunner::run_all_and_exit();
}
```

When the runner executes the registry, each test passes if its function returns normally. If an assertion fails, the runner catches the `AssertionError`, marks the test as failed, and continues with the next test. Other exceptions are also caught and reported as errors, which keeps the test run stable even when a test fails unexpectedly.

## Test cases

A `TestCase` stores a name and a function. The name is used in the output, while the function contains the code that should be verified. The function does not need to return a value. It succeeds by completing normally and fails by throwing an exception.

```cpp
TestCase test("value is positive", []
{
  int value = 10;
  Assert::is_true(value > 0, "value should be positive");
});
```

This model keeps test definitions close to normal C++ code. It is useful for module-level tests where the goal is to verify small pieces of behavior without introducing a large testing framework.

## Test suites

A `TestSuite` groups related test cases under one name. Suites are useful when a module has several behaviors that belong together, such as parsing, validation, error handling, or runtime behavior.

```cpp
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

A suite does not change how tests are executed. It only gives structure to the registry and makes the output easier to read when a project contains several groups of tests.

## Assertions

The assertion API is intentionally short. It provides truth checks, equality checks, inequality checks, and an explicit failure function.

```cpp
Assert::is_true(condition);
Assert::is_false(condition);
Assert::equal(expected, actual);
Assert::not_equal(left, right);
Assert::fail("message");
```

Each assertion accepts an optional message. The message is added to the failure output, which helps explain the intent of the check when the condition itself is not enough.

```cpp
Assert::equal(result.status, 200, "HTTP response should be successful");
```

## Running tests

The runner executes all standalone tests and suites registered in `TestRegistry`. The most common entry point for a test executable is `run_all_and_exit()`.

```cpp
return vix::tests::TestRunner::run_all_and_exit();
```

This function returns `0` when all tests pass and a non-zero exit code when at least one test fails. That makes the executable suitable for local development, CTest integration, and CI pipelines.

From a Vix project, tests can also be launched with the CLI:

```bash
vix tests
```

The C++ module is the API used inside the test code. The `vix tests` command is the project-level workflow used to discover, prepare, and execute tests from the terminal.

## Header

Use the root module header when writing tests:

```cpp
#include <vix/tests.hpp>
```

This header gives access to the main testing components:

```cpp
#include <vix/tests/Assert.hpp>
#include <vix/tests/TestCase.hpp>
#include <vix/tests/TestSuite.hpp>
#include <vix/tests/TestRegistry.hpp>
#include <vix/tests/TestRunner.hpp>
#include <vix/tests/Summary.hpp>
#include <vix/tests/Timer.hpp>
#include <vix/tests/Colors.hpp>
```

For most test files, including `<vix/tests.hpp>` is enough.

## Next step

Continue with the quick start page to create a small test executable, register a few test cases, and run them from the terminal.
