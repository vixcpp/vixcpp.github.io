# Runner

`TestRunner` executes the tests collected in `TestRegistry`. It is the part of `vix::tests` that turns registered test cases and suites into a real test run, prints the result of each test, and returns a final status that can be used by the operating system, CTest, or a CI pipeline.

The runner keeps the execution model simple. A test passes when its function completes normally. A test fails when an assertion throws `AssertionError`. If another standard exception is thrown, the runner reports it as an error and continues with the rest of the test run.

## Header

Use the module header when running tests:

```cpp id="ksu9fv"
#include <vix/tests.hpp>
```

For files that only need the runner type, the direct header can also be used:

```cpp id="dj36xd"
#include <vix/tests/TestRunner.hpp>
```

## Run all registered tests

The most common use of the runner is from the `main()` function of a test executable.

```cpp id="p1ysso"
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

`run_all_and_exit()` executes all registered standalone tests and all tests stored inside registered suites. It returns `0` when every test passes, and it returns a non-zero value when at least one test fails.

## Run and inspect the result

Use `run_all()` when the program needs to inspect the result instead of returning immediately.

```cpp id="9hza3a"
#include <vix/tests.hpp>

int main()
{
  using namespace vix::tests;

  auto &registry = TestRegistry::instance();

  registry.add(TestCase("passing test", []
  {
    Assert::is_true(true);
  }));

  registry.add(TestCase("failing test", []
  {
    Assert::is_true(false, "intentional failure");
  }));

  RunResult result = TestRunner::run_all();

  Assert::equal(result.total, static_cast<std::size_t>(2));
  Assert::equal(result.passed, static_cast<std::size_t>(1));
  Assert::equal(result.failed, static_cast<std::size_t>(1));

  return result.failed == 0 ? 0 : 1;
}
```

This form is useful when testing the runner itself or when a custom program wants to decide how to handle the final result.

## Suites and standalone tests

The runner executes standalone test cases first, then registered suites. Each suite is printed with its name before the tests inside it are executed.

```cpp id="lm1jfd"
#include <string>
#include <vix/tests.hpp>

int main()
{
  using namespace vix::tests;

  auto &registry = TestRegistry::instance();

  registry.add(TestCase("standalone test", []
  {
    Assert::is_true(true);
  }));

  TestSuite suite("strings");

  suite.add(TestCase("same value", []
  {
    Assert::equal(std::string("vix"), std::string("vix"));
  }));

  suite.add(TestCase("different values", []
  {
    Assert::not_equal(std::string("vix"), std::string("cpp"));
  }));

  registry.add(std::move(suite));

  return TestRunner::run_all_and_exit();
}
```

This order keeps simple tests visible while still allowing larger groups to appear under a suite name. The final result includes both standalone tests and suite tests.

## Failure handling

The runner catches assertion failures, standard exceptions, and unknown exceptions. This is important because one failing test should not stop the rest of the run.

```cpp id="q7o9cs"
#include <stdexcept>
#include <vix/tests.hpp>

int main()
{
  using namespace vix::tests;

  auto &registry = TestRegistry::instance();

  registry.add(TestCase("assertion failure", []
  {
    Assert::is_true(false, "expected failure");
  }));

  registry.add(TestCase("standard exception", []
  {
    throw std::runtime_error("unexpected runtime error");
  }));

  registry.add(TestCase("still runs after failures", []
  {
    Assert::equal(1 + 1, 2);
  }));

  return TestRunner::run_all_and_exit();
}
```

The first test is reported as a failed assertion. The second test is reported as an error. The third test still runs, which keeps the output useful when several failures are present in the same test executable.

## Output

The runner prints one line per test, followed by a final summary.

```txt id="f7es6u"
[PASS] basic arithmetic
[FAIL] invalid value -> Expected condition to be true | value should be valid

Summary: total=2 passed=1 failed=1 duration_ms=0.102300
```

Colors are enabled by default through `Colors`. They can be disabled when plain output is needed, for example in a terminal that does not support ANSI escape codes.

```cpp id="h4b0uo"
vix::tests::Colors::set_enabled(false);
```

## API

```cpp id="gr1w95"
struct RunResult
{
  std::size_t total;
  std::size_t passed;
  std::size_t failed;
};

class TestRunner
{
public:
  static RunResult run_all();
  static int run_all_and_exit();
};
```

## Next step

Continue with summaries to see how test run statistics are represented and converted into readable output.
