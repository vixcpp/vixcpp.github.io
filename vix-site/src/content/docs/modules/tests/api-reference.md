# API Reference

This page gives a compact reference for the public API of the `tests` module. For a guided explanation, start with the overview and quick start pages first. This reference is meant for lookup while writing or reviewing test code.

## Header

Use the module aggregator for normal test files:

```cpp id="rs5985"
#include <vix/tests.hpp>
```

The aggregator includes the public test components:

```cpp id="o3urh7"
#include <vix/tests/Assert.hpp>
#include <vix/tests/TestCase.hpp>
#include <vix/tests/TestSuite.hpp>
#include <vix/tests/TestRegistry.hpp>
#include <vix/tests/TestRunner.hpp>
#include <vix/tests/Summary.hpp>
#include <vix/tests/Timer.hpp>
#include <vix/tests/Colors.hpp>
```

## Namespace

All public types are available in the `vix::tests` namespace.

```cpp id="2nk1b8"
using namespace vix::tests;
```

## AssertionError

`AssertionError` is thrown when an assertion fails.

```cpp id="279r07"
class AssertionError : public std::runtime_error
{
public:
  explicit AssertionError(const std::string &message);
};
```

A normal test does not need to catch `AssertionError` directly. The runner catches it and records the current test as failed.

## Assert

`Assert` provides the assertion functions used inside test cases.

```cpp id="1ecf6p"
class Assert
{
public:
  static void is_true(bool condition, const std::string &message = "");
  static void is_false(bool condition, const std::string &message = "");

  template <typename T, typename U>
  static void equal(
    const T &expected,
    const U &actual,
    const std::string &message = ""
  );

  template <typename T, typename U>
  static void not_equal(
    const T &lhs,
    const U &rhs,
    const std::string &message = ""
  );

  static void fail(const std::string &message = "Assertion failed");
};
```

`equal` and `not_equal` require values that can be compared with `operator==`. When an equality assertion fails, the values are written into the failure message, so they also need to be printable with `operator<<`.

## TestCase

`TestCase` represents one executable test.

```cpp id="x6jx4j"
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

A test case succeeds when its function completes normally. It fails when the function throws an `AssertionError` or another exception.

## TestSuite

`TestSuite` groups related test cases under one suite name.

```cpp id="3954bn"
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

A suite does not change the assertion model. It only organizes test cases and gives the runner output a clearer structure.

## TestRegistry

`TestRegistry` stores standalone test cases and suites before execution.

```cpp id="pkv8k4"
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

The registry is accessed through `TestRegistry::instance()`. A test executable usually registers its tests, then calls `TestRunner`.

## RunResult

`RunResult` is the compact result returned by `TestRunner::run_all()`.

```cpp id="ufq93g"
struct RunResult
{
  std::size_t total;
  std::size_t passed;
  std::size_t failed;
};
```

Use it when the program needs to inspect the final counters after the runner has executed the registry.

## TestRunner

`TestRunner` executes all tests registered in `TestRegistry`.

```cpp id="ij6nwk"
class TestRunner
{
public:
  static RunResult run_all();
  static int run_all_and_exit();
};
```

`run_all()` returns a `RunResult`. `run_all_and_exit()` returns `0` when all tests pass and a non-zero value when at least one test fails.

## Summary

`Summary` stores the richer summary used for reporting a test run.

```cpp id="isw90u"
struct Summary
{
  std::size_t total;
  std::size_t passed;
  std::size_t failed;
  double duration_ms;

  bool success() const noexcept;
  double success_ratio() const noexcept;
  std::string to_string() const;
};
```

`success()` returns `true` when `failed` is `0`. `success_ratio()` returns the ratio of passed tests to total tests. When no tests were executed, the ratio is `1.0`.

`Summary` can also be written to an output stream:

```cpp id="hv14ms"
std::ostream &operator<<(std::ostream &os, const Summary &summary);
```

## Timer

`Timer` measures elapsed time in milliseconds.

```cpp id="q4ggo2"
class Timer
{
public:
  Timer();

  void reset();

  double elapsed_ms() const;
};
```

The timer starts when it is constructed. Calling `reset()` updates the start point to the current time.

## Colors

`Colors` provides small ANSI formatting helpers for terminal output.

```cpp id="2m3hxw"
class Colors
{
public:
  static void set_enabled(bool enabled) noexcept;
  static bool enabled() noexcept;

  static std::string green(const std::string &text);
  static std::string red(const std::string &text);
  static std::string yellow(const std::string &text);
  static std::string cyan(const std::string &text);
  static std::string bold(const std::string &text);
};
```

Colors are enabled by default. When colors are disabled, the formatting helpers return the original text without ANSI escape codes.

## Minimal executable

A minimal test executable usually combines `TestRegistry`, `TestCase`, `Assert`, and `TestRunner`.

```cpp id="kb62yh"
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

This is the core workflow of the module: register tests, run the registry, and return a process status that can be used by the terminal, CTest, or CI.
