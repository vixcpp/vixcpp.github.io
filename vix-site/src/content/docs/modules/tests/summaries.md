# Summaries

A test run needs a clear final result. In `vix::tests`, that result is represented by small summary types that count how many tests were executed, how many passed, how many failed, and how long the run took.

The module uses two closely related result shapes. `Summary` is the richer structure used while building the final report, with duration and helper functions. `RunResult` is the compact result returned by `TestRunner::run_all()`, which is usually enough when the caller only needs to decide whether the process should succeed or fail.

## Header

Use the module header when working with summaries:

```cpp
#include <vix/tests.hpp>
```

For files that only need the summary type, the direct header can also be used:

```cpp
#include <vix/tests/Summary.hpp>
```

## Summary values

A `Summary` stores the main counters for a test run.

```cpp
#include <vix/tests.hpp>

int main()
{
  using namespace vix::tests;

  Summary summary;

  summary.total = 3;
  summary.passed = 2;
  summary.failed = 1;
  summary.duration_ms = 12.5;

  Assert::equal(summary.total, static_cast<std::size_t>(3));
  Assert::equal(summary.passed, static_cast<std::size_t>(2));
  Assert::equal(summary.failed, static_cast<std::size_t>(1));

  return 0;
}
```

The fields are intentionally direct. A summary is a value object, not a service. It exists to carry the final numbers of a run in a form that can be inspected, printed, or converted into a string.

## Success state

Use `success()` when the only question is whether the test run passed.

```cpp
#include <vix/tests.hpp>

int main()
{
  using namespace vix::tests;

  Summary summary;

  summary.total = 2;
  summary.passed = 2;
  summary.failed = 0;

  Assert::is_true(summary.success(), "summary should be successful");

  return 0;
}
```

A summary is successful when `failed` is `0`. This keeps the rule simple and matches the behavior of `TestRunner::run_all_and_exit()`, which returns `0` only when no test failed.

## Success ratio

`success_ratio()` returns the proportion of passed tests as a value between `0.0` and `1.0`.

```cpp
#include <vix/tests.hpp>

int main()
{
  using namespace vix::tests;

  Summary summary;

  summary.total = 4;
  summary.passed = 3;
  summary.failed = 1;

  Assert::equal(summary.success_ratio(), 0.75);

  return 0;
}
```

When no tests were executed, the ratio is `1.0`. An empty run has no failed tests, so the summary treats it as successful from the point of view of the ratio.

## String output

A summary can be converted into a readable string with `to_string()`.

```cpp
#include <string>
#include <vix/tests.hpp>

int main()
{
  using namespace vix::tests;

  Summary summary;

  summary.total = 2;
  summary.passed = 2;
  summary.failed = 0;
  summary.duration_ms = 1.5;

  std::string text = summary.to_string();

  Assert::is_true(text.find("total=2") != std::string::npos);
  Assert::is_true(text.find("passed=2") != std::string::npos);
  Assert::is_true(text.find("failed=0") != std::string::npos);

  return 0;
}
```

The string format is meant for terminal output and diagnostics. It is compact enough for a final line in the runner output while still showing the important values of the run.

## Stream support

`Summary` also supports streaming to an output stream. This is useful inside code that already writes to streams or builds diagnostic text with `std::ostringstream`.

```cpp
#include <sstream>
#include <string>
#include <vix/tests.hpp>

int main()
{
  using namespace vix::tests;

  Summary summary;

  summary.total = 1;
  summary.passed = 1;
  summary.failed = 0;
  summary.duration_ms = 0.3;

  std::ostringstream out;
  out << summary;

  Assert::is_true(out.str().find("total=1") != std::string::npos);

  return 0;
}
```

The stream output uses the same representation as `to_string()`, so both forms remain consistent.

## RunResult

`RunResult` is returned by `TestRunner::run_all()`. It contains the counters that most callers need after a run.

```cpp
#include <vix/tests.hpp>

int main()
{
  using namespace vix::tests;

  TestRegistry::instance().clear();

  TestRegistry::instance().add(TestCase("passing test", []
  {
    Assert::is_true(true);
  }));

  RunResult result = TestRunner::run_all();

  Assert::equal(result.total, static_cast<std::size_t>(1));
  Assert::equal(result.passed, static_cast<std::size_t>(1));
  Assert::equal(result.failed, static_cast<std::size_t>(0));

  return result.failed == 0 ? 0 : 1;
}
```

Use `RunResult` when the program needs to inspect the result of the runner. Use `run_all_and_exit()` when the test executable only needs to return the correct process exit code.

## API

```cpp
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

std::ostream &operator<<(std::ostream &os, const Summary &summary);
```

```cpp
struct RunResult
{
  std::size_t total;
  std::size_t passed;
  std::size_t failed;
};
```

## Next step

Continue with colors and output to see how the runner formats test results in the terminal.
