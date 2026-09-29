# Assertions

Assertions are the point where a test turns an expected behavior into a clear result. In `vix::tests`, an assertion is a normal C++ call. When the condition is correct, the test continues. When the condition is wrong, the assertion throws an `AssertionError`, and the runner records the current test as failed.

The API is intentionally small. It is designed for module tests where the important part is the behavior being checked, not the testing syntax around it.

## Header

Use the module header when writing assertions in test files:

```cpp
#include <vix/tests.hpp>
```

For files that only need assertions, the direct header can also be used:

```cpp
#include <vix/tests/Assert.hpp>
```

## Truth checks

Use `Assert::is_true` when a condition must be true.

```cpp
#include <vix/tests.hpp>

int main()
{
  using namespace vix::tests;

  bool ready = true;

  Assert::is_true(ready, "system should be ready");

  return 0;
}
```

Use `Assert::is_false` when a condition must be false.

```cpp
#include <vix/tests.hpp>

int main()
{
  using namespace vix::tests;

  bool has_error = false;

  Assert::is_false(has_error, "operation should not report an error");

  return 0;
}
```

The optional message is added to the failure output. It should explain the intent of the check, not simply repeat the expression in different words.

## Equality checks

Use `Assert::equal` when two values must compare equal with `operator==`.

```cpp
#include <string>
#include <vix/tests.hpp>

int main()
{
  using namespace vix::tests;

  std::string name = "vix";

  Assert::equal(std::string("vix"), name, "module name should match");

  return 0;
}
```

The first argument is the expected value, and the second argument is the actual value.

```cpp
Assert::equal(expected, actual);
```

When the assertion fails, the error message includes both values. This means the values passed to `Assert::equal` must be printable to an output stream with `operator<<`.

## Inequality checks

Use `Assert::not_equal` when two values must be different.

```cpp
#include <vix/tests.hpp>

int main()
{
  using namespace vix::tests;

  int first_id = 10;
  int second_id = 20;

  Assert::not_equal(first_id, second_id, "ids should be unique");

  return 0;
}
```

This assertion is useful when the exact value is less important than the fact that two results should not collapse into the same value.

## Forced failure

Use `Assert::fail` when a test reaches a path that should not be reached.

```cpp
#include <vix/tests.hpp>

int main()
{
  using namespace vix::tests;

  bool unsupported_path_reached = true;

  if (unsupported_path_reached)
  {
    Assert::fail("unsupported path should not be executed");
  }

  return 0;
}
```

A forced failure is useful for branches where reaching a line already means the test has failed. It can also be used when testing error paths, parser behavior, or unsupported states.

## Failure behavior

A failed assertion throws `AssertionError`.

```cpp
#include <string>
#include <vix/tests.hpp>

int main()
{
  using namespace vix::tests;

  bool caught = false;

  try
  {
    Assert::equal(1, 2);
  }
  catch (const AssertionError &)
  {
    caught = true;
  }

  Assert::is_true(caught, "equal should throw on mismatch");

  return 0;
}
```

Most test files should let `TestRunner` catch assertion failures. Catching `AssertionError` manually is mainly useful when testing the assertion layer itself or when a test needs to verify that a failure is produced intentionally.

## Use inside a test case

In normal usage, assertions live inside a `TestCase`.

```cpp
#include <vix/tests.hpp>

int main()
{
  using namespace vix::tests;

  TestRegistry::instance().add(TestCase("addition returns the expected value", []
  {
    int result = 2 + 2;

    Assert::equal(4, result, "addition result should be correct");
  }));

  return TestRunner::run_all_and_exit();
}
```

If the assertion passes, the test function completes and the runner marks the test as passed. If the assertion fails, the exception is caught by the runner, the test is marked as failed, and the run continues with the next registered test.

## API

```cpp
Assert::is_true(bool condition, const std::string &message = "");
Assert::is_false(bool condition, const std::string &message = "");

template <typename T, typename U>
Assert::equal(const T &expected, const U &actual, const std::string &message = "");

template <typename T, typename U>
Assert::not_equal(const T &lhs, const U &rhs, const std::string &message = "");

Assert::fail(const std::string &message = "Assertion failed");
```

## Next step

Continue with test cases to see how assertions are placed inside executable test units and registered for the runner.
