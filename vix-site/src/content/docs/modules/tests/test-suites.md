# Test Suites

A `TestSuite` groups related `TestCase` objects under one name. It is used when a module has several tests that belong to the same area of behavior, such as parsing, validation, routing, storage, or error handling.

A suite does not introduce a different execution model. Each test inside the suite is still a normal `TestCase`, and each test still passes by completing normally or fails by throwing an exception. The suite only gives structure to the registry and makes the runner output easier to read when a project contains more than a few tests.

## Header

Use the module header when working with suites:

```cpp
#include <vix/tests.hpp>
```

For files that only need the suite type, the direct header can also be used:

```cpp
#include <vix/tests/TestSuite.hpp>
```

## Create a suite

A suite is created with a name, then populated with test cases.

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

  return 0;
}
```

The suite name should describe the group of behavior being tested. The test names should describe the individual expectations inside that group.

## Register a suite

A suite becomes part of a test run when it is added to `TestRegistry`.

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

When the runner reaches a suite, it prints the suite name, then executes the test cases stored inside it. This makes the output easier to follow because related failures appear under the same section.

## Use suites to organize behavior

Suites are useful when a file tests more than one behavior. Instead of registering many standalone tests with unrelated names, a suite gives the tests a local context.

```cpp
#include <vix/tests.hpp>

int main()
{
  using namespace vix::tests;

  TestSuite suite("numbers");

  suite.add(TestCase("positive value", []
  {
    int value = 10;
    Assert::is_true(value > 0);
  }));

  suite.add(TestCase("different ids", []
  {
    int first_id = 1;
    int second_id = 2;

    Assert::not_equal(first_id, second_id);
  }));

  TestRegistry::instance().add(std::move(suite));

  return TestRunner::run_all_and_exit();
}
```

This style keeps the test run readable without adding a heavy structure around the code. The suite gives enough organization for the terminal output, while each test remains a small C++ function.

## Inspect a suite

A suite stores its name and the list of tests it contains. It can also report whether it is empty and how many tests it contains.

```cpp
#include <vix/tests.hpp>

int main()
{
  using namespace vix::tests;

  TestSuite suite("registry");

  Assert::is_true(suite.empty(), "new suite should be empty");

  suite.add(TestCase("first test", []
  {
    Assert::is_true(true);
  }));

  Assert::is_false(suite.empty(), "suite should contain a test");
  Assert::equal(suite.size(), static_cast<std::size_t>(1));

  return 0;
}
```

These functions are mostly useful when testing the testing module itself or when building helpers that assemble suites before registration.

## API

```cpp
class TestSuite
{
public:
  TestSuite();
  explicit TestSuite(std::string name);

  const std::string &name() const noexcept;

  void add(TestCase testCase);

  const std::vector<TestCase> &tests() const noexcept;

  bool empty() const noexcept;
  std::size_t size() const noexcept;
};
```

## Next step

Continue with the registry to see how standalone test cases and suites are collected before the runner executes them.
