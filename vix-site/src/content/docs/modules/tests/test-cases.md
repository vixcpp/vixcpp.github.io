# Test Cases

A `TestCase` represents one executable unit of verification in `vix::tests`. It stores a name and a function. The name identifies the test in the runner output, and the function contains the code that should be checked.

The model is simple: a test passes when its function completes normally, and it fails when the function throws. In most cases, failures come from `Assert`, but any exception thrown by the test function is caught by the runner and reported as an error. This keeps test code close to normal C++ while still giving the runner enough structure to produce readable results.

## Header

Use the module header when defining test cases:

```cpp id="33km1d"
#include <vix/tests.hpp>
```

For files that only need the test case type, the direct header can also be used:

```cpp id="kx63dl"
#include <vix/tests/TestCase.hpp>
```

## Define a test case

A test case is created with a name and a callable object.

```cpp id="cuob0b"
#include <vix/tests.hpp>

int main()
{
  using namespace vix::tests;

  TestCase test("basic arithmetic", []
  {
    Assert::equal(2 + 2, 4);
  });

  test.run();

  return 0;
}
```

Calling `run()` executes the function stored in the test case. In real test executables, test cases are usually registered in `TestRegistry` and executed by `TestRunner` instead of being run manually.

## Register a test case

The usual workflow is to add the test case to the global registry and let the runner execute it.

```cpp id="ljke21"
#include <vix/tests.hpp>

int main()
{
  using namespace vix::tests;

  auto &registry = TestRegistry::instance();

  registry.add(TestCase("basic arithmetic", []
  {
    Assert::equal(2 + 2, 4);
  }));

  return TestRunner::run_all_and_exit();
}
```

This keeps the test executable small. The test file describes what should be checked, the registry collects the tests, and the runner handles execution, reporting, and the final exit code.

## Naming test cases

A test name should describe the behavior being verified. It should be specific enough to understand the failure from the terminal output without opening the test file immediately.

```cpp id="h70sfw"
TestCase("parser accepts an empty object", []
{
  Assert::is_true(true);
});
```

A good name is usually written around the expected behavior, not around the implementation detail. For example, `parser accepts an empty object` is more useful than `parser test 1`, because it tells the reader what broke when the test fails.

## Test functions

The function stored in a `TestCase` has the type `std::function<void()>`. It does not return a value. The success or failure of the test is decided by whether the function throws.

```cpp id="97879e"
TestCase("value is positive", []
{
  int value = 10;

  Assert::is_true(value > 0, "value should be positive");
});
```

This style works well for small module tests because setup, execution, and assertion can stay in the same local scope. When a test needs more setup, the setup can still be written as normal C++ before the assertions.

## Valid test cases

A default-constructed `TestCase` is empty. The `valid()` function returns whether the test has an executable function.

```cpp id="vywspv"
#include <vix/tests.hpp>

int main()
{
  using namespace vix::tests;

  TestCase empty;
  Assert::is_false(empty.valid(), "empty test case should not be valid");

  TestCase test("valid test", []
  {
    Assert::is_true(true);
  });

  Assert::is_true(test.valid(), "test case should contain a function");

  return 0;
}
```

The runner only gets useful work from test cases that contain a function. Empty test cases are mainly useful when code needs a default value before assigning a real test later.

## Failure behavior

A test case does not decide whether a run succeeds or fails. It only executes its function. The runner is responsible for catching failures and updating the final result.

```cpp id="f54gca"
TestCase("intentional failure", []
{
  Assert::is_true(false, "this test is expected to fail");
});
```

When this test is executed by `TestRunner`, the runner catches the `AssertionError`, prints the failure, increments the failed count, and continues with the remaining tests.

## API

```cpp id="pz8hdd"
class TestCase
{
public:
  using Function = std::function<void()>;

  TestCase();
  TestCase(std::string name, Function function);

  const std::string &name() const noexcept;
  bool valid() const noexcept;
  void run() const;
};
```

## Next step

Continue with test suites to group related test cases under one name and make larger test runs easier to read.
