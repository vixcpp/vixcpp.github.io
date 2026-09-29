# Registry

`TestRegistry` is the central place where `vix::tests` collects test cases and suites before they are executed. A test executable registers its tests in the registry, then asks `TestRunner` to run everything that has been collected.

The registry gives the module a simple execution model. Test files can describe the behavior they want to verify, while the runner can read from one shared source of truth. This avoids passing lists of tests around manually and keeps the `main()` of a test executable small.

## Header

Use the module header when working with the registry:

```cpp
#include <vix/tests.hpp>
```

For files that only need the registry type, the direct header can also be used:

```cpp
#include <vix/tests/TestRegistry.hpp>
```

## Access the registry

The registry is accessed through `TestRegistry::instance()`.

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

  return TestRunner::run_all_and_exit();
}
```

The registry is a singleton because a test executable usually needs one shared collection of tests. This keeps registration straightforward and allows the runner to find the tests without extra wiring.

## Register standalone tests

A standalone `TestCase` can be added directly to the registry.

```cpp
#include <vix/tests.hpp>

int main()
{
  using namespace vix::tests;

  auto &registry = TestRegistry::instance();

  registry.add(TestCase("value is positive", []
  {
    int value = 10;

    Assert::is_true(value > 0, "value should be positive");
  }));

  registry.add(TestCase("values are different", []
  {
    Assert::not_equal(10, 20);
  }));

  return TestRunner::run_all_and_exit();
}
```

Standalone tests are useful for small files or simple modules. When a group of tests starts to describe the same area of behavior, a suite usually gives the output a clearer structure.

## Register suites

A `TestSuite` can also be added to the registry. The runner will execute every test case stored in the suite.

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

The registry stores standalone tests and suites separately, but the runner treats both as part of the same run. The final result includes all registered test cases.

## Count registered tests

`total_tests()` returns the number of standalone tests plus the number of tests stored inside suites.

```cpp
#include <vix/tests.hpp>

int main()
{
  using namespace vix::tests;

  auto &registry = TestRegistry::instance();

  registry.clear();

  registry.add(TestCase("single test", []
  {
    Assert::is_true(true);
  }));

  TestSuite suite("group");

  suite.add(TestCase("first suite test", []
  {
    Assert::is_true(true);
  }));

  suite.add(TestCase("second suite test", []
  {
    Assert::is_true(true);
  }));

  registry.add(std::move(suite));

  Assert::equal(registry.total_tests(), static_cast<std::size_t>(3));

  return 0;
}
```

This is useful when testing the registry itself or when a test helper needs to check that the expected number of tests has been registered.

## Clear the registry

`clear()` removes all registered standalone tests and suites.

```cpp
#include <vix/tests.hpp>

int main()
{
  using namespace vix::tests;

  auto &registry = TestRegistry::instance();

  registry.clear();

  Assert::equal(registry.total_tests(), static_cast<std::size_t>(0));

  return 0;
}
```

Clearing the registry is mainly useful in tests that exercise the testing module itself, or in small programs that run multiple isolated registration scenarios in the same process. A normal test executable usually registers its tests once and then exits after the runner finishes.

## API

```cpp
class TestRegistry
{
public:
  static TestRegistry &instance();

  void add(TestCase testCase);
  void add(TestSuite suite);

  const std::vector<TestCase> &tests() const noexcept;
  const std::vector<TestSuite> &suites() const noexcept;

  void clear();

  std::size_t total_tests() const noexcept;
};
```

## Next step

Continue with the runner to see how registered tests are executed and how the final result is returned to the process.
