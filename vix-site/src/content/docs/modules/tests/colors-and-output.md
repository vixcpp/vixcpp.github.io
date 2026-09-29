# Colors and Output

The `tests` module prints a small amount of terminal output while a test run is executing. Each test is reported with a status, the test name, and, when a failure happens, the message produced by the assertion or exception. This output is intentionally direct: it should make a local run easy to read without hiding the actual failure behind too much formatting.

Color support is handled by `Colors`. The runner uses it to mark successful tests, failed assertions, errors, suite names, and the final summary. Colors are enabled by default, but they can be disabled when plain text output is better, such as in terminals without ANSI support or in CI logs that should not contain escape codes.

## Header

Use the module header when working with colors:

```cpp
#include <vix/tests.hpp>
```

For files that only need color helpers, the direct header can also be used:

```cpp
#include <vix/tests/Colors.hpp>
```

## Runner output

A normal run prints one line for each test and a final summary.

```txt
[PASS] basic arithmetic
[FAIL] invalid value -> Expected condition to be true | value should be valid

Summary: total=2 passed=1 failed=1 duration_ms=0.102300
```

Passing tests are printed as `[PASS]`. Failed assertions are printed as `[FAIL]`, followed by the assertion message. Exceptions that are not `AssertionError` are printed as `[ERROR]`, so the runner can distinguish between an expected assertion failure and an unexpected runtime error.

## Suites in the output

When tests are grouped in a `TestSuite`, the runner prints the suite name before running the tests inside it.

```txt
[SUITE] strings
[PASS] same value
[PASS] different values

Summary: total=2 passed=2 failed=0 duration_ms=0.084200
```

The suite label gives structure to larger test runs. It does not change how the tests are executed; it only makes the output easier to follow when several groups of tests are registered in the same executable.

## Disable colors

Colors are enabled globally by default. Use `Colors::set_enabled(false)` when plain output is needed.

```cpp
#include <vix/tests.hpp>

int main()
{
  using namespace vix::tests;

  Colors::set_enabled(false);

  TestRegistry::instance().add(TestCase("plain output test", []
  {
    Assert::is_true(true);
  }));

  return TestRunner::run_all_and_exit();
}
```

Disabling colors does not change the text that is printed. It only removes the ANSI escape sequences around the text. This is useful when output is redirected to a file or consumed by another tool.

## Check whether colors are enabled

Use `Colors::enabled()` when a helper needs to adapt its own output to the current color setting.

```cpp
#include <vix/tests.hpp>

int main()
{
  using namespace vix::tests;

  Colors::set_enabled(false);

  Assert::is_false(Colors::enabled(), "colors should be disabled");

  return 0;
}
```

The setting is global inside the process. Once disabled, all later calls to the color helpers return plain text until colors are enabled again.

## Color helpers

`Colors` provides a small set of helpers used by the runner and available to test utilities.

```cpp
#include <string>
#include <vix/tests.hpp>

int main()
{
  using namespace vix::tests;

  std::string success = Colors::green("passed");
  std::string failure = Colors::red("failed");
  std::string warning = Colors::yellow("warning");
  std::string label = Colors::cyan("suite");
  std::string title = Colors::bold("Summary");

  Assert::is_true(!success.empty());
  Assert::is_true(!failure.empty());
  Assert::is_true(!warning.empty());
  Assert::is_true(!label.empty());
  Assert::is_true(!title.empty());

  return 0;
}
```

These helpers wrap text in ANSI escape codes when colors are enabled. When colors are disabled, they return the original text unchanged.

## API

```cpp
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

## Next step

Continue with timers to see how the module measures the duration of a test run.
