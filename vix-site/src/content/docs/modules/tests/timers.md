# Timers

`Timer` provides a small way to measure elapsed time during a test run. It is used by the test runner to record how long the full execution took, and it can also be used by tests or small helpers that need a simple duration measurement in milliseconds.

The timer is intentionally limited. It starts when it is constructed, can be reset, and can report the elapsed time since the last start point. This is enough for test reporting, where the goal is usually to understand how long a run or a specific operation took without introducing a larger timing API.

## Header

Use the module header when working with timers:

```cpp id="2lrrwf"
#include <vix/tests.hpp>
```

For files that only need the timer type, the direct header can also be used:

```cpp id="4jfw1w"
#include <vix/tests/Timer.hpp>
```

## Measure elapsed time

A `Timer` starts immediately when it is created.

```cpp id="vxj8jq"
#include <vix/tests.hpp>

int main()
{
  using namespace vix::tests;

  Timer timer;

  int value = 2 + 2;
  Assert::equal(4, value);

  double elapsed = timer.elapsed_ms();

  Assert::is_true(elapsed >= 0.0, "elapsed time should be available");

  return 0;
}
```

`elapsed_ms()` returns the elapsed duration as a `double`, expressed in milliseconds. The value is useful for reporting and diagnostics, not for strict correctness checks that depend on exact timing.

## Reset a timer

Use `reset()` to start measuring again from the current moment.

```cpp id="pfrcmj"
#include <vix/tests.hpp>

int main()
{
  using namespace vix::tests;

  Timer timer;

  Assert::is_true(timer.elapsed_ms() >= 0.0);

  timer.reset();

  double elapsed = timer.elapsed_ms();

  Assert::is_true(elapsed >= 0.0, "timer should continue working after reset");

  return 0;
}
```

Resetting a timer does not create a new object. It simply updates the internal start point, which is useful when a test helper measures several operations in the same process.

## Use in a test case

A timer can be used inside a `TestCase` when a test needs to record or inspect how long a small operation took.

```cpp id="o2u9w0"
#include <vix/tests.hpp>

int main()
{
  using namespace vix::tests;

  TestRegistry::instance().add(TestCase("operation produces a duration", []
  {
    Timer timer;

    int result = 10 * 2;

    Assert::equal(20, result);
    Assert::is_true(timer.elapsed_ms() >= 0.0);
  }));

  return TestRunner::run_all_and_exit();
}
```

This kind of check should stay simple. Timing in tests can vary between machines, build modes, and CI environments, so the timer is better used for reporting and broad diagnostics than for fragile performance assertions.

## Use in runner summaries

`TestRunner` uses `Timer` to fill the duration of the final summary. The runner starts a timer before executing registered tests, then writes the elapsed duration into the summary before printing the final line.

```txt id="1mha90"
Summary: total=3 passed=3 failed=0 duration_ms=0.145200
```

This gives the developer a quick indication of how long the run took without requiring any setup in the test file.

## API

```cpp id="2ms25b"
class Timer
{
public:
  Timer();

  void reset();

  double elapsed_ms() const;
};
```

## Next step

Continue with the CLI page to understand how the `vix tests` command discovers, prepares, and runs test executables from a Vix project.
