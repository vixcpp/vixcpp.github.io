---
title: "How Vix Turns C++ Errors Into Actionable Diagnostics"
description: "A deep dive into Vix.cpp error diagnostics: compiler errors, template failures, runtime crashes, sanitizers, ownership bugs, concurrency failures, and modern C++ mistakes."
date: 2026-05-23
tags:
  - C++
  - Vix.cpp
  - Diagnostics
  - Runtime
  - Templates
  - Developer Experience
---

# How Vix Turns C++ Errors Into Actionable Diagnostics

C++ is powerful because it gives developers direct control over memory, ownership, templates, concurrency, system calls, and runtime behavior.
That power also comes with a cost.
When something goes wrong, the error is often technically correct but difficult to act on:

```text
terminate called after throwing an instance of 'std::runtime_error'
Aborted (core dumped)
```

Or:

```text
use of deleted function
```

Or:

```text
no matching function for call to ...
```

Or:

```text
AddressSanitizer: heap-use-after-free
```

The compiler, sanitizer, or runtime usually knows what failed.
But it does not always present the failure in a way that helps the developer fix the code immediately.
Vix.cpp treats this as a core developer experience problem.
The goal is not to hide C++.
The goal is to make C++ errors explain themselves.

## The problem with raw C++ errors

C++ errors usually come from several different layers:

- compiler
- template instantiation
- concept constraints
- linker
- runtime exception
- `std::terminate`
- sanitizers
- operating system
- filesystem
- network
- threading runtime

Each layer speaks a different language.
A template error may expose implementation details from `<type_traits>` or `<concepts>`.
A runtime crash may only say `Aborted`.

A sanitizer report may contain the correct stack trace, but the important user frame can be buried inside a large log.
A filesystem error may be technically clear but not mapped to the line of user code that triggered it.
Vix tries to normalize these failures into one shape:

- error type
- source location
- code frame
- human hint
- raw log excerpt when needed

The output should answer four questions quickly:

- What happened?
- Where did it happen?
- Why did it probably happen?
- What should I check next?

## The diagnostic pipeline

Vix error handling is built as a rule-based diagnostic pipeline.
There are three major families:

- build/compiler diagnostics
- template and modern C++ diagnostics
- runtime diagnostics

Each diagnostic rule is small, focused, and responsible for one family of errors.
A rule generally does four things:

1. detect whether a log or compiler error belongs to its family
2. classify the specific subtype when possible
3. locate the best source line
4. print a code frame and actionable hint

This makes the system extensible.
Instead of one large error parser trying to understand all of C++, Vix uses many precise rules.

## Runtime diagnostics

Runtime errors are the hardest because they can come from undefined behavior, exceptions, operating system failures, sanitizers, or library-specific failures.
Vix currently handles the following runtime families.

## Process termination and aborts

- `AbortRule`
- `ThreadJoinableRule`
- `UncaughtExceptionRuntimeRule`

These rules handle errors such as:

- `std::terminate` called
- `terminate called after throwing an instance of ...`
- `terminate called without an active exception`
- `Aborted (core dumped)`
- `SIGABRT`
- joinable `std::thread` destroyed

A raw abort is often too generic.

For example, this output is not enough:

```text
terminate called after throwing an instance of 'std::runtime_error'
Aborted (core dumped)
```

Vix extracts the actual exception reason when available:

```text
what(): Failed to load environment configuration:
failed to parse .env content at line 1: invalid .env line: key is invalid
```

Then it can point to the real file:

```text
runtime error: environment configuration parse failed

--> /home/softadastra/tmp/.env:1:1
code:
  1 | production.websocket.host=127.0.0.1
      ^
  2 | production.websocket.port=9090
  3 | production.websocket.path=/ws

hint: fix the invalid environment file line; use KEY=value with a valid key name
at: /home/softadastra/tmp/.env:1
```

That is the kind of diagnostic Vix is designed to produce.

Not just:

```text
std::terminate called
```

But:

```text
this exact config file has an invalid key on line 1
```

## Memory safety diagnostics

C++ memory bugs are often catastrophic.
Vix recognizes the most common memory safety families:

- `DoubleFreeRule`
- `InvalidFreeRule`
- `UseAfterFreeRule`
- `MemoryLeakRule`
- `BufferOverflowRule`
- `StackOverflowRule`
- `NullPointerRule`
- `MisalignedAccessRule`

These rules handle logs from libc, AddressSanitizer, UndefinedBehaviorSanitizer, and raw crashes.

Examples:

- double free
- invalid free
- heap-use-after-free
- stack-use-after-scope
- heap-buffer-overflow
- stack-buffer-overflow
- global-buffer-overflow
- stack overflow
- null pointer dereference
- misaligned memory access

The important design choice is that Vix avoids overly broad matches.
For example, `InvalidFreeRule` does not trigger on `invalid pointer` alone, because that phrase can appear in unrelated contexts.

It requires stronger signals such as:

- `free(): invalid pointer`
- `munmap_chunk(): invalid pointer`
- `bad-free`
- `AddressSanitizer` + attempting free
- `AddressSanitizer` + not malloc()-ed

This reduces false positives.

For memory bugs, Vix also keeps the raw sanitizer excerpt visible because the sanitizer often contains multiple important locations:

- allocation site
- free site
- invalid use site
- thread creation site

A friendly diagnostic should simplify the report without hiding evidence.

## Container and iterator diagnostics

STL errors are common in real C++ code.

Vix handles:

- `EmptyContainerFrontBackRule`
- `OutOfRangeAccessRule`
- `InvalidIteratorDereferenceRule`
- `IteratorInvalidationRule`

These rules detect problems like:

- `front()` on empty container
- `back()` on empty container
- `pop_front()` on empty container
- `pop_back()` on empty container
- `top()` on empty container
- vector out-of-range access
- string out-of-range access
- `map::at` missing key
- `unordered_map::at` missing key
- invalid iterator dereference
- end iterator dereference
- singular iterator dereference
- iterator invalidated by erase
- iterator invalidated by reallocation

These are especially useful with debug STL modes and sanitizers.
For example, raw STL diagnostics may say:

```text
attempt to dereference a singular iterator
```

Vix turns that into:

```text
runtime error: singular iterator dereference
hint: initialize the iterator and refresh it after erase, insert, resize, reserve, or container reallocation
```

The goal is not to replace the STL diagnostic.
The goal is to translate it into an immediate correction path.

## Ownership and lifetime diagnostics

Modern C++ reduces many memory bugs through RAII, but lifetime mistakes still happen.
Vix currently handles:

- `StringViewDanglingRuntimeRule`
- `SpanLifetimeRule`
- `DetachedThreadLifetimeRule`
- `UseAfterFreeRule`
- `NullPointerRule`

These rules catch patterns such as:

- dangling `std::string_view`
- `std::string_view` outlived local string data
- `std::string_view` points to freed memory
- `std::span` outlived local storage
- `std::span` invalidated by vector reallocation
- detached thread captured expired stack data
- detached thread used freed memory

These diagnostics are important because `std::string_view` and `std::span` do not own memory.
They are safe only when the underlying storage outlives the view.
This is valid:

```cpp
std::string name = "vix";
std::string_view view = name;
```

This is dangerous:

```cpp
std::string_view make_name()
{
  std::string name = "vix";
  return name;
}
```

The compiler may not catch this.
A sanitizer may catch it later.
Vix turns that runtime failure into a lifetime-focused diagnostic.

## Concurrency diagnostics

Concurrency bugs are among the hardest C++ problems to debug.
Vix handles several families:

- `DataRaceRule`
- `DeadlockRule`
- `MutexMisuseRule`
- `ConditionVariableMisuseRule`
- `ThreadCreationFailureRule`
- `ThreadJoinableRule`
- `DetachedThreadLifetimeRule`
- `FuturePromiseRule`

These rules cover:

- data race
- lock-order inversion
- deadlock
- resource deadlock avoided
- invalid mutex unlock
- mutex used after destruction
- condition variable wait without lock
- condition variable destroyed while still in use
- thread resource limit reached
- `pthread_create` failed
- joinable `std::thread` destroyed
- broken promise
- promise already satisfied
- future already retrieved
- future has no associated state

Concurrency diagnostics must be careful.

For example, a ThreadSanitizer data race report usually has at least two important locations:

- current read/write
- previous conflicting read/write
- thread creation site

Vix does not hide that log.

Instead, it prints a short human explanation and keeps the runtime log excerpt visible:

```text
runtime error: data race between read and write

hint: protect every read and write of the shared value with the same mutex, or make the value atomic
hint: do not ignore the runtime log: data races usually require comparing both conflicting stack traces
```

This is important because data races are not single-line bugs.
They are relationship bugs between multiple execution paths.

## Arithmetic and undefined behavior diagnostics

Vix also handles common undefined behavior families:

- `DivisionByZeroRule`
- `IntegerOverflowRule`
- `UninitializedMemoryRule`
- `MisalignedAccessRule`
- `InvalidCastRule`
- `PureVirtualCallRule`

These detect errors such as:

- division by zero
- `SIGFPE`
- signed integer overflow
- invalid shift
- use of uninitialized value
- misaligned address
- invalid vptr
- bad dynamic cast
- `bad_any_cast`
- `bad_variant_access`
- pure virtual function call

These are often reported by UBSan, MSan, or the C++ runtime.
A raw UBSan message may be correct, but Vix makes the output more directly actionable:

```text
runtime error: signed integer overflow
hint: use wider integer types or check bounds before arithmetic
```

Or:

```text
runtime error: pure virtual function call
hint: avoid calling virtual functions from constructors/destructors or after object destruction
```

These diagnostics matter because many undefined behavior bugs do not fail immediately in release mode.
They may silently corrupt program behavior.

## Filesystem, network, and OS diagnostics

Not every runtime error is memory-related.
Vix also handles operational failures:

- `FilesystemRuntimeRule`
- `PermissionDeniedRule`
- `AddressAlreadyInUseRule`
- `BrokenPipeRule`
- `TimeoutRuntimeRule`
- `JsonParseRuntimeRule`
- `ConfigParseRuntimeRule`

These cover:

- filesystem error
- file not found
- path is not a directory
- path already exists
- permission denied
- address already in use
- port already in use
- broken pipe
- connection reset by peer
- operation timed out
- JSON parse failed
- environment configuration parse failed

This matters because C++ applications increasingly behave like systems software:

- servers
- CLIs
- build tools
- package managers
- database clients
- network runtimes
- edge applications
- offline-first systems

A good C++ runtime should explain not only pointer errors, but also system-level failures.

Example:

```text
runtime error: address already in use
hint: port 8080 is already in use; stop the other process or change the port
```

Or:

```text
runtime error: broken pipe
hint: the peer closed the connection before the write completed; handle disconnects and retry only when safe
```

This is not language-level C++ only.
It is production C++.

## Template and modern C++ diagnostics

Runtime diagnostics are only one side.
C++ also has extremely complex compile-time errors, especially around templates, concepts, overload resolution, coroutines, ownership types, and modern library features.
Vix currently handles these template and modern C++ families:

- `DependentTypenameRule`
- `NoTypeNamedRule`
- `TemplateArgumentMismatchRule`
- `InvalidTemplateTemplateArgumentRule`
- `CtadFailureRule`
- `RequiresExpressionFailureRule`
- `ConceptConstraintFailureRule`
- `NoMatchingOverloadWithConstraintsRule`
- `SubstitutionFailureRule`
- `StaticAssertFailureRule`
- `ConstexprEvaluationFailureRule`
- `MoveOnlyCopyRule`
- `DeletedFunctionRule`
- `PrivateConstructorRule`
- `InaccessibleMemberRule`
- `IncompleteTypeRule`
- `NoViableConversionRule`
- `ConstQualifierRule`
- `InvalidReferenceBindingRule`
- `InvalidInitializerListRule`
- `NarrowingConversionRule`
- `MissingBeginEndRule`
- `OperatorNotFoundRule`
- `AllocatorValueTypeMismatchRule`
- `TupleVariantAccessRule`
- `InvalidUseOfVoidRule`
- `LambdaCaptureLifetimeRule`
- `NonVirtualDestructorDeleteRule`
- `ObjectSlicingRule`
- `BadOverrideRule`
- `InvalidDowncastRule`
- `CoroutineReturnTypeRule`
- `MissingCoReturnRule`
- `InvalidAwaitableRule`
- `NoMemberAwaitReadyRule`
- `NoMemberAwaitSuspendRule`
- `NoMemberAwaitResumeRule`
- `InvalidPromiseTypeRule`

This is a large part of the C++ developer experience problem.
A beginner may struggle with:

- missing semicolon
- header not found
- `cout` not declared

But an experienced C++ developer often loses time on:

- substitution failure
- failed constraint
- requires-expression failure
- invalid awaitable
- bad override
- deleted copy constructor
- CTAD failure
- `static_assert` failure
- `consteval`/`constexpr` failure
- invalid template template argument

Vix aims to make those failures readable.

## Concepts and constraints

Modern C++ uses concepts to encode requirements.
When constraints fail, the compiler often emits a long instantiation trace.

Vix recognizes:

- `ConceptConstraintFailureRule`
- `RequiresExpressionFailureRule`
- `NoMatchingOverloadWithConstraintsRule`
- `SubstitutionFailureRule`

These diagnostics focus on the actual missing requirement.
Instead of leaving the user with a long template backtrace, Vix tries to produce a message closer to:

```text
error: concept constraint failed
hint: check which required expression, type, or operation is not satisfied
```

This is especially important for libraries that use heavily constrained APIs.

## Coroutine diagnostics

C++ coroutines have very specific rules.
A coroutine type must expose the right promise type and awaitable operations.
Vix recognizes:

- `CoroutineReturnTypeRule`
- `MissingCoReturnRule`
- `InvalidAwaitableRule`
- `InvalidPromiseTypeRule`
- `NoMemberAwaitReadyRule`
- `NoMemberAwaitSuspendRule`
- `NoMemberAwaitResumeRule`

These cover errors like:

- missing `co_return`
- invalid coroutine return type
- `promise_type` missing
- `await_ready` missing
- `await_suspend` missing
- `await_resume` missing

The goal is to map coroutine compiler errors back to the coroutine mental model:

- `promise_type`
- `co_await` protocol
- `co_return`
- `await_ready`
- `await_suspend`
- `await_resume`

## Ownership diagnostics at compile time

Some ownership bugs are runtime bugs.
Others are visible at compile time.
Vix handles compile-time ownership patterns such as:

- `MoveOnlyCopyRule`
- `DeletedFunctionRule`
- `NonVirtualDestructorDeleteRule`
- `ObjectSlicingRule`
- `InvalidDowncastRule`
- `LambdaCaptureLifetimeRule`

These help with errors like:

- copying `std::unique_ptr`
- copying `std::thread`
- copying a move-only type
- deleting derived object through non-virtual base destructor
- object slicing
- invalid downcast
- lambda captures unsafe reference

For example, a raw compiler error might say:

```text
use of deleted function 'std::unique_ptr<T>::unique_ptr(const std::unique_ptr<T>&)'
```

Vix can turn that into:

```text
error: copy of move-only type
hint: use std::move, pass by reference, or delete copying intentionally
```

This is better because it explains the C++ rule, not only the failed symbol.

## Why ordering matters

The diagnostic pipeline is ordered.
This matters because many errors overlap.
For example:

```text
std::out_of_range
```

could be handled by a generic uncaught exception rule.
But a better rule exists:

```text
OutOfRangeAccessRule
```

So the specialized rule must run first.
Another example:

```text
failed to parse .env content at line 1
```

could be seen as an uncaught `std::runtime_error`.
But the better rule is:

```text
ConfigParseRuntimeRule
```

So it must run before generic exception handling.
The same applies to memory errors:

```text
AddressSanitizer: heap-use-after-free
```

should be handled by:

```text
UseAfterFreeRule
```

not by a generic segfault or abort rule.
This is why Vix keeps broad fallback rules at the end:

- `SegfaultRule`
- `AbortRule`

They are still useful, but only when no better rule can explain the failure.

## Avoiding false positives

Good diagnostics are not only about matching more errors.
They are also about avoiding wrong explanations.
Vix rules are intentionally conservative.

Examples:

`InvalidFreeRule` does not match `invalid pointer` alone, because that phrase is too generic.
`BrokenPipeRule` does not match `write failed` alone unless socket, stream, or connection context is present.
`JsonParseRuntimeRule` does not match `unexpected token` unless JSON context is present.
`FilesystemRuntimeRule` steps aside when permission-specific signals are present, so `PermissionDeniedRule` can produce the better message.
This is important.

A wrong friendly diagnostic is worse than a raw compiler error.

## The role of raw logs

Vix does not try to hide the original compiler, sanitizer, or runtime log.
Instead, it gives a better first explanation and keeps the relevant log excerpt visible.
This is especially important for:

- data races
- deadlocks
- use-after-free
- double free
- buffer overflows
- template substitution failures
- concept failures
- uncaught exceptions

Many advanced C++ failures cannot be fully explained from a single line.
The diagnostic should guide the developer without removing the original evidence.

## What this means for Vix

Vix is not only a build tool.
Vix is becoming a C++ runtime and developer system that understands the failure modes of real C++ programs.
That includes:

- compilation
- templates
- concepts
- coroutines
- ownership
- memory safety
- threading
- filesystem
- networking
- configuration
- runtime crashes
- sanitizers

The goal is simple:
C++ should remain powerful.
The error experience should become humane.

A developer should not need to decode a 200-line template trace just to understand that a type is missing `begin()`.

A developer should not only see `Aborted (core dumped)` when the real issue is line 1 of `.env`.
A developer should not lose time guessing whether a crash is a null pointer, use-after-free, invalid iterator, or joinable thread destruction.
Vix gives the error a name, a location, and a next step.

## Current diagnostic families managed by Vix

### Runtime families

- `AbortRule`
- `ThreadJoinableRule`
- `UncaughtExceptionRuntimeRule`
- `DataRaceRule`
- `DeadlockRule`
- `ConditionVariableMisuseRule`
- `MutexMisuseRule`
- `FuturePromiseRule`
- `ThreadCreationFailureRule`
- `DetachedThreadLifetimeRule`
- `DoubleFreeRule`
- `InvalidFreeRule`
- `UseAfterFreeRule`
- `MemoryLeakRule`
- `BufferOverflowRule`
- `StackOverflowRule`
- `NullPointerRule`
- `DivisionByZeroRule`
- `IntegerOverflowRule`
- `UninitializedMemoryRule`
- `MisalignedAccessRule`
- `InvalidCastRule`
- `PureVirtualCallRule`
- `EmptyContainerFrontBackRule`
- `OutOfRangeAccessRule`
- `InvalidIteratorDereferenceRule`
- `IteratorInvalidationRule`
- `StringViewDanglingRuntimeRule`
- `SpanLifetimeRule`
- `FilesystemRuntimeRule`
- `PermissionDeniedRule`
- `AddressAlreadyInUseRule`
- `BrokenPipeRule`
- `TimeoutRuntimeRule`
- `JsonParseRuntimeRule`
- `ConfigParseRuntimeRule`
- `SegfaultRule`

### Template and modern C++ families

- `DependentTypenameRule`
- `NoTypeNamedRule`
- `TemplateArgumentMismatchRule`
- `InvalidTemplateTemplateArgumentRule`
- `CtadFailureRule`
- `RequiresExpressionFailureRule`
- `ConceptConstraintFailureRule`
- `NoMatchingOverloadWithConstraintsRule`
- `SubstitutionFailureRule`
- `StaticAssertFailureRule`
- `ConstexprEvaluationFailureRule`
- `MoveOnlyCopyRule`
- `DeletedFunctionRule`
- `PrivateConstructorRule`
- `InaccessibleMemberRule`
- `IncompleteTypeRule`
- `NoViableConversionRule`
- `ConstQualifierRule`
- `InvalidReferenceBindingRule`
- `InvalidInitializerListRule`
- `NarrowingConversionRule`
- `MissingBeginEndRule`
- `OperatorNotFoundRule`
- `AllocatorValueTypeMismatchRule`
- `TupleVariantAccessRule`
- `InvalidUseOfVoidRule`
- `LambdaCaptureLifetimeRule`
- `NonVirtualDestructorDeleteRule`
- `ObjectSlicingRule`
- `BadOverrideRule`
- `InvalidDowncastRule`
- `CoroutineReturnTypeRule`
- `MissingCoReturnRule`
- `InvalidAwaitableRule`
- `NoMemberAwaitReadyRule`
- `NoMemberAwaitSuspendRule`
- `NoMemberAwaitResumeRule`
- `InvalidPromiseTypeRule`

### Beginner and common compile-time families

- `CoutNotDeclaredRule`
- `HeaderNotFoundRule`
- `MissingSemicolonRule`
- `VectorOstreamRule`
- `ProcessNullptrAmbiguityRule`
- `UniquePtrCopyRule`
- `SharedPtrRawPtrMisuseRule`
- `DeleteMismatchRule`
- `UseAfterMoveRule`
- `DanglingStringViewRule`
- `ReturnLocalRefRule`
- `UseOfUninitializedRule`

## Conclusion

C++ does not need to become less powerful to become more accessible.
The language can stay explicit, native, and close to the system.
But the tooling around it should be better.
Vix.cpp is building that layer.
A layer that understands C++ errors.
A layer that turns raw compiler output, runtime crashes, and sanitizer logs into diagnostics developers can act on immediately.
That is the direction:

- less guessing
- less hidden context
- better source locations
- better hints
- better C++ developer experience

C++ errors should not only be correct.
They should be useful.
