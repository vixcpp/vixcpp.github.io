---
title: "Vix Core v2.6.3 benchmark baseline"
description: "How Vix.cpp Core started using an official Release benchmark baseline to track runtime, executor, router, HTTP, session, and app performance."
date: 2026-06-16
---

---

# Vix Core v2.6.3 benchmark baseline

Vix.cpp Core now has an official benchmark baseline for v2.6.3.

This is an important step for the project because performance is no longer only based on intuition, small manual tests, or local impressions.

The baseline was generated in **Release** mode on:

```txt
OS: Linux
Arch: x86_64
Compiler: GCC 13.3.0
Build type: Release
Machine: vix-bench-runner-1
```

The goal is simple:

```txt
Measure performance.
Track performance.
Protect performance.
```

## Why a benchmark baseline matters

When working on a C++ framework, it is easy to introduce a performance regression without noticing it.

A change can look clean.

Tests can still pass.

The API can still behave correctly.

But internally, something may become slower:

- route matching can allocate more,
- request construction can become heavier,
- response serialization can regress,
- executor scheduling can cost more,
- runtime queues can become less efficient,
- app route registration can become slower.

Without benchmarks, these regressions are difficult to see.

With a baseline, every serious change can be compared against a known reference.

That is the purpose of this v2.6.3 benchmark baseline.

## What is benchmarked

The current Vix Core benchmark suite covers several areas:

```txt
runtime.task
runtime.queue
runtime.scheduler
runtime.worker

executor.submit
executor.post
executor.metrics

router.match
router.registration

http.request
http.response

session.fake_transport

app.route_registration
app.group_registration
```

This gives visibility across both low-level runtime primitives and higher-level web framework behavior.

## Runtime results

The runtime benchmarks measure queues, workers, scheduler behavior, and task execution paths.

Some baseline results:

```txt
runtime.queue/push_clear       33.3M ops/sec
runtime.queue/push_pop         49.6M ops/sec
runtime.scheduler/submit_complete_tasks  677K ops/sec
runtime.worker/submit_complete_tasks     747K ops/sec
```

These numbers help protect the scheduling and queueing layer of Vix Core.

That layer matters because the web framework, sessions, async work, and internal execution paths depend on it.

## Executor results

The executor benchmarks measure task submission, posted work, counters, and metrics reads.

Some baseline results:

```txt
executor.metrics/idle_reads       112.2M ops/sec
executor.submit/task_complete       465K ops/sec
executor.post/void_tasks            397K ops/sec
```

This gives a measurable view of the cost of executing work through the Vix executor.

That is important because the executor sits behind many higher-level operations.

## Router results

The router benchmarks measure static routes, nested routes, parameterized routes, query strings, method normalization, missing routes, and large route trees.

Some baseline results:

```txt
router.match/strip_query       41.6M ops/sec
router.match/static_route       9.37M ops/sec
router.match/param_route        5.67M ops/sec
router.match/nested_param_route 3.91M ops/sec
```

The results show an expected pattern:

```txt
static route matching is faster than parameterized route matching
nested parameterized routes cost more than simple static routes
```

That is normal.

The important part is that the cost is now visible and tracked.

## Router registration results

Route registration is also benchmarked separately.

Some baseline results:

```txt
router.registration/static_routes        1.34M ops/sec
router.registration/nested_static_routes 832K ops/sec
router.registration/param_routes         680K ops/sec
```

This helps track the cost of building the internal route tree.

Route registration usually happens at startup, not on every request, but it still matters for applications with many routes.

## HTTP request results

The HTTP request benchmarks measure construction, path/query parsing, header lookup, parameter lookup, JSON access, request state, copy, and move behavior.

Some baseline results:

```txt
http.request/default_construct      10.7M ops/sec
http.request/construct_static_target 1.18M ops/sec
http.request/construct_query_target  700K ops/sec
```

This shows that basic request construction is fast, while query parsing naturally adds more work.

That is useful to know because request creation is part of the request-processing path.

## HTTP response results

The HTTP response benchmarks measure construction, status helpers, headers, common response helpers, JSON/text responses, and HTTP string serialization.

Some baseline results:

```txt
http.response/default_construct       3.38B ops/sec
http.response/construct_status        6.58B ops/sec
http.response/construct_status_body   63.3M ops/sec
```

Very small response construction benchmarks can produce extremely high ops/sec numbers because the measured operation is tiny.

Those numbers are useful as guardrails, but they should be interpreted together with larger response benchmarks such as full HTTP string serialization.

## Session results

The session benchmarks use an in-memory fake transport.

This avoids external network noise while still testing a higher-level request-processing path.

Some baseline results:

```txt
session.fake_transport/single_get_health 146K ops/sec
session.fake_transport/single_get_root   148K ops/sec
```

This is not a real network benchmark.

It is a framework-overhead benchmark.

That distinction matters.

The goal is to measure the internal session pipeline without depending on sockets, kernel scheduling, TLS, or external network behavior.

## App registration results

The app benchmarks measure the higher-level Vix app API: route registration, group registration, nested groups, duplicate routes, automatic OPTIONS registration, middleware helpers, and route record scanning.

Some baseline results:

```txt
app.route_registration/get_routes        138K ops/sec
app.route_registration/post_routes       138K ops/sec
app.group_registration/create_group_objects 69K ops/sec
app.group_registration/returned_group_get_routes 128K ops/sec
```

This helps protect the ergonomics layer.

Even if low-level router registration is fast, the app layer can still add overhead through route normalization, automatic OPTIONS routes, group prefixes, middleware helpers, and route records.

Now that overhead is measurable.

## Why Release mode is required

Benchmarks must be generated from a Release build.

A dev/debug build is useful for development, debugging, and validating that everything compiles.

But it is not useful for official performance numbers.

The rule for Vix Core is now:

```txt
dev/debug = compile, test, debug
release   = measure performance
```

Official baselines must be created from Release builds only.

## How the baseline is used

The v2.6.3 baseline is now the reference point.

Before a serious change, benchmarks can be run.

After the change, benchmarks can be run again.

Then the new results can be compared against the baseline.

If performance improves, the improvement is visible.

If performance regresses, the regression is visible.

If a benchmark changes because the benchmark suite itself changed, that can be reviewed intentionally.

The goal is not to block every small difference.

The goal is to prevent silent performance regressions.

## Performance is part of correctness

For Vix.cpp, performance is not just a marketing point.

It is part of the engineering discipline.

A framework can be correct and still become slower over time.

A benchmark baseline helps prevent that.

It makes performance part of the development workflow.

It gives future changes a measurable standard.

It helps keep the project honest.

## Conclusion

Vix.cpp Core v2.6.3 now has an official Release benchmark baseline.

This baseline covers runtime, executor, router, HTTP, session, and app-level behavior.

From now on, performance-sensitive changes can be compared against a known reference.

That means Vix Core can move forward with more confidence.

Performance should not be based on feelings.

It should be measured, tracked, and protected.
